import { getPublicProductBySlug } from "@/features/products/public-queries"
import { createSocialImage } from "@/lib/seo/social-image"

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const product = await getPublicProductBySlug((await params).slug)
  if (!product) return new Response("Product not found", { status: 404 })
  return createSocialImage(product.name, product.tagline)
}
