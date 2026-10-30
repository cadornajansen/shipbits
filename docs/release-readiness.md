# Public release preparation

Verified on October 30, 2026 with Node.js 24.18.0 and pnpm 11.15.0.

## What changed

Contact, Support, Privacy, and Terms are real static pages. Introduction, Installation, Accessibility, and Skill now explain the actual source-copy, registry, and Studio workflows. The public identity is `shipbits.dev`, Jansen Cadorna, and `ship@jansencadorna.com`. Coffee links are hidden until a destination is configured.

Original Shipbits code is MIT licensed. Existing third-party notices are preserved, a full Glass folder notice is included, and the owner confirmed permission to redistribute the bundled Saans font. Font and dependency licenses remain separate from the original code's MIT license.

This is the first public push of the accumulated Shipbits application, including earlier component work already present in the working tree. This release-preparation pass does not redesign those components.

## How the pages work

1. `lib/site.ts` holds the domain, contact, repository, and optional coffee destination.
2. Two typed page lists provide content for the information pages and getting-started guides.
3. `app/[slug]/page.tsx` generates these pages at build time using the existing sidebar and typography. Their metadata uses the production domain.
4. The sitemap includes working public pages and editors. Unfinished account destinations remain explicitly unavailable, carry `noindex`, and are excluded from the sitemap and main navigation.
5. Header and footer GitHub links point to the repository. The old `/github` placeholder permanently redirects there.

These pages need no database or form service. Contact opens the visitor's mail application; public bug reports use GitHub Issues.

## Verification

- `pnpm install --frozen-lockfile`: passed.
- `pnpm lint`: passed.
- `pnpm typecheck`: passed; generates Next route types first so it also works in a fresh checkout.
- `pnpm test`: all 374 tests passed, including the existing chat, collection, icon, and orb tests.
- `pnpm build`: passed, including registry generation and all 50 generated pages.
- Production HTTP checks: all eight new information/guide pages return 200 with the expected title and canonical URL; registry, icon, robots, and sitemap return 200; `/github` returns 308; unknown routes return 404; `/account` is marked `noindex`.
- Security headers: `nosniff` and the configured referrer policy are included; the framework identification header is disabled.
- Production browser check at 1280px: Contact layout, Support link, hidden coffee control, and Glass reload passed with no captured browser errors.
- Phone check at 390px: Contact, Support, Privacy, Terms, Installation, and Skill have no horizontal page overflow. Mobile navigation opens and shows the repository link without the deferred coffee control.
- A scan of application, documentation, scripts, and public assets found no common credential/private-key signatures. This is a limited release check, not a guarantee of exhaustive security review.

Screenshots: [Contact desktop](visual-qa/release-contact-desktop.png), [Privacy phone](visual-qa/release-privacy-phone.png).

## Dependency audit and remaining launch work

The shadcn CLI is now a development dependency because it is used to build the registry and styles, not by the running server. Compatible transitive patches were applied for body-parser, fast-uri, qs, systeminformation, and undici.

`pnpm audit --prod` reports zero known findings. The complete development graph still reports two advisories: Zod 3 oversized-collection memory exhaustion (high) and deepmerge 4.3.1 prototype poisoning (low), reached through development tooling. Compatible updates did not resolve those pinned/range-limited dependencies. No major-version override or audit suppression was added. Recheck when the upstream tooling is updated; do not treat an unrestricted audit as clean.

The repository is prepared for a Node.js Next.js host, but this work does not deploy or configure DNS. Before launch, connect the host, enable HTTPS for `shipbits.dev`, and confirm its operational log retention against the Privacy page. No analytics or backend service was added. Buy Me a Coffee remains deferred. Sign-in, sign-up, account, and feedback routes are still explicitly unpublished functionality.

## One focused manual test

Run `pnpm build`, then `pnpm start`. Open `/contact`, follow Support, then use the footer to open Privacy and Terms. Confirm the contact address, working source links, readable phone layout, and absence of a coffee button. GitHub publishing and website deployment are separate steps.

## Files changed in this preparation pass

| File | Change and purpose |
| --- | --- |
| `.env.example` | Added public build-time domain, email, and deferred coffee settings. |
| `.gitignore` | Allows the safe environment example while excluding actual environment files. |
| `.github/workflows/ci.yml` | Added pinned GitHub Actions for install, lint, types, all tests, and build. |
| `LICENSE` | Added the owner's chosen MIT license for original code. |
| `THIRD_PARTY_NOTICES.md` | Added source and font attribution overview. |
| `README.md` | Replaced starter documentation with setup, checks, source, and production instructions. |
| `package.json` | Added the portable test command, pinned package manager/runtime requirements, fresh-checkout type generation, and moved shadcn to development dependencies. |
| `pnpm-lock.yaml` | Records the dependency classification and compatible transitive security patches. |
| `scripts/test.mjs` | Added recursive test discovery that works on Windows and CI. |
| `lib/site.ts` | Added shared public identity and destination configuration. |
| `lib/information-pages.tsx` | Added typed Contact, Support, Privacy, and Terms content. |
| `lib/getting-started-pages.tsx` | Added truthful Introduction, Installation, Accessibility, and Skill guides. |
| `lib/planned-pages.ts` | Removed destinations now implemented as real pages or a redirect. |
| `app/[slug]/page.tsx` | Renders static information pages with metadata while preserving unavailable account routes. |
| `app/layout.tsx` | Sets the production metadata base and Shipbits sharing text. |
| `app/robots.ts` | Added crawler access and sitemap location. |
| `app/sitemap.ts` | Added a catalog-driven sitemap for working public destinations. |
| `app/icon.svg` | Added the Shipbits browser icon. |
| `app/favicon.ico` | Deleted the default framework favicon. |
| `app/how-to-use/page.tsx` | Replaced unavailable-source wording with the public repository workflow. |
| `components/component-showcase.tsx` | Updated Install panels and source-copy snippets to link the repository. |
| `components/site-header.tsx` | Connected GitHub and hid unset coffee controls on desktop and mobile. |
| `components/site-footer.tsx` | Connected the footer's GitHub link. |
| `next.config.ts` | Added the GitHub redirect and conservative response headers. |
| `docs/catalog.md` | Updated source distribution guidance for the public repository. |
| `docs/glass-folder-license.txt` | Added the full third-party MIT notice. |
| `docs/release-readiness.md` | This release record and file manifest. |
| `docs/visual-qa/release-contact-desktop.png` | Saved desktop production-page evidence. |
| `docs/visual-qa/release-privacy-phone.png` | Saved phone production-page evidence. |
