# AI Chat pack

One install, one public `AIChat` entry point, and one integrated chat/agent showcase at `/components/ai-chat`.

## Install and start

Use React 19, Tailwind CSS 4, and a configured shadcn Base UI project. In the showcase, Copy install uses that page’s actual origin, including localhost during development. Keep your existing theme and font.

```sh
pnpm dlx shadcn@latest add http://localhost:3000/r/ai-chat.json
```

```tsx
"use client"
import { AIChatDemo } from "@/components/ai-chat/demo"
export default function Example() { return <AIChatDemo /> }
```

This complete local adapter uses scripted fixtures. It does not connect to a model service, inspect attached files, upload recordings, or modify repository files.

## The important execution flow

1. `AIChat` receives `messages` and `status`. Your application owns these values.
2. The composer collects a draft, local `File` attachments, model, effort, and Chat/Agent mode. Submit calls `onSubmit` with a `ChatSubmission`.
3. Your adapter appends a user message and streams assistant parts into state. Each part has a `type` discriminator, such as `text`, `tool`, `approval`, or `artifact`; TypeScript uses that field to select the right properties.
4. `ChatPartView` renders those parts. Message Scroller preserves reading position and offers Jump to latest while the reader is away from the live edge.
5. Retry, version selection, feedback, approvals, and context actions call your callbacks. They do not secretly perform network or filesystem operations.

Start with the demo adapter to see a complete implementation. It uses `AbortController` to cancel its waits and a run ID to reject stale updates after Stop, Replay, New chat, or unmount. Only the latest assistant response is retryable in the demo. Each retry appends a version; switching versions preserves the original parts.

## Public interface

Import `AIChat`, `AIChatProps`, `ChatMessage`, `ChatPart`, `ChatStatus`, `ChatSubmission`, and other types from your UI `ai-chat` entry.

- Required: `messages`, `status`, `onSubmit`.
- Optional actions: `onStop`, `onRetry`, `onFeedback`, `onSelectVersion`, `onApproval`, `onContextAction`.
- Configuration: `models` (with per-model `efforts`), `suggestions`, `capabilities`, `title`, `description`, `error`, `className`.
- Attachments: `maxAttachments` defaults to 5; `maxAttachmentBytes` defaults to 10 MB; `maxRecordingSeconds` defaults to 120.
- Context: `{ used, limit }` comes from your host. The component does not estimate token usage.
- Extension points: `toolbar` accepts React content; `renderArtifact` receives an artifact and returns its preview.

Status is `idle`, `submitted`, `streaming`, `awaiting-approval`, or `error`. Keep message IDs and part IDs stable during streaming. Update the current part rather than replacing the conversation with fresh IDs.

`onSubmit` may return a promise for accepting a submission. Reject it to retain the draft and display an error. Manage the longer response lifecycle with `status`; the demo starts its asynchronous response separately. In a real adapter, abort your transport in `onStop` and update running activities when generation stops.

Text parts render Markdown with tables, lists, code, and safe links. To reference a source inline, use `[1](#source-sourceId)` and include that source in the text part’s `sources` array. Source URLs support HTTP(S). Raw HTML is disabled.

The `approval` callback receives message ID, part ID, and `approved` or `rejected`. Update the matching part’s `decision`. Its `approveLabel` and `rejectLabel` are optional; the defaults are Approve and Reject. In a real application, perform and validate the requested operation in your backend; this frontend only presents the decision.

Artifacts contain code, a filename, and optional Markdown/image preview. Code is displayed rather than executed. A custom React preview is supplied through `renderArtifact`.

## Audio ownership and cleanup

Recording starts only after pressing Record voice note. `getUserMedia` obtains an audio stream; `MediaRecorder` collects chunks into a `File`. Finish attaches it, Cancel discards it, and the maximum duration automatically finishes it. All tracks and timers are stopped on finish, cancel, failure, or component unmount. A late permission response after cancellation is discarded and its tracks stopped.

Playback creates a local object URL for that file and revokes it when the preview unmounts. Transcript attachments retain the `File` independently of the cleared composer. The host decides whether and how to upload or transcribe it. HTTPS or localhost is required for microphone access.

## Styling and rendering

The pack inherits semantic theme tokens and fonts. Styling uses inline Tailwind utilities. The registry installs its `sb-chat` keyframes and angle property into your global stylesheet; there is no standalone chat CSS file. When copying source manually, include those animation definitions from `app/globals.css`. The composer has a quiet spectral border while processing; reduced motion stops autonomous effects. All decorative elements ignore interaction.

Markdown uses `react-markdown` and `remark-gfm`. Shiki is imported only when a code block mounts; a singleton highlighter, limited language set, and 32-entry cache bound repeated highlighting. Until highlighting completes, plain code remains readable. There is no WebGL dependency.

