"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

export function ProductDirectoryOwnerLink({
  productId,
}: {
  productId: string
}) {
  const [isOwner, setIsOwner] = useState(false)

  useEffect(() => {
    let active = true
    const supabase = createClient()

    async function checkOwnership() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from("product_builders")
        .select("product_id")
        .eq("product_id", productId)
        .eq("user_id", user.id)
        .eq("role", "owner")
        .maybeSingle()

      if (active && !error) setIsOwner(Boolean(data))
    }

    void checkOwnership()
    return () => {
      active = false
    }
  }, [productId])

  if (!isOwner) return null

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
