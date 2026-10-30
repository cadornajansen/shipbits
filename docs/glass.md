# Browse glass material

The free Glass Lab lives at `http://localhost:3000/glass`. It uses the same `GlassLink` as the hero. The homepage preset is still `browseGlass` near the top of `app/page.tsx`; tuning the lab does not change that preset until you copy your settings into it. No new dependencies are involved.

## Live lab

- `app/glass/page.tsx` provides the collection navigation and page heading as a Server Component.
- `components/glass-lab.tsx` owns one `GlassSettings` state object. Original, Clear, and Frosted presets replace this object; Reset restores the default material. Preview/Code and the optional grid are separate UI state, so switching views preserves the material.
- `components/glass-controls.tsx` renders labeled native range inputs and a color input. Each slider's `onChange` copies the current object and updates one property. The color picker uses `onInput` to update continuously. React immediately passes the settings to the preview and generated code.
- Copy code exports a typed preset and example usage for this project's existing `GlassLink`. Nothing is saved automatically; refresh restores the original settings. Clipboard failures leave selectable code and a readable message.

The preview measures 210 × 60px. Depth and corner radius therefore stop at 30px: greater values would clamp to the same geometry. Frost stops at 20px to keep its blur inside this preview's filter bounds. The component's API accepts wider ranges for other sizes. On sufficiently tall mobile screens, the preview stays visible while you scroll through the controls; short windows use normal flow.

The default preview is charcoal (`#171717`) with two soft white radial glows at 3.5% and 2.5% opacity, without decorative captions or scene selectors. For optical inspection, choose **Clear**, enable **Show grid** at the preview's bottom-right corner, then move **Refraction** between 0 and 100. The grid should straighten at 0 and bend around the glass edge at 100 in Chrome or Edge. The numbers and generated code update together.

## Controls

These names follow Figma's controls, but this is a browser approximation, not Figma's proprietary renderer. Equal numbers do not imply identical optics.

| Setting          | Default     | Meaning in this implementation                                                                                                         |
| ---------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `lightAngle`     | `-45`       | Highlight direction in degrees: 0 is above, -45 is upper left, 90 is right. Range -180 to 180.                                         |
| `lightIntensity` | `80`        | Brightness of the rim, inner reflections, and surface sheen; 0–100%.                                                                   |
| `refraction`     | `80`        | Strength of curved-edge background distortion; 0–100%. Zero disables the SVG filter.                                                   |
| `depth`          | `20`        | How many CSS pixels the curved bevel extends inward. Geometry clamps it to half the smaller dimension; zero removes lens displacement. |
| `dispersion`     | `50`        | Separation of red, green, and blue samples at the bevel; 0–100%. Zero keeps their offsets identical.                                   |
| `frost`          | `4`         | Background blur radius in CSS pixels; 0–40. Text stays sharp.                                                                          |
| `splay`          | `0`         | Width and softness of the projected highlights; 0–100%.                                                                                |
| `radius`         | `22`        | Corner radius in CSS pixels. Set size with Tailwind classes on `GlassLink`.                                                            |
| `tint`           | `"#3f3f3f"` | Transmitted surface tint, as a six-digit hex color.                                                                                    |
| `fillOpacity`    | `20`        | Tint opacity, 0–100%. At 100%, the tint hides the backdrop.                                                                            |

First tuning exercise: change `lightAngle` from `-45` to `45` and see the highlight move. Restore it, then raise `splay` to `60` to broaden the light. On the flat hero background, refraction and dispersion are naturally subtle: there are no detailed objects beneath the button to distort.

## Rendering and data flow

`browseGlass` → `GlassLink` → normalized values → CSS material variables + optional SVG lens filter.

