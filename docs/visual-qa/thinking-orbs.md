# Thinking orbs verification

Verified locally in Chromium on 2026-10-27. Final design follows the user's latest
references: dense spherical dots, clean dark example cards, functional status
pills, and a separate playground with no descriptive copy inside the stage.

## Result

- Four published states: Idle, Thinking, Streaming, Error. The later reference's
  additional states/variants remain outside the selected four-state first release.
- Original Shipbits frame geometry is passed to `thinking-orbs` 0.3.2's custom
  frame API. No built-in engine animation geometry is used.
- Dots fill a Fibonacci sphere, with depth-dependent radius, ink, and opacity.
  Thinking counter-rotates its hemispheres and highlights two bands; Streaming
  moves a three-strand brightness wave. Idle breathes and settles. Error is a
  still dotted globe interrupted by two gaps.
- No visible Pause/Resume controls remain in the app's TSX source. They were
  removed from the orb page, both material editors, and the Titanium audio card,
  including its exported example. Programmatic `paused` props remain supported.
- The preference for no playback buttons or preview descriptions is recorded in
  `AGENTS.md`. No stylesheets or shared theme tokens were changed in this update.

## Browser checks

- All four states were exercised at 20, 32, and 64px. Canvas and wrapper dimensions
  match. Sizes and state selection work by visible labels; arrow keys switch
  states. Speed supports keyboard endpoints at 0.5× and 2×.
- The initial Pause implementation was pixel-checked before its UI was removed;
  the underlying optional prop retains the last actual frame.
- Idle's canvas becomes frozen after five seconds; consecutive pixel reads remain
  identical. Error remains still.
- Live reduced-motion emulation sets all five visible orb canvases to paused,
  produces identical consecutive pixel samples, and removes state crossfade
  duration. The preference override was restored after testing.
- Offscreen example canvases retained identical pixel samples while the visible
  playground continued changing. The engine's hidden-tab and observer cleanup
  behavior was also inspected in its installed implementation.
- Preview → Install unmounts every orb canvas; returning creates fresh instances.
  A static-thumbnail hydration warning from final-digit floating-point differences
  was caught and fixed by serializing SVG attributes to four decimal places.
  A fresh reload after this fix recorded no new browser errors.
- At 1280 × 1024, examples form two staggered columns with State/Size/Speed next to
  the playground. At 390 × 844, examples and controls stack with no horizontal
  document overflow. Navigation chips include Thinking orbs.
- Homepage has nine real catalog entries, the new destination is correct, and
  the final desktop card starts at grid column 3, centering the single last card.
- Sidebar and footer include Thinking orbs after AI Chat; previous/next links
  target AI Chat and Glass folder.
- Liquid metal and Titanium Studio pages contain no playback buttons. Titanium
  still exposes its 13 sliders. Source inspection covers the shared material
  editor used by Foil and Titanium and the generated audio example.
- Install shows the pinned dependency command, three source files, usage,
  props, and engine attribution. Copy reports its existing “Copied” success
  state; clipboard readback in the in-app browser returned empty, so operating-
  system clipboard contents could not be independently confirmed here.

## Automated checks

- `pnpm lint` — passed.
- `pnpm typecheck` — passed.
- `pnpm test:chat` — 9 passed.
- Existing combined component tests — 148 passed.
- `node --experimental-strip-types --test lib/ai-orb-frames.test.ts` — 26 passed
  after the final dense-sphere revision: deterministic geometry, finite/bounded
  particles, depth order, adaptive density, distinct states, Error's gaps,
  accessible SSR markup, decorative mode, stable pre-hydration boxes, and static
  thumbnail output under simulated floating-point jitter.
- `pnpm build` — passed after the final revision; 33 pages generated.

Only Chromium was available for visual checks. Hidden-tab behavior and listener
cleanup rely on the inspected engine implementation rather than a cross-browser
automation harness. The existing copy widget was not changed.

## Screenshots

- [Desktop example cards](thinking-orbs-desktop.jpg)
- [Clean playground](thinking-orbs-playground.jpg)
- [Phone layout](thinking-orbs-phone.jpg)
- [Install instructions](thinking-orbs-install.jpg)

## Complete change list

Created:

| File | Purpose |
| --- | --- |
| `components/ui/ai-orb.tsx` | Typed accessible orb, live motion preference, hydration gate, settling and state transitions. |
| `lib/ai-orb-frames.ts` | Four original particle sphere frame functions and state labels. |
| `lib/ai-orb-frames.test.ts` | 26 geometry, server-render, and thumbnail regression tests. |
| `components/thinking-orbs-playground.tsx` | Dark status examples and State/Size/Speed playground. |
| `components/thinking-orb-thumbnail.tsx` | Static SVG navigation thumbnail from the same geometry. |
| `app/components/thinking-orbs/page.tsx` | Public route and metadata using the shared page shell. |
| `docs/thinking-orbs.md` | Source installation, public API, data flow, and attribution. |
| `docs/thinking-orbs-engine-license.txt` | Retained MIT engine license. |
| `docs/visual-qa/thinking-orbs.md` | This report. |
| `docs/visual-qa/thinking-orbs-desktop.jpg` | Desktop evidence. |
| `docs/visual-qa/thinking-orbs-playground.jpg` | Playground evidence. |
| `docs/visual-qa/thinking-orbs-phone.jpg` | Phone evidence. |
| `docs/visual-qa/thinking-orbs-install.jpg` | Installation evidence. |

Modified:

| File | Purpose |
| --- | --- |
| `lib/catalog.ts` | AI agents entry and optional source dependency command. |
| `components/catalog-icon.tsx` | Static orb navigation icon. |
| `components/component-artwork.tsx` | Live homepage orb. |
| `components/component-showcase.tsx` | Orb playground branch, setup command, API notes, and attribution. |
| `app/page.tsx` | Centers a single final desktop catalog card. |
| `package.json` | Adds only the pinned `thinking-orbs` dependency. |
| `pnpm-lock.yaml` | Records the dependency installation. |
| `components/metal-lab.tsx` | Removes manual playback control; preserves automatic reduced motion. |
| `components/material-lab.tsx` | Removes manual playback control and exports a normal running example. |
| `components/material-examples.tsx` | Removes playback toggle from the Titanium audio card and exported source; retains mute. |
| `app/how-to-use/page.tsx` | Removes obsolete playback-control instructions. |
| `AGENTS.md` | Records no playback buttons and no preview descriptions as ongoing preferences. |

No files deleted. Existing unrelated edits were preserved. No backend, database,
additional providers, Studio orb editor, or extra public orb states were added.
