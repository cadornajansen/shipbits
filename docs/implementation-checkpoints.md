# Implementation checkpoints

This log covers the Libraries.dev adaptation in this implementation turn. Earlier Next.js and dark-theme changes were already in the working tree.

## Checkpoint 1 — Shared appearance

**What changed:** A 1240px shell with 24px desktop gutters, explicit interface sizes, Inter/Saans/Roboto Mono fonts, shared header and footer, grouped sidebar, and mobile component chips. Existing component CSS tokens (including `--radius`) remain in globals.css; public-site rules live in site.css.

**How it works:** The root layout loads self-hosted fonts and shared navigation. `lib/catalog.ts` supplies the working component links. The sidebar selects the current pathname and centers its active chip below 900px. The desktop More menu uses the existing Base UI menu primitive. Mobile navigation supports Escape and keyboard focus containment.

**One test:** Open `/glass`, use More, and resize below 900px to inspect the chip strip.

## Checkpoint 2 — Homepage, previews, and Studio

**What changed:** Five material hero tiles, gray/blue hero pills, seven real catalog cards, usage steps and FAQ; a common public Preview/Install frame; and five Studio routes.

**How it works:** Each existing public URL passes a typed ID to `ComponentPage`. The catalog provides its title, description, installation method, and neighboring entries. `ComponentShowcase` switches between live preview and truthful setup instructions. Source-copy entries list actual project files; AI Chat uses its existing registry path. Copy prompt includes those requirements, and clipboard failure exposes selectable text.

Studio resolves a known catalog ID and renders the existing GlassLab, MetalLab, DistressedLab, or MaterialLab. Their state still feeds both live rendering and generated code. The shader implementations, presets, controls, component exports, and registry definition were not rewritten.

The hero uses the pinned reference's MIT animation runtime for the dotted entrance. Pointer movement sets separate drag and magnetic-offset CSS variables. Reduced motion disables the entrance and magnetic movement.

**One test:** Open `/metal` → Tune in Studio → choose a preset → Code; inspect the exported settings.

## Checkpoint 3 — Planned destinations

**What changed:** Four mock entries were removed from the public home/sidebar, 14 honest placeholder destinations were added, and How to use was updated. UI primitives remain available.

**How it works:** `plannedPages` is separate from the published component catalog. Next.js awaits the route's params, checks the known slug, and renders the shared planned-page layout. Unknown slugs return 404. Placeholders do not offer simulated form submission or authentication and carry no-index metadata.

**One test:** Open `/pricing`, confirm “Not available yet,” then use Browse components to return to the working collection.

## File manifest

Every file authored or modified by this turn is listed below. No source files were deleted by this turn. Generated registry output may be rewritten by `pnpm build` using the existing registry format.

- `lib/catalog.ts`
- `components/site-brand.tsx`
- `components/catalog-icon.tsx`
- `components/site-footer.tsx`
- `docs/libraries-dev-license.txt`
- `public/fonts/Saans-Medium.woff2`
- `components/site-header.tsx`
- `components/collection-sidebar.tsx`
- `app/layout.tsx`
- `app/globals.css`
- `app/site.css`
- `components/component-artwork.tsx`
- `components/hero-tiles.tsx`
- `components/site-faq.tsx`
- `components/copy-button.tsx`
- `app/page.tsx`
- `components/component-page.tsx`
- `components/component-showcase.tsx`
- `components/glass-folder-examples.tsx`
- `app/studio/page.tsx`
- `app/studio/[id]/page.tsx`
- `app/glass/page.tsx`
- `app/metal/page.tsx`
- `app/distressed/page.tsx`
- `app/foil/page.tsx`
- `app/titanium/page.tsx`
- `app/components/ai-chat/page.tsx`
- `app/components/glass-folder/page.tsx`
- `lib/planned-pages.ts`
- `app/[slug]/page.tsx`
- `docs/catalog.md`
- `app/how-to-use/page.tsx`
- `lib/vendor/ui-generation.js`
- `lib/vendor/ui-generation.d.ts`
- `docs/implementation-checkpoints.md` — this walkthrough and file manifest.
- `design-qa.md` — verification results and remaining visual/interaction checks.
- `docs/visual-qa/source-home-desktop.png`
- `docs/visual-qa/source-home-mobile.png`
- `docs/visual-qa/source-menu-desktop.png`
- `docs/visual-qa/source-detail-desktop.png`
- `docs/visual-qa/source-install-desktop.png`
- `docs/visual-qa/source-install-mobile.png`
- `docs/visual-qa/source-dimensions.json`
- `docs/visual-qa/route-checks.json` — all 29 published routes return 200; unknown route returns 404.
- `docs/visual-qa/implementation-home-desktop.png` — viewport capture; rendering artifacts prevent visual acceptance.
- `docs/visual-qa/implementation-home-full.jpg` — captured implementation homepage.

The screenshot API returned JPEG bytes; these reference files retain their capture filenames. Their actual dimensions and encoding are recorded in source-dimensions.json.

## Main concept

Keep published component data in one place, but keep editor state local to its working editor. A page can change its layout without changing how a shader, slider, or generated snippet behaves.
