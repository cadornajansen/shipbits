import Link from "next/link"

import { cn } from "@/lib/utils"

const tabs = [
  { href: "/dashboard", label: "Dashboard", value: "dashboard" },
  { href: "/dashboard/directory-submissions", label: "Directory Submissions", value: "directory-submissions" },
  { href: "/dashboard/profile", label: "Profile", value: "profile" },
  { href: "/dashboard/settings", label: "Settings", value: "settings" },
] as const

export function DashboardTabs({
  active,
}: {
  active: (typeof tabs)[number]["value"]
}) {
  return (
    <nav aria-label="Dashboard navigation" className="border-b">
      <div className="flex flex-wrap gap-x-5 gap-y-3">
        {tabs.map((tab) => (
          <Link
            key={tab.value}
            href={tab.href}
            aria-current={active === tab.value ? "page" : undefined}
            className={cn(
              "border-b-2 px-0.5 pb-3 text-sm font-medium transition-colors",
              active === tab.value
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
