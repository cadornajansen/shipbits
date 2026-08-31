const CLOUDFLARE_ASSET_HOST = "assets.shipbits.dev"
const R2_COVER_PATH =
  /^\/(?:products|submissions)\/[0-9a-f-]+\/cover\.(?:jpe?g|png|webp)$/i

export function optimizedProductCoverUrl(sourceUrl: string): string {
  try {
    const source = new URL(sourceUrl)
    if (
      source.protocol !== "https:" ||
      source.hostname !== CLOUDFLARE_ASSET_HOST ||
      !R2_COVER_PATH.test(source.pathname)
    ) {
      return sourceUrl
    }

    return `${source.origin}/cdn-cgi/image/width=960,quality=80,format=auto,fit=cover${source.pathname}${source.search}`
  } catch {
    return sourceUrl
  }
}
