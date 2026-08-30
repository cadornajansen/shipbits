import "server-only"

import { redirect } from "next/navigation"

import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

export async function getCurrentUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user
}

export async function requireUser() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/")
  }

  return user
}

export async function isAdminUser(userId: string) {
  const { data, error } = await createAdminClient()
    .from("admin_users")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle()

  if (error) {
    throw new Error(`Unable to verify administrator access: ${error.message}`)
  }

  return Boolean(data)
}

export async function requireAdmin() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  if (!(await isAdminUser(user.id))) {
    redirect("/dashboard")
  }

  return user
}
