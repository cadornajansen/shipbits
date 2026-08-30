import { DashboardProducts } from "@/components/dashboard/dashboard-products"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { DashboardSubmissions } from "@/components/submissions/dashboard-submissions"
import { getUserProducts } from "@/features/dashboard/queries"
import { getCategories } from "@/features/products/queries"
import { getUserSubmissions } from "@/features/submissions/queries"
import { requireUser } from "@/lib/supabase/auth"

export default async function DashboardPage() {
  const user = await requireUser()
  const [categories, products, submissions] = await Promise.all([
    getCategories(),
    getUserProducts(user.id),
    getUserSubmissions(user.id),
  ])
  const unfinishedSubmissions = submissions.filter(
    (submission) => !submission.productId
  )

  return (
    <DashboardShell
      active="dashboard"
      title="My dashboard"
      description="Manage your products, drafts, and listing details."
      action={<AddProductButton categories={categories} />}
    >
      <div className="grid gap-10">
        <DashboardProducts
          categories={categories}
          products={products}
          submissions={submissions}
        />
        {unfinishedSubmissions.length ? (
          <section>
            <h2 className="font-outfit text-xl font-semibold">
              Draft submissions
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Finish these before they become live listings.
            </p>
            <div className="mt-4">
              <DashboardSubmissions
                categories={categories}
                submissions={unfinishedSubmissions}
              />
            </div>
          </section>
        ) : null}
        {!products.length && !unfinishedSubmissions.length ? (
          <div className="rounded-xl border border-dashed px-6 py-12 text-center">
            <h2 className="font-medium">No products yet</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Start from the product URL field on the homepage.
            </p>
          </div>
        ) : null}
      </div>
    </DashboardShell>
  )
}
import { AddProductButton } from "@/components/dashboard/add-product-button"
