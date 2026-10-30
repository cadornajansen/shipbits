"use client"

import { useState, type ReactElement, type ReactNode } from "react"
import { Check, Copy } from "lucide-react"
import GlassFolder, {
  type FolderFile,
} from "@/components/ui/glass-folder-cards"
import { cn } from "@/lib/utils"

const projectFiles: FolderFile[] = [
  { name: "Cover — final", meta: "PNG · 4.8 MB", art: "ember" },
  { name: "Moodboard", meta: "24 images", art: "dusk" },
  { name: "Brief.pdf", meta: "PDF · 1.2 MB" },
]
const archiveFiles: FolderFile[] = [
  { name: "Lookbook", meta: "38 images", art: "dusk" },
  { name: "Invoices", meta: "12 PDFs" },
  { name: "Stills", meta: "64 images", art: "ember" },
  { name: "Contract.pdf", meta: "PDF · 320 KB" },
]
const studyFiles: FolderFile[] = [
  { name: "Glass study", meta: "Live demo", art: "glacier", href: "/glass" },
  { name: "Liquid metal", meta: "Live demo", art: "ember", href: "/metal" },
  { name: "Foil study", meta: "Live demo", art: "verdant", href: "/foil" },
]

const projectCode = `"use client"

import { useState } from "react"
import GlassFolder, { type FolderFile } from "@/components/ui/glass-folder-cards"

const files: FolderFile[] = ${JSON.stringify(projectFiles, null, 2)}

export default function ProjectFiles() {
  const [selected, setSelected] = useState<string>("")
  return (
    <div className="flex flex-col items-center">
      <GlassFolder
        label="Project files"
        art="aurora"
        files={files}
        onAdd={(current) => ({ name: "Notes " + (current.length + 1), meta: "TXT · New" })}
        onFileSelect={(file) => setSelected(file.name)}
      />
      <p role="status" className="min-h-5 text-xs text-muted-foreground">{selected ? "Selected: " + selected : ""}</p>
    </div>
  )
}`
const archiveCode = `"use client"

import { useState } from "react"
import GlassFolder, { type FolderFile } from "@/components/ui/glass-folder-cards"

const files: FolderFile[] = ${JSON.stringify(archiveFiles, null, 2)}

export default function Archives() {
  const [open, setOpen] = useState<boolean>(false)
  const [version, setVersion] = useState<number>(0)
  const [selected, setSelected] = useState<string>("")
  return (
    <div className="flex flex-col items-center">
      <GlassFolder
        key={version}
        label="Archives"
        art="none"
        action="more"
        labelPlacement="top-left"
        files={files}
        open={open}
        onOpenChange={setOpen}
        onFileSelect={(file) => setSelected(file.name)}
        menu={[{ label: "Reset example", onSelect: () => { setOpen(false); setSelected(""); setVersion((value) => value + 1) } }]}
      />
      <p role="status" className="min-h-5 text-xs text-muted-foreground">{selected ? "Selected: " + selected : ""}</p>
    </div>
  )
}`
const smokedCode = `import GlassFolder, { type FolderFile } from "@/components/ui/glass-folder-cards"

const files: FolderFile[] = ${JSON.stringify(studyFiles, null, 2)}

export default function MaterialStudies() {
  return <GlassFolder label="Material studies" tone="dark" art="ember" seed={11} action="none" files={files} />
}`

function CopyCode({
  code,
  label = "Copy code",
}: {
  code: string
  label?: string
}): ReactElement {
  const [copied, setCopied] = useState<boolean>(false)
  const [failed, setFailed] = useState<boolean>(false)
  async function copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setFailed(false)
    } catch {
      setCopied(false)
      setFailed(true)
    }
  }
  return (
    <div>
      <button
        type="button"
        aria-label={label}
        onClick={() => void copy()}
        className="flex items-center gap-2 rounded-full border border-border/70 bg-foreground/5 px-3 py-1.5 text-xs font-medium focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        {copied ? (
          <Check aria-hidden="true" className="size-3.5" />
        ) : (
          <Copy aria-hidden="true" className="size-3.5" />
        )}
        {copied ? "Copied" : "Copy code"}
      </button>
      <span role="status" className="sr-only">
        {copied ? "Code copied." : ""}
      </span>
      {failed && (
        <label className="mt-3 block text-xs text-muted-foreground">
          Select and copy the code
          <textarea
            aria-label={`${label} manually`}
            readOnly
            value={code}
            onFocus={(event) => event.currentTarget.select()}
            className="mt-2 h-32 w-full rounded-lg border bg-background p-3 font-mono text-xs"
          />
        </label>
      )}
    </div>
  )
}

