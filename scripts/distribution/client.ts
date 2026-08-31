import { existsSync } from "node:fs"
import { createClient } from "@supabase/supabase-js"

export function distributionScriptClient() {
  for (const file of [".env.local", ".env"])
    if (existsSync(file)) process.loadEnvFile(file)
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key)
    throw new Error(
      "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local (never commit credentials)."
    )
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
