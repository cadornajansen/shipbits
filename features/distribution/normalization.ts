// Identity ignores scheme/www/tracking, but preserves meaningful paths and queries.
// Paths are case sensitive except Reddit community names, which are not.
export function normalizeUrl(value: string): {
  url: string
  canonical: string
} {
  const input = value.trim()
  if (!input || input.length > 2048 || /[\s\\]/.test(input))
    throw new Error("Enter a valid public website URL.")
  const url = new URL(
    /^[a-z][a-z\d+.-]*:/i.test(input) ? input : `https://${input}`
  )
  if (
    !["https:", "http:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    (url.port && !["80", "443"].includes(url.port))
  ) {
    throw new Error(
      "Use an http or https URL without credentials or custom ports."
    )
  }
  url.hostname = url.hostname.toLowerCase().replace(/\.$/, "")
  if (!url.hostname.includes("."))
    throw new Error("Use a complete public domain.")
  url.hash = ""
  for (const key of [...url.searchParams.keys()]) {
    if (/^(utm_.+|fbclid|gclid|dclid|msclkid|mc_cid|mc_eid)$/i.test(key))
      url.searchParams.delete(key)
  }
  url.searchParams.sort()
  url.pathname = url.pathname.replace(/\/+$/, "") || "/"
  const identity = new URL(url)
  identity.protocol = "https:"
  identity.port = ""
  identity.hostname = identity.hostname.replace(/^www\./, "")
  if (identity.hostname === "reddit.com" && /^\/r\//i.test(identity.pathname))
    identity.pathname = identity.pathname.toLowerCase()
  return {
    url: url.toString(),
    canonical: identity.toString().replace(/\/$/, ""),
  }
}

export function channelSlug(name: string): string {
  return (
    name
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 100)
      .replace(/-$/, "") || "channel"
  )
}

export function duplicateIdentity(
  a: { website_url: string },
  b: { website_url: string }
): boolean {
  return (
    normalizeUrl(a.website_url).canonical ===
    normalizeUrl(b.website_url).canonical
  )
}