function Example({
  title,
  code,
  children,
}: {
  title: string
  code: string
  children: ReactNode
}): ReactElement {
  return (
    <article className="min-w-0 rounded-2xl bg-muted/30 p-4 dark:bg-[#171717]">
      <div className="flex min-h-[370px] min-w-0 items-center justify-center">
        {children}
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <h2 className="text-xs text-muted-foreground">{title}</h2>
        <CopyCode code={code} label={`Copy ${title.toLowerCase()} example`} />
      </div>
    </article>
  )
}

export function GlassFolderExamples({
  showToolbar = true,
}: {
  showToolbar?: boolean
}): ReactElement {
  const [view, setView] = useState<"preview" | "code">("preview")
  const [selected, setSelected] = useState<string>("")
  const [archiveOpen, setArchiveOpen] = useState<boolean>(false)
  const [archiveVersion, setArchiveVersion] = useState<number>(0)
  const [archiveSelection, setArchiveSelection] = useState<string>("")
  return (
    <>
      <div
        hidden={!showToolbar}
        className="mb-5 flex items-center justify-between gap-4"
      >
        <div role="group" aria-label="View" className="flex gap-1">
          {(["preview", "code"] as const).map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={view === item}
              onClick={() => setView(item)}
              className={cn(
                "rounded-full px-3.5 py-2 text-xs text-muted-foreground capitalize focus-visible:outline-2 focus-visible:outline-offset-2",
                view === item && "bg-foreground/10 text-foreground"
              )}
            >
              {item}
            </button>
          ))}
        </div>
        <CopyCode code={projectCode} />
      </div>
      <section
        hidden={view !== "code"}
        aria-label="Glass folder code"
        className="rounded-2xl bg-muted/30 p-5 dark:bg-[#171717]"
      >
        <pre
          tabIndex={0}
          className="max-h-[650px] overflow-auto rounded-lg font-mono text-xs leading-7 focus-visible:outline-2"
        >
          <code>{projectCode}</code>
        </pre>
        <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
          Imports the folder component, artwork helper, geometry helper, and
          animation keyframes in this project. No extra package is required.
        </p>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          <code>files</code> supplies initial contents; the folder owns
          additions. Use a new React <code>key</code> to reset it. Pass{" "}
          <code>open</code> and <code>onOpenChange</code> when the parent should
          own opening.
        </p>
      </section>
      <div hidden={view !== "preview"}>
        <section
          aria-label="Project files preview"
          className="flex min-h-[470px] flex-col items-center justify-center rounded-2xl bg-muted/30 px-4 py-6 dark:bg-[#171717]"
        >
          <GlassFolder
            label="Project files"
            art="aurora"
            files={projectFiles}
            onAdd={(current) => ({
              name: `Notes ${current.length + 1}`,
              meta: "TXT · New",
            })}
            onFileSelect={(file) => setSelected(file.name)}
          />
          <p role="status" className="min-h-5 text-xs text-muted-foreground">
            {selected ? `Selected: ${selected}` : ""}
          </p>
        </section>
        <div className="mt-4 grid min-w-0 gap-4 md:grid-cols-2">
          <Example title="Archives" code={archiveCode}>
            <div className="flex w-full min-w-0 flex-col items-center">
              <GlassFolder
                key={archiveVersion}
                label="Archives"
                art="none"
                action="more"
                labelPlacement="top-left"
                width={300}
                files={archiveFiles}
                open={archiveOpen}
                onOpenChange={setArchiveOpen}
                onFileSelect={(file) => setArchiveSelection(file.name)}
                menu={[
                  {
                    label: "Reset example",
                    onSelect: () => {
                      setArchiveOpen(false)
                      setArchiveSelection("")
                      setArchiveVersion((value) => value + 1)
                    },
                  },
                ]}
              />
              <p
                role="status"
                className="min-h-5 text-xs text-muted-foreground"
              >
                {archiveSelection ? `Selected: ${archiveSelection}` : ""}
              </p>
            </div>
          </Example>
          <Example title="Smoked glass" code={smokedCode}>
            <GlassFolder
              label="Material studies"
              tone="dark"
              art="ember"
              seed={11}
              action="none"
              width={300}
              files={studyFiles}
            />
          </Example>
        </div>
      </div>
      <p className="mt-4 text-[11px] text-muted-foreground">
        Adapted from{" "}
        <a
          href="https://21st.dev/@kedhareswer/components/glass-folder-cards"
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-3 focus-visible:outline-2"
        >
          Kedhareswer Naidu’s Glass Folder Cards
        </a>{" "}
        · MIT
      </p>
    </>
  )
}
