import type { Metadata } from "next"
import Link from "next/link"
import type { ReactElement } from "react"
import { CollectionSidebar } from "@/components/collection-sidebar"
import { site } from "@/lib/site"

export const metadata: Metadata = {
  title: "How to use — Shipbits",
  description:
    "Preview a component, tune a material in Studio, and bring the source into your project.",
}

export default function HowToUsePage(): ReactElement {
  return (
    <div className="mx-auto grid w-full max-w-[1240px] grid-cols-[200px_minmax(0,1fr)] items-start gap-x-14 px-3 pt-8 pb-24 max-[900px]:grid-cols-1 max-[900px]:gap-y-6 max-[900px]:pt-4 sm:px-6">
      <CollectionSidebar />
      <main
        id="main-content"
        className="relative max-w-[686px] min-w-0 text-base leading-[25px] outline-none [&_a:not([class])]:underline [&_a:not([class])]:underline-offset-[3px] [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:text-lg [&_h2]:leading-[25px] [&_h2]:font-medium [&_section_p]:text-[#c5c5c5] [&_section+section]:mt-8 [&>p]:mt-4 [&>p]:text-[#c5c5c5]"
        tabIndex={-1}
      >
        <h1 className="font-heading text-[36px] leading-[42px] font-medium tracking-[-.18px] text-white max-sm:text-[32px] max-sm:leading-[38px]">
          How to use
        </h1>
        <p>From a working preview to your own interface.</p>
        <section>
          <h2>Find your component</h2>
          <p>
            Start with the <Link href="/#experiments">collection</Link>. Open a
            component to see its live Preview. Use the sidebar or previous and
            next arrows to explore the working entries.
          </p>
        </section>
        <section>
          <h2>Check the Install tab</h2>
          <p>
            Each component explains its actual setup.{" "}
            <Link href="/components/ai-chat">AI Chat</Link> has a shadcn
            registry command that installs editable source and dependencies.
            Materials and Glass folder currently use source files from this
            project; copy the listed files and keep their imports together. Mono
            icons can be copied as React source or downloaded as plain SVGs.
          </p>
        </section>
        <section>
          <h2>Copy a prompt for your agent</h2>
          <p>
            Copy prompt includes the component’s requirements, source-file list
            or registry command, and usage example. Paste it into your coding
            agent. For source-copy components, give the agent access to the{" "}
            <a href={site.repository}>Shipbits repository</a>. Copy the listed
            files, their imports, and license notices. These components do not
            have separate npm packages. Mono icons also provides plain SVG
            files.
          </p>
        </section>
        <section>
          <h2>Tune a material in Studio</h2>
          <p>
            Choose Tune in Studio on a material page, or open{" "}
            <Link href="/studio">Studio</Link> to pick an editor. Start with a
            preset, adjust the controls, and watch the preview update. Reset
            returns to the default settings. Preview backgrounds help you
            inspect the result.
          </p>
        </section>
        <section>
          <h2>Bring your settings with you</h2>
          <p>
            Use Copy code in the editor. The generated snippet includes your
            current settings and the component import. The Code view also lets
            you select the text manually if clipboard access is unavailable.
            Install the source dependencies first, then paste the example into
            your project.
          </p>
        </section>
        <section>
          <h2>Keep the behavior accessible</h2>
          <p>
            Test your integration with a keyboard and reduced motion enabled.
            Keep visible focus states, labels, and fallbacks. AI Chat’s included
            demo runs locally; connecting a real model or storing files requires
            your own backend.
          </p>
        </section>
        <section>
          <h2>What is ready?</h2>
          <p>
            Every catalog entry and the Studio editors work without an account.
            Other product and account destinations are clearly marked as
            planned. They do not submit forms, create accounts, or take
            payments.
          </p>
        </section>
      </main>
    </div>
  )
}
