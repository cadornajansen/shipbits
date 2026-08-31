# Site-policy launch review

The `/privacy`, `/terms`, and `/refund-policy` pages are original ShipBits site policies, not legally reviewed documents. They deliberately show an operator-review notice. Review and approve the commitments before marketing begins; do not remove the notice solely to make the site look finished.

Before public launch:

- Set `NEXT_PUBLIC_SUPPORT_EMAIL` to a monitored address that the operator actually controls. Without it, the pages explain that contact is not configured rather than inventing a support inbox.
- Add the confirmed operator identity and any required business/contact details. Obtain appropriate professional review for the jurisdictions in which ShipBits operates.
- Confirm the proposed refund policy: verified technical duplicates, charged-but-unfulfilled transactions, and paid submissions rejected before any publication are eligible for review. Correct fulfilment, poor outcomes, and subsequent policy-violation removals are not automatically refundable; statutory rights remain unaffected.
- Confirm the PayMongo account's refund capability and processing procedure. The current official guide lists a 30-day QR Ph refund window and no partial QR Ph refunds. No refund SDK or automated refund flow was added.
- Keep a reconciliation record when handling manual refunds and correct any public listing/support totals manually. The app has no refunded payment state or automatic reversal mechanism yet.
- Define and implement a data-retention/deletion procedure for accounts, drafts, images, payment records, logs, backups, and newsletter signups. Do not promise a purge timeline that is not implemented.
- Handle privacy and newsletter opt-out requests through the monitored support channel. An operator can mark an address `unsubscribed`; duplicate signups intentionally do not reactivate it. Public direct access to the subscriber table must remain blocked.
- Newsletter forms save opt-in addresses in Supabase and send a Resend confirmation email. Confirm the sender domain, monitor the reply-to inbox for unsubscribe requests, and add a one-click unsubscribe mechanism before sending the first newsletter issue. Account notification preferences are not newsletter consent.
- Verify the deployed hosting/logging, regional processing, and provider data-handling configuration match the privacy text. Publicly served image URLs are not a private file vault.

Reviewed implementation facts:

- Google/GitHub authentication uses Supabase; admin authorization remains separate.
- Firecrawl plus AssemblyAI generates suggestions from website evidence. People should review copy and image rights before saving.
- Verified paid submissions with required content and images can publish immediately. Admins can still archive, return to draft, reject, or delete listings.
- Public product values include paid listing/support amounts and may include the ₱1 starting value for an admin-added product. They are not the listed app's own selling price.

Primary references checked on August 30, 2026:

- [PayMongo refund guide](https://docs.paymongo.com/docs/payment-acceptance-refunds): QR Ph refund support, provider window, and processing mechanics. ShipBits eligibility commitments are the proposed site policy, not a claim about what PayMongo guarantees.
- [National Privacy Commission: data-subject rights](https://privacy.gov.ph/data-subject-rights/): access, correction, objection, erasure/blocking, portability, and complaints. The policy is not a certification of legal compliance.
