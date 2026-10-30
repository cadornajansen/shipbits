# Mono icons

The 21 icons come from the supplied [Figma ICONS file](https://www.figma.com/design/m9uOlcLa5mlSEMbMkz2eCq/ICONS).
They retain the original 24 × 24 viewBox, paths, primitive shapes, transforms,
masks, clipping, and gray fills. Only the white frame backgrounds and Figma
canvas backdrop were removed, so the SVG files have transparent backgrounds.
Downloads and `MonoIcon` remain static. The optional `AnimatedMonoIcon` animates
all 21 icons using internal SVG layers. No raster image, canvas,
external asset URL, or custom stylesheet is used.

## React usage

```tsx
import { MonoIcon } from "@/components/ui/mono-icon"

;<MonoIcon name="home" width={24} height={24} aria-label="Home" />
```

Copy `components/ui/mono-icon.tsx` and `lib/mono-icons.ts` into a React project.
Adjust the `@/lib/mono-icons` type import if the project uses a different alias.
The component accepts standard SVG props, including `className`, `width`,
`height`, and accessibility attributes. Without an accessible label, it is
decorative and hidden from assistive technology. Label icon-only controls on
their button or link rather than announcing the same label twice.

The downloadable files in `public/icons/mono/` are ordinary SVGs and work
without React or Tailwind. Each file is available at `/icons/mono/<name>.svg`.

## Optional animated React usage

Install `motion` (`pnpm add motion`) and copy these additional files:

- `components/ui/animated-mono-icon.tsx`
- `lib/mono-icon-playback.ts`
- `lib/mono-icon-motion.ts`

```tsx
import { AnimatedMonoIcon } from "@/components/ui/animated-mono-icon"

;<button type="button" aria-label="Home" data-mono-icon-trigger>
  <span data-mono-icon-preview className="flex p-4">
    <AnimatedMonoIcon name="home" width={48} height={48} />
  </span>
</button>
```

Every `MonoIconName` is accepted. The enclosing trigger listens for
mouse hover and keyboard-visible focus. The preview starts an introduction when
at least 50% visible. A module-level Set remembers completed introductions until
a full reload, including across route changes and Preview/Install switches.
Interrupted introductions reset and retry; active cycles finish when the pointer
leaves. Home holds its depth reveal until both hover and focus end. Its front
wall, door, and roof outline never narrow, rotate, skew, or shift; only the depth
faces behind them extend to the right.
The homepage gives its existing six icons `stagger={index * 80}` on the same card,
with a visibility target around each icon so offscreen icons remain unviewed.

Motion animates a number from 0 to 1; the painter maps that progress to individual
SVG transforms, Home depth paths, and Pen's ink clip. The root SVG never moves.
An exhaustive `iconAnimations` map gives each name its own duration and pose
function. The painter caches the named layers once, then applies the attributes
for each frame. Cycle endpoints restore exact initial attributes, and added
reflections, waves, steam, and the letter stay invisible at rest.
`prefers-reduced-motion` disables all playback, including changes made while the
page is open. Visibility observers, hover listeners, timers, and animation controls
are cleaned up on unmount. No browser storage or backend is involved.

## Editable layers

The JSX uses individual `<path>`, `<rect>`, `<circle>`, `<ellipse>`, and `<g>`
elements instead of an image wrapper. `data-part` names identify pieces such as
`door`, `roof-left`, `clapper`, and `bookmark` for later animation work.
React's `useId` supplies a separate ID prefix for every rendered icon, keeping
masks and clip paths correct when an icon appears more than once on a page.
Keep the raw SVG and React shapes in sync when changing a design.
If you paste the same raw SVG more than once inline, give each copy's mask IDs
and references a unique prefix. The React wrapper does this automatically.

## Source mapping

| Name        | Figma node |
| ----------- | ---------- |
| Home        | `1:2`      |
| Pen         | `1:25`     |
| Folder      | `1:47`     |
| Work        | `1:67`     |
| User        | `1:94`     |
| Mic         | `7:57`     |
| Search      | `42:34`    |
| Settings    | `42:42`    |
| Bell        | `42:55`    |
| Mail        | `42:67`    |
| Calendar    | `42:85`    |
| Coffee      | `43:130`   |
| Location    | `43:161`   |
| Image       | `43:179`   |
| Book        | `43:214`   |
| Agents      | `74:454`   |
| Clock       | `70:2`     |
| Light       | `70:36`    |
| Touch       | `70:68`    |
| Layers      | `70:96`    |
| Motion path | `70:124`   |

The location pin is labelled **Location** here; its Figma frame was named
“Coffee / Cup.” All supplied designs are included exactly once.

Agents adds a 900ms curious glance and staggered blink. Its two eye groups move
independently while the original circular body stays fixed. The static SVG
download retains the original Figma ellipses and rotations on a transparent
background. It uses the same first-view memory and hover/focus playback as the
other cycle icons.

The five newest icons keep their original Figma geometry and add these motions:

- **Clock:** the crown presses and the hands sweep around the fixed face.
- **Light:** the bulb brightens while the highlight and rays respond in sequence.
- **Touch:** the finger presses and releases, sending a second curved ripple outward.
- **Layers:** individual bars slide between editing positions around the fixed guide.
- **Motion path:** the starting dot follows the bouncing curve and lands at its endpoint.

Motion path replaces the Figma frame's working name, “Beizer Cube Graph.”
The touch echo and motion trace are invisible at rest and absent from static
downloads. All five use the existing once-per-reload introduction and repeatable
hover/keyboard-focus cycle, with no playback when reduced motion is enabled.

## Original static-icon verification

Verified on initial delivery, before the optional animation update:

- All 15 icons render as inline SVGs with no icon animations or duplicate IDs.
- Shapes, fills, transforms, masks, and clipping match the Figma exports.
- Every SVG download returns HTTP 200 with `image/svg+xml`; the Home download
  was also exercised through the browser.
- Desktop (1280 × 1024) and phone (390 × 844) layouts have no horizontal overflow.
- Icons opens and closes in the sidebar; the active mobile chip is Mono icons.
- Preview/Install works with mouse and arrow keys. Instructions distinguish raw
  SVG downloads from the optional React wrapper.
- The homepage shows eight catalog entries in a 2 / 3 / 3 desktop layout.
- `pnpm lint`, `pnpm typecheck`, `pnpm test:chat` (9 tests), and `pnpm build` pass.
- No browser console errors occurred during the checks.

Screenshots: [desktop](visual-qa/mono-icons-desktop.jpg) and
[phone](visual-qa/mono-icons-mobile.jpg).

## Files changed for this addition

Modified:

- `lib/catalog.ts` — Icons group and Mono icons catalog entry.
- `components/catalog-icon.tsx` — navigation thumbnail.
- `components/component-artwork.tsx` — homepage icon preview.
- `components/component-showcase.tsx` — SVG gallery and accurate Install content.
- `app/page.tsx` — fit the eighth catalog card without empty grid cells.
- `components/site-faq.tsx` — remove the old seven-entry count; explain SVG downloads.
- `app/how-to-use/page.tsx` — document the new download option.
- `docs/catalog.md` — document the Icons category.

Created:

- `app/icons/mono-icons/page.tsx` — public route and metadata.
- `components/mono-icons-gallery.tsx` — responsive gallery and download links.
- `components/ui/mono-icon.tsx` — all 15 editable React SVGs.
- `lib/mono-icons.ts` — typed icon names, labels, Figma nodes, and download URLs.
- `docs/mono-icons.md` — this usage guide, source mapping, and verification record.
- `public/icons/mono/home.svg` — Home.
- `public/icons/mono/pen.svg` — Pen.
- `public/icons/mono/folder.svg` — Folder.
- `public/icons/mono/work.svg` — Work.
- `public/icons/mono/user.svg` — User.
- `public/icons/mono/mic.svg` — Mic.
- `public/icons/mono/search.svg` — Search.
- `public/icons/mono/settings.svg` — Settings.
- `public/icons/mono/bell.svg` — Bell.
- `public/icons/mono/mail.svg` — Mail.
- `public/icons/mono/calendar.svg` — Calendar.
- `public/icons/mono/coffee.svg` — Coffee.
- `public/icons/mono/location.svg` — Location.
- `public/icons/mono/image.svg` — Image.
- `public/icons/mono/book.svg` — Book.
- `docs/visual-qa/mono-icons-desktop.jpg` — desktop evidence.
- `docs/visual-qa/mono-icons-mobile.jpg` — phone evidence.

No files were deleted. No dependencies or stylesheets were added.

For the optional Home/Pen/Folder animation update, see the
[motion QA report and complete change list](visual-qa/mono-icons-motion.md).

For the full collection and fixed-front Home update, see the
[full-collection QA report](visual-qa/mono-icons-full-motion.md).
