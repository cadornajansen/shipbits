"use client"

import { useEffect, useState, useTransition } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { QrCodeIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import {
  getSubmissionPaymentStatusAction,
  startSubmissionPaymentAction,
} from "@/features/submissions/actions"
import type { Submission } from "@/features/submissions/queries"

function formatPesos(amountCentavos: number) {
  return new Intl.NumberFormat("en-PH", {
    currency: "PHP",
    minimumFractionDigits: 2,
    style: "currency",
  }).format(amountCentavos / 100)
}

function expiryLabel(value: string | null) {
  if (!value) return "Expires in about 30 minutes"
  const remainingMinutes = Math.max(
    0,
    Math.ceil((new Date(value).getTime() - Date.now()) / 60_000)
  )
  return remainingMinutes ? `Expires in ${remainingMinutes} min` : "QR expired"
}

export function PaymentDialog({
  onOpenChange,
  open,
  submission,
}: {
  onOpenChange: (open: boolean) => void
  open: boolean
  submission: Submission
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [amountPesos, setAmountPesos] = useState("1.00")
  const [payment, setPayment] = useState<{
    amountCentavos: number
    id: string
    qrExpiresAt: string
    qrImageUrl: string
  } | null>(null)
  const [paymentStatus, setPaymentStatus] = useState(submission.paymentStatus)

  useEffect(() => {
    if (!payment || paymentStatus !== "pending") return

    const interval = window.setInterval(() => {
      void getSubmissionPaymentStatusAction(payment.id).then((result) => {
        if (!result.ok) return
        setPaymentStatus(result.status)
        if (result.status === "paid") {
          toast.success("Payment received. Your listing is awaiting review.")
          router.refresh()
        }
      })
    }, 5000)

    return () => window.clearInterval(interval)
  }, [payment, paymentStatus, router])

  function generateQr() {
    startTransition(async () => {
      const result = await startSubmissionPaymentAction(
        submission.id,
        amountPesos
      )
      if (!result.ok) {
        toast.error(result.error)
        return
      }

      setPayment({
        amountCentavos: result.amountCentavos,
        id: result.paymentId,
        qrExpiresAt: result.qrExpiresAt,
        qrImageUrl: result.qrImageUrl,
      })
      setPaymentStatus("pending")
    })
  }

  const isTerminal = paymentStatus === "failed" || paymentStatus === "expired"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        {!payment ? (
          <>
            <DialogHeader>
              <DialogTitle>Get your product listed</DialogTitle>
              <DialogDescription>
                Choose how much you&apos;d like to pay. Listings start at ₱1.
              </DialogDescription>
            </DialogHeader>
            <Field>
              <FieldLabel htmlFor="amount_pesos">Amount in pesos</FieldLabel>
              <div className="flex items-center gap-2">
                <span className="text-lg font-medium">₱</span>
                <Input
                  id="amount_pesos"
                  inputMode="decimal"
                  value={amountPesos}
                  onChange={(event) => setAmountPesos(event.target.value)}
                  placeholder="1.00"
                />
              </div>
            </Field>
            <Button type="button" onClick={generateQr} disabled={isPending}>
              {isPending ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <QrCodeIcon data-icon="inline-start" />
              )}
              {isPending ? "Generating..." : "Generate QR Ph"}
            </Button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-4 text-center">
            <DialogHeader className="items-center">
              <DialogTitle>
                Pay {formatPesos(payment.amountCentavos)}
              </DialogTitle>
              <DialogDescription>
                Scan with your banking or e-wallet app.
              </DialogDescription>
            </DialogHeader>
            <Image
              src={payment.qrImageUrl}
              alt={`QR Ph code for ${formatPesos(payment.amountCentavos)}`}
              height={208}
              width={208}
              unoptimized
              className="size-52 rounded-lg border bg-white p-2"
            />
            {paymentStatus === "pending" ? (
              <p className="text-sm text-muted-foreground">
                Waiting for payment… · {expiryLabel(payment.qrExpiresAt)}
              </p>
            ) : null}
            {paymentStatus === "paid" ? (
              <p className="text-sm font-medium">Paid · Awaiting review</p>
            ) : null}
            {isTerminal ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setPayment(null)}
              >
                Generate new QR
              </Button>
            ) : null}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
