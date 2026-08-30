import Image from "next/image"
import Link from "next/link"
import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"

import { Separator } from "@/components/ui/separator"
import type { ArticleHeading } from "@/features/blog/content"

export function ArticleBody({ content, headings }: { content: string; headings: ArticleHeading[] }) {
  const headingIds = new Map(headings.map((heading) => [heading.line, heading.id]))

  return (
    <div className="min-w-0 text-base leading-8 text-foreground/90 [&>p]:my-5 [&>ul]:my-5 [&>ul]:list-disc [&>ul]:pl-6 [&>ol]:my-5 [&>ol]:list-decimal [&>ol]:pl-6 [&_li]:my-2 [&_li>ul]:list-disc [&_li>ul]:pl-5 [&_strong]:font-semibold [&_blockquote]:my-6 [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-5 [&_blockquote]:text-muted-foreground [&_pre]:my-6 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-4 [&_pre]:text-sm [&_code]:break-words [&_code]:font-mono [&_code]:text-sm [&_pre_code]:break-normal">
      <Markdown
        skipHtml
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h2 className="mt-10 mb-4 font-outfit text-2xl leading-snug font-semibold tracking-tight">{children}</h2>,
          h2: ({ children, node }) => (
            <h2 id={headingIds.get(node?.position?.start.line ?? 0)} className="mt-10 mb-4 scroll-mt-8 font-outfit text-2xl leading-snug font-semibold tracking-tight">
              {children}
            </h2>
          ),
          h3: ({ children, node }) => (
            <h3 id={headingIds.get(node?.position?.start.line ?? 0)} className="mt-7 mb-3 scroll-mt-8 font-outfit text-xl leading-snug font-semibold">
              {children}
            </h3>
          ),
          a: ({ children, href }) => {
            const className = "break-words font-medium underline decoration-border underline-offset-4 hover:decoration-foreground"
            return href?.startsWith("/") && !href.startsWith("//") ? (
              <Link href={href} className={className}>{children}</Link>
            ) : (
              <a href={href} className={className} rel="noreferrer">{children}</a>
            )
          },
          img: ({ src, alt }) => typeof src === "string" && src ? (
            <Image src={src} alt={alt ?? ""} width={1200} height={675} sizes="(max-width: 768px) 100vw, 720px" className="my-6 h-auto w-full rounded-lg" unoptimized={src.startsWith("https://")} />
          ) : null,
          hr: () => <Separator className="my-8" />,
          table: ({ children }) => <div className="my-6 overflow-x-auto"><table className="w-full text-left text-sm [&_th]:border-b [&_th]:p-3 [&_th]:font-semibold [&_td]:border-b [&_td]:p-3">{children}</table></div>,
        }}
      >
        {content}
      </Markdown>
    </div>
  )
}
