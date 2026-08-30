export type Category = {
  id: string
  name: string
  slug: string
}

export type ProductListItem = {
  categoryName: string
  createdAt: string
  domain: string
  id: string
  logoUrl: string | null
  moderationStatus: "draft" | "published" | "rejected"
  name: string
  source: "admin" | "paid"
}

export type ProductActionResult =
  | { error: string; fieldErrors?: Record<string, string[]>; ok: false }
  | { ok: true; productId: string }
