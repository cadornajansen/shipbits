const masks = new Map<string, Promise<HTMLImageElement>>()

export function textMask(text: string): Promise<HTMLImageElement> {
  const label = text.slice(0, 32).trim() || "SHIPBITS"
  const cached = masks.get(label)
  if (cached) return cached
  const pending = drawTextMask(label).catch((error: unknown) => {
    masks.delete(label)
    throw error
  })
  // Typing must not retain an unbounded number of GPU source images.
  if (masks.size >= 24) masks.delete(masks.keys().next().value as string)
  masks.set(label, pending)
  return pending
}

async function drawTextMask(text: string): Promise<HTMLImageElement> {
  await document.fonts.ready
  const family = getComputedStyle(document.body).fontFamily
  await document.fonts.load(`600 96px ${family}`)
  const canvas = document.createElement("canvas")
  canvas.width = 1024
  canvas.height = 384
  const context = canvas.getContext("2d")
  if (!context) throw new Error("Text canvas is unavailable")
  context.font = `600 180px ${family}`
  const fontSize = Math.min(
    180,
    (940 / Math.max(context.measureText(text).width, 1)) * 180
  )
  context.font = `600 ${fontSize}px ${family}`
  context.textAlign = "center"
  context.textBaseline = "middle"
  context.fillStyle = "white"
  context.fillText(text, 512, 192)
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (value) =>
        value
          ? resolve(value)
          : reject(new Error("Text mask could not be encoded")),
      "image/png"
    )
  )
  // Paper caches image uniforms by the beginning of their URL. Unique blob URLs
  // prevent different text masks with identical PNG headers from colliding.
  const url = URL.createObjectURL(blob)
  const image = new Image()
  try {
    image.src = url
    await image.decode()
    return image
  } finally {
    URL.revokeObjectURL(url)
  }
}
