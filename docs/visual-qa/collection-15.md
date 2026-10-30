# Next 15 components: implementation and QA

Completed 2026-10-29. The catalog now contains 24 working entries: the existing nine and all fifteen approved additions. Each addition has a reusable component, a functional local demo, homepage artwork, navigation, and accurate source-copy instructions.

## Verification

- `pnpm lint`: passed.
- `pnpm typecheck`: passed.
- `pnpm test:chat`: 9 tests passed.
- Existing and new library tests: 248 tests passed, including three catalog integration tests. **257 tests passed in total.**
- `pnpm build`: passed, including registry generation and 49 prerendered pages.
- All fifteen previews were checked at 1280px desktop and 390px phone widths without horizontal page overflow. Ten page measurements are saved in [layout-checks.json](collection-15/layout-checks.json); the five overlay previews were checked separately.
- All fifteen installation examples compile against their real component APIs. Their source lists include transitive local imports.
- The homepage reports 24 working components and exposes every new destination. Existing component URLs remain intact.
- No dependencies, CSS files, visible Pause/Resume controls, or backend services were added.

### Focused interaction checks

| Component | Verified behavior |
| --- | --- |
| Agent companions | Select Mori, assign a task, switch working/resting states; reduced-motion emulation leaves internal transforms stationary. |
| Activity capsule | Export actual theme tokens, expand/collapse using the keyboard, complete steps, and download the JSON result. Preview/Install switching works. |
| Morphing action menu | Keyboard opening and action selection; duplication changes the local brief; closing restores trigger focus. |
| Image generation reveal | Image loading precedes the coarse-to-crisp reveal; replay works. Resume timing and error/retry paths reviewed and helper-tested. |
| Command palette | Search, empty results, nested actions, arrow selection, Enter activation, and focus restoration. |
| Voice capsule | Sample sequence progresses through listening, processing, and transcript. Supplied level drives the visual response. |
| Precision dial | Arrow adjustment and direct numeric entry both update the displayed value and slider semantics. |
| Context toolbar | Keyboard selection changes actual text alignment. |
| File intake | Reject unsupported SVG, remove it, accept a PNG, and display the local preview. Batch duplicate handling and abort/object-URL cleanup reviewed. |
| Notification stack | Archive creates feedback; Undo restores the local workspace; dismissal and keyboard focus remain usable. |
| Contextual inspector | Select a row, update its pinned metadata, close with Escape, and return focus. Phone layout uses a bottom sheet. |
| Presence group | Keyboard selection, shared nameplate, overflow popover, and focus restoration. |
| Precision counter | Rapid increments/decrements update values; formatting tests cover decimals, negative values, and invalid numbers. |
| Image comparison | Home/End reach endpoints and arrow keys adjust the divider. Images remain registered. |
| Hold to confirm | Accessible click-confirmation dialog completes the action and Undo restores it. Early-release/exit cancellation is implemented. |

### Screenshots

- [Activity capsule completed](collection-15/activity-completed.png)
- [Activity capsule on phone](collection-15/activity-capsule-mobile.png)
- [Agent companions on phone](collection-15/agent-companions-mobile.png)
- [Voice capsule on phone](collection-15/voice-capsule-mobile.png)
- [Precision dial](collection-15/dial-desktop.png)
- [Context toolbar on phone](collection-15/context-toolbar-mobile.png)
- [File intake on phone](collection-15/file-intake-mobile.png)
- [Precision counter on phone](collection-15/precision-counter-mobile.png)
- [Hold to confirm on phone](collection-15/hold-to-confirm-mobile.png)
- [Image comparison on phone](collection-15/image-comparison-mobile.png)
- [Image generation reveal on phone](collection-15/image-generation-reveal-mobile.png)
- [Command palette](next-15-command-palette.png) / [phone](next-15-command-palette-mobile.png)
- [Morphing action menu](next-15-morphing-menu.png) / [phone](next-15-morphing-menu-mobile.png)
- [Notification stack](next-15-notifications.png) / [phone](next-15-notifications-mobile.png)
- [Contextual inspector](next-15-inspector.png) / [phone](next-15-inspector-mobile.png)
- [Presence group](next-15-presence.png) / [phone](next-15-presence-mobile.png)

### Practical limits

Physical touchscreen gestures still need a device check; the browser tool did not support touch-event emulation. Phone layout and keyboard interactions were verified. Reduced motion was exercised at runtime for companions; the other components' reduced-motion branches were reviewed rather than every animation being recorded under emulation.

Voice uses labelled sample audio data, not microphone capture or transcription. File intake stays local unless the consumer supplies its upload callback. Presence and agent assignment use local demo state. Image generation reveal displays supplied images; it does not generate them. These boundaries are documented in Install instructions.

The new components and Sierra image assets are original Shipbits implementations. Reference links informed interaction design; restricted Transitions source was not copied. Existing Libraries.dev attribution for the shared site shell is retained.

## Files changed

### Created: reusable components

All paths below are relative to the repository root.

