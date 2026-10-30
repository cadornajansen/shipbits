# AI agents remake and card refinement

Verified locally on 2026-10-30.

## Result

Four layered SVG characters replace the ceramic mascots. The public title is **AI agents**, under **AI artifacts**. The existing `/components/agent-companions` URL, `AgentCompanion` export, and legacy shape aliases remain supported.

Each equal-size card has a quiet character stage, left-aligned identity and assignment action, and compact state controls. Cards use two columns on desktop/tablet and one on phones. All character viewports remain 112px.

Ready has autonomous eye tracking, occasional blinks, and character-specific drift. Working has distinct floating scanner, idea, typing, and shape-weaving sequences. Resting uses closed eyes and slower breathing. Hover/focus gestures finish once and state changes replace obsolete gestures.

The Agents design is also the sixteenth Mono icon. Its body stays fixed while its eyes glance and blink; its downloaded SVG stays static and transparent.

## Execution flow

1. Each card owns its selected state. Assign updates the shared local assignment and selects Working only on that card.
2. `AgentCompanion` resolves descriptive or legacy shape names and renders the matching layered artwork.
3. Motion supplies elapsed time to the pure `agentPose` function. It returns transforms and opacity for named internal SVG groups.
4. The runtime applies those values without transforming the root SVG. Visibility, tab activity, reduced motion, and unmount cleanup gate the clocks.
5. The Mono icon reuses the collection's existing introduction memory and hover/focus playback.

## Checkpoint 1: static artwork and integration

Compared the four characters with the Figma normal and alternate-expression exports, including the lavender visor, orange star/happy eyes, pink cat happy eyes, and lime horizontal eyes. Removed only the Figma frame backgrounds.

Focused check: open the existing component URL and select each state independently. All four cards remain equal, names and assignment controls are functional, and the navigation thumbnail is the static Agents icon.

## Checkpoint 2: motion and refined presentation

The SVG root remains stationary for every character. Ready runs without requiring a hover. Working and Resting have visibly different expressions and motion. Hover gestures return to the current state rather than resetting to Ready.

Focused check: leave Lavender bot in Ready, hover Orange bot to see stars then happy eyes, select Resting on Pink cat, and Assign Orange bot. Orange becomes Working while Pink cat stays Resting.

### Working-state refinement

| Character | Signature motion | Loop |
| --- | --- | --- |
| Lavender bot | Counter-swaying head/base, a clipped visor scan, and sequential body readouts. | 3.8 seconds |
| Orange bot | Figure-eight head drift, delayed antenna follow-through, a focused squint, then star eyes and two idea sparks. | 3.2 seconds |
| Pink cat | Gentle floating sway, alternating typing paws and lit key strokes, with reactive ears and whiskers. | 3.6 seconds |
| Lime bloom | Banked orbital drift, a clockwise lobe ripple, a brief squint, and two orbiting seeds. | 4.2 seconds |

Only the artwork, pure motion definitions, and their tests changed for this refinement; the cards and runtime controls stayed intact. Added details are invisible in Ready, Resting, and static/reduced-motion Working poses. Nine new tests check effect visibility, loop seams using transformed points, and distinct two-axis body paths.

