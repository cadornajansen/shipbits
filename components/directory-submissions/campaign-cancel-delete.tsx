"use client"

import { useState, useTransition } from "react"
import { Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { cancelAndDeleteDirectoryCampaignAction } from "@/features/directory-submissions/actions"

export function CampaignCancelDelete({ campaignId }: { campaignId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function cancelAndDelete() {
    startTransition(async () => {
      const result = await cancelAndDeleteDirectoryCampaignAction(campaignId)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      setOpen(false)
      toast.success("Directory submission cancelled and deleted.")
      router.refresh()
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-destructive hover:text-destructive"
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          setOpen(true)
        }}
      >
        <Trash2 />
        Cancel & delete
      </Button>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel this submission?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently deletes this unpaid directory campaign. If a QR was
            generated, it must expire first. Your product listing will not be
            deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Keep campaign</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            className="bg-destructive text-white hover:bg-destructive/90"
            onClick={(event) => {
              event.preventDefault()
              cancelAndDelete()
            }}
          >
            {isPending ? "Deleting…" : "Cancel & delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
