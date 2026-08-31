"use client"

import Image from "next/image"
import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  startDirectoryPaymentAction,
  getDirectoryPaymentStatusAction,
} from "@/features/directory-submissions/actions"
import { formatDirectoryPrice } from "@/features/directory-submissions/config"

export function CampaignCheckout({
  campaignId,
  priceCentavos,
}: {
  campaignId: string
  priceCentavos: number
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [qr, setQr] = useState<{ url: string; expires: string } | null>(null)
  const [message, setMessage] = useState(
    "Your campaign starts only after payment is confirmed."
  )
  useEffect(() => {
    let stopped = false
    let timer: ReturnType<typeof setTimeout>
    async function poll() {
      try {
        const result = await getDirectoryPaymentStatusAction(campaignId)
        if (stopped) return
        if (!result.ok) setMessage(result.error)
        else if (result.status === "paid") {
          toast.success("Payment confirmed. Your directory campaign is active.")
          router.refresh()
          return
        } else if (["failed", "expired"].includes(result.status)) {
          setQr(null)
          setMessage("Payment did not complete. You can generate a new QR.")
        }
      } catch {
        if (!stopped)
          setMessage(
            "Unable to check payment. Keep this page open; do not pay again."
          )
      }
      if (!stopped) timer = setTimeout(poll, 5000)
    }
    timer = setTimeout(poll, 5000)
    return () => {
      stopped = true
      clearTimeout(timer)
    }
  }, [campaignId, router])
  return (
    <section className="rounded-xl border bg-muted/20 p-5">
      <h2 className="font-outfit text-xl font-semibold">
        Pay {formatDirectoryPrice(priceCentavos)} with QR Ph
      </h2>
      <p className="mt-2 text-sm text-muted-foreground" role="status">
        {message}
      </p>
      {qr ? (
        <div className="mt-4 flex flex-col items-start gap-3">
          <Image
            src={qr.url}
            alt={`QR Ph payment for ${formatDirectoryPrice(priceCentavos)}`}
            width={208}
            height={208}
            unoptimized
            className="rounded-lg border bg-white p-2"
          />
          <p className="text-xs text-muted-foreground">
            Scan with your banking or e-wallet app. Expires{" "}
            {new Intl.DateTimeFormat("en-PH", {
              hour: "numeric",
              minute: "2-digit",
              timeZone: "Asia/Manila",
            }).format(new Date(qr.expires))}{" "}
            PHT.
          </p>
        </div>
      ) : (
        <Button
          className="mt-4"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              try {
                const result = await startDirectoryPaymentAction(campaignId)
                if (!result.ok) {
                  toast.error(result.error)
                  return
                }
                if (result.paid) {
                  router.refresh()
                  return
                }
                setQr({ url: result.qrImageUrl, expires: result.expiresAt })
                setMessage(
                  "Waiting for confirmed payment. Please pay only once."
                )
              } catch {
                toast.error(
                  "Checkout unavailable. Please refresh and try again."
                )
              }
            })
          }
        >
          {pending ? "Preparing checkout…" : "Generate / resume QR Ph"}
        </Button>
      )}
    </section>
  )
}
