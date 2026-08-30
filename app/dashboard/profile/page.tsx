import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { ProfileForm } from "@/components/dashboard/profile-form"
import { getUserProfile } from "@/features/profile/queries"
import { requireUser } from "@/lib/supabase/auth"

export default async function ProfilePage() {
  const user = await requireUser()
  const profile = await getUserProfile(user.id)
  const defaultDisplayName =
    (typeof user.user_metadata.full_name === "string" &&
      user.user_metadata.full_name) ||
    (typeof user.user_metadata.name === "string" && user.user_metadata.name) ||
    user.email?.split("@")[0] ||
    ""

  return (
    <DashboardShell
      active="profile"
      title="Your profile"
      description="Set the identity that will represent you as a builder."
    >
      <ProfileForm defaultDisplayName={defaultDisplayName} profile={profile} />
    </DashboardShell>
  )
}
