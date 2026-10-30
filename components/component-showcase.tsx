"use client"

import Link from "next/link"
import {
  useRef,
  useState,
  useSyncExternalStore,
  type ReactElement,
  type KeyboardEvent,
} from "react"
import { WandSparkles } from "lucide-react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { CopyButton } from "@/components/copy-button"
import { GlassLink } from "@/components/ui/glass-link"
import { ComponentArtwork } from "@/components/component-artwork"
import { GlassFolderExamples } from "@/components/glass-folder-examples"
import { AIChatDemo } from "@/components/ai-chat/demo"
import { MonoIconsGallery } from "@/components/mono-icons-gallery"
import { ThinkingOrbsExamples } from "@/components/thinking-orbs-examples"
import { CollectionExample } from "@/components/collection-examples"
import { isCollectionId } from "@/lib/collection-additions"
import type { CatalogEntry } from "@/lib/catalog"
import { monoIcons } from "@/lib/mono-icons"
import { site } from "@/lib/site"

const subscribeOrigin = (): (() => void) => () => {}

function CodeSample({
  text,
  label,
}: {
  text: string
  label: string
}): ReactElement {
  return (
    <div className="relative rounded-[10px] bg-[#202020] shadow-[inset_0_0_0_1px_rgb(255_255_255/.02)] [&_pre]:overflow-x-auto [&_pre]:rounded-[inherit] [&_pre]:py-3 [&_pre]:pr-11 [&_pre]:pl-3 [&_pre]:font-mono [&_pre]:text-[13px] [&_pre]:leading-[22px] [&_pre]:focus-visible:outline-2 [&_pre]:focus-visible:outline-offset-2 [&_pre]:focus-visible:outline-[#888]">
      <pre tabIndex={0} aria-label={label}>
        <code>{text}</code>
      </pre>
      <CopyButton text={text} label={`Copy ${label.toLowerCase()}`} iconOnly />
    </div>
  )
}

