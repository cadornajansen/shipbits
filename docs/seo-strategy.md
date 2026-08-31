# ShipBits SEO Architecture

## Indexable routes

- `/` owns ShipBits brand and broad product-discovery intent.
- `/products` and valid `?page=N` URLs own browsing apps, SaaS, tools, and products. Each real pagination page is self-canonical.
- `/products/[slug]` is the sole canonical product-detail route. Only published, unarchived products resolve publicly.
- `/categories/[slug]` and valid pagination pages are controlled taxonomy pages. Only categories with published inventory are in the sitemap.
- `/blog` and published, non-future `/blog/[slug]` articles own informational launch and distribution intent.
- `/resources` and `/resources/seo-checker` own practical launch resources and deterministic SEO checking.
- `/directory-submission` owns commercial startup, SaaS, and product directory-submission intent.
- `/privacy`, `/terms`, and `/refund-policy` are public trust pages.
- `/feed.xml` syndicates published, non-future blog articles but is not a search landing page.

## Non-indexable routes

Dashboard, admin, login/auth, API, payment, campaign tracker/report, badge, and owner-only routes are omitted from the sitemap. Dashboard and admin layouts and the login page emit `noindex, nofollow`; crawler exclusions reduce waste but never replace authorization. Invalid products, categories, articles, and out-of-range pagination return a real 404.

## Search intent ownership

| Surface                       | Primary intent                                                   |
| ----------------------------- | ---------------------------------------------------------------- |
| Homepage                      | ShipBits brand and curated product discovery                     |
| `/products`                   | Browse apps, SaaS, developer tools, and startup products         |
| `/categories/developer-tools` | Developer tools directory                                        |
| `/categories/education`       | Education and learning products                                  |
| `/directory-submission`       | Startup, SaaS, and product directory submission service          |
| `/resources/seo-checker`      | Free SEO and launch checker                                      |
| `/blog/*`                     | Informational founder, launch, distribution, and search guidance |

Educational directory-submission articles should explain tradeoffs and link to the commercial page rather than duplicate its sales intent. The homepage introduces discovery; `/products` is the browse destination.

## Metadata conventions

The canonical origin, site name, locale, logo, default description, and social fallback live in `lib/site.ts`. `createPageMetadata` provides distinct titles, descriptions, canonical URLs, Open Graph, Twitter, and robots directives. Dynamic metadata comes only from public product/category data or validated article frontmatter. Page titles passed to the helper do not include `| ShipBits`.

Product metadata falls back from cover to generated product OG art. Descriptions use the stored short description, with a non-empty category fallback. Articles require title, slug, description, date, author, category, and draft state before parsing succeeds.

## Canonical strategy

All indexable pages are self-canonical on the `NEXT_PUBLIC_SITE_URL` origin. Production must configure the canonical HTTPS origin; the safe default is `https://shipbits.dev`. Sitemap URLs, metadata, and internal links use the same paths and no trailing slash. Tracking parameters and fragments are excluded. Existing product slugs remain stable.

## Pagination strategy

Page one omits `?page=1`. Real pages two and above use crawlable links and self-canonical `?page=N` URLs with page-specific titles and descriptions. Invalid, duplicate, unsafe, or out-of-range page values return 404 or redirect to the clean equivalent.

## Filter/query strategy

Product search is user-facing but `noindex`. Search URLs canonicalize only to their normalized result URL and are excluded from the sitemap. Arbitrary tag, sort, and combined-filter landing pages are not created. Pagination without a temporary filter remains indexable.

## Sitemap strategy

`/sitemap.xml` contains canonical static routes, published products, categories with inventory, and published non-future articles. Product and category dates come from stored product updates; article dates come from validated frontmatter. Private, draft, future, search, payment, report, badge, and API URLs are excluded. Split into sitemap indexes only when real inventory approaches operational sitemap limits.

## Structured data

- Homepage: truthful `Organization` and `WebSite` entities without invented social profiles or search actions.
- Product: a conservative `Product` entity based only on public fields plus `BreadcrumbList`. ShipBits support/listing payments are never represented as product offers.
- Article: `BlogPosting` from validated frontmatter plus `BreadcrumbList`.
- Category: `BreadcrumbList` matching visible navigation.
- Directory Submission: `Service` may describe the visible service and exact current offers; it must never include ratings, reviews, guarantees, or product-sale semantics.

JSON-LD is rendered by the shared component and escapes script-sensitive characters. Schema properties must always match visible content.

## Internal linking rules

Use crawlable Next.js links or anchors with descriptive destination text. Homepage links to products, categories, resources, blog through navigation, and directory submission. Products link to category, related products, and their external website. Articles link contextually to relevant tools, directory pages, and the commercial service. Avoid random links, hidden links, orphan routes, and nonexistent hubs.

## Product page quality rules

Only moderated published products are indexable. A product page should visibly provide name, summary, useful description, category, tags, imagery, website, publication context, and relevant related products where available. User descriptions remain source content and are not mechanically rewritten. External links use `ugc`; add `sponsored` only when the specific outbound link is a paid placement relationship.

## Blog publishing requirements

Frontmatter requires title, unique slug, description, `YYYY-MM-DD` publication date, truthful author identity, category, and boolean draft state. Updated dates cannot precede publication. Draft and future articles never enter queries, metadata, RSS, or sitemap. Published content should be original, substantive, logically headed, and include useful contextual or primary-source links.

