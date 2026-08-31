export const directoryPlans = {
  starter: {
    name: "Starter",
    priceCentavos: 19900,
    targetCount: 10,
    popular: false,
    priceSuffix: "",
    features: [
      "10 relevant directory submissions",
      "Reusable product profile",
      "Category and niche matching",
      "ShipBits listing included",
      "Submission tracking and report",
    ],
  },
  launch: {
    name: "Launch",
    priceCentavos: 69900,
    targetCount: 50,
    popular: true,
    priceSuffix: "",
    features: [
      "50 directory submissions",
      "Everything in Starter",
      "Broader category coverage",
      "Higher-priority directories first",
      "Proof and links where available",
    ],
  },
  growth: {
    name: "Growth",
    priceCentavos: 149900,
    targetCount: 100,
    popular: false,
    priceSuffix: "",
    features: [
      "100 directory submissions",
      "Everything in Launch",
      "Priority processing",
      "Broader niche coverage",
      "Reasonable failed-submission retries",
      "Downloadable submission report",
    ],
  },
  done_for_you: {
    name: "Done For You",
    priceCentavos: 299900,
    targetCount: 100,
    popular: false,
    priceSuffix: "+",
    features: [
      "100 submissions + manual handling",
      "Custom form questions",
      "Account-required flows where practical",
      "Difficult submission flows",
      "Manual retries where appropriate",
    ],
  },
} as const
export type DirectoryPlan = keyof typeof directoryPlans
export const planKeys = Object.keys(directoryPlans) as DirectoryPlan[]
export const submissionDisclaimer =
  "Submission does not guarantee publication. Each directory independently reviews and approves listings."
export const campaignStatuses = [
  "draft",
  "awaiting_payment",
  "active",
  "completed",
  "cancelled",
] as const
export type CampaignStatus = (typeof campaignStatuses)[number]
export const jobStatuses = [
  "queued",
  "processing",
  "submitted",
  "live",
  "rejected",
  "needs_action",
  "skipped",
] as const
export type JobStatus = (typeof jobStatuses)[number]
export const statusLabels: Record<JobStatus | CampaignStatus, string> = {
  draft: "Draft",
  awaiting_payment: "Awaiting payment",
  active: "Active",
  completed: "Completed",
  cancelled: "Cancelled",
  queued: "Queued",
  processing: "Processing",
  submitted: "Submitted",
  live: "Live",
  rejected: "Rejected",
  needs_action: "Needs action",
  skipped: "Skipped",
}
export function formatDirectoryPrice(centavos: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(centavos / 100)
}
export function directoryProgress(
  jobs: ReadonlyArray<{ status: JobStatus; submitted_at: string | null }>,
  target: number
) {
  const counts = Object.fromEntries(
    jobStatuses.map((status) => [status, 0])
  ) as Record<JobStatus, number>
  for (const job of jobs) counts[job.status]++
  const processed = jobs.filter(
    (job) => job.status !== "queued" && job.status !== "skipped"
  ).length
  const percent = target > 0
    ? Math.min(100, Math.max(0, Math.round((processed / target) * 100)))
    : 0
  return {
    counts,
    total: jobs.length,
    processed,
    unassigned: Math.max(0, target - jobs.length),
    percent,
  }
}
