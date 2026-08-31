# Production readiness

This checklist documents the operational requirements for deploying ShipBits. It does not replace provider dashboards, database backups, or incident procedures.

## Environment

- Set every core variable in `.env.example`. `PUBLIC_RATE_LIMIT_SALT` must be a random secret of at least 16 characters and must remain stable across instances.
- Set `NEXT_PUBLIC_SITE_URL` to the canonical HTTPS origin. Never expose `SUPABASE_SERVICE_ROLE_KEY`, `PAYMONGO_SECRET_KEY`, webhook secrets, R2 credentials, or third-party API keys to browser code.
- Set `PUBLIC_TRUSTED_IP_HEADER` only when the edge proxy overwrites that header on every request. Do not trust a client-controlled forwarding header.
- Use live PayMongo credentials only in the production environment and register the exact production webhook URL.

## Database

- Review and apply pending migrations through the normal controlled migration workflow. Do not edit an already-applied migration.
- Confirm RLS remains enabled and grants remain restricted on customer and payment tables.
- Confirm the atomic request-rate-limit function and payment fulfillment functions exist after migration.
- Configure automated backups and periodically test restoration to a separate project.

## Edge and network

- Enforce HTTPS at the edge. The application sends HSTS in production; verify it is not stripped by the proxy.
- Preserve the application security headers and avoid caching authenticated pages or webhook responses.
- Restrict Supabase, R2, PayMongo, Firecrawl, and AssemblyAI credentials to the minimum environments and permissions available.

## CSP report-only rollout

- Do not enforce a Content Security Policy until its reports have been observed in production. Start with `Content-Security-Policy-Report-Only` and a report collector, then allow only the origins evidenced by those reports.
- The initial inventory must cover `self`, the configured Supabase origin, the configured public R2 origin, and any actually loaded OAuth, PayMongo, analytics, font, image, or demonstration providers. Do not copy a static policy between environments because those configured origins differ.
- Keep `frame-ancestors 'none'` aligned with the existing `X-Frame-Options: DENY` unless ShipBits intentionally adds an embed feature. Promote directives to enforcement only after the report-only period is clean.

## Payments

- Verify PayMongo webhook signing with a test-mode event before enabling live checkout.
- Monitor webhook non-2xx responses and structured `paymongo_*` log events. Alerts should include event, payment, and intent identifiers, never raw payloads or secrets.
- Reconcile PayMongo transactions against `listing_payments` and `product_upvotes`. Fulfillment is idempotent, but unresolved verification or fulfillment warnings require investigation.
- Test duplicate webhook delivery, late failure delivery, amount/currency mismatch, and provider outage behavior in a non-production project.

## Abuse and external services

- Monitor rate-limit denials and global bucket utilization. Adjust limits only with usage and cost data.
- Remote image imports use DNS-pinned, size-bounded fetches. Keep the allowlist policy limited to public HTTP(S) ports 80 and 443.
- Firecrawl, AssemblyAI, and PayMongo calls have hard deadlines. Alert on sustained timeout or error rates rather than retrying payment creation blindly.

## Release checks

Run before release:

```sh
pnpm run typecheck
pnpm run lint
pnpm exec tsx --test tests/*.test.ts
pnpm run build
pnpm exec supabase db push --dry-run
git diff --check
```

Also review `git status --short` and the complete diff so only intended files and migrations ship. Run the Supabase dry run against the intended linked project, but require an explicit operator approval before any real database push.

## Rollback and incident response

- Keep the prior application artifact deployable. Prefer a forward migration for database corrections; do not roll back destructive schema changes without a tested recovery plan.
- Disable affected checkout entry points if payment verification or fulfillment integrity is uncertain. Do not manually mark payments paid without provider reconciliation.
- For a webhook incident, preserve the provider event and payment-intent IDs, inspect the provider's authoritative payment state, then use the existing idempotent reconciliation path; do not replay raw payloads blindly.
- For abuse, identify the rate-limit action and reduce that action's configured limit or block at the edge while preserving evidence needed to investigate the account or request pattern.
- For a database incident, stop risky mutations, take or preserve a backup, and restore only through the documented tested procedure.
- Rotate a credential immediately if logs, source control, or client bundles may have exposed it, then audit access and payment activity.
- Preserve structured logs and provider event IDs for investigation while avoiding raw webhook bodies and personal data.
