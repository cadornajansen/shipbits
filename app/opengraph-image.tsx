import { createSocialImage } from "@/lib/seo/social-image"

export const alt = "ShipBits — discover what Filipino builders are shipping"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OpenGraphImage() {
  return createSocialImage("Discover what people are shipping.", "Explore independent apps, tools, and products. List your own product from ₱1.")
}
