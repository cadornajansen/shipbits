"use client"

import { useEffect, useState, useTransition } from "react"
import Image from "next/image"
import { ChevronDownIcon, ChevronUpIcon, QrCodeIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import {
  getProductUpvotePaymentStatusAction,
  startProductUpvotePaymentAction,
} from "@/features/upvotes/actions"

function formatPesos(amountCentavos: number) {
  return new Intl.NumberFormat("en-PH", {
    currency: "PHP",
    minimumFractionDigits: 2,
    style: "currency",
  }).format(amountCentavos / 100)
}

export function ProductUpvoteButton({
  productId,
  productName,
  upvoteCount,
}: {
  productId: string
  productName: string
  upvoteCount: number
}) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [amountPesos, setAmountPesos] = useState("1")

  const [payment, setPayment] = useState<{
    amountCentavos: number
    id: string
    qrImageUrl: string
  } | null>(null)

  const [paymentStatus, setPaymentStatus] = useState<
    "pending" | "paid" | "failed" | "expired"
  >("pending")

  useEffect(() => {
    if (!payment || paymentStatus !== "pending") return

    const interval = window.setInterval(() => {
      void getProductUpvotePaymentStatusAction(payment.id).then((result) => {
        if (!result.ok) return

        setPaymentStatus(result.status)

        if (result.status === "paid") {
          toast.success("Upvote received. Thank you!")
        }
      })
    }, 5_000)

    return () => window.clearInterval(interval)
  }, [payment, paymentStatus])

  function getAmount() {
    const parsed = Number.parseInt(amountPesos, 10)

    return Number.isFinite(parsed) && parsed >= 1
      ? Math.min(parsed, 10_000)
      : 1
  }

  function updateAmount(next: number) {
    setAmountPesos(String(Math.min(10_000, Math.max(1, Math.round(next)))))
  }

  function stepAmount(delta: number) {
    updateAmount(getAmount() + delta)
  }

  function generateQr() {
    startTransition(async () => {
      const normalized = String(getAmount())

      setAmountPesos(normalized)

      const result = await startProductUpvotePaymentAction(
        productId,
        normalized
      )

      if (!result.ok) {
        toast.error(result.error)
        return
      }

      setPayment({
        amountCentavos: result.amountCentavos,
        id: result.paymentId,
        qrImageUrl: result.qrImageUrl,
      })

      setPaymentStatus("pending")
    })
  }

  return (
    <>
      <Button
        type="button"
        size="icon-sm"
        variant="outline"
        className="shrink-0 rounded-lg bg-teal-700 hover:bg-teal-900"
        onClick={() => setOpen(true)}
        aria-label={`Upvote ${productName}`}
      >
        <ChevronUpIcon className="text-white" />
        
        <span className="sr-only">{upvoteCount} upvotes</span>
      </Button>

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen)

          if (!nextOpen) {
            setPayment(null)
            setAmountPesos("1")
          }
        }}
      >
        <DialogContent className="max-w-md">
          {!payment ? (
            <>
              <DialogHeader>
                <DialogTitle>Upvote {productName}</DialogTitle>

                <DialogDescription>
                  ₱1 equals 1 upvote. Choose any whole-peso amount from ₱1.
                </DialogDescription>
              </DialogHeader>

              <div
                className="flex min-h-48 items-center justify-center"
                onWheel={(event) => {
                  if (event.deltaY < 0) {
                    stepAmount(1)
                  } else if (event.deltaY > 0) {
                    stepAmount(-1)
                  }
                }}
              >
                <div className="flex items-center">
                  <div className="inline-flex items-center">
                    <span className="text-6xl font-semibold tracking-tight">
                      ₱
                    </span>

                    <input
                      aria-label="Upvote amount in pesos"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={amountPesos}
                      onFocus={(event) => event.currentTarget.select()}
                      onChange={(event) => {
                        const value = event.target.value.replace(/\D/g, "")
                        const next = value.slice(0, 5)
                        setAmountPesos(
                          next && Number(next) > 10_000 ? "10000" : next
                        )
                      }}
                      onBlur={() => updateAmount(getAmount())}
                      onKeyDown={(event) => {
                        if (event.key === "ArrowUp") {
                          event.preventDefault()
                          stepAmount(1)
                        }

                        if (event.key === "ArrowDown") {
                          event.preventDefault()
                          stepAmount(-1)
                        }
                      }}
                      maxLength={5}
                      className="min-w-[0.7em] border-0 bg-transparent p-0 text-left text-6xl font-semibold tracking-tight outline-none"
                      style={{
                        width: `${Math.max(1, amountPesos.length) * 0.62}em`,
                      }}
                    />
                  </div>

                  <div className="ml-2 flex flex-col">
                    <button
                      type="button"
                      className="flex size-5 items-center justify-center rounded-sm hover:bg-muted"
                      onClick={() => stepAmount(1)}
                      aria-label="Increase amount"
                    >
                      <ChevronUpIcon className="size-3.5" />
                    </button>

                    <button
                      type="button"
                      className="flex size-5 items-center justify-center rounded-sm hover:bg-muted"
                      onClick={() => stepAmount(-1)}
                      aria-label="Decrease amount"
                    >
                      <ChevronDownIcon className="size-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              <Button
                type="button"
                size="lg"
                className="w-full rounded-lg"
                onClick={generateQr}
                disabled={isPending}
              >
                {isPending ? (
                  <Spinner data-icon="inline-start" />
                ) : (
                  <QrCodeIcon data-icon="inline-start" />
                )}

                {isPending ? "Preparing payment..." : "Continue to payment"}
              </Button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-4 text-center">
              <DialogHeader className="items-center">
                <DialogTitle>
                  {payment.amountCentavos / 100} upvotes for {productName}
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
                className="size-52 bg-white p-2"
              />

              {paymentStatus === "pending" && (
                <p className="text-sm text-muted-foreground">
                  Waiting for payment…
                </p>
              )}

              {paymentStatus === "paid" && (
                <p className="text-sm font-medium">Upvoted</p>
              )}

              {(paymentStatus === "failed" || paymentStatus === "expired") && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPayment(null)}
                >
                  Try again
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
