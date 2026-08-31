"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  ArrowUpIcon,
  CheckCircle2Icon,
  ChevronDownIcon,
  ChevronUpIcon,
  QrCodeIcon,
} from "lucide-react"
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
  buttonLabel,
  size = "sm",
  productId,
  productName,
  upvoteCount,
}: {
  buttonLabel?: string
  size?: "xs" | "sm"
  productId: string
  productName: string
  upvoteCount: number
}) {
  const router = useRouter()
  const preparingPayment = useRef(false)
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

  const awaitingPayment = payment !== null && paymentStatus === "pending"
  const isProcessing = isPending || awaitingPayment

  useEffect(() => {
    if (!payment || paymentStatus !== "pending") return

    let disposed = false
    let checking = false
    const interval = window.setInterval(async () => {
      if (checking) return
      checking = true
      try {
        const result = await getProductUpvotePaymentStatusAction(payment.id)
        if (disposed || !result.ok) return
        setPaymentStatus(result.status)
        if (result.status !== "pending") window.clearInterval(interval)
        if (result.status === "paid") {
          toast.success(`Upvote added for ${productName}. Thank you!`)
          router.refresh()
        }
      } catch {
        // A temporary connection failure should not discard an active payment.
      } finally {
        checking = false
      }
    }, 5_000)

    return () => {
      disposed = true
      window.clearInterval(interval)
    }
  }, [payment, paymentStatus, productName, router])

  function getAmount() {
    const parsed = Number.parseInt(amountPesos, 10)

    return Number.isFinite(parsed) && parsed >= 1 ? Math.min(parsed, 10_000) : 1
  }

  function updateAmount(next: number) {
    setAmountPesos(String(Math.min(10_000, Math.max(1, Math.round(next)))))
  }

  function stepAmount(delta: number) {
    updateAmount(getAmount() + delta)
  }

  function generateQr(): void {
    if (preparingPayment.current || awaitingPayment) return
    preparingPayment.current = true
    startTransition(async () => {
      try {
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
      } catch {
        toast.error("Unable to prepare payment. Please try again.")
      } finally {
        preparingPayment.current = false
      }
    })
  }

  return (
    <>
      <Button
        type="button"
        size={buttonLabel ? "default" : size}
        variant={buttonLabel ? "default" : "outline"}
        className={
          buttonLabel
            ? "w-full"
            : "shrink-0 cursor-pointer border-teal-700/25 text-teal-700 hover:border-teal-700/50 hover:bg-teal-700/10 hover:text-teal-800"
        }
        onClick={() => setOpen(true)}
        disabled={isProcessing}
        aria-busy={isProcessing}
        aria-label={
          isProcessing
            ? `Upvoting ${productName}`
            : `Upvote ${productName} · ₱1`
        }
      >
        <ArrowUpIcon data-icon="inline-start" />
        <span>
          {isProcessing ? "Upvoting..." : (buttonLabel ?? "Upvote · ₱1")}
        </span>
        <span className="sr-only">{upvoteCount} upvotes</span>
      </Button>
      {!open && awaitingPayment ? (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => setOpen(true)}
        >
          View payment
        </Button>
      ) : null}

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (isPending) return
          setOpen(nextOpen)

          if (!nextOpen && !awaitingPayment) {
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
          ) : paymentStatus === "paid" ? (
            <div className="flex flex-col items-center gap-5 py-6 text-center">
              <div className="flex size-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                <CheckCircle2Icon className="size-10" aria-hidden="true" />
              </div>

              <DialogHeader className="items-center">
                <DialogTitle>Payment confirmed</DialogTitle>
                <DialogDescription>
                  Your {productName} upvote was successfully added. Thanks for
                  supporting this product!
                </DialogDescription>
              </DialogHeader>

              <Button
                type="button"
                className="min-w-24"
                onClick={() => setOpen(false)}
              >
                Done
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 text-center">
              <DialogHeader className="items-center">
                <DialogTitle>
                  {payment.amountCentavos / 100} upvotes for {productName}
                </DialogTitle>

                <DialogDescription>
                  Scan with GCash, Maya, or your banking app to complete the
                  payment.
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
