import { DistributionTable } from "@/components/admin/distribution/distribution-table"
import { getDistributionAdminData } from "@/features/distribution/queries"
import { parseFilters } from "@/features/distribution/validation"

export const maxDuration = 60

export default async function DistributionPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const filters = parseFilters(await searchParams)
  const data = await getDistributionAdminData(filters)
  return <DistributionTable {...data} filters={filters} />
}
