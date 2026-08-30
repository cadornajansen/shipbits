export function parseDirectoryPage(value: string | string[] | undefined): number | null {
  if (value === undefined) return 1
  if (Array.isArray(value) || !/^[1-9]\d*$/.test(value)) return null
  const page = Number(value)
  return Number.isSafeInteger(page) ? page : null
}

/** Builds a directory URL, omitting `page` when it is the implicit first page. */
export function directoryPageHref(
  path: string,
  page: number,
  params?: Record<string, string>
): string {
  const search = new URLSearchParams(params)
  if (page > 1) search.set("page", String(page))
  const query = search.toString()
  return query ? `${path}?${query}` : path
}
