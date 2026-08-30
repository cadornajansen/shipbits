import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

function getSupabasePublicConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!url || !publishableKey) {
    throw new Error("Supabase public environment variables are not configured.")
  }

  return { publishableKey, url }
}

export async function createClient() {
  const cookieStore = await cookies()
  const { publishableKey, url } = getSupabasePublicConfig()

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, options, value }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Server Components cannot write cookies. The proxy refreshes sessions.
        }
      },
    },
  })
}
