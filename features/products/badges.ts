export const BADGE_VARIANTS = ["default", "monochrome", "yellow"] as const

export type BadgeVariant = (typeof BADGE_VARIANTS)[number]

export function resolveBadgeVariant(value: string | null): BadgeVariant {
  return BADGE_VARIANTS.includes(value as BadgeVariant)
    ? (value as BadgeVariant)
    : "default"
}

export function getVerifiedBadgePath(
  slug: string,
  variant: BadgeVariant
): string {
  const path = `/badges/listed/${slug}.svg`
  return variant === "default" ? path : `${path}?variant=${variant}`
}
