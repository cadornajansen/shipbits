import { getPublicProductBySlug } from "@/features/products/public-queries"
import { absoluteUrl } from "@/lib/site"

export default async function Icon({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Response> {
  const product = await getPublicProductBySlug((await params).slug)
  return Response.redirect(product?.logoUrl ?? absoluteUrl("/favicon.ico"), 307)
}
