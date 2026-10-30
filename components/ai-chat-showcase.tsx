"use client"

import { useSyncExternalStore, type ReactElement } from "react"
import { AIChatDemo } from "./ai-chat/demo"
import { CopyAction } from "./ai-chat/atoms"
import { CodeBlock } from "./ai-chat/content"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs"

const demoCode = `"use client"

import { AIChatDemo } from "@/components/ai-chat/demo"

export default function ChatPreview() {
  return <AIChatDemo />
}`
const integrationCode = `"use client"

import { AIChat, type AIChatProps }
  from "@/components/ui/ai-chat"

// Map your backend or SDK hook to this controlled contract.
type ChatSession = Pick<AIChatProps,
  "messages" | "status" | "onSubmit" | "onStop" |
  "onRetry" | "onApproval" | "onFeedback" | "onSelectVersion"
>

export function ConnectedChat({ session }: { session: ChatSession }) {
  return <AIChat
    {...session}
    title="My workspace"
    models={[
      { id: "your-model-id", label: "Your model", efforts: ["Standard", "Deep"] }
    ]}
  />
}
`

const subscribeOrigin = (): (() => void) => () => {}
export function AIChatShowcase(): ReactElement {
  const origin = useSyncExternalStore(
    subscribeOrigin,
    () => window.location.origin,
    () => ""
  )
  const install = `pnpm dlx shadcn@latest add ${origin || "<your-shipbits-origin>"}/r/ai-chat.json`
  return (
    <Tabs defaultValue="preview" className="gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TabsList
          variant="line"
          className="gap-1 rounded-full p-0 [&_button]:rounded-full [&_button]:px-3 [&_button]:py-2 [&_button]:text-xs [&_button]:after:hidden [&_button[data-active]]:bg-foreground/8"
        >
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="usage">Install &amp; Usage</TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-1">
          <CopyAction text={install} label="Copy install" />
          <CopyAction text={demoCode} label="Copy code" />
        </div>
      </div>
      <TabsContent value="preview">
        <AIChatDemo />
      </TabsContent>
      <TabsContent value="usage" className="flex flex-col gap-7">
        <section>
          <h2 className="mb-3 text-sm font-medium">
            One install. The complete pack.
          </h2>
          <p className="mb-4 max-w-2xl text-xs leading-6 text-muted-foreground">
            For React 19 and Tailwind CSS 4 projects with shadcn’s Base UI
            preset configured. The command installs the chat, agent blocks,
            recording hook, demo adapter, styles, and required dependencies as
            editable source.
          </p>
          <CodeBlock code={install} language="bash" />
        </section>
        <section>
          <h2 className="mb-3 text-sm font-medium">
            Start with the working frontend
          </h2>
          <CodeBlock code={demoCode} language="tsx" />
          <p className="mt-3 text-xs leading-6 text-muted-foreground">
            The included demo runs entirely in your browser. It sends no files
            or recordings to a service. Replace its adapter when you connect
            your own backend.
          </p>
        </section>
        <section>
          <h2 className="mb-3 text-sm font-medium">Connect your application</h2>
          <p className="mb-3 text-xs leading-6 text-muted-foreground">
            Your application owns messages and status. Stream updates into that
            state and wire stop, retry, approval, and feedback callbacks to your
            backend. The example below shows the adapter boundary; inspect the
            included demo adapter for a complete local implementation.
          </p>
          <CodeBlock code={integrationCode} language="tsx" />
        </section>
        <section className="rounded-xl border border-border/60 p-5 text-xs leading-6 text-muted-foreground">
          <h2 className="mb-2 font-medium text-foreground">
            What ships together
          </h2>
          <p>
            Conversation, composer, messages, Markdown, citations, sources,
            loaders, avatars, response versions, tools, activity summaries,
            tasks, approvals, diffs, artifacts, context usage, and audio
            recording. One entry point: <code>AIChat</code>.
          </p>
          <p className="mt-3">
            Models and context counts come from your application. Attachments
            remain local until your submission callback handles them. Microphone
            access requires HTTPS or localhost. The pack inherits your font and
            theme; it does not replace your app’s design tokens.
          </p>
        </section>
      </TabsContent>
    </Tabs>
  )
}
