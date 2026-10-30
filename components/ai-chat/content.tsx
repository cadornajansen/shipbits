"use client"

import { memo, useEffect, useState, type ReactElement } from "react"
import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { ExternalLink, Globe, ChevronRight } from "lucide-react"
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverTitle,
  PopoverDescription,
} from "../ui/popover"
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "../ui/collapsible"
import { Button } from "../ui/button"
import { CopyAction } from "./atoms"
import type { ChatSource } from "./types"
import type { ThemedToken } from "shiki"

export const CodeBlock = memo(function CodeBlock({
  code,
  language = "text",
}: {
  code: string
  language?: string
}): ReactElement {
  const [tokens, setTokens] = useState<{
    code: string
    lines: ThemedToken[][]
  } | null>(null)
  useEffect(() => {
    let current = true
    void import("./highlight")
      .then(({ highlight }) => highlight(code, language))
      .then((lines) => {
        if (current) setTokens({ code, lines })
      })
      .catch(() => {})
    return () => {
      current = false
    }
  }, [code, language])
  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-[#121417] text-[#d9dce2] [&_button]:text-[#9b9faa]">
      <div className="flex items-center justify-between border-b border-white/8 px-3 py-1.5 text-[10px] text-white/45">
        <span>{language}</span>
        <CopyAction text={code} compact label="Copy code block" />
      </div>
      <pre className="max-h-80 overflow-auto p-3 text-xs leading-6">
        <code>
          {tokens?.code === code
            ? tokens.lines.map((line, index) => (
                <span key={index} className="block min-h-6">
                  {line.map((token, tokenIndex) => (
                    <span key={tokenIndex} style={{ color: token.color }}>
                      {token.content}
                    </span>
                  ))}
                </span>
              ))
            : code}
        </code>
      </pre>
    </div>
  )
})

export function safeLink(url: string): string | undefined {
  try {
    const parsed = new URL(url)
    return ["https:", "http:"].includes(parsed.protocol)
      ? parsed.href
      : undefined
  } catch {
    return undefined
  }
}

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return "Source"
  }
}

export function Citation({
  source,
  index,
}: {
  source: ChatSource
  index: number
}): ReactElement {
  const href = safeLink(source.url)
  return (
    <Popover>
      <PopoverTrigger
        aria-label={`Source ${index}: ${source.title}`}
        className="mx-0.5 inline-flex h-[15px] min-w-[15px] items-center justify-center rounded-[5px] border border-border bg-muted px-[3px] align-super text-[9px] leading-none text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        {index}
      </PopoverTrigger>
      <PopoverContent
        className="max-w-[calc(100vw-2rem)] motion-reduce:animate-none! motion-reduce:transition-none! motion-reduce:[&_*]:animate-none! motion-reduce:[&_*]:scroll-auto! motion-reduce:[&_*]:transition-none! motion-reduce:[&_*::before]:animate-none! motion-reduce:[&_*::before]:transition-none!"
        sideOffset={8}
      >
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <Globe className="size-3" aria-hidden="true" />
          {hostname(source.url)}
        </div>
        <PopoverTitle className="mt-2 text-sm">{source.title}</PopoverTitle>
        {source.description && (
          <PopoverDescription className="mt-2 text-xs leading-relaxed">
            {source.description}
          </PopoverDescription>
        )}
        {href && (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-2 rounded-sm text-xs underline underline-offset-4 focus-visible:outline-2"
          >
            Open source
            <ExternalLink className="size-3" aria-hidden="true" />
          </a>
        )}
      </PopoverContent>
    </Popover>
  )
}

export const RichText = memo(function RichText({
  text,
  sources = [],
}: {
  text: string
  sources?: ChatSource[]
}): ReactElement {
  return (
    <div className="text-[13px] leading-[1.85] [overflow-wrap:anywhere] [&_:not(pre)>code]:rounded [&_:not(pre)>code]:border [&_:not(pre)>code]:border-border [&_:not(pre)>code]:bg-muted [&_:not(pre)>code]:px-1 [&_:not(pre)>code]:py-px [&_:not(pre)>code]:text-[.85em] [&_a]:underline [&_a]:underline-offset-[3px] [&_a]:focus-visible:outline-2 [&_a]:focus-visible:outline-offset-3 [&_a]:focus-visible:outline-ring [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground [&_h1]:text-[1.1em] [&_h1]:font-[550] [&_h1]:tracking-[-.02em] [&_h2]:text-[1.1em] [&_h2]:font-[550] [&_h2]:tracking-[-.02em] [&_h3]:text-[1.1em] [&_h3]:font-[550] [&_h3]:tracking-[-.02em] [&_li+li]:mt-[5px] [&_ol]:list-decimal [&_ol]:pl-5 [&_strong]:font-[550] [&_table]:block [&_table]:max-w-full [&_table]:border-collapse [&_table]:overflow-x-auto [&_table]:text-xs [&_td]:border-b [&_td]:border-border [&_td]:px-3 [&_td]:py-2 [&_td]:text-left [&_th]:border-b [&_th]:border-border [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_ul]:list-disc [&_ul]:pl-5 [&>*+*]:mt-3">
      <Markdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        components={{
          pre: ({ children }) => <>{children}</>,
          code: ({ children, className }) => {
            const content = String(children).replace(/\n$/, "")
            const language = /language-([\w-]+)/.exec(className ?? "")?.[1]
            return language || content.includes("\n") ? (
              <CodeBlock code={content} language={language} />
            ) : (
              <code>{children}</code>
            )
          },
          a: ({ href, children }) => {
            const source = sources.find((item) => href === `#source-${item.id}`)
            return source ? (
              <Citation source={source} index={sources.indexOf(source) + 1} />
            ) : (
              <a href={href} target="_blank" rel="noreferrer">
                {children}
              </a>
            )
          },
        }}
      >
        {text}
      </Markdown>
    </div>
  )
})

export function Sources({ sources }: { sources: ChatSource[] }): ReactElement {
  return (
    <Collapsible className="">
      <CollapsibleTrigger
        render={<Button variant="ghost" size="sm" />}
        className="group gap-2"
      >
        <span className="flex -space-x-1" aria-hidden="true">
          {sources.slice(0, 3).map((source, index) => (
            <span
              key={source.id}
              className="flex size-4 items-center justify-center rounded-full border border-background bg-muted text-[8px]"
            >
              {index + 1}
            </span>
          ))}
        </span>
        {sources.length} sources
        <ChevronRight
          className="transition-transform group-data-open:rotate-90 motion-reduce:transition-none"
          data-icon="inline-end"
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="h-[var(--collapsible-panel-height)] overflow-hidden transition-[height,opacity] duration-200 motion-reduce:transition-none data-closed:h-0 data-closed:opacity-0">
        <ul className="flex flex-col gap-3 pt-3">
          {sources.map((source, index) => (
            <li key={source.id} className="flex items-start gap-3 text-xs">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-md border border-border text-[10px] text-muted-foreground">
                {index + 1}
              </span>
              <div>
                <a
                  className="rounded-sm font-medium hover:underline focus-visible:outline-2"
                  href={safeLink(source.url)}
                  target="_blank"
                  rel="noreferrer"
                >
                  {source.title}
                </a>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {hostname(source.url)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  )
}
