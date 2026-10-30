# Mono icons motion verification

Verified locally on 2026-10-27 at `/icons/mono-icons` and `/` in Chromium.

## Result

Home turns into a three-quarter view with separate wall and roof faces, Pen
writes with a grouped head and clipped ink line, and Folder lifts its paper as
the front opens. Root SVG elements remain stationary. All other icons and
navigation thumbnails remain static. No dependencies or CSS files were added.

## Browser checks

- 1280 × 1024: four columns; 768 × 1024: three; 390 × 844: two.
  No horizontal document overflow at these widths.
- Home reaches a held pose on hover and keyboard focus and returns afterward.
- Pen and Folder animate on hover and keyboard entry, then return to their
  original shapes. Their internal groups move; the SVG root has no transform.
- Homepage card hover starts all three, with Pen and Folder initially scheduled
  behind Home. Each uses its configured 80ms stagger.
- Full reload produces introductions. Completed introductions do not replay
  after Preview/Install switches, scrolling out/back, or client-side navigation
  between the homepage and gallery. Both navigation directions were checked.
- Switching `prefers-reduced-motion` on during Home's held pose immediately
  resets it. Subsequent hover produces no movement. The emulation was restored.
- Only three SVGs have playback controls; no duplicate SVG IDs were found.
- Pen's downloaded file is byte-for-byte equal to `public/icons/mono/pen.svg`
  and contains no animation, script, stylesheet, or raster image.
- No browser console errors were recorded. Temporary viewport overrides were reset.

## Automated checks

- `pnpm lint` — passed.
- `pnpm typecheck` — passed.
- `pnpm test:chat` — nine existing tests passed.
- `node --experimental-strip-types --test lib/folder.test.ts lib/glass-optics.test.ts`
  — twelve existing tests passed.
- `node --experimental-strip-types --test lib/mono-icon-playback.test.ts`
  — nine new tests passed: shared introduction memory, interruption/retry,
  late callback rejection, non-overlapping cycles, Home takeover/held/return,
  timer cleanup, and exact resting poses.
- `pnpm build` — registry generation and production build passed, 32 pages generated.

Cancellation and rapid re-entry are covered deterministically by the playback
tests. Browser checks confirm the rendered interactions; Safari and Firefox were
not tested in this environment.

## Screenshots

- [Desktop at rest](mono-icons-motion-rest.jpg)
- [Home held in three-quarter view](mono-icons-home-turn.jpg)
- [Pen during writing](mono-icons-pen-write.jpg)
- [Folder open](mono-icons-folder-open.jpg)
- [Tablet grid](mono-icons-motion-tablet.jpg)
- [Phone grid](mono-icons-motion-phone.jpg)
- [Homepage card during motion](mono-icons-homepage-motion.jpg)

## Files changed in this update

Modified:

| File | Purpose |
| --- | --- |
| `app/page.tsx` | Marks the homepage Mono icons card as the interaction trigger. |
| `components/component-artwork.tsx` | Uses animated Home/Pen/Folder with stagger in the homepage preview. |
| `components/component-showcase.tsx` | Documents optional Motion setup and usage in Install; updates copied guidance. |
| `components/mono-icons-gallery.tsx` | Responsive 4/3/2 grid and card-triggered animated previews. |
| `components/ui/mono-icon.tsx` | Named SVG layers, invisible Home depth faces, unique Pen ink clip. |
| `lib/catalog.ts` | Accurate description of the optional animations. |
| `lib/mono-icons.ts` | Supported animated icon names and type guard. |
| `docs/mono-icons.md` | Optional animation usage and execution flow. |

Created:

| File | Purpose |
| --- | --- |
| `components/ui/animated-mono-icon.tsx` | Connects visibility, reduced motion, card interaction, and Motion. |
| `lib/mono-icon-playback.ts` | Playback states, cancellation, stagger, and completion bookkeeping. |
| `lib/mono-icon-motion.ts` | Maps animation progress to SVG part attributes. |
| `lib/mono-icon-playback.test.ts` | Playback and geometry regression tests. |
| `docs/visual-qa/mono-icons-motion.md` | This verification report. |
| `docs/visual-qa/mono-icons-motion-rest.jpg` | Resting desktop evidence. |
| `docs/visual-qa/mono-icons-home-turn.jpg` | Home motion evidence. |
| `docs/visual-qa/mono-icons-pen-write.jpg` | Pen motion evidence. |
| `docs/visual-qa/mono-icons-folder-open.jpg` | Folder motion evidence. |
| `docs/visual-qa/mono-icons-motion-tablet.jpg` | Tablet layout evidence. |
| `docs/visual-qa/mono-icons-motion-phone.jpg` | Phone layout evidence. |
| `docs/visual-qa/mono-icons-homepage-motion.jpg` | Homepage trigger evidence. |

No files deleted. The standalone SVG files are unchanged. Existing unrelated
working-tree changes were preserved.