Browser sampling found every visible shape inside the 113 × 113 viewBox (including Pink cat's whiskers and new paws), with no root SVG transforms. A fresh reduced-motion reload kept all four Working poses static and all temporary details hidden. Temporary emulation was cleared afterward.

## Verification

- `pnpm lint`: passed.
- `pnpm typecheck`: passed.
- `pnpm build`: passed, including registry generation and 49 routes.
- Full repository Node test run: **329 passed, 0 failed**. Includes chat, collection, Mono icon, orb/material, and 64 character-motion tests.
- Tests cover deterministic finite poses, real SVG-layer targets, legacy aliases, exact gesture return, selected-state static expressions, idle-cycle continuity, autonomous gaze/blinks/drift, and unique gradient IDs.
- Desktop: two equal columns; 936px grid, equal approximately 334px card height.
- Tablet at 768px: two equal 350px-wide cards; no document overflow.
- Phone at 375px: one column, equal 347.2px-wide cards; no document overflow.
- Keyboard focus triggers a single gesture; state controls and assignment work by keyboard.
- Touch-emulated assignment selects the character and puts it into Working.
- All four hover gestures were sampled through completion; roots had no transform and moving layers changed independently.
- Offscreen characters become static; reduced-motion reloads show static selected-state poses.
- Independent state changes and Preview/Install switches work.
- Repeated reloads produced no browser error logs or hydration errors in the tested page.
- Homepage artwork renders all four characters with animation disabled.
- Mono gallery contains 16 cards; Agents SVG download works.
- Temporary viewport, touch, and reduced-motion overrides were restored.

Run the full test suite in PowerShell:

```powershell
$agentTestFiles = @(rg --files lib components -g '*.test.ts')
node --experimental-strip-types --test @agentTestFiles
```

Browser checks used Chrome desktop responsive/touch emulation, not a physical phone. A pre-existing Next.js smooth-scroll warning was observed; no new console errors were observed.

## Screenshots

- [Resting artwork and final card layout](./ai-agents-static.png)
- [Mixed Working and Resting states](./ai-agents-states.png)
- [Animated page view](./ai-agents-animated.png)
- [Phone layout](./ai-agents-phone.png)
- [Refined Working states](./ai-agents-working.png)

The screenshots are representative frames; hover and state sequences were also checked over time.

## Every changed file

| File | Change | Purpose |
| --- | --- | --- |
| `components/ui/agent-companion.tsx` | Modified | Layered character renderer, compatible props, visibility-aware state/gesture playback. |
| `components/ui/agent-character-art.tsx` | Created | Figma SVG geometry, expressions, named layers, unique gradient IDs. |
| `lib/agent-companion-motion.ts` | Created | Typed shape aliases, timing, and pure state/gesture poses. |
| `lib/agent-companion-motion.test.ts` | Created | 64 character geometry, compatibility, and motion checks. |
| `components/collection-examples/agent-media.tsx` | Modified | Four refined equal cards, independent controls, and assignment status. |
| `components/collection-examples/index.tsx` | Modified | Removes the redundant outer preview surface for this example only. |
| `components/collection-artwork.tsx` | Modified | Four-character homepage artwork and static Agents thumbnail. |
| `lib/collection-additions.ts` | Modified | AI agents title/copy, source files, installation examples, compatibility notes. |
| `lib/catalog.ts` | Modified | Mono icon description derives the actual icon count. |
| `components/component-showcase.tsx` | Modified | Mono Install/Copy prompt counts derive from the collection. |
| `lib/mono-icons.ts` | Modified | Adds the Agents catalog entry and Figma source identity. |
| `components/ui/mono-icon.tsx` | Modified | Static Agents circle and eye geometry. |
| `lib/mono-icon-motion.ts` | Modified | Agents glance and staggered blink sequence. |
| `lib/mono-icon-playback.test.ts` | Modified | Agents layer, stationary body, and return-to-rest tests. |
| `public/icons/mono/agents.svg` | Created | Transparent framework-independent static download. |
| `docs/mono-icons.md` | Modified | Documents 16 icons and Agents behavior/source. |
| `docs/visual-qa/ai-agents.md` | Created | This verification report and full file inventory. |
| `docs/visual-qa/ai-agents-static.png` | Created | Final static-layout screenshot. |
| `docs/visual-qa/ai-agents-states.png` | Created | Four-card state screenshot. |
| `docs/visual-qa/ai-agents-animated.png` | Created | Animated desktop page screenshot. |
| `docs/visual-qa/ai-agents-phone.png` | Created | Responsive phone screenshot. |
| `docs/visual-qa/ai-agents-working.png` | Created | Refined Working-state screenshot with the new details visible. |

No files were deleted. No dependencies, custom CSS, Studio routes, backend behavior, or playback buttons were added.