## File inventory for this checkpoint

Created reusable source:
- `components/ui/ai-chat.tsx`: public component, transcript, message actions, context popover.
- `components/ai-chat/types.ts`: typed public contract and message parts.
- `components/ai-chat/state.ts`: versions, approvals, attachment rules, avatar seeds, diff parsing, run guards.
- `components/ai-chat/atoms.tsx`: avatars, copy feedback, selection menus, attachments, loaders.
- `components/ai-chat/composer.tsx`: draft, files, keyboard input, send/stop, recording controls.
- `components/ai-chat/use-recording.ts`: microphone lifecycle and cleanup.
- `components/ai-chat/content.tsx`: Markdown, code blocks, source cards and lists.
- `components/ai-chat/highlight.ts`: lazy, cached syntax tokenization.
- `components/ai-chat/workbench.tsx`: activity, task, approval, diff and artifact renderers.
- `app/globals.css`: shared chat animation definitions, also shipped through the registry item's `css` field.
- `components/ai-chat/demo-data.ts`: release-review fixtures and artifact contents.
- `components/ai-chat/demo.tsx`: working local state and cancellation adapter.
- `components/ai-chat/state.test.ts`: focused Node tests.

Created shadcn primitives: `components/ui/attachment.tsx`, `badge.tsx`, `bubble.tsx`, `collapsible.tsx`, `dialog.tsx`, `dropdown-menu.tsx`, `input-group.tsx`, `input.tsx`, `marker.tsx`, `message-scroller.tsx`, `message.tsx`, `popover.tsx`, `tabs.tsx`, `textarea.tsx`. The existing `button.tsx` was reused unchanged.

Created site/distribution files: `app/components/ai-chat/page.tsx`, `components/ai-chat-showcase.tsx`, `components/ai-chat-thumbnail.tsx`, `registry.json`, `public/r/ai-chat.json`, this document, and `docs/ai-chat-shadcn-license.txt` (the copied primitives’ MIT notice, included in the install).

Modified: `app/page.tsx` (linked collection card), `app/how-to-use/page.tsx` (pack installation guidance), `components/collection-sidebar.tsx` (active entry), `package.json` (runtime dependencies, registry/test/build scripts), `pnpm-lock.yaml` (resolved dependencies).

Deleted: none. Existing material renderers and the glass folder were not changed.

The registry bundles runtime modules and primitives, not the website’s header, sidebar, homepage, or test runner. `@components/` and `@ui/` targets respect the receiving project’s aliases, including a `src/` directory. Existing theme tokens are not replaced. Rebuild the payload with `pnpm registry:build`; `pnpm build` does that automatically.

## Verify it

```sh
pnpm test:chat
pnpm lint
pnpm typecheck
pnpm build
```

Manual test: open `/components/ai-chat`, choose Replay workflow, expand the patch, and approve or reject it. Open the resulting artifact, switch between Preview and Code, and copy or download it. Retry the latest response and use its version arrows to recover the original.

### Verification on the available environment

- All nine focused Node tests passed. Lint, explicit typecheck, and the production build passed.
- Checked 1440 × 900 and 390 × 844 layouts. No horizontal document overflow at mobile width; light and dark theme switching preserved usable controls.
- Exercised multiline/send/stop, stale-run cancellation, retry/version switching, feedback, model/effort fallback, citations with Escape focus restoration, task/diff expansion, approval/rejection, and artifact Preview/Code/copy.
- Used real browser `MediaRecorder` with a synthetic audio stream. Finish produced a playable local attachment; finish, cancel, and New chat ended captured tracks. Simulated denied and unsupported recording paths displayed the intended messages. Physical microphone permission prompts and real phone keyboards remain manual checks.
- A fresh one-command installation exited successfully into a separate `src/`-based application. Its typecheck and production build passed, and its browser-rendered rejection flow produced revision notes. Theme stylesheet hashes were unchanged by installation.
- An 1.8-second emulated-mobile frame sample recorded 108 frames, median 16.7 ms and p95 16.9 ms, with no frames above 33.4 ms. This measures the available desktop browser under mobile layout emulation, not physical phone performance.
- Reduced-motion emulation reported no animation for the processing border, loader cells, or model popup. The temporary audio/browser test overrides were removed.

## References

- Visual direction: [Libraries.dev Beam](https://libraries.dev/beam).
- Interaction references: [SmoothUI chat](https://smoothui.dev/docs/components/ai-conversation) and the supplied screenshots. Shipbits’ chat/workbench implementation is original.
- Chat primitives: [shadcn/ui](https://ui.shadcn.com/docs/components/base/message-scroller), distributed under its MIT license.
- Audio implementation: [MediaRecorder](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder).
