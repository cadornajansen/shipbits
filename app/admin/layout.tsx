import Link from "next/link"
import type { Metadata } from "next"

import { requireAdmin } from "@/lib/supabase/auth"

export const metadata: Metadata = {
  robots: { follow: false, index: false },
}

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
          <div className="flex flex-wrap items-center gap-4 text-sm"><Link href="/admin/products">Products</Link><Link href="/admin/directory-submissions">Directory Submissions</Link><span className="text-muted-foreground">{user.email}</span></div>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
    </main>
  )
}
