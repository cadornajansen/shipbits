# Thinking orbs — variants, badge examples, and Studio QA

Verified 27 October 2026 in the local Next.js app.

## Latest follow-up: uniform sizes and one example per state

The public gallery now filters the available looks to their default variant:
nine unique states, with Orchestrating first. Alternate variants remain in Studio.
Every example uses a 64 × 64px orb inside a 288 × 82px badge on desktop.
At 320px viewport width, all badges constrain equally to 260 × 82px; the orbs
remain 64px. Browser measurements confirmed no clipped badge text or page overflow.
The equal card grid and exact Studio links are preserved.

Checks: scoped ESLint and `pnpm typecheck` passed; desktop and narrow-phone
dimensions were measured in the browser. No animation definitions changed.

Files modified: `components/thinking-orbs-examples.tsx` (filter, uniform size and
presentation), `lib/catalog.ts` (remove obsolete count from description),
`docs/thinking-orbs.md` (current gallery behavior), and this QA report.
Created: [uniform gallery screenshot](thinking-orbs-uniform-badges.jpg).

## Follow-up: clickable, equal-size cards

The gallery now uses two equal columns with all desktop cards measuring 460 ×
290 CSS pixels at the checked 1440px viewport. Orchestrating is first; there
are no captions. All 16 cards link to Studio with their exact state and variant.
At 390px the cards stack, all measure 260px high, and there is no overflow.

Keyboard Enter opened Working/Gyro. Refresh retained that selection.
Reasoning/Twins and Orchestrating/Default also opened correctly. After editing
Orchestrating to Searching, leaving and reopening the Orchestrating card restored
Orchestrating. Its Coordinated preset remains correctly recognized.

Validation: lint, typecheck, all six Studio tests, and production build passed.
Tests cover every gallery pair and missing, invalid, incompatible, and
prototype-property query values. The animation geometry was unchanged.

Files modified for this follow-up:

- `components/thinking-orbs-examples.tsx`: regular grid, no captions, Orchestrating first, accessible Studio links.
- `components/thinking-orbs-studio.tsx`: read and initialize from URL selection, with a keyed editor.
- `lib/ai-orb-studio.ts`: validate state/variant query values.
- `lib/ai-orb-studio.test.ts`: query round trips and safe fallback checks.
- `app/studio/[id]/page.tsx`: Suspense around the URL-dependent orb editor.
- `docs/thinking-orbs.md`: updated gallery and URL initialization flow.
- `docs/visual-qa/thinking-orbs-variants.md`: this follow-up record.

Created: [current gallery screenshot](thinking-orbs-linked-cards.jpg).
The remaining sections below record the preceding implementation checkpoint.

## Delivered behavior

- Public route: `/components/thinking-orbs`.
- All 15 reference looks plus Shipbits **Orchestrating**: 16 separate dark example cards, with status badges or inline interface statuses. Captions sit outside each preview. Two staggered columns on desktop; one on phones.
- Editor route: `/studio/thinking-orbs`, available through Tune in Studio and the Studio index. The catalog drives this destination and the existing navigation.
- Editor uses shadcn **Base UI** Select and Slider primitives. Options: four presets, state, valid variant, presentation, size, speed, particle density, dot radius, and camera tilt. Reset and generated React code use the same settings.
- No visible Pause/Resume controls. No explanatory copy inside preview stages. Styling is inline Tailwind; no stylesheet or dependency was added for this expansion.
- Public copy now says **16 animations**. Guide and FAQ no longer hardcode five Studio editors.

## Motion and geometry

The reference vocabulary includes Base, Working/Gyro, Reasoning/Twins, Searching/Lighthouse, Background/Spiral, Retrying/Surge, Compacting/Squeeze/Fuse, and Waiting. Existing Idle, Thinking, Streaming, and Error states remain supported in the component and Studio.

Orchestrating assigns each dot a persistent ID, phase, speed, group, and curved route. Dots travel independently into four distributed clusters, exchange staggered light pulses, and return to a sphere. This is deterministic mathematical choreography, not AI inference. A sparse outer shell retains the globe silhouette.

Density and dot size affect actual particles. Tilt changes their 3D projection. The canvas root never moves. Seed/route caches are bounded to 12 entries each. Idle settles after five seconds; Error is static. Reduced motion freezes the actual current frame and still allows appearance changes to repaint it.

## Automated checks

