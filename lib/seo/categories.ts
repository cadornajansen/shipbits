const categoryDescriptions: Record<string, string> = {
  ai: "Artificial intelligence products for creating, researching, analyzing, and automating practical work.",
  analytics: "Analytics tools for understanding product usage, customers, campaigns, and business performance.",
  automation: "Products that connect workflows, reduce repetitive work, and help teams operate more consistently.",
  business: "Software for running company operations, serving customers, and supporting day-to-day business work.",
  communication: "Tools for messaging, meetings, customer conversations, and clear team communication.",
  design: "Products for visual design, prototyping, collaboration, asset creation, and creative workflows.",
  "developer-tools": "APIs, developer infrastructure, coding tools, testing, deployment, and engineering workflows.",
  education: "Learning, study, teaching, research, and knowledge tools for students, educators, and lifelong learners.",
  finance: "Products for payments, accounting, financial planning, reporting, and managing money.",
  marketing: "Tools for planning campaigns, creating content, reaching audiences, and measuring marketing work.",
  productivity: "Tools for organizing work, automating repetitive tasks, planning, and getting more done.",
  saas: "Cloud software products that help individuals and teams complete useful work online.",
  seo: "Tools for search visibility, technical checks, content workflows, and understanding organic discovery.",
  utilities: "Focused tools that solve practical everyday tasks for individuals, teams, and builders.",
}

export function getCategoryDescription(category: { name: string; slug: string }): string {
  return categoryDescriptions[category.slug] ??
    `Explore ${category.name.toLowerCase()} products, tools, and software organized by their primary use case.`
}
