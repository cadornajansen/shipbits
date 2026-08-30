import Link from "next/link"

import { PolicyPage, PolicySection } from "@/components/legal/policy-page"
import { createPageMetadata } from "@/lib/seo/metadata"

export const metadata = createPageMetadata({
  title: "Privacy policy",
  description:
    "How ShipBits handles account details, product submissions, website analysis, payments, and newsletter signups.",
  path: "/privacy",
})

export default function PrivacyPage() {
  return (
    <PolicyPage
      title="Privacy policy"
      description="What we collect, what becomes public, and how to ask about your data."
      path="/privacy"
    >
      <PolicySection id="information" title="Information you give us">
        <p>
          ShipBits is a product directory. You can browse without an account.
          Google and GitHub sign-in are provided through Supabase OAuth. When
          you sign in, we receive the account identifier, email, and available
          basic profile details that the provider shares. ShipBits does not
          receive your Google or GitHub password.
        </p>
        <p>
          We store product drafts, website URLs, descriptions, categories,
          logos, and cover images you submit. Optional profile details include
          your display name, photo, title, role, bio, location, and links. We
          use account and builder associations to let the right person manage a
          product.
        </p>
      </PolicySection>

      <PolicySection id="public-content" title="What becomes public">
        <p>
          Published product details and their managed images are public. They
          can appear in product pages, directory lists, categories, previews,
          badges, and search engines. Public product totals may include listing
          payments and paid support, but we do not publish payer email addresses
          or transaction identifiers with those totals.
        </p>
        <p>
          Builder profile details are intended for attribution where a public
          profile feature is enabled and the visibility setting permits it.
          Private drafts, account email addresses, and payment records are not
          public listing content. An image uploaded to public asset storage can
          be accessible to anyone who has its URL, even before the listing is
          published. Do not upload confidential material.
        </p>
      </PolicySection>

      <PolicySection
        id="service-providers"
        title="How the service processes your information"
      >
        <ul>
          <li>
            Supabase provides authentication and stores account, product,
            submission, and payment-status data. Cloudflare R2 stores managed
            images such as logos, covers, and profile photos.
          </li>
          <li>
            Autocomplete can send your website URL to Firecrawl, then send
            retrieved public website content to the AssemblyAI LLM Gateway to
            generate suggested product copy. Review the result before saving;
            generated text can be wrong. Admin imports may retain website
            evidence for later regeneration.
          </li>
          <li>
            The SEO / Launch Checker requests the public URL you supply and may
            inspect its robots.txt and sitemap. Only analyze pages you are
            entitled to check. Do not include access tokens, private links, or
            credentials in a submitted URL.
          </li>
          <li>
            PayMongo processes QR Ph payments. ShipBits stores references,
            amounts, currency, and status needed to verify payments and fulfil
            listings or support. We do not ask for your bank or e-wallet
            password.
          </li>
        </ul>
        <p>
          These providers and their infrastructure may process information
          outside your country. Their own privacy terms govern the parts of
          their services that they operate independently.
        </p>
      </PolicySection>

      <PolicySection id="newsletter" title="Newsletter and preferences">
        <p>
          ShipBits Weekly is an optional signup. We currently save the email
          address, subscription status, and signup time in Supabase; we are not
          sending newsletters yet. Newsletter signup is separate from signing
          in, paying, or saving account notification preferences.
        </p>
        <p>
          Ask through the contact below to withdraw a signup or remove your
          email. A delivery provider and a working unsubscribe mechanism must be
          in place before newsletter sending begins. Signing up again does not
          automatically reactivate an address marked unsubscribed.
        </p>
      </PolicySection>

      <PolicySection id="security" title="Cookies, security, and retention">
        <p>
          Authentication uses session cookies. The submission flow can
          temporarily store a product URL in your browser session so it survives
          OAuth. We keep rate-limit counters and security logs to reduce abuse;
          rate-limit identifiers use a keyed hash rather than a stored raw IP
          address. Our current analytics event hooks do not send data to a new
          analytics provider.
        </p>
        <p>
          Drafts and profiles remain until removed. Archiving hides a listing;
          it is not data erasure. Some records, backups, and provider records
          may remain where needed for security, payment reconciliation,
          disputes, or legal obligations. No automatic account or newsletter
          retention schedule is currently configured. The operator must confirm
          a retention schedule before launch.
        </p>
      </PolicySection>

      <PolicySection id="your-choices" title="Your choices and requests">
        <p>
          You can edit available profile and listing fields from your{" "}
          <Link href="/dashboard">dashboard</Link>. Contact the operator to ask
          about access, correction, removal, or objection to processing, subject
          to applicable rights and necessary verification. There is no automated
          account-deletion tool in this release.
        </p>
        <p>
          For information about Philippine data-subject rights and complaints,
          see the{" "}
          <a href="https://privacy.gov.ph/data-subject-rights/">
            National Privacy Commission
          </a>
          . Changes to these practices should be reflected on this page. This
          policy does not limit rights provided by applicable law.
        </p>
      </PolicySection>
    </PolicyPage>
  )
}
