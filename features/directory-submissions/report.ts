import type { Campaign } from "./types"
import { statusLabels } from "./config"

export function campaignCsv(campaign: Campaign): string {
  const cell = (value: string | null): string => {
    const text = value ?? ""
    // Prevent spreadsheet formula execution in founder/admin-authored fields.
    return `"${(/^[\s]*[=+@-]/.test(text) ? "'" + text : text).replaceAll('"', '""')}"`
  }
  const rows = [
    [
      "Directory",
      "Status",
      "Submitted",
      "Published",
      "Result URL",
      "Rejection reason",
      "Action required",
    ],
    ...campaign.directory_submissions.map((job) => [
      job.directories.name,
      statusLabels[job.status],
      job.submitted_at,
      job.published_at,
      job.result_url,
      job.rejection_reason,
      job.action_required_message,
    ]),
  ]
  return "\uFEFF" + rows.map((row) => row.map(cell).join(",")).join("\r\n")
}
