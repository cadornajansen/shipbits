# Shipbits visual QA

final result: implementation complete; visual acceptance incomplete

## Source of truth

- Libraries.dev repository commit `d923333ae4fc9bf82e2f4e708c8458a4c64983da`.
- Source styles: `sites/home/public/assets/site.css`, `playground.css`, and the homepage inline styles.
- Hero behavior: `sites/home/src/hero-tiles.tsx` and its MIT UI-generation runtime.
- Source captures are in `docs/visual-qa/`. Their actual encoding and dimensions are recorded in `source-dimensions.json`.

## Captured source states

| State | Source visual truth path | Requested viewport | Saved pixels |
| --- | --- | --- | --- |
| Home, full page | docs/visual-qa/source-home-desktop.png | 1440 × 1000 | 1424 × 4022 |
| Home, full page | docs/visual-qa/source-home-mobile.png | 390 × 844 | 375 × 5728 |
| More menu, open | docs/visual-qa/source-menu-desktop.png | 1440 × 1000 | 1425 × 990 |
| Component Preview | docs/visual-qa/source-detail-desktop.png | 1440 × 1000 | 1425 × 990 |
| Component Install | docs/visual-qa/source-install-desktop.png | 1440 × 1000 | 1425 × 990 |
| Component Install | docs/visual-qa/source-install-mobile.png | 390 × 844 | 375 × 811 |

The screenshot API returned JPEG bytes. Files retain their original capture names.
Requested browser viewport sizes and saved pixel dimensions differ. Final comparison
must measure actual CSS viewport and device pixel ratio on both pages and normalize
the captures before asserting pixel fidelity. No density-normalized match is claimed.

## Implementation evidence and blocker

Implementation screenshots: `docs/visual-qa/implementation-home-desktop.png`
and `docs/visual-qa/implementation-home-full.jpg`. Browser access recovered after
the build, and the homepage rendered. The viewport capture contains clipping and
repeated image content, so it is not accepted as a normalized comparison image.

The updated header, sidebar groups, seven links, and footer rendered on localhost
during checkpoint 1. The temporary CSS import error observed during editing was
resolved by importing site.css directly from layout.tsx. A reload then rendered the
page and working Glass controls.

Subsequent attempts to open the reference guide, reconnect the local tab, inventory
the browser, reconnect its controls without a page snapshot, and reset the browser
session timed out. At that point the 16 GB machine had approximately 500–900 MB
free physical memory. This correlates with slow command execution; it does not
prove the cause of the browser failure.

Source and homepage implementation captures exist. Full-view and focused-region
comparisons remain incomplete. No final visual approval is claimed.

## Source-driven corrections

- Replaced the old Figma-style hero buttons with the source's 32px gray/blue pills.
- Matched the 1240px shell, 200px sidebar, 56px gap, 46px detail icons, and explicit typography.
- Reused the source hero scatter/mobile geometry, hover chrome, and dotted entrance runtime.
- Replaced the first usage-card draft's large icons with the reference's text cards and blue numbered badges.
- Restored GitHub in the phone header where space permits, with a smaller-screen fallback in navigation.
- Kept shared component tokens and the restored radius rather than replacing the component stylesheet.

These are code/source comparisons, not substitutes for rendered visual evidence.
Post-fix screenshots are still required for P2 visual acceptance.

## Intended differences

- Shipbits branding, seven working components, and the real component count.
- No unsupported install counts, customer logos, testimonials, GitHub star counts, or claims of payment/authentication.
- React only; no nonworking platform tabs.
- Existing material editors in free Studio routes; public pages have clean previews.
- Fourteen destinations explicitly marked “Not available yet.”

## Checks completed

- Focused lint for the shared foundation: passed.
- Full `pnpm lint`: passed.
- Shared style audit: all 72 original CSS custom properties are still declared; `--radius: 0.625rem` is present. `git diff --check` passed.
- `pnpm typecheck` after the shared showcase and Studio routing: passed.
- `pnpm test:chat`: all 9 tests passed.
- `pnpm build`: passed, including registry generation, production compilation, TypeScript, and all 32 routes. Some static pages exceeded 60 seconds on their first attempt; the build retried and completed every page successfully.
- HTTP verification: all 29 published destinations returned 200; an unknown route returned 404. Results are saved in `docs/visual-qa/route-checks.json`.

## Remaining acceptance checks

- Capture final home, Preview/Install, How to use, More/mobile menu, footer, and Studio at desktop and phone widths.
- Verify 100% zoom, CSS viewport, DPR, and screenshot density; compare full views and focused header/sidebar/hero/control regions.
- Exercise all five editors: preset, slider, reset, pause/background where available, code export, and copy success/failure.
- Test keyboard navigation, tab arrow keys, hero drag/click separation, reduced motion, mobile chip centering, rounded surfaces, and horizontal overflow.
- Verify placeholder navigation interactively; HTTP status checks passed.
- Inspect the final browser console for errors.

No P0/P1/P2 visual finding can be signed off until these rendered checks are completed.

The browser eventually recovered. The user then requested an immediate wrap-up,
so further visual and interaction checks were stopped. The preview is running at
`http://localhost:3000` and was left open. The viewport emulation override was cleared.
