import { NextResponse, type NextRequest } from "next/server"

import { createServerClient } from "@supabase/ssr"

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code")
  const origin = request.nextUrl.origin
  const requestedDestination = request.nextUrl.searchParams.get("next")
  const destination = new URL(
    requestedDestination === "/dashboard" ? "/dashboard" : "/",
    origin
  )
  const response = NextResponse.redirect(destination)
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!code || !url || !publishableKey) {
    return response
  }

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, options, value }) =>
          response.cookies.set(name, value, options)
        )
      },
    },
  })

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    destination.searchParams.set("auth", "failed")
    return NextResponse.redirect(destination)
  }

  return response
}