export function ComponentShowcase({
  entry,
}: {
  entry: CatalogEntry
}): ReactElement {
  const [view, setView] = useState<"preview" | "install">("preview")
  const reduceMotion = useReducedMotion()
  const tabs = useRef<HTMLDivElement>(null)
  const origin = useSyncExternalStore(
    subscribeOrigin,
    () => window.location.origin,
    () => ""
  )
  const installation = entry.installation
  const setup =
    installation.kind === "registry"
      ? `pnpm dlx shadcn@latest add ${origin || "<your-shipbits-origin>"}${installation.path}`
      : `${installation.command ? `${installation.command}\n\n` : ""}Copy these files from ${site.repository}:\n\n${installation.files.join("\n")}`
  const prompt = `Add Shipbits' ${entry.title} to my ${entry.id === "mono-icons" ? "project as static SVGs, using the React wrapper only if needed" : "React project"}.\n\nReference: ${origin || "<your-shipbits-origin>"}${entry.href}\n${entry.description}\n\n${installation.requirements}\n\n${setup}\n\nUsage:\n${installation.usage}\n\nPreserve keyboard accessibility and reduced-motion support. ${entry.id === "mono-icons" ? `Download the individual SVGs from the Preview gallery. Preserve their paths, masks, and layers. Keep downloads static; use the optional AnimatedMonoIcon source for individual-part animations on all ${monoIcons.length} icons.` : installation.kind === "source" ? "Use the files from this project; do not invent an npm package. Ask for the source if it is unavailable." : "Use the registry's actual component exports."}`

  function navigateTabs(event: KeyboardEvent<HTMLDivElement>): void {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return
    event.preventDefault()
    const next =
      event.key === "Home"
        ? "preview"
        : event.key === "End"
          ? "install"
          : view === "preview"
            ? "install"
            : "preview"
    setView(next)
    tabs.current
      ?.querySelector<HTMLButtonElement>(`[data-view="${next}"]`)
      ?.focus()
  }

  return (
    <>
      <div className="mt-6 mb-[18px] flex flex-wrap items-center justify-between gap-4 max-sm:items-start">
        <div
          ref={tabs}
          role="tablist"
          aria-label="View"
          className="inline-flex h-9 items-center gap-[3px] rounded-[48px] p-[3px] [&_button]:h-[30px] [&_button]:rounded-[36px] [&_button]:px-3 [&_button]:text-[13px] [&_button]:font-medium [&_button]:text-[#969696] [&_button]:transition-colors [&_button]:duration-250 [&_button]:ease-[cubic-bezier(.22,1,.36,1)] [&_button]:focus-visible:outline-2 [&_button]:focus-visible:-outline-offset-2 [&_button]:focus-visible:outline-[#ededed] [&_button]:motion-reduce:transition-none [&_button[aria-selected=true]]:bg-[#303030] [&_button[aria-selected=true]]:text-[#ededed]"
          onKeyDown={navigateTabs}
        >
          {(["preview", "install"] as const).map((tab) => (
            <button
              key={tab}
              id={`${entry.id}-tab-${tab}`}
              role="tab"
              type="button"
              data-view={tab}
              aria-selected={view === tab}
              aria-controls={`${entry.id}-${tab}`}
              tabIndex={view === tab ? 0 : -1}
              onClick={() => setView(tab)}
            >
              {tab === "preview" ? "Preview" : "Install"}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2 max-sm:w-full">
          <span className="mr-3 text-[13px] font-medium max-sm:mb-1 max-sm:w-full">
            {entry.id === "mono-icons" ? "SVG" : "React"}
          </span>
          {entry.studio && (
            <Link
              className="relative inline-flex h-8 items-center justify-center gap-2 rounded-3xl border-0 bg-[#232323] bg-[radial-gradient(ellipse_at_20%_0%,#30403d55,transparent_60%),radial-gradient(ellipse_at_100%_80%,#5c375a66,transparent_60%)] px-3 text-[13px] leading-[13px] font-medium whitespace-nowrap text-white shadow-(--site-ring) transition-colors duration-150 hover:bg-[#303030] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#ededed] active:bg-[#262626] motion-reduce:transition-none"
              href={entry.studio}
            >
              <WandSparkles size={16} />
              Tune in Studio
            </Link>
          )}
          <CopyButton key={entry.id} text={prompt} label="Copy prompt" />
        </div>
      </div>
      <AnimatePresence mode="wait" initial={false}>
        {view === "preview" ? (
          <motion.div
            key="preview"
            role="tabpanel"
            id={`${entry.id}-preview`}
            aria-labelledby={`${entry.id}-tab-preview`}
            initial={{ opacity: 0, y: reduceMotion ? 0 : 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{
              opacity: 0,
              y: reduceMotion ? 0 : -4,
              transition: { duration: reduceMotion ? 0 : 0.12 },
            }}
            transition={{
              duration: reduceMotion ? 0 : 0.18,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {isCollectionId(entry.id) ? (
              <CollectionExample id={entry.id} />
            ) : entry.id === "mono-icons" ? (
              <MonoIconsGallery />
            ) : entry.id === "thinking-orbs" ? (
              <ThinkingOrbsExamples />
            ) : entry.id === "ai-chat" ? (
              <AIChatDemo />
            ) : entry.id === "glass-folder" ? (
              <GlassFolderExamples showToolbar={false} />
            ) : (
              <div
                className="relative flex h-[370px] items-center justify-center overflow-hidden rounded-[20px] bg-[#171717] max-sm:h-[320px] [&>[data-liquid-metal]]:max-w-full [&>[data-material]]:max-w-full"
                aria-label={`${entry.title} preview`}
              >
                {entry.id === "glass" ? (
                  <GlassLink
                    href="/studio/glass"
                    className="h-[60px] w-[210px] text-lg font-normal"
                  >
                    Browse
                  </GlassLink>
                ) : (
                  <ComponentArtwork id={entry.preview} />
                )}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="install"
            role="tabpanel"
            id={`${entry.id}-install`}
            aria-labelledby={`${entry.id}-tab-install`}
            initial={{ opacity: 0, y: reduceMotion ? 0 : 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{
              opacity: 0,
              y: reduceMotion ? 0 : -4,
              transition: { duration: reduceMotion ? 0 : 0.12 },
            }}
            transition={{
              duration: reduceMotion ? 0 : 0.18,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="rounded-[20px] bg-[#171717] p-5 text-sm leading-[22px] max-sm:p-4 [&_a]:text-[#ededed] [&_a]:underline [&_a]:underline-offset-[3px] [&_h2]:mb-2 [&_h2]:text-[13px] [&_h2]:leading-[18px] [&_h2]:font-medium [&_p]:mt-2 [&_p]:mb-3 [&_p]:text-[13px] [&_p]:leading-[21px] [&_p]:text-[#cacaca]/70 [&_section+section]:mt-4 [&[hidden]]:hidden"
          >
            <section>
              <h2>Installation</h2>
              <p>{installation.requirements}</p>
              {entry.id === "mono-icons" ? (
                <p>
                  Download any SVG from Preview to use it in any framework. For
                  inline React SVGs with editable layers, copy the two source
                  files below. No icon package or animation dependency is
                  needed.
                </p>
              ) : (
                installation.kind === "source" && (
                  <p>
                    Copy the listed files from the{" "}
                    <a
                      href={site.repository}
                      className="underline underline-offset-3"
                    >
                      Shipbits repository
                    </a>
                    , together with their imports, before using the example.
                    Keep the applicable license notices with your copy.
                  </p>
                )
              )}
              <CodeSample
                text={setup}
                label={
                  installation.kind === "registry"
                    ? "Install command"
                    : "Source files"
                }
              />
            </section>
            <section>
              <h2>Usage</h2>
              <CodeSample text={installation.usage} label="Usage example" />
            </section>
            {entry.id === "mono-icons" && (
              <section>
                <h2>Optional React animation</h2>
                <p>
                  MonoIcon and the SVG downloads stay static. For animated React
                  versions of all {monoIcons.length} icons, install Motion and
                  copy these three additional files alongside the static sources
                  above.
                </p>
                <CodeSample
                  text={
                    "pnpm add motion\n\ncomponents/ui/animated-mono-icon.tsx\nlib/mono-icon-playback.ts\nlib/mono-icon-motion.ts"
                  }
                  label="Optional animation setup"
                />
                <p>
                  Mark the enclosing button or link as the trigger and its
                  preview area as the visibility target. It plays once when half
                  visible, then on hover or keyboard focus. Reduced motion keeps
                  it static. Home holds its depth reveal until interaction ends;
                  every other icon completes one cycle and returns to rest.
                </p>
                <CodeSample
                  text={
                    'import { AnimatedMonoIcon } from "@/components/ui/animated-mono-icon"\n\nexport function Example() {\n  return (\n    <button type="button" aria-label="Home" data-mono-icon-trigger>\n      <span data-mono-icon-preview className="flex p-4">\n        <AnimatedMonoIcon name="home" width={48} height={48} />\n      </span>\n    </button>\n  )\n}'
                  }
                  label="Animated React example"
                />
              </section>
            )}
            {entry.studio && (
              <p>
                For custom settings, open{" "}
                <Link href={entry.studio}>Studio</Link> and copy the generated
                code.
              </p>
            )}
            {entry.id === "ai-chat" && (
              <p>
                The demo uses a local adapter. Your application owns messages
                and status; wire AIChat’s submit, stop, retry, approval,
                feedback, and version callbacks to your own backend. No AI
                service is included.
              </p>
            )}
            {entry.id === "thinking-orbs" && (
              <section>
                <h2>States and controls</h2>
                <p>
                  Choose base, working, reasoning, searching, background,
                  retrying, compacting, waiting, or orchestrating. Working adds
                  gyro; Reasoning adds twins; Searching adds lighthouse;
                  Background adds spiral; Retrying adds surge; Compacting adds
                  squeeze and fuse. Variant defaults to default.
                </p>
                <p>
                  Orchestrating gives every dot its own identity, timing, and
                  curved route. The particles explore, gather into four groups,
                  pass pulses through them, and return to the sphere. Its motion
                  is deterministic choreography, with no AI service required.
                </p>
                <p>
                  Idle, thinking, streaming, and error remain supported. Size
                  accepts sm (20px), md (32px), or lg (64px, the default). Speed
                  defaults to 1; paused is a programmatic prop. Idle settles
                  after settleMs (5000ms by default), and error stays still.
                </p>
                <p>
                  Tune in Studio opens the separate editor with presets,
                  badge/inline/orb layouts, and controls for speed, density
                  (0.5–1.5), dotSize (0.6–1.6), and tilt (−30° to 60°). Density
                  changes particle count; dotSize changes each dot’s radius;
                  tilt changes the globe’s camera angle. Copy code exports the
                  selected props and layout.
                </p>
                <p>
                  Each orb has an accessible state label. Override it with
                  label, or use decorative when nearby text already describes
                  it. Reduced motion produces a still frame. The wrapper keeps
                  its size during server rendering and hydration.
                </p>
                <p>
                  The custom particle frames are Shipbits source. Canvas
                  rendering, offscreen pausing, and background-tab handling come
                  from{" "}
                  <a href="https://github.com/Jakubantalik/thinking-orbs">
                    thinking-orbs
                  </a>
                  , MIT © Jakub Antalik. This is a source-copy component, with
                  no standalone Shipbits npm package or AI service.
                </p>
              </section>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
