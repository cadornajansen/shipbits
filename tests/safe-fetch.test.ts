import assert from "node:assert/strict"
import test from "node:test"

import {
  createPinnedLookup,
  isPublicIpAddress,
  parsePublicUrl,
  SafeFetchError,
  safeFetchText,
  type SafeFetchDependencies,
} from "../lib/security/safe-fetch"

const publicAddress = { address: "1.1.1.1", family: 4 as const }

function fakeNetwork(overrides: Partial<SafeFetchDependencies> = {}): SafeFetchDependencies {
  return {
    resolve: async () => [publicAddress],
    transport: async () => ({ status: 200, headers: { "content-type": "text/html" }, body: "<h1>Hello</h1>" }),
    ...overrides,
  }
}

test("accepts public IPv4 and native global IPv6 only", () => {
  for (const address of ["1.1.1.1", "8.8.8.8", "2606:4700:4700::1111"]) {
    assert.equal(isPublicIpAddress(address), true, address)
  }
  for (const address of [
    "127.0.0.1", "0.0.0.0", "10.0.0.1", "172.16.0.1", "192.168.1.1",
    "169.254.169.254", "100.64.0.1", "198.18.0.1", "192.0.2.1", "203.0.113.4",
    "224.0.0.1", "255.255.255.255", "::", "::1", "fe80::1", "fc00::1",
    "::ffff:127.0.0.1", "::ffff:8.8.8.8", "64:ff9b::7f00:1", "2002:7f00:1::",
    "2001:db8::1", "2001::1", "3fff::1", "not-an-address",
  ]) {
    assert.equal(isPublicIpAddress(address), false, address)
  }
})

test("rejects local hostnames, encoded IP forms, credentials, unsafe protocols and ports", () => {
  for (const value of [
    "http://localhost/", "http://localhost./", "http://service.local/", "http://server/",
    "http://metadata.google.internal/", "http://127.1/", "http://2130706433/",
    "http://0177.0.0.1/", "http://0x7f000001/", "http://%31%32%37.0.0.1/",
    "http://[::1]/", "http://[::ffff:127.0.0.1]/", "http://[fe80::1%25eth0]/",
    "https://example.com:8080/", "https://user:password@example.com/",
    "file:///etc/passwd", "data:text/html,hello", "ftp://example.com/",
    "https://example.com\\@127.0.0.1/", "https://example.com/path\nother",
  ]) {
    assert.throws(() => parsePublicUrl(value), SafeFetchError, value)
  }
  assert.equal(parsePublicUrl("https://example.com/page#section").toString(), "https://example.com/page")
})

test("does not connect when any DNS record points to a private address", async () => {
  let connections = 0
  await assert.rejects(
    safeFetchText("https://example.com/", {}, fakeNetwork({
      resolve: async () => [publicAddress, { address: "10.0.0.1", family: 4 }],
      transport: async () => { connections += 1; throw new Error("must not connect") },
    })),
    { code: "blocked_target" }
  )
  assert.equal(connections, 0)
})

test("pins the verified IP while preserving the URL hostname and TLS target", async () => {
  let lookups = 0
  const response = await safeFetchText("https://example.com/page", {}, fakeNetwork({
    resolve: async () => { lookups += 1; return [publicAddress] },
    transport: async (url, address, limits) => {
      assert.equal(url.hostname, "example.com")
      assert.deepEqual(address, publicAddress)
      assert.equal(limits.maxBytes, 1_000_000)
      const pinnedLookup = createPinnedLookup(address)
      pinnedLookup("example.com", {}, (error, result, family) => {
        assert.equal(error, null)
        assert.equal(result, "1.1.1.1")
        assert.equal(family, 4)
      })
      pinnedLookup("example.com", { all: true }, (error, result) => {
        assert.equal(error, null)
        assert.deepEqual(result, [publicAddress])
      })
      return { status: 200, headers: {}, body: "ok" }
    },
  }))
  assert.equal(lookups, 1)
  assert.equal(response.body, "ok")
})

test("blocks a private-network redirect before the second connection", async () => {
  let connections = 0
  await assert.rejects(safeFetchText("https://example.com/", {}, fakeNetwork({
    transport: async () => {
      connections += 1
      return { status: 302, headers: { location: "http://169.254.169.254/latest/meta-data/" }, body: "" }
    },
  })), { code: "blocked_target" })
  assert.equal(connections, 1)
})

test("re-resolves and rejects DNS rebinding even on same-host redirects", async () => {
  let lookups = 0
  let connections = 0
  await assert.rejects(safeFetchText("https://example.com/", {}, fakeNetwork({
    resolve: async () => ++lookups === 1 ? [publicAddress] : [{ address: "127.0.0.1", family: 4 }],
    transport: async () => {
      connections += 1
      return { status: 302, headers: { location: "/next" }, body: "" }
    },
  })), { code: "blocked_target" })
  assert.equal(lookups, 2)
  assert.equal(connections, 1)
})

test("same-origin probes refuse even public cross-origin redirects", async () => {
  await assert.rejects(safeFetchText("https://example.com/robots.txt", { sameOrigin: "https://example.com" }, fakeNetwork({
    transport: async () => ({ status: 302, headers: { location: "https://elsewhere.example/robots.txt" }, body: "" }),
  })), { code: "blocked_target" })
})

test("bounds redirects, response bytes and DNS time", async () => {
  await assert.rejects(safeFetchText("https://example.com/", { maxRedirects: 1 }, fakeNetwork({
    transport: async () => ({ status: 302, headers: { location: "/again" }, body: "" }),
  })), { code: "too_many_redirects" })
  await assert.rejects(safeFetchText("https://example.com/", { maxBytes: 2 }, fakeNetwork({
    transport: async () => ({ status: 200, headers: {}, body: "₱" }),
  })), { code: "too_large" })
  await assert.rejects(safeFetchText("https://example.com/", { timeoutMs: 5 }, fakeNetwork({
    resolve: () => new Promise(() => {}),
  })), { code: "timeout" })
})

test("DNS failures expose a useful message, not internal network details", async () => {
  await assert.rejects(safeFetchText("https://example.com/", {}, fakeNetwork({
    resolve: async () => { throw new Error("DNS server 10.10.10.10 failed with internal details") },
  })), (error: unknown) => error instanceof SafeFetchError && error.code === "dns_failure" && !error.message.includes("10.10.10.10"))
})
