export const MAX_PRODUCT_TAGS = 5
export const MAX_PRODUCT_TAG_LENGTH = 30

export const PRODUCT_TAG_OPTIONS = [
  "A/B Testing",
  "Accessibility Testing",
  "Account Management",
  "Activity Tracking",
  "Ad Analytics",
  "Ad Creation",
  "Affiliate Tracking",
  "AI Agents",
  "AI Assistants",
  "AI Image Generation",
  "AI Writing",
  "Alerting",
  "API Documentation",
  "API Integration",
  "API Monitoring",
  "API Testing",
  "Application Performance",
  "Appointment Booking",
  "Asset Tracking",
  "Async Communication",
  "Attribution",
  "Audio Editing",
  "Audit Logs",
  "Authentication",
  "Authorization",
  "Backlog Management",
  "Backup Recovery",
  "Behavioral Analytics",
  "Billing",
  "Blog Publishing",
  "Brand Monitoring",
  "Browser Automation",
  "Bug Tracking",
  "Business Process",
  "Calendar Management",
  "Call Recording",
  "Campaign Management",
  "Candidate Sourcing",
  "Career Development",
  "Chatbots",
  "Checkout Optimization",
  "Cloud Migration",
  "Cloud Storage",
  "Code Generation",
  "Code Review",
  "Compliance Monitoring",
  "Content Scheduling",
  "Contract Management",
  "Conversion Tracking",
  "Course Creation",
  "CRM Integration",
  "Customer Feedback",
  "Customer Onboarding",
  "Customer Portal",
  "Customer Segmentation",
  "Support Ticketing",
  "Data Backup",
  "Data Catalog",
  "Data Cleaning",
  "Data Collection",
  "Data Enrichment",
  "Data Governance",
  "Data Integration",
  "Data Migration",
  "Data Modeling",
  "Data Pipeline",
  "Data Privacy",
  "Dashboard Building",
  "Data Warehousing",
  "Database Management",
  "Debugging",
  "Design Handoff",
  "Device Management",
  "Digital Signatures",
  "Document Automation",
  "Document Collaboration",
  "Document Scanning",
  "E-signatures",
  "Email Automation",
  "Email Deliverability",
  "Email Marketing",
  "Email Outreach",
  "Employee Onboarding",
  "Endpoint Protection",
  "Error Tracking",
  "Experimentation",
  "Expense Tracking",
  "Feature Flags",
  "Feature Management",
  "File Sharing",
  "Financial Reporting",
  "Fleet Management",
  "Form Builder",
  "Fraud Detection",
  "Funnel Analysis",
  "Gamification",
  "Help Desk",
  "Identity Verification",
  "Incident Management",
  "Influencer Marketing",
  "Inventory Management",
  "Invoice Management",
  "Issue Tracking",
  "Knowledge Base",
  "Knowledge Management",
  "Landing Pages",
  "Lead Generation",
  "Lead Scoring",
  "Learning Analytics",
  "Localization",
  "Log Management",
  "Loyalty Programs",
  "Market Intelligence",
  "Marketing Attribution",
  "Meeting Notes",
  "Meeting Scheduling",
  "Mobile Analytics",
  "Mobile Development",
  "Monitoring",
  "Multi-factor Authentication",
  "Network Security",
  "Note Taking",
  "Notifications",
  "OCR",
  "OKR Tracking",
  "On-call Management",
  "Password Management",
  "Payment Processing",
  "Payroll",
  "Performance Management",
  "Personalization",
  "Pipeline Management",
  "Podcast Hosting",
  "Portfolio Management",
  "Predictive Analytics",
  "Presentation Design",
  "Pricing Optimization",
  "Product Analytics",
  "Product Feedback",
  "Product Roadmapping",
  "Project Planning",
  "Prototyping",
  "Purchase Orders",
  "Quality Assurance",
  "Quiz Creation",
  "Recruitment Marketing",
  "Release Management",
  "Remote Access",
  "Remote Collaboration",
  "Reporting",
  "Research Collaboration",
  "Resource Planning",
  "Revenue Operations",
  "Risk Management",
  "Sales Automation",
  "Screen Recording",
  "Search Analytics",
  "Search Indexing",
  "Security Testing",
  "Session Replay",
  "Shipment Tracking",
  "Social Listening",
  "Social Scheduling",
  "Speech-to-Text",
  "Spaced Repetition",
  "Sprint Planning",
  "Static Analysis",
  "Subscription Management",
  "Survey Builder",
  "Task Automation",
  "Team Chat",
  "Collaborative Editing",
  "Team Performance",
  "Template Management",
  "Test Automation",
  "Time Tracking",
  "Translation Management",
  "Travel Booking",
  "User Onboarding",
  "User Research",
  "User Testing",
  "Vector Editing",
  "Version Control",
  "Video Editing",
  "Video Hosting",
  "Video Meetings",
  "Virtual Classroom",
  "Visitor Management",
  "Vulnerability Management",
  "Warehouse Management",
  "Webinar Hosting",
  "Website Builder",
  "Website Monitoring",
  "Website Personalization",
  "Workflow Automation",
  "Workflow Management",
  "Workflow Templates",
  "Workspace Booking",
  "Zapier Integration",
  "Zero Trust",
] as const

