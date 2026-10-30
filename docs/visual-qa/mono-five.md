# Five new Mono icons — QA

Date: 2026-10-30

Added Clock, Light, Touch, Layers, and Motion path. The catalog now contains 21 icons. Motion path is the display name for Figma's “Beizer Cube Graph”.

## Source and motion

Source file: `m9uOlcLa5mlSEMbMkz2eCq`. Nodes: Clock `70:2`, Light `70:36`, Touch `70:68`, Layers `70:96`, Motion path `70:124`.

Exact exported shapes are preserved, with frame backgrounds removed. Animation targets are named internal SVG layers; the root SVG remains stationary.

- Clock: crown press, minute-hand sweep, and restrained hour-hand follow-through.
- Light: anticipation, highlight sweep, and staggered rays.
- Touch: fingertip compression and a delayed second tap ripple.
- Layers: bars slide and reorder around the fixed center guide.
- Motion path: a dot follows the cubic bounce curve, revealing its trail and pulsing the endpoint.

## Verification

- `pnpm lint`, `pnpm typecheck`, and `pnpm build`: passed.
- All existing TypeScript test files: 374 passed, including 166 icon tests.
- All five static SVG download URLs returned HTTP 200 with `image/svg+xml`; no embedded animation, style, or script elements.
- Real browser hover sampling confirmed distinct changing poses, fixed roots, no viewBox clipping, and exact returns to idle for all five icons.
- Keyboard Tab focused Clock and triggered its animation.
- Reduced motion left all five idle and temporary trace/ripple shapes invisible.
- Preview → Install → Preview did not replay completed introductions. A pointer-triggered Touch cycle completed normally.
- Responsive grid: four columns at 1440px, three at 1000px, two at 390px. No horizontal overflow at these widths.
- Browser warning/error log was empty during the final checks.
- Shared playback regression tests cover introduction memory, cancellation/retry, rapid input, reduced motion, and cleanup.

## Screenshots

- [Resting desktop](mono-five-resting.png)
- [Representative animation frame](mono-five-animated.png)
- [Phone with keyboard focus](mono-five-phone.png)

## Complete file inventory

Modified:
- `components/ui/mono-icon.tsx` — five exact SVG drawings and named animation layers.
- `lib/mono-icons.ts` — append the five catalog definitions.
- `lib/mono-icon-motion.ts` — five motion definitions and cubic-path sampling.
- `lib/mono-icon-playback.test.ts` — geometry and motion regression coverage.
- `docs/mono-icons.md` — source mapping, counts, and motion documentation.

Created:
- `public/icons/mono/clock.svg`
- `public/icons/mono/light.svg`
- `public/icons/mono/touch.svg`
- `public/icons/mono/layers.svg`
- `public/icons/mono/motion-path.svg`
- `docs/visual-qa/mono-five.md`
- `docs/visual-qa/mono-five-resting.png`
- `docs/visual-qa/mono-five-animated.png`
- `docs/visual-qa/mono-five-phone.png`

No files deleted, dependencies added, or custom CSS introduced.
