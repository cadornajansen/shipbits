import { lookup } from "node:dns/promises"
import { request as httpRequest, type IncomingHttpHeaders } from "node:http"
import { request as httpsRequest } from "node:https"
import { isIP, type LookupFunction } from "node:net"
import ipaddr from "ipaddr.js"

type FetchErrorCode =
  | "invalid_url"
  | "blocked_target"
  | "dns_failure"
  | "fetch_failed"
  | "timeout"
  | "too_large"
  | "invalid_response"
  | "too_many_redirects"

const errorMessages: Record<FetchErrorCode, string> = {
  invalid_url: "Enter a public http or https website URL using port 80 or 443.",
  blocked_target: "Only public websites can be checked. Local or private-network addresses are not allowed.",
  dns_failure: "This website's public address could not be resolved. Check the URL and try again.",
  fetch_failed: "The website could not be reached. It may be offline or blocking automated requests.",
  timeout: "The website took too long to respond. Please try again later.",
  too_large: "The page is too large for this lightweight checker.",
  invalid_response: "The website did not return a readable page for this checker.",
  too_many_redirects: "The website redirects too many times. Try its final public URL.",
}

export class SafeFetchError extends Error {
  constructor(public readonly code: FetchErrorCode) {
    super(errorMessages[code])
    this.name = "SafeFetchError"
  }
}

export type ResolvedAddress = { address: string; family: 4 | 6 }

export type SafeTextResponse = {
  url: string
  status: number
  headers: IncomingHttpHeaders
  body: string
}

type TransportResponse = Omit<SafeTextResponse, "url" | "body"> & { body: Buffer }
type TransportOptions = { maxBytes: number; timeoutMs: number }

export type SafeFetchDependencies = {
  resolve: (hostname: string) => Promise<ResolvedAddress[]>
  transport: (
    url: URL,
    address: ResolvedAddress,
    options: TransportOptions
  ) => Promise<TransportResponse>
}

export type SafeFetchOptions = {
  maxBytes?: number
  timeoutMs?: number
  maxRedirects?: number
  sameOrigin?: string
}

export type SafeBufferResponse = Omit<SafeTextResponse, "body"> & { body: Buffer }

const redirectStatuses = new Set([301, 302, 303, 307, 308])
const privateNames = /(?:^|\.)(?:localhost|local|internal|intranet|lan|home|test|invalid|onion)$/i

export function isPublicIpAddress(value: string): boolean {
  if (!isIP(value)) return false

  const address = ipaddr.parse(value)
  if (address.range() !== "unicast") return false

  // IPv6 must be native global unicast, not a mapped/tunnel/private address.
  return address.kind() === "ipv4" || (address.toByteArray()[0] & 0xe0) === 0x20
}

export function parsePublicUrl(value: string): URL {
  let url: URL
  try {
    if (value.length > 2048 || /[\s\\]/.test(value)) {
      throw new SafeFetchError("invalid_url")
    }
    url = new URL(value)
  } catch {
    throw new SafeFetchError("invalid_url")
  }

  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    (url.port && !["80", "443"].includes(url.port))
  ) {
    throw new SafeFetchError("invalid_url")
  }

  const hostname = url.hostname.replace(/^\[|\]$/g, "").replace(/\.$/, "")
  if (
    !hostname ||
    privateNames.test(hostname) ||
    hostname === "metadata.google.internal" ||
    (!isIP(hostname) && (!hostname.includes(".") || hostname.includes(".."))) ||
    (isIP(hostname) && !isPublicIpAddress(hostname))
  ) {
    throw new SafeFetchError("blocked_target")
  }

  url.hash = ""
  return url
}

export function createPinnedLookup(address: ResolvedAddress): LookupFunction {
  return (_hostname, options, callback) => {
    if (options.all) callback(null, [address])
    else callback(null, address.address, address.family)
  }
}

async function resolvePublicAddress(
  url: URL,
  resolve: SafeFetchDependencies["resolve"]
): Promise<ResolvedAddress> {
  const hostname = url.hostname.replace(/^\[|\]$/g, "").replace(/\.$/, "")
  const family = isIP(hostname)
  const addresses = family
    ? [{ address: hostname, family: family as 4 | 6 }]
    : await resolve(hostname).catch(() => {
        throw new SafeFetchError("dns_failure")
      })

  if (!addresses.length) throw new SafeFetchError("dns_failure")
  if (addresses.some((address) => !isPublicIpAddress(address.address))) {
    throw new SafeFetchError("blocked_target")
  }
  return addresses.find((address) => address.family === 4) ?? addresses[0]
}

