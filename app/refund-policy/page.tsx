import Link from "next/link"

import { PolicyPage, PolicySection } from "@/components/legal/policy-page"
import { createPageMetadata } from "@/lib/seo/metadata"

export const metadata = createPageMetadata({
  title: "Refund policy",
  description:
    "How ShipBits reviews duplicate charges, failed listing fulfilment, and rejected paid submissions.",
  path: "/refund-policy",
})

export default function RefundPolicyPage() {
  return (
    <PolicyPage
      title="Refund policy"
      description="If a payment or listing goes wrong, keep the receipt and ask us to review it."
      path="/refund-policy"
    >
      <PolicySection
        id="before-paying-again"
        title="Charged, but the page still says pending?"
      >
        <p>
          Do not pay again immediately. Payment confirmation can be delayed by a
          network or webhook problem. Keep the PayMongo or bank/e-wallet
          receipt, the product URL, amount, and approximate payment time.
          Contact the operator so the payment can be checked against PayMongo
          records. A screenshot alone does not replace verification.
        </p>
      </PolicySection>

      <PolicySection id="eligible-cases" title="Cases we review for a refund">
        <ul>
          <li>
            <strong>Technical duplicate charge:</strong> more than one
            successful charge for the same intended listing or support
            transaction because of a technical failure. Separate support
            payments intentionally made by a user are not automatically
            duplicates.
          </li>
          <li>
            <strong>Charged but not fulfilled:</strong> PayMongo confirms a
            successful payment, but the listing or paid support was not recorded
            and ShipBits cannot complete the intended transaction. We first
            check whether the original payment can be safely fulfilled without
            charging again.
          </li>
          <li>
            <strong>Rejected before publication:</strong> a paid submission that
            ShipBits rejects before it has ever been published is eligible for a
            refund request after the payment and lack of publication are
            verified.
          </li>
        </ul>
        <p>
          Requests are reviewed individually. Verified eligible cases are
          handled manually; this release does not automatically issue refunds.
          An expired QR or failed attempt with no settled payment has no payment
          to refund.
        </p>
      </PolicySection>

      <PolicySection
        id="fulfilled-payments"
        title="Correctly fulfilled listings and support"
      >
        <p>
          Once an eligible listing has been published or paid support has been
          correctly recorded, low traffic, lack of sales, a changed ranking,
          change of mind, or later voluntary removal does not by itself make the
          payment refundable. No listing or upvote promises a business result or
          permanent placement.
        </p>
        <p>
          Listings remain subject to moderation after payment. Removal for a
          policy violation after fulfilment is not automatically refundable.
          These rules do not remove rights or remedies required by applicable
          law; a mistaken moderation decision or payment error can still be
          reviewed.
        </p>
      </PolicySection>

      <PolicySection id="request-review" title="How to request a review">
        <p>
          Use the support contact below. Include your account email, product
          URL, payment reference, paid amount and date, and a brief explanation.
          Send only the receipt details needed to match the payment; never send
          your bank password, one-time code, or full account credentials. We may
          need to verify that you control the account or made the payment.
        </p>
        <p>
          Please report a problem promptly. PayMongo&apos;s current
          documentation lists a 30-day QR Ph refund window and does not support
          partial QR Ph refunds. Provider rules can change, so the operator must
          confirm the available route for your transaction. A provider window
          does not cancel any applicable statutory right. See{" "}
          <a href="https://docs.paymongo.com/docs/payment-acceptance-refunds">
            PayMongo&apos;s refund documentation
          </a>
          .
        </p>
      </PolicySection>

      <PolicySection id="processing" title="What happens after approval">
        <p>
          Where supported, an approved refund is sent through PayMongo to the
          original payment method. We do not promise an instant refund or a
          fixed bank processing time. If the provider cannot return it through
          the original route, the operator must agree a safe resolution with
          you; do not send money or pay a fee to unlock a refund.
        </p>
        <p>
          Refunding a listing or support payment may require its corresponding
          listing/support value to be corrected manually. A refund is not a way
          to keep paid support or a listing without the associated payment. Read
          the <Link href="/terms">terms of use</Link> for the listing rules and
          the <Link href="/privacy">privacy policy</Link> for receipt data.
        </p>
      </PolicySection>
    </PolicyPage>
  )
}
