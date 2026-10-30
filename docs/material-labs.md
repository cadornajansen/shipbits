# Material labs

Shipbits has two new GPU materials: Holographic foil and Titanium. Prismatic crystal and Woven silk were removed following design review. These use the existing lab layout, with examples beneath the preview and sticky desktop settings.

## What to edit

| Material | Settings and presets | Rendering | Public component | Route |
| --- | --- | --- | --- | --- |
| Foil | `lib/materials/foil.ts` | `lib/shaders/foil.ts` | `components/ui/holographic-foil.tsx` | `app/foil/page.tsx` |
| Titanium | `lib/materials/titanium.ts` | `lib/shaders/titanium.ts` | `components/ui/titanium.tsx` | `app/titanium/page.tsx` |

These eight files are new in this implementation. The Titanium component is now named `Titanium`; its earlier `MachinedTitanium` name/file was replaced.

Other new files:

- `components/ui/material-surface.tsx`: shared GPU lifecycle, live uniforms, pointer input, lazy mounting, pause, reduced motion, and recovery.
- `components/material-page.tsx`: compact page title, sidebar, and lab composition.
- `components/material-lab.tsx`: settings, exact numeric entry, presets, preview backgrounds, pause, quality, and copyable component code.
- `components/material-examples.tsx`: practical examples, ordinary HTML controls, and copyable example markup.
- `lib/materials/types.ts`: shared settings descriptors, validation, and conversion to shader uniforms.
- `lib/materials/registry.ts`: titles, public component names, shapes, and material definitions.
- `lib/materials/text-mask.ts`: bounded font-ready texture cache for optional programmatic text masks. The labs do not offer material text demonstrations.
- `lib/materials/materials.test.ts`: settings validation and shader/installed-Paper interface regression tests.
- `docs/material-labs.md`: this file inventory, walkthrough, and verification notes.

Existing files modified:

- `components/effect-icon.tsx`: small animated material thumbnails.
- `components/collection-sidebar.tsx`: effect navigation, including Titanium's shorter name.
- `app/page.tsx`: collection entries for the two materials.
- `app/how-to-use/page.tsx`: exact numeric entry and the dependencies required by copied snippets.

Removed during design review:

- `app/crystal/page.tsx`
- `lib/materials/crystal.ts`
- `lib/shaders/crystal.ts`
- `components/ui/prismatic-crystal.tsx`
- `app/silk/page.tsx`
- `lib/materials/silk.ts`
- `lib/shaders/silk.ts`
- `components/ui/woven-silk.tsx`
- `components/ui/machined-titanium.tsx` (replaced by `components/ui/titanium.tsx`)

No new packages were added. Existing Glass, Liquid metal, and Distressed renderers were left intact.

## Follow one setting through the code

1. Open `lib/materials/titanium.ts`. A descriptor such as `brushDirection` defines its label, numeric bounds, step, and unit. The same descriptor feeds both the slider and numeric field.
2. `MaterialLab` keeps the selected settings in React state. Inputs are checked for finite numbers and clamped to the descriptor's bounds.
3. The preview and all examples receive the same settings object. Each example keeps its own small interaction state, such as selected mode or playback state.
4. `materialUniforms` converts a setting into a GPU uniform: `brushDirection` becomes `u_brushDirection`; colors become three numeric channels; choices become numeric indexes.
5. `MaterialSurface` sends these uniforms into its existing Paper `ShaderMount`. A setting change does not create another GPU context.
6. The material's fragment shader computes the visible pixel. In Titanium, brush direction rotates the grain and its directional reflections.

A **uniform** is a value shared by all pixels in a shader draw. A **fragment shader** is the GPU program that computes each pixel's color. React owns user settings; the GPU owns the material image. Labels and interactive controls remain ordinary HTML above that image.

## Material choices

- **Foil:** directional etched grooves and angle-dependent spectral reflections. Credentials and seals use a localized foil area instead of covering every label with the effect.
- **Titanium:** directional brushing, silver reflections, and a separately polished edge. Hardware-style controls give the material a useful purpose.

The renderer is an artistic approximation. The diffraction treatment is informed by [NVIDIA GPU Gems](https://developer.nvidia.com/gpugems/gpugems/part-i-natural-effects/chapter-8-simulating-diffraction), and Titanium's directional reflection model by [Filament's anisotropic material model](https://google.github.io/filament/main/filament.html). The host uses the installed [Paper ShaderMount API](https://github.com/paper-design/shaders/blob/main/_autodocs/api-reference/shader-mount.md).

## Rendering lifecycle

Shader modules load on demand. A surface mounts near the viewport, pauses when offscreen or when the document is hidden, and releases its context when distant. Its animation phase remains in a ref through renderer recreation. Settings and pointer updates use uniforms rather than React animation renders.

The canvas stays transparent until a linked shader has produced its first frames. Rendering failure exposes a quiet Retry control. There is no striped substitute material. Reduced motion stops the automatic sweep and pointer movement; manual settings still work. Touch input does not capture page scrolling.

Microscopic patterns use screen-space derivatives to soften detail that falls below pixel resolution. This prevents thin grooves and fibers from flashing as they move. Auto and High have bounded rendering resolution; thumbnails use a smaller budget and a 15 fps ceiling.

Copied code imports project components. It is not a standalone package: retain the shared host, settings, shaders, utilities, and installed Paper dependency. Example copy buttons include their surrounding HTML and local state.

## Test the result

With the existing development server running, open `/titanium`, select **Natural**, and change **Brush direction**. The main material and examples should change together. Scroll through the examples: settings remain pinned on desktop and flow normally at mobile widths.

```sh
node --experimental-strip-types --test lib/materials/materials.test.ts lib/glass-optics.test.ts
pnpm lint
pnpm typecheck
pnpm build
```

Earlier browser checks verified live Titanium uniforms without replacing its canvas, presets/reset, pause, context-loss recovery, reduced motion, sticky desktop controls, and mobile flow without horizontal overflow. Browser automation stalled during performance measurement; a reliable frame-rate result is unavailable.

Final checks after removing Woven silk: all 20 tests passed; `pnpm lint`, `pnpm typecheck`, and `pnpm build` passed. The production route list contains neither `/silk` nor `/crystal`. No component feature work was started.
