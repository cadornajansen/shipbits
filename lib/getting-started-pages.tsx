import Link from "next/link"
import type { InformationPage } from "@/lib/information-pages"
import { site } from "@/lib/site"

export const gettingStartedPages: readonly InformationPage[] = [
  {
    slug: "introduction",
    title: "Introduction",
    description: "Small, carefully made pieces for interfaces worth shipping.",
    sections: [
      {
        title: "Explore a working collection",
        content: (
          <p>
            Shipbits brings together material effects, AI interface components,
            everyday controls, and animated Mono icons. Open any entry from the
            sidebar to try its Preview, then check Install for its source files
            and dependencies. The <Link href="/#experiments">homepage</Link>{" "}
            features a selection of the collection.
          </p>
        ),
      },
      {
        title: "Make it yours",
        content: (
          <p>
            The components are editable source. Use{" "}
            <Link href="/studio">Studio</Link> to tune materials and Thinking
            orbs, then copy the settings into your project. Other components can
            be customized directly in their React or SVG source. No account is
            required to explore or use the editors.
          </p>
        ),
      },
      {
        title: "Keep the useful details",
        content: (
          <p>
            Preserve keyboard controls, visible focus, meaningful labels, and
            reduced-motion behavior when adapting a component. These examples
            show interface behavior; AI responses, uploads, and assignments in
            the demos are local demonstrations. Start with{" "}
            <Link href="/installation">Installation</Link> and review the{" "}
            <a href={`${site.repository}/blob/main/THIRD_PARTY_NOTICES.md`}>
              source notices
            </a>{" "}
            before reusing an entry.
          </p>
        ),
      },
    ],
  },
  {
    slug: "installation",
    title: "Installation",
    description: "Bring the component source into your own project.",
    sections: [
      {
        title: "Check your project",
        content: (
          <p>
            React components use React 19 and Tailwind CSS 4. The source is
            TypeScript and uses the <code>@/</code> import alias. Follow each
            component’s Install tab for its dependencies, shared theme tokens,
            and supporting files. AI Chat also expects shadcn’s Base UI preset.
            Standalone Mono SVGs need no framework.
          </p>
        ),
      },
      {
        title: "Install AI Chat from the registry",
        content: (
          <p>
            Open <Link href="/components/ai-chat">AI Chat</Link> and select
            Install to copy its shadcn command. The registry lives at{" "}
            <a href={`${site.url}/r/ai-chat.json`}>{site.url}/r/ai-chat.json</a>
            . It installs editable component files and dependencies. The bundled
            demo uses local sample data; connect your own backend for real model
            responses or file storage.
          </p>
        ),
      },
      {
        title: "Copy other components from source",
        content: (
          <p>
            Open the <a href={site.repository}>Shipbits repository</a> and copy
            the files listed in the component’s Install tab, keeping their
            imports and license notices together. Install the listed packages,
            then use the supplied example. There is no general Shipbits npm
            package. <Link href="/icons/mono-icons">Mono icons</Link> also
            offers direct downloads of the static SVGs.
          </p>
        ),
      },
      {
        title: "Apply your settings",
        content: (
          <p>
            A <Link href="/studio">Studio</Link> export contains the component
            import and your chosen settings, not all of its implementation.
            Install its source first, then paste the generated usage code. See{" "}
            <Link href="/how-to-use">How to use</Link> for the complete flow or{" "}
            <Link href="/support">Support</Link> if an import or style is
            missing.
          </p>
        ),
      },
    ],
  },
  {
    slug: "accessibility",
    title: "Accessibility",
    description: "Keep the interaction usable as you make it your own.",
    sections: [
      {
        title: "Keyboard and focus",
        content: (
          <p>
            Keep native buttons and links, accessible names, and visible focus
            styles. Try the Preview and Install tabs with the arrow keys, and
            check that dialogs close with Escape and return focus to their
            trigger. Controls such as the Precision dial offer keyboard and
            direct-value input alongside pointer interaction.
          </p>
        ),
      },
      {
        title: "Motion preferences",
        content: (
          <p>
            Animated components check the device’s reduced-motion preference.
            Keep those checks when changing their timing or design, and provide
            a useful static appearance. Some effects also stop outside the
            viewport or in hidden tabs. Important status changes must remain
            understandable without animation.
          </p>
        ),
      },
      {
        title: "Labels and visual alternatives",
        content: (
          <p>
            Give standalone icons and controls a meaningful accessible name;
            mark decorative artwork as decorative when adjacent text already
            explains it. Preserve status announcements and fallbacks. Check
            contrast after recoloring a component, and do not rely on color,
            sound, or hover alone to communicate an action.
          </p>
        ),
      },
      {
        title: "Test your integration",
        content: (
          <p>
            Test keyboard navigation, a screen reader, increased text size,
            reduced motion, and a narrow touch screen in your own product.
            Accessibility depends on the surrounding interface and content; this
            collection is not a certification of your implementation. If you
            find a barrier in a Shipbits example, please{" "}
            <a href={`${site.issues}/new`}>report the component and steps</a> so
            it can be investigated.
          </p>
        ),
      },
    ],
  },
  {
    slug: "skill",
    title: "Skill",
    description: "Give your coding agent the right source and a clear task.",
    sections: [
      {
        title: "Start with Copy prompt",
        content: (
          <p>
            Choose a component and use Copy prompt. It includes the reference
            page, actual dependencies, source-file list or registry command, and
            a usage example. Paste it into your coding agent alongside the page
            or feature you want to build.
          </p>
        ),
      },
      {
        title: "Provide the source",
        content: (
          <p>
            Give the agent access to the{" "}
            <a href={site.repository}>Shipbits repository</a> and your project.
            Ask it to inspect your existing components, theme, and imports
            before editing. For a source-copy entry, copy the listed files and
            their dependencies; do not substitute an invented npm package. For
            AI Chat, use the registry command in its Install tab.
          </p>
        ),
      },
      {
        title: "Keep the request focused",
        content: (
          <p>
            Specify the component, its location in your interface, the data it
            receives, and what each action should do. Include any Studio export
            with your preferred settings. Ask the agent to preserve the
            component’s accessible labels, keyboard behavior, reduced-motion
            support, and license notices, then verify the interaction in your
            app.
          </p>
        ),
      },
      {
        title: "A guide, not an agent installer",
        content: (
          <p>
            This page explains the source-and-prompt workflow. Shipbits does not
            currently publish a downloadable agent skill or an MCP integration.
            You can follow the same steps manually using{" "}
            <Link href="/installation">Installation</Link> and{" "}
            <Link href="/how-to-use">How to use</Link>.
          </p>
        ),
      },
    ],
  },
]
