import type { Metadata } from "next"
import type { ReactElement } from "react"
import { ComponentPage } from "@/components/component-page"
import { getCatalogEntry } from "@/lib/catalog"

const entry = getCatalogEntry("mono-icons")!
export const metadata: Metadata = {
  title: `${entry.title} — Shipbits`,
  description: entry.description,
}

export default function Page(): ReactElement {
  return <ComponentPage id="mono-icons" />
}
