const baseUrl = "https://api.anysearch.com"

export type SearchResult = { title: string; url: string; snippet?: string }

function headers(): HeadersInit {
  return {
    "Content-Type": "application/json",
    ...(process.env.ANYSEARCH_API_KEY
      ? { Authorization: `Bearer ${process.env.ANYSEARCH_API_KEY}` }
      : {}),
  }
}

async function request<T>(path: string, body: object, attempts = 3): Promise<T> {
  let lastError: unknown
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const response = await fetch(`${baseUrl}${path}`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15_000),
      })
      if (!response.ok) throw new Error(`AnySearch HTTP ${response.status}`)
      const result = (await response.json()) as {
        code: number
        message: string
        data: T
      }
      if (result.code !== 0) throw new Error(result.message)
      return result.data
    } catch (error) {
      lastError = error
      if (attempt + 1 < attempts) await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** attempt))
    }
  }
  throw lastError
}

export async function anySearch(query: string): Promise<SearchResult[]> {
  const data = await request<unknown>("/v1/search", { query, max_results: 8 })
  const list = Array.isArray(data)
    ? data
    : typeof data === "object" && data && "results" in data
      ? (data as { results: unknown }).results
      : []
  return Array.isArray(list)
    ? list.filter((item): item is SearchResult =>
        Boolean(item && typeof item === "object" && "url" in item && "title" in item)
      )
    : []
}

export async function anyExtract(url: string): Promise<{ url: string; title: string; content: string }> {
  return request("/v1/extract", { url })
}