## Category strategy

Categories are controlled taxonomy. High-value categories have concise curated definitions; the remaining controlled categories receive a short factual fallback. Categories without published inventory are omitted from search surfaces for now. Category copy should explain scope, not repeat keyword variants.

## Tags strategy

Tags enrich visible product semantics and can improve relevance signals. ShipBits does not create tag landing pages in this checkpoint. Add them only when a stable tag has enough products, unique user value, and editorial context to avoid thin programmatic pages.

## Directory Submission commercial SEO

`/directory-submission` explains the human-reviewed matching and submission workflow, current one-time pricing, tracker/reporting, third-party fee disclosure, and the fact that each directory controls approval. It does not promise backlinks, followed links, rankings, traffic, authority metrics, or partnerships. Example destinations do not imply endorsement.

## Core Web Vitals targets

- LCP at or below 2.5 seconds: reserve media space, keep hero copy server-rendered, and avoid making decorative motion the primary content.
- INP below 200 milliseconds: retain Server Components for static content and keep client interaction scoped to controls that need it.
- CLS below 0.1: provide image dimensions/aspect ratios and stable responsive layouts.

The directory marquee has fixed dimensions and reduced-motion behavior. Important commercial copy exists outside it. Product media uses stable aspect ratios; external R2 optimization should be revisited only with a verified hostname and image-delivery policy.

## Search Console launch checklist

- Verify the canonical production property in Google Search Console.
- Submit `/sitemap.xml` and inspect `/`, `/products`, `/directory-submission`, one product, one category, and one article.
- Monitor Page Indexing, Core Web Vitals, crawl anomalies, and applicable structured-data enhancements.
- Run Rich Results Test on homepage entities, a representative product, an article, and breadcrumbs.
- Run PageSpeed Insights on homepage, products, a product detail, directory submission, and an article on mobile and desktop.
- Submit the sitemap to Bing Webmaster Tools and inspect representative URLs.
- Confirm preview/staging deployments are not linked or submitted as canonical properties. If previews become publicly discoverable, add a reliable platform-level non-production `noindex` policy rather than guessing from an unstable environment signal.

## SEO anti-patterns ShipBits intentionally avoids

- No keyword stuffing, hidden text, meta keywords, or arbitrary SEO-score claims.
- No mass tag pages, thin programmatic pages, doorway pages, or generated location pages.
- No fake review schema, fake ratings, testimonials, rankings, authority, or expertise.
- No scaled AI content or scraped competitor content.
- No guaranteed backlink, followed-link, ranking, traffic, DR, or AI-citation claims.
- No obsolete sitelinks search action or unsupported schema added only for validator eligibility.

# Production Metadata & Asset Matrix

## Implemented

- **Favicon:** `app/favicon.ico` is the stable, legacy-compatible root favicon. The existing official ShipBits mark also supplies a padded Apple touch icon and 192px/512px manifest icons.
- **Manifest:** `app/manifest.ts` publishes truthful name, description, browser display mode, colors, scope, and Android/Chromium icons. It does not claim offline or installable-app behavior that ShipBits does not provide.
- **Social previews:** `public/branding/shipbits-preview.png` is the global 4800×2520 Open Graph and Twitter/X `summary_large_image` source; products retain their dedicated generated OG route. Metadata uses canonical absolute URLs and image alt text.
- **Structured data:** Organization, WebSite, Product, BlogPosting, Service, and BreadcrumbList are emitted only where the visible page supports them. Entity IDs use the canonical site URL.
- **Machine-readable routes:** `robots.txt`, `sitemap.xml`, and `feed.xml` are implemented. The RSS alternate is advertised from root metadata.
- **Verification hooks:** optional public `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` and `NEXT_PUBLIC_BING_SITE_VERIFICATION` values are emitted only when configured. No credential is exposed.
- **Preview behavior:** no preview noindex policy is added because this repository has no reliable deployment-environment signal that can distinguish public production from a preview safely.

## Intentionally not applicable

- **SVG favicon and Safari pinned tab:** the available vector source contains embedded raster data and is not a compact monochrome mask; the stable ICO and PNG hierarchy is safer than creating an inferior substitute.
- **Maskable icon:** the official mark needs visible padding to avoid crop damage, so it is declared only for the standard `any` purpose.
- **Microsoft tile/browserconfig:** legacy tile metadata adds no meaningful support beyond the maintained modern icon set.
- **`llms.txt` and `security.txt`:** neither is added without a durable, truthful public policy/contact surface. `llms.txt` is not a Google ranking signal.
- **IndexNow:** remains an optional operational integration; it is not coupled to publication because this checkpoint does not establish a verified key and non-blocking delivery lifecycle.

## External launch validation

- Verify the production property in Google Search Console and Bing Webmaster Tools, submit `/sitemap.xml`, and inspect representative homepage, directory, product, category, article, and directory-submission URLs.
- Check social cards with the Facebook Sharing Debugger and LinkedIn Post Inspector after the production domain is live.
- Run Google Rich Results Test and Schema Markup Validator on representative structured-data pages, then test PageSpeed Insights for homepage, products, a product, directory submission, and an article.
