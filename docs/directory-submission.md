# Directory Submission MVP

## Temporary live-payment test price

Starter is priced at **₱199 for 10 submissions**. Historical ₱1 test campaigns remain valid in the database, but new Starter campaigns use the production price.

## Deployment status

Implemented in code and validated against an isolated PostgreSQL runtime. The configured hosted Supabase project still needs migrations. No hosted data or payments were changed during implementation.

`npx supabase db push --linked --dry-run` reports three pending migrations:

1. `20260830161943_expand_product_taxonomy.sql` — pre-existing taxonomy change.
2. `20260830165917_directory_submission.sql` — campaign schema and shared payment fulfillment.
3. `20260830170202_seed_directory_catalog.sql` — 24 directory records.

Review that list before applying `npx supabase db push --linked`. The seed follows the project's existing migration-based convention; rerunning its INSERT updates descriptive fields by slug without resetting operational flags or notes.

Keep the existing PayMongo secret/public keys and webhook secret configured. The existing `/api/webhooks/paymongo` endpoint handles campaign payments too. Perform a PayMongo test-mode purchase after migration deployment; no real provider payment was initiated during validation.

## Payment and product flow

1. The founder selects an owned `products` record, or creates/edits an existing `listing_submissions` draft through `PublicProductForm` and autocomplete.
2. The server checks ownership and complete details/media, then saves an `awaiting_payment` campaign. Prices come from `features/directory-submissions/config.ts`; database constraints independently enforce the locked price/count pairs.
3. Checkout adds a campaign target to the existing `listing_payments` model. It uses the same PayMongo QR Ph helpers and idempotency keys. Product/campaign/plan references travel in provider metadata. A draft is locked against ordinary editing during payment.
4. Signed webhooks or authenticated server-side status reconciliation retrieve the intent from PayMongo and verify `succeeded`, amount, and currency. Client state alone cannot activate a campaign.
5. One database transaction records payment, publishes the existing draft if needed, links its owner, activates the campaign, and creates matched jobs. The original ₱1 listing fulfillment uses the same extracted publication routine. No extra listing payment is required for a package.
6. Admins process jobs manually; founders see status, timestamps, links, rejection reasons and action-required messages. Private admin notes are not selected for customer pages or CSV reports.

Campaign payments have `campaign_id`, not `submission_id`, on the payment row. They therefore do not inflate the existing public listing-support amount. Existing listing/support display conventions remain unchanged.

## Operational limits

