import "server-only"

import { revalidatePath, revalidateTag } from "next/cache"

export const PUBLIC_PRODUCTS_TAG = "shipbits-public-products"

export function invalidatePublicProducts(): void {
  // Immediate expiry also works in payment webhooks; do not serve an archived
  // listing once more while a stale-while-revalidate refresh runs.
  revalidateTag(PUBLIC_PRODUCTS_TAG, { expire: 0 })
  revalidatePath("/")
  revalidatePath("/sitemap.xml")
}
