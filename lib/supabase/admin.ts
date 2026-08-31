import "server-only"

import { createClient } from "@supabase/supabase-js"
import { validateCoreServerEnv } from "@/lib/env/server"

export function createAdminClient() {
  const env = validateCoreServerEnv()

  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
