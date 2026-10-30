"use client"

import { useEffect, useState } from "react"
import {
  Archive,
  Check,
  Copy,
  FileText,
  Folder,
  ImageIcon,
  Layers,
  Palette,
  Pin,
  Plus,
  Type,
  Undo2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  CommandPalette,
  type CommandPaletteAction,
} from "@/components/ui/command-palette"
import {
  ContextualInspector,
  type InspectorItem,
} from "@/components/ui/contextual-inspector"
import { MorphingActionMenu } from "@/components/ui/morphing-action-menu"
import {
  NotificationStack,
  useNotificationStack,
} from "@/components/ui/notification-stack"
import {
  PresenceGroup,
  type PresencePerson,
} from "@/components/ui/presence-group"

export function MorphingActionMenuExample() {
  const [pinned, setPinned] = useState(false)
  const [copies, setCopies] = useState(0)
  const [archived, setArchived] = useState(false)
  const [message, setMessage] = useState("")
  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-5">
      <div className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background">
          <FileText aria-hidden className="size-5 text-muted-foreground" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-sm font-medium">
            Design brief{" "}
            {pinned && <Pin aria-label="Pinned" className="size-3" />}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {archived
              ? "In your archive"
              : copies
                ? `${copies} local ${copies === 1 ? "copy" : "copies"}`
                : "Personal workspace"}
          </p>
        </div>
      </div>
      {archived ? (
        <Button
          variant="outline"
          onClick={() => {
            setArchived(false)
            setMessage("Design brief restored")
          }}
        >
          <Undo2 data-icon="inline-start" />
          Undo archive
        </Button>
      ) : (
        <MorphingActionMenu
          actions={[
            {
              id: "duplicate",
              label: "Duplicate",
              icon: <Copy />,
              onSelect: () => {
                setCopies((count) => count + 1)
                setMessage("A local copy was created")
              },
            },
            {
              id: "pin",
              label: pinned ? "Unpin from workspace" : "Pin to workspace",
              icon: <Pin />,
              onSelect: () => {
                setPinned(!pinned)
                setMessage(pinned ? "Brief unpinned" : "Brief pinned")
              },
            },
            {
              id: "archive",
              label: "Archive brief",
              icon: <Archive />,
              separatorBefore: true,
              onSelect: () => {
                setArchived(true)
                setMessage("Design brief archived locally")
              },
            },
          ]}
        />
      )}
      <p role="status" className="h-4 text-xs text-muted-foreground">
        {message}
      </p>
    </div>
  )
}

export function CommandPaletteExample() {
  const [document, setDocument] = useState("Launch notes")
  const [mode, setMode] = useState("Draft")
  const actions: readonly CommandPaletteAction[] = [
    {
      id: "notes",
      label: "Launch notes",
      description: "Open your working document",
      category: "Files",
      icon: <FileText />,
      onSelect: () => setDocument("Launch notes"),
    },
    {
      id: "brief",
      label: "Design brief",
      description: "Open the product brief",
      category: "Files",
      icon: <Layers />,
      onSelect: () => setDocument("Design brief"),
    },
    {
      id: "create",
      label: "Create new…",
      description: "Choose a document type",
      category: "Actions",
      icon: <Plus />,
      children: [
        {
          id: "new-note",
          label: "Text document",
          category: "Create",
          icon: <Type />,
          onSelect: () => {
            setDocument("Untitled document")
            setMode("Draft")
          },
        },
        {
          id: "new-board",
          label: "Mood board",
          category: "Create",
          icon: <Palette />,
          onSelect: () => {
            setDocument("Untitled mood board")
            setMode("Draft")
          },
        },
      ],
    },
    {
      id: "review",
      label: "Mark ready for review",
      category: "Actions",
      description: "Update this document’s status",
      icon: <Check />,
      onSelect: () => setMode("Ready for review"),
    },
  ]
  return (
    <div className="flex w-full max-w-sm flex-col gap-5">
      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-xs text-muted-foreground">Personal workspace</p>
        <p className="mt-4 text-base font-medium">{document}</p>
        <p role="status" className="mt-1 text-xs text-muted-foreground">
          {mode}
        </p>
      </div>
      <CommandPalette actions={actions} />
    </div>
  )
}

export function NotificationStackExample() {
  return (
    <NotificationStack>
      <WorkspaceNotifications />
    </NotificationStack>
  )
}

