export class RequestBodyError extends Error {
  constructor(
    message: string,
    readonly status: number = 400
  ) {
    super(message)
    this.name = "RequestBodyError"
  }
}

async function readBodyBytes(
  request: Request,
  maxBytes: number
): Promise<Uint8Array> {
  const length = Number(request.headers.get("content-length"))
  if (Number.isFinite(length) && length > maxBytes) {
    throw new RequestBodyError("Request is too large.", 413)
  }
  if (!request.body) throw new RequestBodyError("A request body is required.")

  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      total += value.byteLength
      if (total > maxBytes) {
        await reader.cancel()
        throw new RequestBodyError("Request is too large.", 413)
      }
      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }
  const bytes = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  return bytes
}

/** Bound the streamed body, not just Content-Length (which the caller controls). */
export async function readJsonBody(
  request: Request,
  maxBytes = 4096
): Promise<unknown> {
  if (
    !request.headers
      .get("content-type")
      ?.toLowerCase()
      .startsWith("application/json")
  ) {
    throw new RequestBodyError("Send a JSON request.", 415)
  }
  try {
    return JSON.parse(
      new TextDecoder("utf-8", { fatal: true }).decode(
        await readBodyBytes(request, maxBytes)
      )
    ) as unknown
  } catch (error) {
    if (error instanceof RequestBodyError) throw error
    throw new RequestBodyError("Enter valid JSON.")
  }
}

/** Preserve the exact decoded webhook payload while enforcing a streamed size limit. */
export async function readTextBody(
  request: Request,
  maxBytes = 64 * 1024
): Promise<string> {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(
      await readBodyBytes(request, maxBytes)
    )
  } catch (error) {
    if (error instanceof RequestBodyError) throw error
    throw new RequestBodyError("Request body must be valid UTF-8.")
  }
}