const genericGeneratedTags = new Set(["app", "saas", "software", "website"])
const canonicalTagsByNormalizedValue = new Map(
  PRODUCT_TAG_OPTIONS.map((tag) => [tag.toLowerCase(), tag])
)

export function normalizeTag(value: string): string {
  return value.replace(/\s+/g, " ").trim()
}

/** Limits AI suggestions to discovery tags founders can select in the UI. */
export function toCanonicalProductTags(values: readonly string[]): string[] {
  return values.flatMap((value) => {
    const canonical = canonicalTagsByNormalizedValue.get(normalizeTag(value).toLowerCase())
    return canonical ? [canonical] : []
  })
}

export function normalizeProductTags(
  values: readonly string[],
  category?: { name: string; slug: string } | null,
  options: { generated?: boolean } = {}
): string[] {
  const excluded = new Set(
    category ? [category.name.toLowerCase(), category.slug.toLowerCase()] : []
  )
  const seen = new Set<string>()
  const tags: string[] = []

  for (const raw of values) {
    const tag = normalizeTag(raw)
    const comparison = tag.toLowerCase()
    if (
      !tag ||
      tag.length > MAX_PRODUCT_TAG_LENGTH ||
      excluded.has(comparison) ||
      seen.has(comparison) ||
      (options.generated && genericGeneratedTags.has(comparison))
    ) {
      continue
    }
    seen.add(comparison)
    tags.push(tag)
    if (tags.length === MAX_PRODUCT_TAGS) break
  }

  return tags
}

export function parseProductTags(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((tag): tag is string => typeof tag === "string")
  }
  if (typeof value !== "string" || !value.trim()) return []
  try {
    const parsed: unknown = JSON.parse(value)
    return Array.isArray(parsed)
      ? parsed.filter((tag): tag is string => typeof tag === "string")
      : []
  } catch {
    return []
  }
}

export function validateProductTags(
  values: readonly string[],
  category?: { name: string; slug: string } | null
): string | null {
  if (values.length > MAX_PRODUCT_TAGS) return "Add no more than 5 tags."
  for (const raw of values) {
    const tag = normalizeTag(raw)
    if (!tag) return "Tags cannot be empty."
    if (tag.length > MAX_PRODUCT_TAG_LENGTH) {
      return "Tags must be 30 characters or fewer."
    }
  }
  const normalized = normalizeProductTags(values, category)
  if (normalized.length !== values.length) {
    return "Tags must be unique and cannot match the selected category."
  }
  return null
}