function WorkspaceNotifications() {
  const { add, close } = useNotificationStack()
  const [archived, setArchived] = useState(true)
  const [pinned, setPinned] = useState(true)
  useEffect(() => {
    add({
      id: "palette",
      title: "Palette saved",
      description: "Autumn colors are in your workspace.",
    })
    add({
      id: "pin",
      title: "Brief pinned",
      description: "Design brief is now a favorite.",
      actionProps: {
        children: "Undo",
        onClick: () => {
          setPinned(false)
          close("pin")
        },
      },
    })
    add({
      id: "archive",
      title: "Draft archived",
      description: "Early explorations moved to your archive.",
      actionProps: {
        children: "Undo",
        onClick: () => {
          setArchived(false)
          close("archive")
        },
      },
    })
  }, [add, close])
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-sm font-medium">Your workspace</p>
        <p role="status" className="mt-1 text-[11px] text-muted-foreground">
          {archived ? "Draft in archive" : "Draft restored"} ·{" "}
          {pinned ? "Brief pinned" : "Brief unpinned"}
        </p>
      </div>
      <Button
        size="icon"
        variant="outline"
        aria-label="Archive a draft"
        onClick={() => {
          setArchived(true)
          add({
            id: "archive",
            title: "Draft archived",
            description: "Early explorations moved to your archive.",
            actionProps: {
              children: "Undo",
              onClick: () => {
                setArchived(false)
                close("archive")
              },
            },
          })
        }}
      >
        <Archive />
      </Button>
    </div>
  )
}

export function ContextualInspectorExample() {
  const [pinned, setPinned] = useState<readonly string[]>([])
  const files = [
    {
      id: "brief",
      title: "Design brief",
      subtitle: "Document · Updated today",
      icon: <FileText />,
      type: "Document",
      size: "4.2 KB",
    },
    {
      id: "assets",
      title: "Brand assets",
      subtitle: "Folder · 8 items",
      icon: <Folder />,
      type: "Folder",
      size: "2.4 MB",
    },
    {
      id: "sierra",
      title: "Sierra study",
      subtitle: "Image · 720 × 480",
      icon: <ImageIcon />,
      type: "SVG image",
      size: "3.1 KB",
    },
  ]
  const items: readonly InspectorItem[] = files.map((file) => ({
    ...file,
    metadata: [
      { label: "Type", value: file.type },
      { label: "Size", value: file.size },
      { label: "Access", value: "Only you" },
      { label: "Pinned", value: pinned.includes(file.id) ? "Yes" : "No" },
    ],
    actionLabel: pinned.includes(file.id) ? "Unpin file" : "Pin to workspace",
    onAction: () =>
      setPinned((current) =>
        current.includes(file.id)
          ? current.filter((id) => id !== file.id)
          : [...current, file.id]
      ),
  }))
  return <ContextualInspector items={items} />
}

const people: readonly PresencePerson[] = [
  {
    id: "ana",
    name: "Ana Torres",
    initials: "AT",
    status: "online",
    activity: "Editing the brief",
  },
  {
    id: "noah",
    name: "Noah Kim",
    initials: "NK",
    status: "online",
    activity: "Reviewing colors",
  },
  {
    id: "mei",
    name: "Mei Chen",
    initials: "MC",
    status: "away",
    activity: "Back in a moment",
  },
  {
    id: "leo",
    name: "Leo Reyes",
    initials: "LR",
    status: "online",
    activity: "Exploring concepts",
  },
  {
    id: "sam",
    name: "Sam Ellis",
    initials: "SE",
    status: "offline",
    activity: "Last here yesterday",
  },
  {
    id: "ivy",
    name: "Ivy Patel",
    initials: "IP",
    status: "online",
    activity: "Reading launch notes",
  },
]

export function PresenceGroupExample() {
  const [selected, setSelected] = useState<PresencePerson | null>(null)
  return (
    <div className="flex w-full max-w-sm flex-col gap-16 rounded-3xl border border-border bg-card px-5 pt-6 pb-5">
      <div>
        <p className="text-sm font-medium">Autumn launch</p>
        <p className="mt-1 text-xs text-muted-foreground">
          6 collaborators · 4 online
        </p>
      </div>
      <div className="flex justify-center py-3">
        <PresenceGroup people={people} onSelect={setSelected} />
      </div>
      <p
        role="status"
        className="h-4 text-center text-xs text-muted-foreground"
      >
        {selected
          ? `${selected.name} · ${selected.activity}`
          : "Shared with your team"}
      </p>
    </div>
  )
}
