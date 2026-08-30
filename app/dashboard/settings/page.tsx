import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { SettingsForm } from "@/components/dashboard/settings-form"
import { getUserProfile } from "@/features/profile/queries"
import { requireUser } from "@/lib/supabase/auth"

export default async function SettingsPage() {
  const user = await requireUser()
  const profile = await getUserProfile(user.id)
  const providers = [
    ...new Set(user.identities?.map((identity) => identity.provider) ?? []),
  ]

  return (
    <DashboardShell
      active="settings"
      title="Settings"
      description="Control your privacy and ShipBits notifications."
    >
      <SettingsForm profile={profile} providers={providers} />
    </DashboardShell>
  )
}
