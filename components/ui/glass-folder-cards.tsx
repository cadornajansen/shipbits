"use client"

/* eslint-disable @next/next/no-img-element -- File images may be caller-supplied URLs; their dimensions are fixed. */
// Adapted from Glass Folder Cards by Kedhareswer Naidu, 21st.dev (MIT).
import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactElement,
} from "react"
import { MoreHorizontal, Plus } from "lucide-react"
import {
  hashString,
  requestFolderArtwork,
  rng,
  type ArtPreset,
  type ArtRecipe,
  type FolderArt,
} from "@/lib/folder-art"
import {
  fanSlot,
  folderScale,
  FOLDER_BACK_PATH,
  FOLDER_FRONT_PATH,
  FOLDER_WIDTH,
  FOLDER_FRAME_WIDTH,
  FOLDER_FRAME_HEIGHT,
  FOLDER_GUTTER,
  FOLDER_HEADROOM,
  MAX_VISIBLE_FILES,
} from "@/lib/folder-geometry"
import { cn } from "@/lib/utils"

export type { ArtPreset, ArtRecipe, FolderArt } from "@/lib/folder-art"
export type FolderFile = {
  name: string
  meta?: string
  art?: ArtPreset | ArtRecipe
  image?: string
  href?: string
}
export type FolderMenuItem = {
  label: string
  onSelect?: () => void
  danger?: boolean
}
export type GlassFolderProps = {
  label?: string
  meta?: string
  tone?: "light" | "dark"
  art?: FolderArt
  seed?: number
  image?: string
  /** Initial contents only. Remount with a new key to replace the local list. */
  files?: FolderFile[]
  action?: "add" | "more" | "none"
  onAdd?: (files: FolderFile[]) => FolderFile | void
  onFilesChange?: (files: FolderFile[]) => void
  menu?: FolderMenuItem[]
  labelPlacement?: "bottom-left" | "top-left" | "top-right"
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  onFileSelect?: (file: FolderFile, index: number) => void
  /** Preferred folder body width; the reserved fan space also scales to fit. */
  width?: number
  appear?: boolean
  appearDelay?: number
  className?: string
  style?: CSSProperties
}
type FolderStyle = CSSProperties & Record<`--gf-${string}`, string | number>
type FileEntry = { id: number; file: FolderFile }

const ease = "cubic-bezier(.2,.8,.2,1)"
const spring = "cubic-bezier(.34,1.36,.5,1)"
const focus =
  "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#739cff]"

function FolderArtwork({
  art,
  seed,
  width,
  height,
  enabled,
  className,
}: {
  art: ArtPreset | ArtRecipe
  seed: number
  width: number
  height: number
  enabled: boolean
  className?: string
}): ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [paintedKey, setPaintedKey] = useState<string>("")
  const recipe = JSON.stringify(art)
  const key = JSON.stringify([recipe, seed, width, height])
  useEffect(() => {
    if (!enabled) return
    let live = true
    const request = requestFolderArtwork(
      JSON.parse(recipe) as ArtPreset | ArtRecipe,
      seed,
      width,
      height
    )
    void request.promise
      .then((source) => {
        const canvas = canvasRef.current
        if (!live || !canvas) return
        canvas.width = source.width
        canvas.height = source.height
        canvas.getContext("2d")?.drawImage(source, 0, 0)
        setPaintedKey(key)
      })
      .catch(() => {
        /* The neutral panel remains usable if artwork is unavailable. */
      })
    return () => {
      live = false
      request.release()
    }
  }, [enabled, recipe, seed, width, height, key])
  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={cn(
        "transition-opacity duration-700 motion-reduce:transition-none",
        paintedKey === key ? "opacity-100" : "opacity-0",
        className
      )}
    />
  )
}

