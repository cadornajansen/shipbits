export const SITE_NAME = "ShipBits"
export const SITE_SHORT_NAME = "ShipBits"
export const SITE_DESCRIPTION =
  "Discover apps, SaaS, developer tools, and startup products from Filipino builders."
export const SITE_LANGUAGE = "en"
export const SITE_LOCALE = "en_PH"
export const SITE_THEME_COLOR = "#ffb200"
export const SITE_BACKGROUND_COLOR = "#ffffff"
export const SITE_LOGO_PATH = "/branding/shipbits-logo.png"
export const DEFAULT_OG_IMAGE_PATH = "/branding/shipbits-preview.png"

export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL || "https://shipbits.dev"
  const url = new URL(configured)
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password
  ) {
    throw new Error("NEXT_PUBLIC_SITE_URL must be an HTTP(S) origin.")
  }
  return url.origin
}

export function absoluteUrl(path: string): string {
  return new URL(path, `${getSiteUrl()}/`).toString()
}

export function canonicalUrl(path: string): string {
  const url = new URL(path, `${getSiteUrl()}/`)
  url.hash = ""
  for (const key of [...url.searchParams.keys()]) {
    if (/^(utm_.+|fbclid|gclid|ref)$/i.test(key)) url.searchParams.delete(key)
  }
  if (url.pathname.length > 1) url.pathname = url.pathname.replace(/\/+$/, "")
  return url.toString()
}

export function getSupportEmail(): string | null {
  const email = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim()
  return email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null
}

export function getSearchVerification() {
  const google = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim()
  const bing = process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION?.trim()
  return {
    ...(google ? { google } : {}),
    ...(bing ? { other: { "msvalidate.01": bing } } : {}),
  }
}
