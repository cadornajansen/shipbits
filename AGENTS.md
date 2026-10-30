<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Styling preferences

- Use inline Tailwind utilities in component markup for all UI styling.
- Do not create standalone CSS/SCSS files or custom component CSS classes.
- Use `app/globals.css` only for necessary shared tokens, keyframes, and framework directives.
- Motion (`motion/react`) may be used for transitions; respect reduced motion.
- Reuse the existing shadcn primitives where they fit.
- Do not add visible Pause/Resume controls anywhere in the app. Keep automatic reduced-motion and offscreen handling.
- Keep preview canvases free of explanatory headings and descriptions; functional component content, such as a status pill, belongs in the preview.
