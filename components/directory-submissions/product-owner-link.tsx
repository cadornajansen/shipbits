import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getCurrentUser } from "@/lib/supabase/auth"
import { createClient } from "@/lib/supabase/server"

export async function ProductDirectoryOwnerLink({
  productId,
}: {
  productId: string
}) {
  const user = await getCurrentUser()
  if (!user) return null
  const db = await createClient()
  const { data, error } = await db
    .from("product_builders")
    .select("product_id")
    .eq("product_id", productId)
    .eq("user_id", user.id)
    .eq("role", "owner")
    .maybeSingle()
  if (error || !data) return null
  return (
    <div className="mt-4 border-t pt-4">
      <Button asChild size="sm" variant="outline" className="w-full">
        <Link
          href={`/dashboard/directory-submissions/new?product=${productId}`}
        >
          Submit to directories
        </Link>
      </Button>
    </div>
  )
}
