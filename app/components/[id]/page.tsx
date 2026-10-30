import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ComponentPage } from "@/components/component-page"
import { getCatalogEntry } from "@/lib/catalog"
import { collectionEntries, isCollectionId } from "@/lib/collection-additions"

export const dynamicParams = false
export function generateStaticParams(): { id: string }[] {
  return collectionEntries.map(({ id }) => ({ id }))
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const entry = getCatalogEntry(id)
  if (!entry || !isCollectionId(id)) notFound()
  return { title: `${entry.title} — Shipbits`, description: entry.description }
}
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  if (!isCollectionId(id) || !getCatalogEntry(id)) notFound()
  return <ComponentPage id={id} />
}
