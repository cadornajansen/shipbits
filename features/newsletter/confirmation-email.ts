import "server-only"

import { Resend } from "resend"
import { z } from "zod"

import { logServerError } from "@/lib/observability/logger"
import {
  buildNewsletterConfirmationEmailHtml,
  buildNewsletterConfirmationEmailText,
} from "./confirmation-email-template"

const newsletterEmailEnvSchema = z.object({
  NEWSLETTER_FROM_EMAIL: z.email(),
  NEWSLETTER_REPLY_TO_EMAIL: z.email(),
  RESEND_API_KEY: z.string().min(1),
})

type ConfirmationEmailOptions = {
  recipientEmail: string
}

export async function sendNewsletterConfirmationEmail({
  recipientEmail,
}: ConfirmationEmailOptions): Promise<boolean> {
  const parsed = newsletterEmailEnvSchema.safeParse(process.env)
  if (!parsed.success) {
    logServerError("newsletter_confirmation_configuration_invalid")
    return false
  }

  try {
    const resend = new Resend(parsed.data.RESEND_API_KEY)
    const { error } = await resend.emails.send({
      from: `ShipBits Weekly <${parsed.data.NEWSLETTER_FROM_EMAIL}>`,
      to: [recipientEmail],
      replyTo: parsed.data.NEWSLETTER_REPLY_TO_EMAIL,
      subject: "Welcome to ShipBits Weekly ✦",
      html: buildNewsletterConfirmationEmailHtml(),
      text: buildNewsletterConfirmationEmailText(),
    })

    if (!error) return true

    logServerError("newsletter_confirmation_send_failed")
  } catch {
    logServerError("newsletter_confirmation_send_failed")
  }

  return false
}
