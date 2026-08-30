export const DIRECTORY_SEARCH_MAX_LENGTH = 80

/** Normalizes a raw `?q=` value into a trimmed, length-capped search term. */
export function parseDirectorySearch(value: string | string[] | undefined): string {
  if (typeof value !== "string") return ""
  return value.replace(/\s+/g, " ").trim().slice(0, DIRECTORY_SEARCH_MAX_LENGTH)
}

/**
 * Builds a PostgREST `ilike` pattern for a search term. Characters that would
 * break the `or(...)` filter syntax or act as wildcards are dropped so the term
 * can never alter the query shape.
 */
export function toDirectorySearchPattern(term: string): string {
  const safe = term
    .replace(/[%_*,()\\"']/g, " ")
    .replace(/\s+/g, " ")
    .trim()
  return `%${safe}%`
}
