# Shipbits

A collection of React components, material effects, SVG icons, and AI interface previews, with browser-based editors for customizing materials and thinking orbs.

Source: [cadornajansen/shipbits](https://github.com/cadornajansen/shipbits).

## Run locally

Use Node.js 24 (CI uses 24.18.0) and pnpm 11.15.0. Next.js itself supports Node.js 20.9+, but this project uses Node.js 24 for its TypeScript test runner and release checks.

```bash
npm install --global pnpm@11.15.0
git clone https://github.com/cadornajansen/shipbits.git
cd shipbits
pnpm install --frozen-lockfile
pnpm dev
```

Open [localhost:3000](http://localhost:3000). The component demos and Studio run without a database, account, or AI API key. AI Chat uses local demonstration data, not a connected model.

## Verify changes

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

`pnpm test` discovers every `*.test.ts` under `components/` and `lib/` and runs them with Node's test runner. `pnpm test:chat` runs only the chat state tests. The GitHub Actions workflow runs the complete checks on pull requests and pushes to the main branches.

`pnpm build` rebuilds the shadcn registry in `public/r/` before producing the Next.js production build. Development dependencies are required during the build, including the shadcn CLI and Tailwind compiler.

## Run in production

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm start
```

Use a host that supports a Node.js Next.js application. The start command serves the production build on port 3000 by default; the host can set `PORT`. Configure HTTPS on the host so microphone and clipboard features can work. Do not use `pnpm dev` as the production server.

Publishing the GitHub repository does not deploy the website. Connect the repository to the chosen hosting provider, use the build and start commands above, and configure the production domain there.

The canonical site is `https://shipbits.dev`, and public contact is `ship@jansencadorna.com`. Optional public build-time overrides are listed in `.env.example`; no secrets are required. `NEXT_PUBLIC_COFFEE_URL` is intentionally unset, so donation controls stay hidden. Rebuild after changing these settings. Confirm HTTPS, the domain, and the hosting provider’s logging/retention settings before launch.

## Project structure

- `app/`: routes, metadata, and shared theme tokens.
- `components/ui/`: reusable component source and shadcn/Base UI primitives.
- `components/collection-examples/`: interactive demonstrations.
- `lib/catalog.ts`: published catalog, navigation order, and install instructions.
- `lib/`: animation geometry, state logic, and colocated tests.
- `public/icons/mono/`: static, standalone SVG downloads.
- `registry.json` and `public/r/`: AI Chat registry source and generated output.

Use inline Tailwind utilities for UI styling and Motion for animation. Respect reduced motion, keep navigation thumbnails static, and avoid visible animation playback controls.

See [the catalog guide](docs/catalog.md) before adding a component. Each component's Install tab lists its actual dependencies and source files; only AI Chat currently has a shadcn registry installer.

## Attribution

Original Shipbits code is [MIT licensed](LICENSE). [Third-party notices](THIRD_PARTY_NOTICES.md) identify adapted source, the rendering engine, and fonts with separate license terms. Preserve those notices when reusing the applicable portions. Dependency licenses remain with their respective packages.

## Issues

Report reproducible bugs or component requests through [GitHub Issues](https://github.com/cadornajansen/shipbits/issues). Include the component URL, browser, steps to reproduce, and expected behavior. Do not include credentials or private recordings.
