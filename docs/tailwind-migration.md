# Collection groups and Tailwind migration

Completed 2026-10-27.

## What changed

Collection is the main header, footer, and sidebar label. Catalog entries have a typed group:
Effects (five materials), AI agents (AI Chat), and Components (Glass folder). The active
component's group opens by default; groups can be toggled independently. Phone layouts
keep the seven horizontally scrolling component chips.

Standalone CSS files were deleted. Component and page styles now use inline Tailwind
utilities. Only app/globals.css remains: framework directives/defaults, shared tokens,
registered animation properties, and keyframes. Dynamic rendering values (shader settings,
drag offsets, syntax colors) remain runtime values; their rendering logic was preserved.

Sidebar disclosure panels transition height and opacity over 200 ms. Preview/Install
uses Motion: 120 ms exit followed by a 180 ms entrance, with a small vertical shift.
Reduced motion disables the movement and transition durations. Tab keyboard navigation
and aria relationships are preserved.

## Reviewable checkpoints and execution flow

1. Catalog group -> sidebar grouping and active row; header/footer Collection label.
   Test: open /glass and toggle Effects, AI agents, and Components.
2. Stylesheet selectors -> component-local Tailwind classes; global animation declarations
   -> globals.css. The generated hero SVG uses Tailwind classes too.
   Test: view the homepage, /glass, and /studio/glass at desktop and phone widths.
3. View state -> AnimatePresence exit -> keyed next panel entrance. AI Chat's registry
   ships animation declarations through its css metadata instead of a file import.
   Test: switch Preview/Install by click and arrow keys, then run pnpm test:chat.

## Verification

- pnpm lint: passed.
- pnpm typecheck: passed.
- pnpm registry:build: passed.
- pnpm test:chat: all 9 passed, including the rebuilt registry contract.
- pnpm build: passed; all 31 routes generated.
- Browser: Collection labels/groups, active rows, independent disclosure controls,
  Preview/Install click and keyboard switching, FAQ toggle, AI Chat text/input styling,
  and mobile chip scrolling checked.
- Desktop 1280px and phone 390px: no document horizontal overflow.
- Reduced motion: sidebar transition property becomes none; Motion uses zero duration
  and no vertical movement. Test media and viewport overrides were restored.
- No browser console errors observed in the checked local session.
- The screenshot captures are implementation evidence; this is not a new pixel-level
  sign-off against the reference. All editor logic was preserved, but this styling pass
  did not re-exercise every slider and preset.

## Modified files

| File | Purpose |
| --- | --- |
| `AGENTS.md` | Persistent Tailwind-only styling and reduced-motion rules. |
| `app/globals.css` | Shared tokens and necessary animation definitions; preserves existing component variables. |
| `app/layout.tsx` | Loads only globals.css; sets base sizing, background, scrolling, and responsive gutter. |
| `app/page.tsx` | Inline Tailwind hero, gallery, usage steps; Collection label. |
| `app/how-to-use/page.tsx` | Inline Tailwind guide layout. |
| `app/studio/page.tsx` | Inline Tailwind Studio list. |
| `app/studio/[id]/page.tsx` | Inline Tailwind editor page frame; editor logic unchanged. |
| `app/[slug]/page.tsx` | Inline Tailwind planned-page layout. |
| `components/catalog-icon.tsx` | Inline thumbnail sizing and surfaces. |
| `components/collection-sidebar.tsx` | Grouped Collection navigation, animated disclosure panels, mobile chips. |
| `components/component-page.tsx` | Inline shared component heading and previous/next controls. |
| `components/component-showcase.tsx` | Inline Preview/Install surfaces; Motion enter/exit transitions. |
| `components/copy-button.tsx` | Inline copy controls and manual clipboard fallback. |
| `components/hero-tiles.tsx` | Inline responsive tile positioning, hover, focus, drag chrome and trace styling. |
| `components/site-brand.tsx` | Inline logo and wordmark styling. |
| `components/site-faq.tsx` | Inline accordion transitions; removes obsolete pricing copy. |
| `components/site-footer.tsx` | Collection label and inline footer styling. |
| `components/site-header.tsx` | Collection label. |
| `components/ai-chat/atoms.tsx` | Inline avatar, menu, and loader styling. |
| `components/ai-chat/composer.tsx` | Inline input, toolbar, and spectral border styling. |
| `components/ai-chat/content.tsx` | Inline Markdown, citation, code, and source styles. |
| `components/ai-chat/workbench.tsx` | Inline activity, approval, diff, artifact, and disclosure styles. |
| `components/ui/ai-chat.tsx` | Inline transcript styling and reduced-motion rules; removes CSS import. |
| `components/ai-chat-thumbnail.tsx` | Inline thumbnail animation; removes CSS import. |
| `components/ai-chat/state.test.ts` | Registry contract now verifies global animation definitions and absence of CSS files. |
| `lib/catalog.ts` | Typed group identifiers and group membership for all seven entries. |
| `lib/vendor/ui-generation.js` | Tailwind classes on generated SVG overlay nodes; retains MIT notice. |
| `registry.json` | Installs chat keyframes/property through registry CSS metadata; removes deleted stylesheet. |
| `public/r/ai-chat.json` | Rebuilt distributable registry item. |
| `package.json` | Motion dependency for Preview/Install transitions. |
| `pnpm-lock.yaml` | Resolved Motion dependencies. |
| `docs/catalog.md` | Group field and Tailwind-only authoring instructions. |
| `docs/ai-chat.md` | Updated installation/style documentation. |

## Created files

- docs/tailwind-migration.md — this report and complete project file manifest.
- docs/visual-qa/tailwind-collection-install.jpg — rendered implementation screenshot.
- docs/visual-qa/tailwind-ai-chat.jpg — rendered implementation screenshot.
- docs/visual-qa/tailwind-home-desktop.jpg — rendered implementation screenshot.
- docs/visual-qa/tailwind-collection-mobile.jpg — rendered implementation screenshot.
- docs/visual-qa/tailwind-collection-preview.jpg — rendered implementation screenshot.

## Deleted files

- app/site.css
- app/ui-generation.css
- components/ai-chat/styles.css

No component exports, registry URL, public component URL, or editor state API was removed.
