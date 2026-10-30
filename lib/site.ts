export const site = {
  name: "Shipbits",
  owner: "Jansen Cadorna",
  repository: "https://github.com/cadornajansen/shipbits",
  issues: "https://github.com/cadornajansen/shipbits/issues",
  profile: "https://github.com/cadornajansen",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "https://shipbits.dev").replace(
    /\/$/,
    ""
  ),
  contactEmail:
    process.env.NEXT_PUBLIC_CONTACT_EMAIL || "ship@jansencadorna.com",
  coffeeUrl: process.env.NEXT_PUBLIC_COFFEE_URL,
} as const