| File | Purpose |
| --- | --- |
| `components/ui/activity-capsule.tsx` | Task disclosure, progress, steps, and result. |
| `components/ui/agent-companion.tsx` | Original ceramic SVG characters and independent facial/body motion. |
| `components/ui/voice-capsule.tsx` | Level-driven listening, processing, and transcript surface. |
| `components/ui/image-generation-reveal.tsx` | Loading-aware pixel reveal. |
| `components/ui/image-comparison.tsx` | Registered image divider with pointer and keyboard input. |
| `components/ui/morphing-action-menu.tsx` | Connected trigger/menu surface using Base UI. |
| `components/ui/command-palette.tsx` | Search, filters, recent items, and nested actions. |
| `components/ui/notification-stack.tsx` | Base UI toast stack and exported notification hook. |
| `components/ui/contextual-inspector.tsx` | Adjacent inspector and mobile bottom sheet. |
| `components/ui/presence-group.tsx` | Interactive people group, nameplate, and overflow. |
| `components/ui/precision-dial.tsx` | Pointer, keyboard, and numeric circular control. |
| `components/ui/context-toolbar.tsx` | Expanding named tools with toolbar keyboard behavior. |
| `components/ui/file-intake.tsx` | File validation, previews, optional upload callback, retry, and removal. |
| `components/ui/precision-counter.tsx` | Place-stable rolling digits and anchored punctuation. |
| `components/ui/hold-to-confirm.tsx` | Hold gesture and alternative confirmation dialog. |

### Created: examples and catalog wiring

| File | Purpose |
| --- | --- |
| `components/collection-examples/activity.tsx` | Theme-token export example and real downloadable result. |
| `components/collection-examples/agent-media.tsx` | Companions, voice, image reveal, and comparison examples. |
| `components/collection-examples/overlays.tsx` | Menu, palette, notifications, inspector, and presence examples. |
| `components/collection-examples/precision.tsx` | Dial, toolbar, intake, counter, and confirmation examples. |
| `components/collection-examples/index.tsx` | Exhaustive typed mapping from catalog IDs to demos. |
| `components/collection-artwork.tsx` | Lightweight homepage artwork and static navigation glyphs. |
| `lib/collection-additions.ts` | Fifteen complete typed entries, dependencies, source lists, and usage examples. |
| `app/components/[id]/page.tsx` | Prerendered routes for the fifteen new IDs. |

### Created: helpers, tests, assets, and evidence

| File | Purpose |
| --- | --- |
| `lib/collection-media.ts` | Shared pure media calculations and validation. |
| `lib/collection-media.test.ts` | Media helper edge cases. |
| `lib/precision-controls.ts` | Numeric formatting, range, and file validation helpers. |
| `lib/precision-controls.test.ts` | Precision control edge cases. |
| `lib/collection-additions.test.ts` | Catalog completeness, source closure, and compilation of every Install example. |
| `public/collection/sierra-original.svg` | Original comparison/reveal source artwork. |
| `public/collection/sierra-refined.svg` | Registered alternate finish of the same artwork. |
| `docs/visual-qa/collection-15.md` | This report and complete change manifest. |
| `docs/visual-qa/collection-15/` | Screenshots and measured layout results. |
| `docs/visual-qa/next-15-*.png` | Desktop/phone screenshot pairs for the five overlays. |

### Modified

| File | Purpose |
| --- | --- |
| `lib/catalog.ts` | Merge additions into their groups; preserve existing entries and URLs. |
| `components/component-showcase.tsx` | Dispatch new previews through the existing Preview/Install shell. |
| `components/component-artwork.tsx` | Route new homepage artwork to the shared implementation. |
| `components/catalog-icon.tsx` | Route new static navigation glyphs. |
| `components/collection-sidebar.tsx` | Truncate long titles cleanly while retaining full accessible names. |
| `docs/catalog.md` | Document adding a component, its preview, route, and verifiable Install example. |

No files were deleted. The existing registry build was run without intentionally changing its source format.

## Execution flow

1. `collection-additions.ts` describes each entry; `catalog.ts` merges the entries into the existing groups.
2. The catalog supplies homepage cards, sidebar items, counts, footer links, and previous/next navigation.
3. `/components/[id]` renders the existing shared page shell.
4. `CollectionExample` selects the corresponding demo from an exhaustive typed map.
5. The demo owns task data and callbacks. The reusable UI component renders that state and reports user actions.
6. Install uses the same entry's dependency command, source list, and compiling usage example.

## One clear manual test

Open `/components/activity-capsule`, click **Export tokens**, watch the three steps complete, then click **Download manifest**. Inspect the JSON: it contains the current page's actual colors and typography. Collapse the capsule with the keyboard and switch between Preview and Install.

To repeat the automated checks in PowerShell:

```powershell
pnpm lint
pnpm typecheck
pnpm test:chat
$collectionTestFiles = @(rg --files lib -g '*.test.ts')
node --experimental-strip-types --test @collectionTestFiles
pnpm build
```