1. A native anchor handles navigation, keyboard focus, and the accessible name. Existing shadcn button utilities provide the interaction foundation.
2. Independent, decorative spans draw the tinted backdrop, inner bevel, and one-pixel directional rim. The label sits above all effects. CSS custom properties carry calculated values into Tailwind utilities; there is no global glass stylesheet.
3. In Chromium, `ResizeObserver` measures the anchor. A small in-memory canvas encodes a rounded-rectangle normal map: red stores horizontal displacement and green stores vertical displacement. It runs when size, radius, depth, or refraction enablement changes, not on an animation loop. Changing refraction strength, dispersion, or frost only updates SVG attributes. Maps are capped at 512 pixels on either axis.
4. `feDisplacementMap` samples the blurred background using that map. Negative scale makes the convex bevel sample inward. Three slightly different sampling distances separate RGB channels; their isolated colors are recombined. `colorInterpolationFilters="sRGB"` keeps the map's encoded midpoint consistent.
5. `useId` gives each instance its own filter ID. The observer and pending animation frame are cleaned up on unmount. The rest of the page remains a Server Component.

The formula is `sample offset = scale × (channel − 0.5)`, so maximum displacement is approximately half the SVG scale. A byte value of 128 is the nearest practical midpoint; the residual shift is under 0.04px at the default scale.

## Browser support and limitations

The CSS material renders before hydration. Current Chromium browsers get SVG backdrop refraction; Safari/iOS and Firefox deliberately keep CSS frost, tint, bevel, and rim. Their SVG backdrop support is incomplete. A successful `CSS.supports()` parse does not prove that a referenced filter actually renders. The conservative user-agent check is a compatibility guard, not a capability guarantee.

For an explicit fallback, pass `refractionMode="off"` to `GlassLink`. Real refraction and dispersion are unavailable in that mode. Keep the glass wrapper free of ancestor `opacity`, `filter`, `mask`, and `clip-path` effects: these can change which background pixels a backdrop filter can sample. The rim's mask is a sibling, not an ancestor of the backdrop layer.

The implementation models a smooth bevel and directional light, not physical ray tracing or environmental reflections. A plain backdrop cannot demonstrate all optical controls. Avoid adding an artificial rainbow to compensate. Reduced-motion preferences disable the small interaction transitions; reduced-transparency uses an opaque theme surface; forced colors retain the native label and boundary without decorative layers.

## Verification

- `pnpm dev`: inspect the 162 × 45 Browse anchor, press Tab/Enter, and confirm navigation to the collection. Press D for both themes; inspect at 390px wide.
- `node --experimental-strip-types --test lib/glass-optics.test.ts`: settings limits, neutral pixels, mirrored normals, depth, map bounds, and square corners.
- `pnpm lint`, `pnpm typecheck`, `pnpm build`.
- Open `/glass`, choose Clear and Show grid, then move Refraction between 0 and 100. Compare Dispersion 0 and 100. Verify Reset settings, Preview/Code, Copy code, each slider with arrow keys, mobile scrolling, and the D theme shortcut outside an input.

## Research

- [Figma: Glass controls and export limitations](https://help.figma.com/hc/en-us/articles/360041488473-Apply-effects-to-layers): definitions of the seven controls; Glass does not export as SVG.
- [Figma support: Glass has no direct CSS counterpart](https://forum.figma.com/ask-the-community-7/css-properties-for-glass-effect-58653): Dev Mode does not generate the full Glass effect.
- [MDN: backdrop-filter](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/backdrop-filter): transparency, URL filters, and backdrop-root behavior.
- [MDN: feDisplacementMap](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/feDisplacementMap): channel math and color interpolation.
- [Filter Effects Level 2](https://drafts.csswg.org/filter-effects-2/): backdrop sampling and clipping model.
- [WebKit SVG backdrop issue](https://bugs.webkit.org/show_bug.cgi?id=245510) and [Mozilla SVG backdrop issue](https://bugzilla.mozilla.org/show_bug.cgi?id=1808785): reason for the conservative CSS fallback.
- [WebKit: backdrop-filter rendering costs](https://webkit.org/blog/3632/introducing-backdrop-filters/): reason to keep filters local and avoid continuous regeneration.

Research checked October 15, 2026. The source Figma node is `11:138` in the ICONS file; its exact effect values were read through the Figma API. Those values seed the preset, while the browser renderer supplies its own mapping.
