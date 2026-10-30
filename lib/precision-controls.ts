export function snapValue(
  value: number,
  min: number,
  max: number,
  step: number
): number {
  if (!Number.isFinite(value)) return min
  const increment = Number.isFinite(step) && step > 0 ? step : 1
  const upper = Math.max(min, max)
  const rounded = min + Math.round((value - min) / increment) * increment
  return Number(Math.min(upper, Math.max(min, rounded)).toFixed(8))
}

/** The bottom quarter is a dead zone; its nearest endpoint wins. */
export function dialFraction(x: number, y: number): number {
  const angle = (Math.atan2(x, -y) * 180) / Math.PI
  return Math.max(0, Math.min(1, (angle + 135) / 270))
}

export function validateIntakeFile(
  file: Pick<File, "name" | "size" | "type">,
  accept: string,
  maxBytes: number
): string | undefined {
  if (file.size > maxBytes)
    return `Choose a file smaller than ${Math.round(maxBytes / 1024 / 1024)} MB.`
  const types = accept
    .split(",")
    .map((type) => type.trim().toLowerCase())
    .filter(Boolean)
  const accepted =
    !types.length ||
    types.some((type) => {
      if (type.startsWith(".")) return file.name.toLowerCase().endsWith(type)
      if (type.endsWith("/*"))
        return file.type.toLowerCase().startsWith(type.slice(0, -1))
      return file.type.toLowerCase() === type
    })
  return accepted ? undefined : "This file type is not supported."
}

export type CounterCharacter = {
  key: string
  character: string
  digit: boolean
}

export function counterCharacters(
  value: number,
  decimals: number,
  locale = "en-US"
): CounterCharacter[] {
  const count = Number.isFinite(decimals)
    ? Math.min(8, Math.max(0, Math.trunc(decimals)))
    : 2
  const parts = new Intl.NumberFormat(locale, {
    minimumFractionDigits: count,
    maximumFractionDigits: count,
  }).formatToParts(Number.isFinite(value) ? value : 0)
  const integers = parts
    .filter((part) => part.type === "integer")
    .map((part) => part.value)
    .join("").length
  let integerIndex = integers
  let fractionIndex = 0
  return parts.flatMap((part, partIndex) =>
    [...part.value].map((character, index) => ({
      key:
        part.type === "integer"
          ? `integer-${--integerIndex}`
          : part.type === "fraction"
            ? `fraction-${fractionIndex++}`
            : `${part.type}-${partIndex}-${index}`,
      character,
      digit: part.type === "integer" || part.type === "fraction",
    }))
  )
}
