import Link from "next/link"

import { PolicyPage, PolicySection } from "@/components/legal/policy-page"
import { createPageMetadata } from "@/lib/seo/metadata"

export const metadata = createPageMetadata({
  title: "Terms of use",
  description:
    "The rules for submitting a product, paying for a listing or upvote, and using ShipBits resources.",
  path: "/terms",
})

export default function TermsPage() {
  return (
    <PolicyPage
      title="Terms of use"
      description="A clear agreement about listings, support, and responsible use."
      path="/terms"
    >
      <PolicySection id="using-shipbits" title="Using ShipBits">
        <p>
          ShipBits helps people discover products and gives builders a place to
          list them. Use an account you are authorized to control, keep your
          sign-in provider secure, and submit accurate information. Only submit
          or manage a product if you have permission from its owner. Third-party
          OAuth sign-in does not grant admin access.
        </p>
        <p>
          Products linked from the directory are operated by their respective
          builders. A ShipBits listing is not a guarantee of a product&apos;s
          quality, safety, availability, or suitability. Review the
          product&apos;s own terms before using or buying it.
        </p>
      </PolicySection>

      <PolicySection id="submissions" title="Your listing and content">
        <p>
          You keep ownership of your submitted content. By submitting it, you
          allow ShipBits to store, format, and display it as needed to operate
          the directory, product previews, and related discovery features. Make
          sure you can use the names, images, trademarks, and copy you supply.
        </p>
        <p>
          AI autocomplete is a drafting aid, not a fact-checker. Review
          generated descriptions, categories, and fetched images before saving.
          Product information must not contain invented claims, private
          information, malware, impersonation, or unlawful material. A complete
          public listing requires a logo and cover image along with the required
          product fields.
        </p>
      </PolicySection>

      <PolicySection id="payments" title="Listings and paid support">
        <p>
          Listings start at ₱1, paid through PayMongo QR Ph. Check the amount
          before paying. A saved draft is not a paid listing, and a QR code is
          not proof of payment. ShipBits verifies the payment on the server
          before completing a listing or recording paid support.
        </p>
        <p>
          An eligible, complete paid submission can be published automatically
          after verification. It remains subject to moderation. Payment does not
          guarantee traffic, sales, business results, search rankings, or
          permanent prominence. It does not buy ownership of ShipBits or of a
          listed product.
        </p>
        <p>
          Paid upvotes currently record one upvote per whole peso. Amounts shown
          beside a product represent its listing/support value, not the price of
          using that product. An admin-added product can start with a ₱1 base
          value without a corresponding customer payment. Featured placement or
          a badge is not a promise of permanent ranking.
        </p>
      </PolicySection>

      <PolicySection id="moderation" title="Moderation still applies">
        <p>
          Admins may correct, return to draft, archive, reject, or remove
          listings that are inaccurate, duplicated, unsafe, infringe rights, or
          violate these rules. An archived product is hidden from the public
          directory; deletion can also remove its associated founder-facing
          listing. Do not repeatedly recreate a removed product to bypass
          moderation.
        </p>
        <p>
          A paid submission rejected before it was ever published is eligible
          for a refund request after payment and non-fulfilment are verified. A
          removal after correct fulfilment is not automatically refundable. See
          the <Link href="/refund-policy">refund policy</Link> for technical
          failures, duplicate charges, and how to request a review. Applicable
          consumer rights are not excluded.
        </p>
      </PolicySection>

      <PolicySection id="resources" title="Resources, badges, and fair use">
        <p>
          The SEO / Launch Checker reports a limited set of observable launch
          signals. Its score is not a Google score, security audit, or ranking
          prediction. Do not use the tool to probe private networks, bypass
          access controls, or generate abusive traffic.
        </p>
        <p>
          Use a ShipBits badge only when the corresponding listing qualifies.
          Link it to the real product page and do not alter the wording to claim
          an endorsement, award, or rank that ShipBits has not issued. Free
          resources and access may be limited to protect service availability.
        </p>
      </PolicySection>

      <PolicySection id="changes" title="Changes and questions">
        <p>
          The service and these site policies may change. Material changes
          should be communicated clearly; the date on this page will be updated
          when the text changes. The <Link href="/privacy">privacy policy</Link>{" "}
          explains how information is handled. If a listing or payment looks
          wrong, keep your receipt and contact the operator rather than paying
          again.
        </p>
      </PolicySection>
    </PolicyPage>
  )
}
