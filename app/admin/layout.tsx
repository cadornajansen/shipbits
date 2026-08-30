import Link from "next/link"

import { requireAdmin } from "@/lib/supabase/auth"

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await requireAdmin()

  return (
    <main className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/admin/products" className="font-heading font-semibold">
            ShipBits admin
          </Link>
          <span className="text-sm text-muted-foreground">{user.email}</span>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
    </main>
  )
}
