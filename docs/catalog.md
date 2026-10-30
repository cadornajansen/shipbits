# Publishing a Shipbits component

The public catalog is `lib/catalog.ts`. Only complete, working entries belong in it.
Its order drives homepage cards, sidebar links, the real component count, footer links,
and previous/next navigation. Do not add an unfinished component as a catalog placeholder.

The fifteen interactive additions are declared in `lib/collection-additions.ts` and
merged into those groups by `lib/catalog.ts`. Their `/components/[id]` route is
generated from that list. Add a matching demo to the exhaustive map in
`components/collection-examples/index.tsx`, a thumbnail in
`components/collection-artwork.tsx`, and the editable source in `components/ui/`.
The integration test compiles every published usage example and checks that source
instructions include every local import: `node --experimental-strip-types --test lib/collection-additions.test.ts`.

1. Implement and verify the component in `components/ui/`, including keyboard behavior,
   responsive sizing, motion preferences, and any fallback. Preserve existing exports.
2. Add its ID to `CatalogId` and an entry to `catalog`. Supply a title, description,
   card summary, public URL, preview key, group, and truthful installation information.
   Choose `effects` for visual materials/effects, `ai-agents` for AI interfaces,
   `components` for reusable UI, or `icons` for SVG icon sets. The sidebar uses
   these groups under Collection.
   Use `registry` only when a real registry item exists. Otherwise list the source
   files, their dependencies, and a runnable usage example using `source`.
3. Implement the matching icon in `components/catalog-icon.tsx` and artwork in
   `components/component-artwork.tsx`. Use the real component for a live preview;
   do not add fake data implying a live backend.
4. Add the working preview in `components/component-showcase.tsx`. Create a route
   that renders `<ComponentPage id="your-id" />`. This supplies the shared heading,
   navigation, Preview/Install tabs, and copy actions.
5. If the component has an editor, add its Studio destination to the catalog and
   render the editor in `app/studio/[id]/page.tsx`. Keep editor state in the editor:
   settings feed both the live component and exported code.
6. Verify the public page, Install tab, keyboard tabs, clipboard failure fallback,
   homepage card, sidebar, previous/next ordering, and Studio at desktop and phone sizes.
   Run `pnpm lint`, `pnpm typecheck`, `pnpm test:chat`, and `pnpm build`.

## Planned destinations

Product, account, and documentation placeholders live in `lib/planned-pages.ts`.
`app/[slug]/page.tsx` renders only those known slugs. Unknown slugs return 404.
Each planned page is marked “Not available yet” and excluded from search indexing.
Replace a placeholder with an explicit route when its real behavior is ready, then
remove that slug from `plannedPages`. Static routes take priority over the dynamic route.

## Current distribution

AI Chat uses the existing `/r/ai-chat.json` shadcn registry, built from `registry.json`.
The five materials and Glass folder are source-copy components in this project.
Their editable source is available at https://github.com/cadornajansen/shipbits.
Copy prompt links the repository and lists the required files. There is no standalone npm package for them.

Mono icons uses `components/ui/mono-icon.tsx` and `lib/mono-icons.ts` for its React
wrapper. The files in `public/icons/mono/` are standalone SVGs that need no framework.
Keep their individual shapes and masks editable; do not rasterize or animate them.

## Reference and styling

The public shell and interaction measurements are adapted from Libraries.dev at
`d923333ae4fc9bf82e2f4e708c8458a4c64983da`. Its MIT notice is retained in
`docs/libraries-dev-license.txt`. Saans is the font asset supplied in that repository;
Inter and Roboto Mono are self-hosted by Next.js at build time.

Use inline Tailwind utilities for styling. Do not add custom CSS files; use
`app/globals.css` only when necessary for shared tokens or keyframes. Component
and page styles live directly in their Tailwind `className` values.
Keep `--radius` and the existing shared tokens. The website is permanently dark.