- The initial seed is deliberately 24 real directories, verified from their official homepages. Those homepage URLs are stored with each record. A homepage check is not a verified submission form, affiliation, or approval guarantee.
- `submission_url`, account requirements and payment requirements remain unknown where not verified. Admins must check directory policies, fees, eligibility and current forms before submission. For example, [Uneed](https://www.uneed.best/) advertises paid launch options; fees are not included or authorized by a ShipBits package.
- Only relevant active directories are assigned, at most the plan target. The 50/100 plans initially have unassigned slots. Admins can add verified catalog records and assign additional matching directories; this catalog expansion is manual operational work still required to deliver the full larger packages.
- Submitted, live, and submitted-then-rejected jobs count as processed. Queued, processing, needs-action, and skipped jobs do not. A skipped job remains visible; it is not silently counted as a delivered submission.
- A campaign is completed only once the full paid target has actual processed submissions. Partial catalogs never produce falsely completed campaigns.
- Plan changes are allowed before any payment attempt, by choosing another package for the same product. Amounts are locked once checkout starts. QR retries retain an uncertain provider request's idempotency key; expiry/failure notification permits a new attempt.
- Done For You collects the ₱2,999 base price. Extra scope and third-party fees require separate agreement; there is no automatic surcharge mechanism.
- Product/draft foreign keys retain campaign history and prevent destructive deletion of linked records. No automation, workers, scraping, CAPTCHA bypass, or credential collection is included.

## Validation

```powershell
npm run typecheck
npm run build
npx tsx --test tests/*.test.ts
npm exec --yes --package=@electric-sql/pglite -- node scripts/test-directory-database.mjs
npx eslint features/directory-submissions components/directory-submissions app/directory-submission app/dashboard/directory-submissions app/admin/directory-submissions
```

The database script uses an ephemeral in-memory PostgreSQL runtime from the npm cache, not the configured hosted database. It applies all migrations with minimal Supabase auth-role stubs (built-in UUID generation replaces the unused pgcrypto extension installation), then tests repeat seed, ownership/RLS, locked pricing, pending checkout guards, publication, existing-product reuse, repeat fulfillment, quota enforcement, admin updates, original listing checkout, and blocked client mutations/RPCs. It does not add an application dependency or simulate PayMongo success in the application.

Browser checks covered the landing page, pricing anchor, mobile overflow, existing sign-in dialog, and Resources removal. A forged webhook request returned HTTP 401. Authenticated customer/admin screens and live provider delivery still require a deployed-schema test account and PayMongo test-mode checkout.

Repository-wide lint has pre-existing `react-hooks/set-state-in-effect` errors in `components/ui/carousel.tsx:98` and `hooks/use-mobile.ts:14`. Changed feature files pass targeted lint.

## Files created

| File | Purpose |
| --- | --- |
| `app/directory-submission/page.tsx` | Public landing, preview, pricing and conversion CTAs |
| `app/dashboard/directory-submissions/page.tsx` | Customer campaign list |
| `app/dashboard/directory-submissions/new/page.tsx` | Existing product/draft and plan selection |
| `app/dashboard/directory-submissions/[id]/page.tsx` | Customer tracker |
| `app/dashboard/directory-submissions/[id]/report/route.ts` | Owner-authorized CSV report |
| `app/admin/directory-submissions/page.tsx` | Campaign status filter and verified catalog entry form |
| `app/admin/directory-submissions/[id]/page.tsx` | Admin job management |
| `app/admin/directory-submissions/[id]/report/route.ts` | Admin-authorized report |
| `components/directory-submissions/admin-action-form.tsx` | Pending/error/success handling for admin forms |
| `components/directory-submissions/campaign-checkout.tsx` | Existing QR Ph checkout and confirmation polling |
| `components/directory-submissions/campaign-list.tsx` | Shared responsive campaign rows |
| `components/directory-submissions/campaign-tracker.tsx` | Progress, job rows, founder messages and admin controls |
| `components/directory-submissions/product-owner-link.tsx` | Owner-only product-page CTA |
| `components/directory-submissions/start-campaign.tsx` | Product/draft selection, shared form, package choice and sign-in |
| `components/directory-submissions/status-badge.tsx` | Compact typed status presentation |
| `features/directory-submissions/actions.ts` | Authorized campaign, checkout and admin mutations |
| `features/directory-submissions/config.ts` | Locked plans, status vocabulary, formatting and progress |
| `features/directory-submissions/matching.ts` | Deterministic directory ranking and target caps |
| `features/directory-submissions/payments.ts` | Verified provider reconciliation and transactional fulfillment |
| `features/directory-submissions/queries.ts` | Authorized reads, catalog and product matching profile |
| `features/directory-submissions/report.ts` | CSV serialization with formula injection protection |
| `features/directory-submissions/types.ts` | Shared campaign/catalog/job types |
| `supabase/migrations/20260830165917_directory_submission.sql` | Three tables, enums, shared payments, grants, guards and transactions |
| `supabase/migrations/20260830170202_seed_directory_catalog.sql` | Idempotent 24-directory seed |
| `tests/directory-submissions.test.ts` | Pricing, matching, progress, seed and report tests |
| `scripts/test-directory-database.mjs` | Isolated PostgreSQL integration/security tests |
| `docs/directory-submission.md` | Deployment, limitations, verification and file manifest |

## Existing files modified

| File | Purpose |
| --- | --- |
| `app/admin/layout.tsx` | Admin navigation entry |
| `app/api/webhooks/paymongo/route.ts` | Dispatch campaign payments through verified fulfillment; retry errors |
| `app/auth/callback/route.ts` | Allow the campaign-start destination after sign-in |
| `app/products/[slug]/page.tsx` | Mount owner-only distribution CTA |
| `app/resources/page.tsx` | Remove obsolete Coming soon entry |
| `app/sitemap.ts` | Include the commercial landing route |
| `components/auth/auth-dialog.tsx` | Permit the existing auth dialog to return to campaign setup |
| `components/dashboard/dashboard-products.tsx` | Owner product action |
| `components/dashboard/dashboard-shell.tsx` | New active navigation value |
| `components/dashboard/dashboard-tabs.tsx` | Directory Submissions tab and mobile wrapping |
| `components/layout/footer.tsx` | First-class builder navigation |
| `components/layout/navbar.tsx` | Desktop/mobile product entry |
| `components/submissions/public-product-form.tsx` | Return saved draft ID to an optional continuation |
| `components/submissions/public-submission-dialog.tsx` | Optional saved-draft callback; existing callers preserved |
| `lib/paymongo/qrph.ts` | Optional provider metadata; existing callers unchanged |

No files were deleted. Earlier uncommitted listing/upvote/category UI changes and unrelated assets were preserved.
