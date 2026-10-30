export type PlannedPage = { slug: string; title: string; purpose: string }

// These are destinations, not published components. No account or payment behavior is implied.
export const plannedPages: readonly PlannedPage[] = [
  {
    slug: "sign-in",
    title: "Sign in",
    purpose:
      "Access to a future Shipbits account. The current previews and Studio do not require sign-in.",
  },
  {
    slug: "sign-up",
    title: "Join Shipbits",
    purpose:
      "Registration for a future Shipbits account. You can already explore every working component.",
  },
  {
    slug: "account",
    title: "Account",
    purpose:
      "A future place to manage your profile and saved work. No account data is collected here.",
  },
  {
    slug: "feedback",
    title: "Feedback",
    purpose: "A future channel for suggestions and component requests.",
  },
]

export function getPlannedPage(slug: string): PlannedPage | undefined {
  return plannedPages.find((page) => page.slug === slug)
}
