# Full Mono icons motion QA

Verified on 2026-10-27 in the local Chromium in-app browser at
`/icons/mono-icons` and `/`. This supersedes the earlier three-icon motion report.

## Result

All 15 icons have separate, typed internal-layer animations. Home's original
front face stays identical while side and roof depth extend rightward behind it.
No rear-edge vertical offset, front narrowing, rotation, or skew is applied.
Home holds on hover/focus; the other icons complete a single cycle and settle.
The root SVG never moves. Dark cards and the existing responsive grid remain.

Folder's horizontal hinge spread was reduced slightly after finding its old
pose exceeded the 24-unit viewBox. Its timing, paper lift, and resting geometry
are preserved; a regression test samples the front panel bounds across its cycle.

## Execution flow

1. The existing `AnimatedMonoIcon` observes its preview at the 50% threshold and
   listens to the enclosing card's hover and keyboard-visible focus.
2. The playback controller decides whether to introduce, complete a hover cycle,
   hold Home, return, or cancel. Completed icon names live in a client module Set.
3. Installed Motion advances progress. An exhaustive `iconAnimations` map selects
   the icon's duration and pose; cached `data-part` elements receive SVG attributes.
4. Completed cycles restore exact resting attributes. Additional letter, steam,
   reflection, and sound-wave geometry is invisible at rest and in static icons.

The homepage's existing Home, Pen, Folder, Settings, Coffee, and Book previews
share their card trigger, with 80ms increments and an individual visibility target.
Navigation thumbnails still use static `MonoIcon`. Raw SVG downloads are unchanged.

## Browser verification

- Desktop 1280 × 1024: four columns. Tablet 768 × 1024: three columns.
  Phone 390 × 844: two columns. No horizontal document overflow at these widths.
- Hover and keyboard entry activate the card's internal SVG parts. Home's front
  transform remains the identity matrix while depth is visible.
- Work's handle/straps, User's head/shoulders, Mic's grille/waves, Search's lens
  reflection/handle, Settings' gear/ring, Bell's shell/clapper, Mail's flap/letter,
  Calendar's date ripple, Coffee's steam/lid, Location's pin/shadow, Image's grouped
  mountains/sun, and Book's page edges were observed moving independently.
- Completed introductions stayed idle after scrolling, Preview/Install remounts,
  and client navigation gallery → homepage → gallery. Reload starts fresh intros.
- Homepage hover showed the first icons running while later icons were scheduled,
  confirming the shared trigger and stagger.
- Enabling reduced motion during playback immediately reset every icon to idle
  and all temporary geometry to zero opacity. Keyboard focus caused no movement.
- The rendered gallery had 31 IDs and 31 unique IDs, including SVG masks/clips.
- Home's browser-downloaded SVG was byte-for-byte equal to its source file.
- No browser console errors were captured. Viewport and reduced-motion overrides
  were restored after testing.

Rapid re-entry, interruption/retry, completion memory, late callbacks, timers,
and unmount cleanup are checked deterministically by the expanded tests. Screenshots
and browser observations cover representative rendered poses, not pixel-level
collision analysis of every frame. Safari and Firefox were not tested.

## Automated verification

- `pnpm lint` — passed.
- `pnpm typecheck` — passed.
- `pnpm test:chat` — 9 passed.
- `node --experimental-strip-types --test lib/mono-icon-playback.test.ts lib/folder.test.ts lib/glass-optics.test.ts lib/materials/materials.test.ts components/ai-chat/state.test.ts`
  — 148 passed, including 113 icon tests.
- `pnpm build` — registry generated and production build passed; 32 pages generated.

The icon tests cover all 15 durations and playback lifecycles, exact resting SVG
geometry against original downloads, unique/resolvable masks in repeated instances,
finite pose attributes, stationary roots, hidden temporary shapes, Home's unchanged
front and rear-edge heights, and Folder containment.

## Screenshots created

| File | Evidence |
| --- | --- |
| [mono-icons-full-rest.jpg](mono-icons-full-rest.jpg) | Resting desktop gallery. |
| [mono-icons-full-bottom.jpg](mono-icons-full-bottom.jpg) | Lower rows and settled icons. |
| [mono-icons-full-home-depth.jpg](mono-icons-full-home-depth.jpg) | Corrected Home depth pose. |
| [mono-icons-full-home.jpg](mono-icons-full-home.jpg) | Home held during the hover sweep. |
| [mono-icons-full-mic.jpg](mono-icons-full-mic.jpg) | Mic grille and visible sound waves. |
| [mono-icons-full-coffee.jpg](mono-icons-full-coffee.jpg) | Coffee during its cycle. |
| [mono-icons-full-homepage.jpg](mono-icons-full-homepage.jpg) | Shared homepage card trigger. |
| [mono-icons-full-tablet.jpg](mono-icons-full-tablet.jpg) | Three-column tablet layout. |
| [mono-icons-full-phone.jpg](mono-icons-full-phone.jpg) | Two-column phone layout and keyboard focus. |

## Complete source change list for this update

| Modified file | Purpose |
| --- | --- |
| `components/ui/mono-icon.tsx` | Named groups and hidden pure-SVG embellishments; original static shapes preserved. |
| `lib/mono-icons.ts` | All 15 names supported for animation; obsolete three-icon type guard removed. |
| `lib/mono-icon-motion.ts` | Exhaustive per-icon pose definitions/durations, fixed-front Home, bounded Folder hinge. |
| `lib/mono-icon-playback.ts` | Selects each icon's explicit duration; retains lifecycle and Home hold behavior. |
| `lib/mono-icon-playback.test.ts` | Expanded playback, SVG geometry, masks, and painter regression coverage. |
| `components/mono-icons-gallery.tsx` | All 15 card previews use the existing animated wrapper. |
| `components/component-artwork.tsx` | Animates all six homepage preview icons with individual visibility targets. |
| `components/component-showcase.tsx` | Install instructions and copied guidance explain all animated options. |
| `lib/catalog.ts` | Accurate full-collection animation description. |
| `docs/mono-icons.md` | Updated usage, execution flow, and report link. |

Created: this report and the nine screenshots listed above. No files deleted.
No dependencies, public props, custom CSS, backend, or standalone SVG changes.
The existing animated React wrapper was reused without modifying its source.
Existing unrelated working-tree edits were preserved.

## Focused manual test

Open `/icons/mono-icons`, reload, and let visible introductions finish. Hover or
Tab through Home, Work, Mic, and Mail: Home must hold fixed-front depth; Work must
release its straps, Mic must pulse, and Mail must open once. Switch Install →
Preview: completed intros must not restart. Enable reduced motion: everything
must return to its static pose.
