# Glass folder

The first finished component lives at `/components/glass-folder`. Its page has a main Project files example, controlled Archives, and a dark Material studies folder with links to the existing effect pages. There is no settings panel.

The silhouette, artwork algorithm, and interaction design are adapted from **Glass Folder Cards by Kedhareswer Naidu**, supplied in the attached 21st.dev source (MIT). Source: https://21st.dev/@kedhareswer/components/glass-folder-cards

## File inventory

| Status | File | Purpose |
| --- | --- | --- |
| Created | `components/ui/glass-folder-cards.tsx` | Typed reusable folder, layers, local files, opening, keyboard menu, focus, and pointer input. |
| Created | `lib/folder-art.ts` | Seeded artwork generation, shared cancellable paint queue, and bounded LRU cache. |
| Created | `lib/folder-geometry.ts` | Original SVG paths, dimensions, responsive fit, and fan positions. |
| Created | `components/glass-folder-examples.tsx` | Three working examples, Preview/Code, selection feedback, and copy buttons. |
| Created | `components/glass-folder-thumbnail.tsx` | Lightweight SVG thumbnail; no canvas work on the homepage. |
| Created | `app/components/glass-folder/page.tsx` | Page metadata and the existing header/sidebar page composition. |
| Created | `lib/folder.test.ts` | Artwork determinism, cache eviction, geometry bounds, and snippet syntax checks. |
| Created | `docs/glass-folder.md` | This inventory and walkthrough. |
| Modified | `app/globals.css` | Four folder animation keyframes only. |
| Modified | `components/collection-sidebar.tsx` | Component link and active component selection. Existing effect callers remain compatible. |
| Modified | `components/site-header.tsx` | Collections remains active on component and material routes. |
| Modified | `app/page.tsx` | Linked Glass folder card in the Components collection. |

No files were deleted and no packages were added.

## Follow the data

1. `files` supplies the **initial contents**. The component assigns stable IDs and owns subsequent additions. A new React `key` remounts the folder and resets its contents, as shown by Reset example in Archives.
2. Clicking the front toggles opening. Without an `open` prop, the folder owns that state. With `open` and `onOpenChange`, the parent owns it; Archives demonstrates this controlled form.
3. Open/hover/focus state changes a few CSS custom properties: hinge angle, file lift, spread, and fan angle. Tailwind classes apply the transforms to real HTML file elements. `clip-path` follows the original SVG outlines to shape the glass front and back.
4. Pointer movement uses a ref and one scheduled animation frame to write light/parallax coordinates directly to the element. It does not rerender React on every pointer movement. Touch and reduced-motion preferences skip that tracking.
5. The Add callback returns a new sample file. The folder appends it, animates only that file, updates the count, and calls `onFilesChange` if supplied. The latest four files form the visible fan, matching the reference.
6. Choosing a file invokes `onFileSelect`; a file with `href` is a normal link. Project files shows the selected filename; Material studies navigates to real effect pages.

`width` is the preferred folder body width. The component also reserves space for the raised fan and scales the whole object down to its available width. It waits for its first size measurement before revealing the object, avoiding an oversized flash on mobile.

## Artwork and cleanup

`art` accepts a built-in preset, a custom recipe, or `"none"`. An optional `image` takes precedence. Artwork is deterministic for its recipe and seed, so the same request shares one generated canvas. Raster dimensions are capped at 512 pixels per axis and the LRU cache retains at most 16 entries.

Painting starts near the viewport and runs in small queued slices. Unmounting releases a request; work with no remaining consumers is cancelled. Observers, pointer listeners, document listeners, and animation frames are cleaned up. Artwork failure leaves the neutral folder panel usable.

Closed contents use `inert`, which removes their links and buttons from interaction and keyboard navigation. Escape closes the menu first, then the folder, restoring the appropriate trigger. Menu arrow keys, Home, End, and Tab are supported. Reduced motion removes transitions, entrance motion, and pointer tilt while keeping immediate open/add/menu actions.

## Copying and testing

Snippets import this project's component. Copy the component, both helper files, the four keyframes, and the existing `cn` utility together when moving it to another project. React, Lucide, and Tailwind are the existing dependencies.

One manual check: open `/components/glass-folder`, click the front, select Brief.pdf, add two files, then press Escape. The count should be five and Tab should skip the closed contents. Open Archives' menu with the keyboard and choose Reset example; Project files should retain its count.

```sh
node --experimental-strip-types --test lib/folder.test.ts lib/materials/materials.test.ts lib/glass-optics.test.ts
pnpm lint
pnpm typecheck
pnpm build
```

Verified: all 26 tests, lint, typecheck, and production build pass. Browser checks covered 1440 × 900 and 390 × 844, opening/selection, repeated additions, closed-file tab order, Escape focus return, menu arrows/reset, independent state, Preview/Code preservation, copy and manual-copy fallback, actual file navigation, theme switching, reduced motion, and clean route reloads. Neither viewport had horizontal overflow or console errors.

The in-app browser cannot synthesize touch events, so a physical touch-device gesture check remains manual. The component uses passive pointer listeners and ignores touch tracking; it does not prevent page scrolling.
