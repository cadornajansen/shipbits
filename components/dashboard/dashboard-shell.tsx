import { SiteContainer } from "@/components/layout/site-container"

import { DashboardTabs } from "./dashboard-tabs"

export function DashboardShell({
  active,
  action,
  children,
  description,
  title,
}: {
  active: "dashboard" | "profile" | "settings"
  action?: React.ReactNode
  children: React.ReactNode
  description: string
  title: string
}) {
  return (
    <main className="pt-8 pb-16 sm:pt-12">
      <SiteContainer>
        <div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Account
              </p>
              <h1 className="mt-1 font-outfit text-3xl font-semibold tracking-tight">
                {title}
              </h1>
              <p className="mt-2 text-muted-foreground">{description}</p>
            </div>
            {action ? <div className="shrink-0">{action}</div> : null}
          </div>
          <div className="mt-8">
            <DashboardTabs active={active} />
          </div>
          <div className="pt-6">{children}</div>
        </div>
      </SiteContainer>
    </main>
  )
}
