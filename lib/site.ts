export const SITE_NAME = "ShipBits"

export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL || "https://shipbits.dev"
  const url = new URL(configured)
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new Error("NEXT_PUBLIC_SITE_URL must be an HTTP(S) origin.")
  }
  return url.origin
}

export function absoluteUrl(path: string): string {
  return new URL(path, `${getSiteUrl()}/`).toString()
}

export function getSupportEmail(): string | null {
  const email = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim()
  return email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null
}
