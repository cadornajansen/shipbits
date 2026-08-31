import { getCampaign } from "@/features/directory-submissions/queries"
import { campaignCsv } from "@/features/directory-submissions/report"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const campaign = await getCampaign(id, true)
  if (!campaign) return new Response("Not found", { status: 404 })
  return new Response(campaignCsv(campaign), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="shipbits-campaign-${campaign.id}.csv"`,
      "Cache-Control": "private, no-store",
    },
  })
}
