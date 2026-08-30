"use client"

import { createBrowserClient } from "@supabase/ssr"

function getSupabasePublicConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!url || !publishableKey) {
    throw new Error("Supabase public environment variables are not configured.")
  }

  return { publishableKey, url }
}

export function createClient() {
  const { publishableKey, url } = getSupabasePublicConfig()
  return createBrowserClient(url, publishableKey)
}