Passed:

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test:chat` — 9 tests
- Full existing and orb suites — **245 tests, 0 failures**
- `pnpm build` — 34 generated pages, including the new Studio destination
- Re-ran all 4 Studio export tests after the narrow-phone text adjustment

Full suite command:

```powershell
node --experimental-strip-types --test lib/ai-orb-frames.test.ts lib/ai-orb-studio.test.ts lib/mono-icon-playback.test.ts lib/folder.test.ts lib/glass-optics.test.ts lib/materials/materials.test.ts components/ai-chat/state.test.ts
```

Coverage includes deterministic/finite geometry, depth sorting, bounds at 20/32/64px, all 16 distinct animation sequences, appearance extremes, unique particle identities, individual cluster travel, cycle continuity, static Error, SSR/accessibility/decorative mode, thumbnail hydration precision, and valid Studio presets. Generated code for every look and all three presentations is compiled and server-rendered; captured props must equal the selected settings.

## Browser checks

- Desktop: 1440 × 1000 CSS pixels. Public examples and Studio fit without horizontal overflow.
- Phone: 390 × 844. Examples stack; controls stack below the Studio preview.
- Tablet: 768 × 1024. Studio has all four sliders and no horizontal overflow.
- Narrow phone: 320 × 812. Long status labels wrap within their badges. Badge scroll width equals client width; page has no horizontal overflow.
- Public page has 16 figures, zero editor Select triggers, and zero Pause/Resume buttons.
- Changing Working/Gyro to Searching resets Variant to Default.
- Keyboard selection of Gyro and keyboard Slider Home/End/ArrowRight work. Export reflects speed 1.05, density 1.5, dotSize 0.6, and tilt 60.
- Changing presentation to Inline and size to 20px updates code and rendering. Copy code displays Copied and success feedback. Clipboard read-back is unavailable in this browser harness; actual operating-system paste was not separately tested.
- Focused preset selects Reasoning/Twins; Reset restores Coordinated.
- Reduced-motion emulation sets the canvas frozen flag. Its pixel hash remains stable between observations; changing density updates the frozen image.
- Preview/Install switching works; Install explains source copying, the actual renderer dependency, all variants, appearance props, Studio, accessibility, and MIT attribution.
- Studio index contains all six editor links, including Thinking orbs.
- Fresh desktop reload produced no new console errors or hydration warnings.

Offscreen and hidden-tab lifecycle behavior remains supplied by `thinking-orbs` 0.3.2. Its implementation was inspected; this pass did not automate background-tab testing across browsers. Screenshots are representative frames, not motion recordings.

## Screenshots

- [Desktop page](thinking-orbs-variants-desktop.jpg)
- [Separate badge examples](thinking-orbs-badge-examples.jpg)
- [All examples](thinking-orbs-variants-full.jpg)
- [Phone page](thinking-orbs-variants-phone.jpg)
- [Studio and grouped Orchestrating pose](thinking-orbs-studio.jpg)
- [Phone Studio](thinking-orbs-studio-phone.jpg)

The supplied Libraries.dev screenshot is the visual reference for separate dark stages, quiet pill surfaces, and varied sizes. Shipbits retains its own catalog and original particle geometry.

## File manifest for this change

| File | Change and purpose |
| --- | --- |
| `lib/ai-orb-frames.ts` | Modified: complete typed state/variant definitions, original particle sequences, Orchestrating, appearance normalization, bounded caches. |
| `lib/ai-orb-frames.test.ts` | Modified: full-collection geometry, motion distinction, continuity, appearance, SSR, and typing checks. |
| `components/ui/ai-orb.tsx` | Modified: typed variants and appearance props, memoized frame factory, correct frozen-frame repainting, crossfades and existing lifecycle behavior. |
| `components/thinking-orbs-playground.tsx` → `components/thinking-orbs-examples.tsx` | Renamed/replaced: independent badge and inline-use-case cards; editor removed from public preview. |
| `components/orb-use-case.tsx` | Created: shared status badge, inline status, or standalone orb presentation. |
| `components/thinking-orbs-studio.tsx` | Created: separate editor with Base UI controls, presets, reset, and generated code. |
| `lib/ai-orb-studio.ts` | Created: typed settings, four presets, and React example generation. |
| `lib/ai-orb-studio.test.ts` | Created: valid presets and generated code/props/semantics across every look and presentation. |
| `components/ui/select.tsx` | Created from shadcn: Base UI Select primitive. |
| `components/ui/slider.tsx` | Created from shadcn: Base UI Slider primitive with accessible thumb labels. |
| `components/component-showcase.tsx` | Modified: render public examples; document variants, appearance controls, and Studio. |
| `lib/catalog.ts` | Modified: truthful 16-look copy, usage, and typed Studio destination. |
| `app/studio/[id]/page.tsx` | Modified: render Thinking orbs editor through the existing shared Studio route. |
| `app/studio/page.tsx` | Modified: component-editor copy and automatic catalog-driven listing. |
| `app/how-to-use/page.tsx` | Modified: remove obsolete five-editor count. |
| `components/site-faq.tsx` | Modified: remove obsolete five-editor count. |
| `docs/thinking-orbs.md` | Modified: full API, motion vocabulary, per-dot choreography, Studio flow, and attribution. |
| `docs/visual-qa/thinking-orbs-variants.md` | Created: this report and complete change manifest. |
| Six `thinking-orbs-*.jpg` images linked above | Created: browser evidence for the current implementation. |

No unrelated files were staged, committed, reverted, or deleted.