export default function GlassFolder({
  label = "My files",
  meta,
  tone = "light",
  art = "aurora",
  seed = 3,
  image,
  files: initialFiles = [],
  action = "add",
  onAdd,
  onFilesChange,
  menu = [],
  labelPlacement = "bottom-left",
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  onFileSelect,
  width = 340,
  appear = true,
  appearDelay = 0,
  className,
  style,
}: GlassFolderProps): ReactElement {
  const preferredWidth = Number.isFinite(width)
    ? Math.max(160, width)
    : FOLDER_WIDTH
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "")
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const actionRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const nextId = useRef<number>(initialFiles.length)
  const [entries, setEntries] = useState<FileEntry[]>(() =>
    initialFiles.map((file, id) => ({ file, id }))
  )
  const [localOpen, setLocalOpen] = useState<boolean>(defaultOpen)
  const [menuOpen, setMenuOpen] = useState<boolean>(false)
  const [hovered, setHovered] = useState<boolean>(false)
  const [focused, setFocused] = useState<boolean>(false)
  const [near, setNear] = useState<boolean>(false)
  const [entered, setEntered] = useState<boolean>(!appear)
  const [scale, setScale] = useState<number>(0)
  const [dropped, setDropped] = useState<number | null>(null)
  const [bump, setBump] = useState<number>(0)
  const open = controlledOpen ?? localOpen
  const engaged = hovered || focused
  const dark = tone === "dark"
  const visible = entries.slice(-MAX_VISIBLE_FILES)
  const startIndex = Math.max(0, entries.length - MAX_VISIBLE_FILES)
  const countText =
    meta ?? `${entries.length} ${entries.length === 1 ? "item" : "items"}`

  function changeOpen(next: boolean): void {
    if (controlledOpen === undefined) setLocalOpen(next)
    onOpenChange?.(next)
  }

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const resize = new ResizeObserver(([entry]) =>
      setScale(folderScale(entry.contentRect.width, preferredWidth))
    )
    resize.observe(root)
    return () => resize.disconnect()
  }, [preferredWidth])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    let timeout = 0
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        setNear(true)
        timeout = window.setTimeout(
          () => setEntered(true),
          matchMedia("(prefers-reduced-motion: reduce)").matches
            ? 0
            : Math.max(0, appearDelay)
        )
        observer.disconnect()
      },
      { rootMargin: "160px" }
    )
    observer.observe(root)
    return () => {
      observer.disconnect()
      clearTimeout(timeout)
    }
  }, [appearDelay])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const motion = matchMedia("(prefers-reduced-motion: reduce)")
    let frame = 0
    let x = 0
    let y = 0
    function write(): void {
      frame = 0
      root!.style.setProperty("--gf-px", String(x))
      root!.style.setProperty("--gf-py", String(y))
    }
    function move(event: PointerEvent): void {
      if (event.pointerType === "touch" || motion.matches) return
      const bounds = root!.getBoundingClientRect()
      x = Math.max(
        -1,
        Math.min(1, ((event.clientX - bounds.left) / bounds.width) * 2 - 1)
      )
      y = Math.max(
        -1,
        Math.min(1, ((event.clientY - bounds.top) / bounds.height) * 2 - 1)
      )
      if (!frame) frame = requestAnimationFrame(write)
    }
    function reset(): void {
      x = 0
      y = 0
      if (motion.matches) {
        setHovered(false)
        setFocused(false)
      }
      cancelAnimationFrame(frame)
      write()
    }
    root.addEventListener("pointermove", move, { passive: true })
    root.addEventListener("pointerleave", reset)
    motion.addEventListener("change", reset)
    return () => {
      root.removeEventListener("pointermove", move)
      root.removeEventListener("pointerleave", reset)
      motion.removeEventListener("change", reset)
      cancelAnimationFrame(frame)
    }
  }, [])

  useEffect(() => {
    if (!open && !menuOpen) return
    function escape(event: globalThis.KeyboardEvent): void {
      if (event.key !== "Escape") return
      if (menuOpen) {
        setMenuOpen(false)
        actionRef.current?.focus()
      } else {
        if (controlledOpen === undefined) setLocalOpen(false)
        onOpenChange?.(false)
        triggerRef.current?.focus()
      }
    }
    function outside(event: PointerEvent): void {
      if (rootRef.current?.contains(event.target as Node)) return
      setMenuOpen(false)
      if (open) {
        if (controlledOpen === undefined) setLocalOpen(false)
        onOpenChange?.(false)
      }
    }
    document.addEventListener("keydown", escape)
    document.addEventListener("pointerdown", outside)
    return () => {
      document.removeEventListener("keydown", escape)
      document.removeEventListener("pointerdown", outside)
    }
  }, [open, menuOpen, controlledOpen, onOpenChange])

  useEffect(() => {
    if (!menuOpen) return
    menuRef.current
      ?.querySelector<HTMLButtonElement>("[role=menuitem]")
      ?.focus()
  }, [menuOpen])

  function addFile(): void {
    const current = entries.map((entry) => entry.file)
    const file = onAdd?.([...current]) || {
      name: `Untitled ${entries.length + 1}`,
      meta: "Just now",
    }
    const id = nextId.current++
    const next = [...entries, { id, file }]
    setEntries(next)
    setDropped(id)
    setBump((value) => value + 1)
    onFilesChange?.(next.map((entry) => entry.file))
  }
  function menuKeys(event: KeyboardEvent<HTMLDivElement>): void {
    const items = Array.from(
      menuRef.current?.querySelectorAll<HTMLButtonElement>("[role=menuitem]") ??
        []
    )
    const index = items.indexOf(document.activeElement as HTMLButtonElement)
    const targets: Record<string, number> = {
      ArrowDown: index + 1,
      ArrowUp: index - 1,
      Home: 0,
      End: items.length - 1,
    }
    if (event.key in targets) {
      event.preventDefault()
      items[(targets[event.key] + items.length) % items.length]?.focus()
    } else if (event.key === "Tab") {
      setMenuOpen(false)
      actionRef.current?.focus()
    }
  }
  const menuItems: FolderMenuItem[] = [
    {
      label: open ? "Close folder" : "Open folder",
      onSelect: () => changeOpen(!open),
    },
    ...menu,
  ]
  const vars: FolderStyle = {
    "--gf-px": 0,
    "--gf-py": 0,
    "--gf-hinge": open ? "-24deg" : engaged ? "-11deg" : "0deg",
    "--gf-lift": open ? "-96px" : engaged ? "-34px" : "42px",
    "--gf-spread": open ? "40px" : engaged ? "8px" : "0px",
    "--gf-fan": open ? "5deg" : engaged ? "1.4deg" : "0deg",
    "--gf-stack": open ? "30px" : engaged ? "10px" : "15px",
    "--gf-ease": ease,
    "--gf-spring": spring,
    width: (Math.max(160, width) / FOLDER_WIDTH) * FOLDER_FRAME_WIDTH,
    aspectRatio: `${FOLDER_FRAME_WIDTH}/${FOLDER_FRAME_HEIGHT}`,
    ...style,
  }
  const rimClass =
    "pointer-events-none absolute top-0 left-0 max-w-none overflow-visible fill-none"
  const imageClass = "absolute inset-0 h-full w-full max-w-none object-cover"
  const artSeed = Number.isFinite(seed) ? seed : 3

  return (
    <div
      ref={rootRef}
      data-glass-folder=""
      data-tone={tone}
      data-open={open}
      data-entered={!appear || entered}
      style={vars}
      onPointerEnter={(event) => {
        if (
          event.pointerType !== "touch" &&
          !matchMedia("(prefers-reduced-motion: reduce)").matches
        )
          setHovered(true)
      }}
      onPointerLeave={() => setHovered(false)}
      onFocusCapture={() => {
        if (!matchMedia("(prefers-reduced-motion: reduce)").matches)
          setFocused(true)
      }}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setFocused(false)
      }}
      className={cn(
        "group/folder relative isolate inline-block max-w-full shrink-0 align-top font-sans antialiased [-webkit-tap-highlight-color:transparent]",
        className
      )}
    >
      <div
        className="absolute top-0 left-0 h-[272px] w-[340px] origin-top-left"
        style={{
          transform: `scale(${scale}) translate(${FOLDER_GUTTER}px, ${FOLDER_HEADROOM}px)`,
        }}
      >
        <div className="absolute inset-0 [transform:perspective(1400px)_rotateX(calc(var(--gf-py)*-3deg))_rotateY(calc(var(--gf-px)*4deg))] transition-transform duration-700 ease-[cubic-bezier(.2,.8,.2,1)] motion-reduce:transform-none motion-reduce:transition-none">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-[18px] bottom-[-6px] left-[18px] h-[60px] [transform:translateX(calc(var(--gf-px)*-8px))] rounded-[40px] bg-black/35 blur-[22px]"
          />
          <div
            aria-hidden="true"
            style={{ clipPath: `path('${FOLDER_BACK_PATH}')` }}
            className={cn(
              "absolute inset-0 overflow-hidden transition-[translate,opacity] duration-1000 ease-[cubic-bezier(.2,.8,.2,1)] group-data-[entered=false]/folder:translate-y-[22px] group-data-[entered=false]/folder:opacity-0 motion-reduce:transition-none",
              dark
                ? "bg-linear-to-b from-[#2a2a2e] to-[#121214]"
                : "bg-linear-to-b from-[#f3f3f4] to-[#e3e3e6]"
            )}
          >
            <div className="absolute -inset-3 [transform:translate(calc(var(--gf-px)*-7px),calc(var(--gf-py)*-6px))_scale(1.02)] transition-transform duration-1000 motion-reduce:transform-none motion-reduce:transition-none">
              {image ? (
                <img
                  src={image}
                  alt=""
                  width={364}
                  height={296}
                  draggable={false}
                  className={imageClass}
                />
              ) : art !== "none" ? (
                <FolderArtwork
                  art={art}
                  seed={artSeed}
                  width={448}
                  height={364}
                  enabled={near}
                  className={imageClass}
                />
              ) : null}
            </div>
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#ffffff38,transparent_22%),radial-gradient(120%_80%_at_80%_0%,#ffffff29,transparent_60%)]" />
          </div>
          <svg
            aria-hidden="true"
            viewBox="0 0 340 272"
            className={cn(
              rimClass,
              "h-[272px] w-[340px]",
              dark ? "stroke-white/16" : "stroke-white/45"
            )}
          >
            <path d={FOLDER_BACK_PATH} strokeWidth={1} />
          </svg>
          <div
            key={bump}
            data-bump={bump > 0}
            style={{ clipPath: `path('${FOLDER_FRONT_PATH}')` }}
            className="absolute top-[74px] left-0 z-10 h-[198px] w-[340px] origin-bottom [transform:perspective(760px)_rotateX(var(--gf-hinge))] backdrop-blur-[22px] backdrop-saturate-150 transition-[transform,translate,opacity] duration-800 ease-[cubic-bezier(.34,1.36,.5,1)] group-data-[entered=false]/folder:translate-y-[46px] group-data-[entered=false]/folder:opacity-0 data-[bump=true]:[animation:folder-pocket-bump_.7s_var(--gf-ease)_.38s_both] motion-reduce:animate-none motion-reduce:transition-none"
          >
            <div
              aria-hidden="true"
              className={cn(
                "absolute inset-0",
                dark
                  ? "bg-[linear-gradient(180deg,#1212142e_0%,#0e0e109e_46%,#08080af0_100%)]"
                  : "bg-[linear-gradient(180deg,#ffffff29_0%,#ffffff80_42%,#fcfcfced_100%)]"
              )}
            />
            <div
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute inset-0 bg-[radial-gradient(260px_200px_at_calc(50%+var(--gf-px)*46%)_calc(30%+var(--gf-py)*40%),#ffffff80,transparent_70%)]",
                dark
                  ? "opacity-16 mix-blend-screen"
                  : "opacity-90 mix-blend-soft-light"
              )}
            />
            <svg
              aria-hidden="true"
              viewBox="0 0 340 198"
              className={cn(
                rimClass,
                "h-[198px] w-[340px]",
                dark && "opacity-55"
              )}
            >
              <defs>
                <linearGradient id={`${uid}-rim`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="white" stopOpacity=".95" />
                  <stop offset=".35" stopColor="white" stopOpacity=".35" />
                  <stop offset="1" stopColor="white" stopOpacity=".12" />
                </linearGradient>
              </defs>
              <path
                d={FOLDER_FRONT_PATH}
                stroke={`url(#${uid}-rim)`}
                strokeWidth={2.4}
              />
            </svg>
            <button
              ref={triggerRef}
              type="button"
              aria-expanded={open}
              aria-controls={`${uid}-files`}
              aria-label={`${open ? "Close" : "Open"} ${label}, ${entries.length} ${entries.length === 1 ? "item" : "items"}`}
              onClick={() => {
                setMenuOpen(false)
                changeOpen(!open)
              }}
              className="peer absolute inset-0 z-[1] cursor-pointer outline-none focus-visible:bg-[#739cff]/10"
            />
            <div
              className={cn(
                "pointer-events-none absolute z-[2] flex max-w-[200px] flex-col gap-1 peer-focus-visible:[&>span:first-child]:underline peer-focus-visible:[&>span:first-child]:underline-offset-4",
                dark ? "text-[#f5f5f7]" : "text-[#141416]",
                labelPlacement === "bottom-left"
                  ? "bottom-8 left-7"
                  : labelPlacement === "top-left"
                    ? "top-[34px] left-7"
                    : "top-[52px] right-8"
              )}
            >
              <span className="truncate text-lg leading-[1.15] font-medium tracking-[-.012em]">
                {label}
              </span>
              <span
                key={countText}
                className={cn(
                  "[animation:folder-count-roll_.5s_var(--gf-ease)_both] font-mono text-xs tracking-[.03em] motion-reduce:animate-none",
                  dark ? "text-white/58" : "text-[#141416]/55"
                )}
              >
                {countText}
              </span>
            </div>
          </div>
          <div
            id={`${uid}-files`}
            role="list"
            aria-label={`${label} contents`}
            inert={!open}
            className="pointer-events-none absolute inset-0 z-[5] [clip-path:inset(-400px_-400px_10px_-400px)]"
          >
            {visible.map(({ file, id }, index) => {
              const jitter = rng(hashString(file.name) + id)
              const picture = Boolean(file.art || file.image)
              const sheetStyle: FolderStyle = {
                "--gf-slot": fanSlot(index, visible.length),
                "--gf-depth": visible.length - 1 - index,
                "--gf-jx": `${(jitter() - 0.5) * 10}px`,
                "--gf-jr": `${(jitter() - 0.5) * 3.2}deg`,
                zIndex: index + 1,
              }
              const sheetClass = cn(
                "pointer-events-auto absolute top-[96px] left-[34px] h-[184px] w-[272px] origin-bottom [transform:translate(calc(var(--gf-jx)+var(--gf-slot)*var(--gf-spread)),calc(var(--gf-lift)-var(--gf-depth)*var(--gf-stack)))_rotate(calc(var(--gf-jr)+var(--gf-slot)*var(--gf-fan)))] cursor-pointer overflow-hidden rounded-2xl text-left shadow-[inset_0_1px_0_#ffffffe6,0_0_0_.5px_#0000001a,0_10px_26px_-8px_#0a0c1447] transition-[transform,translate,opacity,box-shadow] duration-750 ease-[cubic-bezier(.34,1.36,.5,1)] group-data-[entered=false]/folder:-translate-y-[120px] group-data-[entered=false]/folder:opacity-0 group-data-[open=true]/folder:hover:-translate-y-[18px] focus-visible:-translate-y-[18px] motion-reduce:animate-none motion-reduce:transition-none",
                dark
                  ? "bg-linear-to-b from-[#2c2c30] to-[#1c1c1f]"
                  : "bg-linear-to-b from-white to-[#f2f2f0]",
                dropped === id &&
                  "[animation:folder-file-drop_.85s_var(--gf-ease)_both]",
                focus
              )
              const contents = (
                <>
                  {file.image ? (
                    <img
                      src={file.image}
                      alt=""
                      width={272}
                      height={184}
                      draggable={false}
                      className={imageClass}
                    />
                  ) : file.art ? (
                    <FolderArtwork
                      art={file.art}
                      seed={hashString(file.name) % 997}
                      width={340}
                      height={230}
                      enabled={near}
                      className={imageClass}
                    />
                  ) : (
                    <div
                      aria-hidden="true"
                      className="absolute top-10 right-3.5 left-3.5 flex flex-col gap-[9px]"
                    >
                      {["86%", "92%", "64%", "88%", "42%"].map((line) => (
                        <span
                          key={line}
                          style={{ width: line }}
                          className={cn(
                            "block h-[5px] rounded bg-current opacity-8 first:mb-1 first:h-[9px] first:opacity-14",
                            dark ? "text-white" : "text-[#18181b]"
                          )}
                        />
                      ))}
                    </div>
                  )}
                  {picture && (
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 bg-linear-to-b from-black/42 to-transparent to-35% shadow-[inset_0_0_0_1px_#ffffff33]"
                    />
                  )}
                  <span className="absolute top-[11px] right-3.5 left-3.5 z-[1] flex items-baseline justify-between gap-2.5 whitespace-nowrap">
                    <span
                      className={cn(
                        "truncate text-[12.5px] font-medium",
                        dark || picture ? "text-[#fafafa]" : "text-[#18181b]"
                      )}
                    >
                      {file.name}
                    </span>
                    {file.meta && (
                      <span
                        className={cn(
                          "shrink-0 font-mono text-[10px] tracking-[.02em]",
                          dark || picture
                            ? "text-white/66"
                            : "text-[#18181b]/50"
                        )}
                      >
                        {file.meta}
                      </span>
                    )}
                  </span>
                </>
              )
              const common = {
                className: sheetClass,
                style: sheetStyle,
                onAnimationEnd: () => {
                  if (dropped === id) setDropped(null)
                },
                onClick: () => onFileSelect?.(file, startIndex + index),
              }
              return (
                <div key={id} role="listitem" className="contents">
                  {file.href ? (
                    <a {...common} href={file.href}>
                      {contents}
                    </a>
                  ) : (
                    <button {...common} type="button">
                      {contents}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
          {action !== "none" && (
            <button
              ref={actionRef}
              type="button"
              aria-label={
                action === "add"
                  ? `Add a file to ${label}`
                  : `More options for ${label}`
              }
              aria-haspopup={action === "more" ? "menu" : undefined}
              aria-expanded={action === "more" ? menuOpen : undefined}
              aria-controls={action === "more" ? `${uid}-menu` : undefined}
              onClick={() =>
                action === "add" ? addFile() : setMenuOpen(!menuOpen)
              }
              className={cn(
                "absolute right-[22px] bottom-[22px] z-[12] grid size-[58px] cursor-pointer place-items-center rounded-[18px] transition-transform duration-300 ease-[cubic-bezier(.34,1.36,.5,1)] group-data-[entered=false]/folder:scale-60 group-data-[entered=false]/folder:opacity-0 hover:-translate-y-0.5 active:scale-93 motion-reduce:transform-none motion-reduce:transition-none",
                focus,
                action === "add" && !dark
                  ? "bg-[radial-gradient(120%_90%_at_50%_0%,#3a3a3f,#121214_55%,#050506)] text-white shadow-[inset_0_1px_0_#ffffff38,inset_0_-3px_8px_#000000b3,0_0_0_1px_#000000bf,0_14px_22px_-8px_#0000008c,0_3px_6px_-2px_#00000059]"
                  : dark && action === "more"
                    ? "bg-linear-to-b from-white/16 to-white/6 text-white shadow-[inset_0_1px_0_#ffffff38,0_0_0_1px_#ffffff1a,0_10px_18px_-8px_#00000099]"
                    : "bg-linear-to-b from-white to-[#d2d2d6] text-[#111113] shadow-[inset_0_1px_0_white,inset_0_-2px_4px_#0000000f,0_0_0_1px_#00000029,0_10px_18px_-8px_#0000004d]"
              )}
            >
              {action === "add" ? (
                <Plus
                  key={bump}
                  aria-hidden="true"
                  className="size-[26px] [animation:folder-plus-turn_.6s_var(--gf-spring)] motion-reduce:animate-none"
                  strokeWidth={1.6}
                />
              ) : (
                <MoreHorizontal
                  aria-hidden="true"
                  className="size-[30px]"
                  strokeWidth={1.7}
                />
              )}
            </button>
          )}
          {action === "more" && menuOpen && (
            <div
              ref={menuRef}
              id={`${uid}-menu`}
              role="menu"
              aria-label={`${label} options`}
              onKeyDown={menuKeys}
              className={cn(
                "absolute right-[22px] bottom-[90px] z-20 flex min-w-44 flex-col rounded-2xl p-1.5 shadow-[inset_0_1px_0_#ffffffb3,0_0_0_.5px_#00000024,0_24px_48px_-16px_#0a0c1466] backdrop-blur-2xl backdrop-saturate-150",
                dark ? "bg-[#1e1e22]/85" : "bg-[#fcfcfd]/85"
              )}
            >
              {menuItems.map((item, index) => (
                <button
                  key={`${item.label}-${index}`}
                  type="button"
                  role="menuitem"
                  tabIndex={-1}
                  onClick={() => {
                    setMenuOpen(false)
                    actionRef.current?.focus()
                    item.onSelect?.()
                  }}
                  className={cn(
                    "cursor-pointer rounded-[10px] px-3 py-[9px] text-left text-[13.5px] outline-none",
                    dark
                      ? "text-[#f4f4f5] hover:bg-white/9 focus-visible:bg-white/9"
                      : "text-[#18181b] hover:bg-black/7 focus-visible:bg-black/7",
                    item.danger && "text-red-500"
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
