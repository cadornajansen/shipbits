import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import {
  DirectorySignIn,
  StartCampaign,
} from "@/components/directory-submissions/start-campaign"
import { getCurrentUser } from "@/lib/supabase/auth"
import { getUserProducts } from "@/features/dashboard/queries"
import { getUserSubmissions } from "@/features/submissions/queries"
import { getCategories } from "@/features/products/queries"

export default async function NewDirectoryCampaignPage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string; plan?: string }>
}) {
  const user = await getCurrentUser()
  const params = await searchParams
  if (!user)
    return (
      <DashboardShell
        active="directory-submissions"
        title="Submit your product"
        description="Sign in to use your product profile and track directory submissions."
      >
        <DirectorySignIn />
      </DashboardShell>
    )
  const [products, drafts, categories] = await Promise.all([
    getUserProducts(user.id),
    getUserSubmissions(user.id),
    getCategories(),
  ])
  return (
    <DashboardShell
      active="directory-submissions"
      title="Submit to directories"
      description="Choose your product and a submission package."
    >
      <StartCampaign
        products={products}
        drafts={drafts.filter((draft) => !draft.productId && !draft.archivedAt)}
        categories={categories}
        initialProduct={params.product}
        initialPlan={params.plan}
      />
    </DashboardShell>
  )
}
