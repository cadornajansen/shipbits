import { readFile } from "node:fs/promises"
import { join } from "node:path"

import { resolveBadgeVariant } from "@/features/products/badges"
import {
  getPublicProductBySlug,
  getPublicProductRank,
} from "@/features/products/public-queries"

export const runtime = "nodejs"
export const revalidate = 60

function escapeXml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&apos;",
      })[character]!
  )
}

function svgDataUrl(svg: string): string {
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  const filename = (await params).filename
  if (!filename.endsWith(".svg"))
    return new Response("Badge not found", { status: 404 })
  const product = await getPublicProductBySlug(filename.slice(0, -4))
  if (!product)
    return new Response("Badge not found", {
      status: 404,
      headers: { "Cache-Control": "no-store" },
    })

  const variant = resolveBadgeVariant(
    new URL(request.url).searchParams.get("variant")
  )
  const template = await readFile(
    join(process.cwd(), "public", "badges", `${variant}.svg`),
    "utf8"
  )
  const rank = await getPublicProductRank(product)
  const label = `Featured on ShipBits: ${escapeXml(product.name)}${rank ? `, rank ${rank}` : ""}`
  const colors = {
    default: { background: "#ffffff", border: "#d8dde4", rank: "#00071a" },
    monochrome: { background: "#ffffff", border: "#cbd5e1", rank: "#000000" },
    yellow: { background: "#00071a", border: "#334155", rank: "#ffb200" },
  }[variant]
  const artworkWidth = rank ? 202 : 250
  const rankBlock = rank
    ? `<path d="M202 7v40" stroke="${colors.border}"/><g fill="${colors.rank}" font-family="Arial,sans-serif" text-anchor="middle"><path d="M225 12l-5 7h10z"/><text x="225" y="38" font-size="15" font-weight="700">${rank}</text></g>`
    : ""
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="250" height="54" viewBox="0 0 250 54" role="img" aria-label="${label}"><title>${label}</title><defs><clipPath id="badge-clip"><rect width="250" height="54" rx="10"/></clipPath></defs><g clip-path="url(#badge-clip)"><rect width="250" height="54" fill="${colors.background}"/><image href="${svgDataUrl(template)}" width="${artworkWidth}" height="54" preserveAspectRatio="xMinYMid slice"/>${rankBlock}</g><rect x=".5" y=".5" width="249" height="53" rx="9.5" fill="none" stroke="${colors.border}"/></svg>`
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=60, must-revalidate",
      "Content-Security-Policy":
        "default-src 'none'; style-src 'none'; sandbox",
      "X-Content-Type-Options": "nosniff",
    },
  })
}
