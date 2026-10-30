# Shipbits Thinking orbs

The gallery shows nine distinct states, with one default example per state.
Studio includes all 15 state/variant looks from the supplied 21st.dev reference
and Shipbits' **Orchestrating** choreography. The original `idle`,
`thinking`, `streaming`, and `error` API also remains supported.

All looks retain monochrome, depth-shaded particles. Shipbits owns the geometry;
`thinking-orbs` 0.3.2 supplies the canvas painter, offscreen/hidden-tab handling,
and reduced-motion support. Motion crossfades state/variant changes over 200ms.
There are no visible playback buttons or descriptive text inside the stage.

## Installation and API

```sh
pnpm add thinking-orbs@0.3.2
```

Copy `components/ui/ai-orb.tsx`, `lib/ai-orb-frames.ts`, and `lib/utils.ts`.
An external project also needs React, Tailwind, `motion`, and `cn`, plus the `@/`
alias or adjusted imports. This is editable source, not a Shipbits npm package.

```tsx
import { AiOrb } from "@/components/ui/ai-orb"

export function Status() {
  return (
    <div className="flex items-center gap-6">
      <AiOrb state="working" variant="gyro" />
      <AiOrb state="reasoning" variant="twins" size="md" />
      <AiOrb state="orchestrating" />
    </div>
  )
}
```

`AiOrbProps` combines standard span attributes with a discriminated `AiOrbLook`:
TypeScript rejects incompatible pairs such as `waiting` with `gyro`.
`AI_ORB_VARIANTS` is the source of valid pairs; `AI_ORB_LOOKS` lists the 16
available looks. `AI_ORB_STATES`, `AI_ORB_NAMES`, `AI_ORB_LABELS`, `AiOrbState`, and
`AiOrbVariant` are exported alongside the named/default `AiOrb` component.

| Prop | Values / default |
| --- | --- |
| `state` | Required. See the motion table below; the original four states also work. |
| `variant` | State-specific optional variant; defaults to `default`. |
| `size` | `sm` 20px, `md` 32px, `lg` 64px (default). |
| `speed` | Nonnegative multiplier; default 1. Studio range is 0.25–2. |
| `density` | Particle-count multiplier, clamped to 0.5–1.5; default 1. |
| `dotSize` | Particle-radius multiplier, clamped to 0.6–1.6; default 1. |
| `tilt` | Camera tilt in degrees, clamped to −30–60; default 12. |
| `paused` | Optional programmatic freeze; default false. No playback UI. |
| `settleMs` | Idle settling time, default 5000ms. Other active states continue while visible. |
| `label` | Overrides the accessible label, which otherwise includes the variant. |
| `decorative` | Hides the orb from assistive technology; default false. |
| Span attributes | Includes `className`, IDs, and event handlers. Preserve the chosen dimensions. |

## Motion vocabulary

| Look | Distinct motion |
| --- | --- |
| Base | Quiet 6.5s globe rotation. |
| Working | Tilted sphere with a descending illumination ring every 1.7s. |
| Working · Gyro | Precessing axis, changing roll, and opposing torsion. |
| Reasoning | One walker follows nearby particles, leaving a five-dot fading trail. |
| Reasoning · Twins | Two independently seeded trails follow different neighboring routes. |
| Searching | A magnifying highlight glides between targets, then dwells. |
| Searching · Lighthouse | A rotating beam sweeps the globe with a fading angular trail. |
| Background | A slower, sparse globe with larger individual dots. |
| Background · Spiral | Eight dotted arms wind pole-to-pole and rotate. |
| Retrying | Turn, brake, recoil, and accelerate again over 3.2s. |
| Retrying · Surge | Fast launch followed by cubic deceleration, every 3.25s. |
| Compacting | A packing sweep compresses the sphere, then springs back exactly. |
| Compacting · Squeeze | Squash and opposing pole twist over 2.6s. |
| Compacting · Fuse | A bright fuse front compresses and dims particles, then releases. |
| Waiting | A comet and trailing light travel across the sphere. |
| Orchestrating | Independent curved paths form four groups, relay pulses, and reunite. |

## Orchestrating: individual particle choreography

Each particle keeps a stable numeric ID, home position, phase, pace, group, and
local tangent. Over a 12-second cycle:

1. Dots make small individual exploratory movements.
2. Each launches after its own deterministic delay and travels along its own
   cubic Bezier route toward one of four task groups.
3. Groups maintain distributed local lattices with individually perturbed orbits,
   preserving visible dots rather than collapsing into solid blobs. Individual
   light pulses travel through the groups with offset timings.
4. Dots follow their routes back to their original sphere positions. A sparse
   outer shell maintains the spherical silhouette throughout.

This is mathematical choreography, not AI inference. Paths are deterministic,
repeatable, continuous at the cycle seam, and evaluated from time rather than
updated with cumulative frame-by-frame physics. The same timestamp produces the
same result, regardless of dropped frames.

## Execution flow and performance

The public page presents nine badge examples in an equal-size two-column grid,
stacking on phones. All orbs are 64px; badges share a 288px width and 82px height,
with width constrained to the card on narrow screens. Orchestrating comes first.
Cards have no captions; each is a keyboard-accessible link named for its look.
The functional status text is part of the badge, with a decorative orb to avoid
duplicate screen-reader labels.

The editor lives at `/studio/thinking-orbs`, linked from every example,
**Tune in Studio**, and the Studio index. Example links carry `state` and
`variant` query parameters. `orbStudioLook` validates both before initializing
the editor; unsupported variants fall back to the state's default. The editor
key changes with the URL selection so client navigation opens the requested
look. A Suspense boundary keeps the outer route prerendered while the editor
reads its query parameters. Its shadcn Base UI Select controls expose presets, state,
valid variant, size, and badge/inline/orb presentation. State selection resets
the variant to `default`. Base UI Slider controls change speed, density, dot
radius, and camera tilt. Reset restores the Coordinated preset.

Settings flow into both `AiOrb` props and `orbStudioCode`, so the copyable React
example includes the actual state, variant, appearance, and chosen presentation.
The preview contains only the component; settings and source code sit outside it.

`orbFrameFor` selects a stable frame function. It reads cached particle seeds,
calculates individual positions and accents, projects them into the sphere, and
returns dots sorted by depth. Root canvas dimensions stay stationary. Neighbor
routes are precomputed per density, not searched every frame. Seed and route
caches each retain at most 12 entries while sliders explore different densities.

State/variant changes remount the inner canvas with a clean cached frame and
settling timer. Server markup reserves the final box before hydration. Static
navigation thumbnails serialize coordinates to four decimals to avoid server/
browser floating-point hydration differences. Media-query subscriptions update
reduced motion live; unmount clears timers and the engine's observers/loops.

The homepage remains a live Thinking preview; navigation thumbnails remain static.
The original four states remain selectable in Studio for existing users.

## Attribution and checks

The supplied 21st.dev source defines the reference state/variant vocabulary and
motion direction. The implementation uses local frame math with the existing
MIT-licensed [thinking-orbs renderer by Jakub Antalik](https://github.com/Jakubantalik/thinking-orbs).
Its retained notice is [thinking-orbs-engine-license.txt](thinking-orbs-engine-license.txt).
No dependencies or custom stylesheets were added for this expansion.

Run `node --experimental-strip-types --test lib/ai-orb-frames.test.ts` for geometry,
variant completeness, independent grouping, continuity, appearance bounds,
Studio exports, SSR, and hydration tests.
See [full-collection QA](visual-qa/thinking-orbs-variants.md) for browser evidence.