function requestPinnedUrl(
  url: URL,
  address: ResolvedAddress,
  { maxBytes, timeoutMs }: TransportOptions
): Promise<TransportResponse> {
  return new Promise((resolve, reject) => {
    const request = (url.protocol === "https:" ? httpsRequest : httpRequest)(
      url,
      {
        agent: false,
        family: address.family,
        lookup: createPinnedLookup(address),
        maxHeaderSize: 16 * 1024,
        method: "GET",
        headers: {
          Accept: "text/html,application/xhtml+xml,application/xml,text/xml,text/plain;q=0.9",
          "Accept-Encoding": "identity",
          "User-Agent": "ShipBitsLaunchChecker/1.0",
        },
      },
      (response) => {
        const status = response.statusCode ?? 0
        if (status < 200 || status >= 300) {
          clearTimeout(timer)
          resolve({ status, headers: response.headers, body: Buffer.alloc(0) })
          response.destroy()
          return
        }

        const length = Number(response.headers["content-length"] ?? 0)
        const encoding = response.headers["content-encoding"]?.toLowerCase()
        if (length > maxBytes || (encoding && encoding !== "identity")) {
          request.destroy(new SafeFetchError(length > maxBytes ? "too_large" : "invalid_response"))
          return
        }

        const chunks: Buffer[] = []
        let bytes = 0
        response.on("data", (chunk: Buffer) => {
          bytes += chunk.length
          if (bytes > maxBytes) {
            request.destroy(new SafeFetchError("too_large"))
            return
          }
          chunks.push(chunk)
        })
        response.once("end", () => {
          clearTimeout(timer)
          resolve({ status, headers: response.headers, body: Buffer.concat(chunks) })
        })
        response.once("error", (error: Error) => {
          clearTimeout(timer)
          reject(error instanceof SafeFetchError ? error : new SafeFetchError("fetch_failed"))
        })
      }
    )

    // A wall-clock timer also covers TCP/TLS setup; socket idle timeouts do not.
    const timer = setTimeout(() => request.destroy(new SafeFetchError("timeout")), timeoutMs)
    request.once("error", (error: Error) => {
      clearTimeout(timer)
      reject(error instanceof SafeFetchError ? error : new SafeFetchError("fetch_failed"))
    })
    request.end()
  })
}

const defaultDependencies: SafeFetchDependencies = {
  resolve: async (hostname) => {
    const addresses = await lookup(hostname, { all: true, verbatim: true })
    return addresses.map(({ address, family }) => ({ address, family: family as 4 | 6 }))
  },
  transport: requestPinnedUrl,
}

async function withinDeadline<T>(promise: Promise<T>, milliseconds: number): Promise<T> {
  if (milliseconds <= 0) throw new SafeFetchError("timeout")
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(new SafeFetchError("timeout")), milliseconds)
      }),
    ])
  } finally {
    clearTimeout(timer)
  }
}

export async function safeFetchText(
  value: string,
  options: SafeFetchOptions = {},
  dependencies: SafeFetchDependencies = defaultDependencies
): Promise<SafeTextResponse> {
  const response = await safeFetchBuffer(value, options, dependencies)
  return { ...response, body: response.body.toString("utf8") }
}

export async function safeFetchBuffer(
  value: string,
  options: SafeFetchOptions = {},
  dependencies: SafeFetchDependencies = defaultDependencies
): Promise<SafeBufferResponse> {
  const maxBytes = options.maxBytes ?? 1_000_000
  const maxRedirects = options.maxRedirects ?? 3
  const deadline = Date.now() + (options.timeoutMs ?? 10_000)
  let url = parsePublicUrl(value)

  for (let redirects = 0; redirects <= maxRedirects; redirects += 1) {
    if (options.sameOrigin && url.origin !== options.sameOrigin) {
      throw new SafeFetchError("blocked_target")
    }

    const address = await withinDeadline(
      resolvePublicAddress(url, dependencies.resolve),
      deadline - Date.now()
    )
    const remaining = deadline - Date.now()
    if (remaining <= 0) throw new SafeFetchError("timeout")

    // Keep the URL hostname for Host/TLS, but the connection uses only this pinned IP.
    const response = await withinDeadline(
      dependencies.transport(url, address, { maxBytes, timeoutMs: remaining }),
      remaining
    )
    if (!redirectStatuses.has(response.status)) {
      if (response.body.byteLength > maxBytes) {
        throw new SafeFetchError("too_large")
      }
      return { ...response, body: response.body, url: url.toString() }
    }

    if (!response.headers.location) throw new SafeFetchError("invalid_response")
    if (redirects === maxRedirects) throw new SafeFetchError("too_many_redirects")
    try {
      url = parsePublicUrl(new URL(response.headers.location, url).toString())
    } catch (error) {
      throw error instanceof SafeFetchError ? error : new SafeFetchError("invalid_url")
    }
  }

  throw new SafeFetchError("too_many_redirects")
}
