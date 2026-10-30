export const monoIcons = [
  {
    name: "home",
    label: "Home",
    figmaNodeId: "1:2",
    href: "/icons/mono/home.svg",
  },
  {
    name: "pen",
    label: "Pen",
    figmaNodeId: "1:25",
    href: "/icons/mono/pen.svg",
  },
  {
    name: "folder",
    label: "Folder",
    figmaNodeId: "1:47",
    href: "/icons/mono/folder.svg",
  },
  {
    name: "work",
    label: "Work",
    figmaNodeId: "1:67",
    href: "/icons/mono/work.svg",
  },
  {
    name: "user",
    label: "User",
    figmaNodeId: "1:94",
    href: "/icons/mono/user.svg",
  },
  {
    name: "mic",
    label: "Mic",
    figmaNodeId: "7:57",
    href: "/icons/mono/mic.svg",
  },
  {
    name: "search",
    label: "Search",
    figmaNodeId: "42:34",
    href: "/icons/mono/search.svg",
  },
  {
    name: "settings",
    label: "Settings",
    figmaNodeId: "42:42",
    href: "/icons/mono/settings.svg",
  },
  {
    name: "bell",
    label: "Bell",
    figmaNodeId: "42:55",
    href: "/icons/mono/bell.svg",
  },
  {
    name: "mail",
    label: "Mail",
    figmaNodeId: "42:67",
    href: "/icons/mono/mail.svg",
  },
  {
    name: "calendar",
    label: "Calendar",
    figmaNodeId: "42:85",
    href: "/icons/mono/calendar.svg",
  },
  {
    name: "coffee",
    label: "Coffee",
    figmaNodeId: "43:130",
    href: "/icons/mono/coffee.svg",
  },
  {
    name: "location",
    label: "Location",
    figmaNodeId: "43:161",
    href: "/icons/mono/location.svg",
  },
  {
    name: "image",
    label: "Image",
    figmaNodeId: "43:179",
    href: "/icons/mono/image.svg",
  },
  {
    name: "book",
    label: "Book",
    figmaNodeId: "43:214",
    href: "/icons/mono/book.svg",
  },
  {
    name: "agents",
    label: "Agents",
    figmaNodeId: "74:454",
    href: "/icons/mono/agents.svg",
  },
  {
    name: "clock",
    label: "Clock",
    figmaNodeId: "70:2",
    href: "/icons/mono/clock.svg",
  },
  {
    name: "light",
    label: "Light",
    figmaNodeId: "70:36",
    href: "/icons/mono/light.svg",
  },
  {
    name: "touch",
    label: "Touch",
    figmaNodeId: "70:68",
    href: "/icons/mono/touch.svg",
  },
  {
    name: "layers",
    label: "Layers",
    figmaNodeId: "70:96",
    href: "/icons/mono/layers.svg",
  },
  {
    name: "motion-path",
    label: "Motion path",
    figmaNodeId: "70:124",
    href: "/icons/mono/motion-path.svg",
  },
] as const

export type MonoIconName = (typeof monoIcons)[number]["name"]

export type AnimatedMonoIconName = MonoIconName
