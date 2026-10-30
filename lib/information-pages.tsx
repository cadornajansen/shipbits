import Link from "next/link"
import type { ReactNode } from "react"
import { site } from "@/lib/site"
import { gettingStartedPages } from "@/lib/getting-started-pages"

type InformationSection = { title: string; content: ReactNode }
export type InformationPage = {
  slug: string
  title: string
  description: string
  updated?: string
  sections: readonly InformationSection[]
}

function ContactLink(): ReactNode {
  return site.contactEmail ? (
    <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>
  ) : (
    <a href={site.profile}>Jansen Cadorna on GitHub</a>
  )
}

export const informationPages: readonly InformationPage[] = [
  ...gettingStartedPages,
  {
    slug: "contact",
    title: "Contact",
    description:
      "A small collection, made by a person. Here’s how to reach me.",
    sections: [
      {
        title: "Say hello",
        content: (
          <p>
            I’m {site.owner}, the maker of Shipbits. For questions about the
            project, collaborations, or a component you would like to see, reach
            me through <ContactLink />.
          </p>
        ),
      },
      {
        title: "Report a bug or request a component",
        content: (
          <p>
            Open an <a href={site.issues}>issue in the Shipbits repository</a>.
            Include the component, what you expected, and what happened.
            Screenshots and a small reproduction help. GitHub issues are public;
            leave out private files, credentials, and personal information.
          </p>
        ),
      },
      {
        title: "Find an answer",
        content: (
          <p>
            The <Link href="/how-to-use">usage guide</Link> covers setup, source
            files, and Studio. For common problems, start with{" "}
            <Link href="/support">Support</Link>. This is an independently
            maintained project, so response times can vary.
          </p>
        ),
      },
    ],
  },
  {
    slug: "support",
    title: "Support",
    description:
      "Help getting a component from the collection into your project.",
    sections: [
      {
        title: "Start with the Install tab",
        content: (
          <p>
            Every component lists its files, dependencies, and an example. AI
            Chat has a shadcn registry command; other components use editable
            source from <a href={site.repository}>GitHub</a>. Mono icons also
            provides individual SVG downloads. There is no separate Shipbits npm
            package.
          </p>
        ),
      },
      {
        title: "Styles or imports look wrong",
        content: (
          <p>
            Use React 19, TypeScript, and Tailwind CSS 4. Copy the listed
            dependencies together, configure the <code>@/</code> import alias,
            and include the shared tokens in <code>app/globals.css</code>. The
            Install tab lists any additional packages. See{" "}
            <Link href="/how-to-use">How to use</Link> for the full flow.
          </p>
        ),
      },
      {
        title: "Motion or materials are still",
        content: (
          <p>
            Animations respect your device’s reduced-motion preference and may
            stop outside the viewport or in a hidden tab. Live materials need
            WebGL support; a fallback can appear when it is unavailable. Try a
            current browser with hardware acceleration enabled.
          </p>
        ),
      },
      {
        title: "Clipboard, microphone, and files",
        content: (
          <p>
            Clipboard and microphone features need a secure context (HTTPS or
            localhost) and browser permission. If copying is blocked, select the
            code manually. Microphone recordings and selected files in the demos
            stay in your browser; upload and AI responses are demonstrations,
            not connected services.
          </p>
        ),
      },
      {
        title: "Still stuck?",
        content: (
          <p>
            <a href={`${site.issues}/new`}>Report an issue</a> with your
            browser, component URL, dependency versions, and a minimal
            reproduction. Remove personal data and secrets first. Support is
            community-based, with no guaranteed response time.
          </p>
        ),
      },
      {
        title: "Support the project",
        content: site.coffeeUrl ? (
          <p>
            If Shipbits helped you ship something, you can{" "}
            <a href={site.coffeeUrl}>buy me a coffee</a>. Contributions are
            optional; every preview and Studio editor remains available without
            payment.
          </p>
        ) : (
          <p>
            You can support Shipbits by{" "}
            <a href={site.repository}>starring the repository</a>, reporting a
            useful bug, or sharing what you built.
          </p>
        ),
      },
    ],
  },
  {
    slug: "privacy",
    title: "Privacy",
    description: "What happens to your information when you use Shipbits.",
    updated: "October 30, 2026",
    sections: [
      {
        title: "Who runs this site",
        content: (
          <p>
            Shipbits is maintained by {site.owner}. This notice covers the
            Shipbits website and its interactive demonstrations. It does not
            cover websites you open through external links or applications you
            build with the source.
          </p>
        ),
      },
      {
        title: "Browser-only demonstrations",
        content: (
          <p>
            Chat messages, selected files, image previews, editor settings, and
            local assignments are held in browser memory. Shipbits does not
            upload this content to a server or send it to an AI provider.
            Reloading the page clears this temporary demo state. A file you
            explicitly download remains on your device until you delete it.
          </p>
        ),
      },
      {
        title: "Microphone and clipboard",
        content: (
          <p>
            The AI Chat demo requests microphone access only when you start
            recording. It creates a local audio attachment and releases the
            microphone when recording ends or the recorder closes. Shipbits does
            not transmit the recording. Copy actions write the selected code or
            prompt to your clipboard after you choose them; the site does not
            read your clipboard.
          </p>
        ),
      },
      {
        title: "Cookies, tracking, and hosting",
        content: (
          <p>
            The application does not set cookies, store preferences in local
            storage, or include advertising or analytics trackers. Hosting and
            network providers necessarily receive request information such as
            your IP address, requested URL, browser information, and request
            time to deliver and secure the site. Their operational logging and
            retention depend on the hosting service. Fonts and preview assets
            are served with the site.
          </p>
        ),
      },
      {
        title: "When you contact me",
        content: (
          <p>
            If you email me or open a GitHub issue, I receive the information
            you choose to share to respond and maintain the project. GitHub
            issues are public and subject to{" "}
            <a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement">
              GitHub’s privacy statement
            </a>
            . Keep sensitive information out of public issues. Correspondence
            may be retained for follow-up and resolving the reported problem.
          </p>
        ),
      },
      {
        title: "Your choices",
        content: (
          <p>
            You can revoke microphone permission in your browser, reload to
            clear temporary demo data, and choose not to use external services.
            To ask about information you shared directly, or request access,
            correction, or deletion where applicable, use <ContactLink />. For a
            private request, use a private contact method listed there rather
            than posting the information in an issue.
          </p>
        ),
      },
      {
        title: "Changes to this notice",
        content: (
          <p>
            This notice will be updated when the site’s data practices change.
            The date above identifies this version. Adding accounts, analytics,
            cloud storage, or a real AI backend would require an updated notice
            before those features are introduced.
          </p>
        ),
      },
    ],
  },
  {
    slug: "terms",
    title: "Terms of use",
    description: "A few clear terms for exploring and using Shipbits.",
    updated: "October 30, 2026",
    sections: [
      {
        title: "The service",
        content: (
          <p>
            Shipbits is a collection of UI components, interactive examples, and
            browser-based editors maintained by {site.owner}. You can explore
            the previews and Studio without an account or payment. The examples
            demonstrate interfaces; they do not provide a hosted AI service,
            file storage, payment processing, or real task execution.
          </p>
        ),
      },
      {
        title: "Source code and third-party work",
        content: (
          <p>
            Original Shipbits code is released under the{" "}
            <a href={`${site.repository}/blob/main/LICENSE`}>MIT license</a>,
            allowing personal and commercial use, modification, and
            redistribution while preserving its copyright and license notice.
            Third-party packages, adapted components, fonts, and other assets
            retain their own licenses; see the repository’s{" "}
            <a href={`${site.repository}/blob/main/THIRD_PARTY_NOTICES.md`}>
              third-party notices
            </a>
            . Shipbits branding is not an endorsement of projects built with the
            components.
          </p>
        ),
      },
      {
        title: "Responsible use",
        content: (
          <p>
            Use the site lawfully. Do not attempt to disrupt the service, bypass
            security controls, or publish other people’s private information in
            support channels. Only use files and content you have the right to
            use. You are responsible for reviewing, testing, and securing any
            code you integrate into your own product.
          </p>
        ),
      },
      {
        title: "Availability and limitations",
        content: (
          <p>
            The website and examples are provided as available, without a
            promise of uninterrupted operation, suitability for a particular
            purpose, or ongoing support. Components may change. To the extent
            permitted by applicable law, the maintainer is not responsible for
            losses arising from use of the site or examples. Nothing here
            excludes rights or liability that the law does not allow to be
            excluded.
          </p>
        ),
      },
      {
        title: "External services and privacy",
        content: (
          <p>
            GitHub and any other linked services have their own terms and
            privacy practices. Read the{" "}
            <Link href="/privacy">Privacy notice</Link> for how this site
            handles demo data and contact information. Optional contributions do
            not purchase a service-level commitment or exclusive access.
          </p>
        ),
      },
      {
        title: "Updates and questions",
        content: (
          <p>
            These terms may be updated as Shipbits evolves. The date above
            identifies the current version; the repository records changes.
            Questions about these terms can be sent through{" "}
            <Link href="/contact">Contact</Link>.
          </p>
        ),
      },
    ],
  },
]

export function getInformationPage(slug: string): InformationPage | undefined {
  return informationPages.find((page) => page.slug === slug)
}
