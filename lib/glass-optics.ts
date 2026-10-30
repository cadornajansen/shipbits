export type GlassSettings = {
  lightAngle: number
  lightIntensity: number
  refraction: number
  depth: number
  dispersion: number
  frost: number
  splay: number
  fillOpacity: number
  radius: number
  tint: string
}

export const defaultGlassSettings: Readonly<GlassSettings> = Object.freeze({
  lightAngle: -45,
  lightIntensity: 80,
  refraction: 80,
  depth: 20,
  dispersion: 50,
  frost: 4,
  splay: 0,
  fillOpacity: 20,
  radius: 22,
  tint: "#3f3f3f",
})

function finiteClamp(
  value: number | undefined,
  fallback: number,
  minimum: number,
  maximum: number
): number {
  const finiteValue =
    typeof value === "number" && Number.isFinite(value) ? value : fallback
  return Math.min(maximum, Math.max(minimum, finiteValue))
}

export function normalizeGlassSettings(
  settings: Partial<GlassSettings> = {}
): GlassSettings {
  const defaults = defaultGlassSettings

  return {
    lightAngle: finiteClamp(
      settings.lightAngle,
      defaults.lightAngle,
      -180,
      180
    ),
    lightIntensity: finiteClamp(
      settings.lightIntensity,
      defaults.lightIntensity,
      0,
      100
    ),
    refraction: finiteClamp(settings.refraction, defaults.refraction, 0, 100),
    depth: finiteClamp(settings.depth, defaults.depth, 0, 256),
    dispersion: finiteClamp(settings.dispersion, defaults.dispersion, 0, 100),
    frost: finiteClamp(settings.frost, defaults.frost, 0, 40),
    splay: finiteClamp(settings.splay, defaults.splay, 0, 100),
    fillOpacity: finiteClamp(
      settings.fillOpacity,
      defaults.fillOpacity,
      0,
      100
    ),
    radius: finiteClamp(settings.radius, defaults.radius, 0, 512),
    tint:
      typeof settings.tint === "string" && /^#[0-9a-f]{6}$/i.test(settings.tint)
        ? settings.tint.toLowerCase()
        : defaults.tint,
  }
}

type DisplacementMap = {
  width: number
  height: number
  pixels: Uint8ClampedArray
}

export function createDisplacementMap(
  width: number,
  height: number,
  radius: number,
  depth: number
): DisplacementMap {
  const cssWidth = finiteClamp(width, 1, 1, Number.MAX_SAFE_INTEGER)
  const cssHeight = finiteClamp(height, 1, 1, Number.MAX_SAFE_INTEGER)
  const resolution = Math.min(1, 512 / Math.max(cssWidth, cssHeight))
  const mapWidth = Math.max(1, Math.round(cssWidth * resolution))
  const mapHeight = Math.max(1, Math.round(cssHeight * resolution))
  const halfWidth = cssWidth / 2
  const halfHeight = cssHeight / 2
  const cornerRadius = finiteClamp(
    radius,
    0,
    0,
    Math.min(halfWidth, halfHeight)
  )
  const bevelDepth = finiteClamp(depth, 0, 0, Math.min(halfWidth, halfHeight))
  const pixels = new Uint8ClampedArray(mapWidth * mapHeight * 4)

  for (let y = 0; y < mapHeight; y++) {
    for (let x = 0; x < mapWidth; x++) {
      const index = (y * mapWidth + x) * 4
      pixels[index] = 128
      pixels[index + 1] = 128
      pixels[index + 2] = 128
      pixels[index + 3] = 255

      // Pixel centers stay in CSS coordinates even when the map is downsampled.
      const pointX = ((x + 0.5) / mapWidth) * cssWidth - halfWidth
      const pointY = ((y + 0.5) / mapHeight) * cssHeight - halfHeight
      const edgeX = Math.abs(pointX) - (halfWidth - cornerRadius)
      const edgeY = Math.abs(pointY) - (halfHeight - cornerRadius)
      const outsideX = Math.max(edgeX, 0)
      const outsideY = Math.max(edgeY, 0)
      const cornerDistance = Math.hypot(outsideX, outsideY)
      const signedDistance =
        cornerDistance + Math.min(Math.max(edgeX, edgeY), 0) - cornerRadius
      const distanceInside = -signedDistance

      if (distanceInside <= 0 || distanceInside >= bevelDepth) continue

      let normalX: number
      let normalY: number

      if (cornerDistance > 0) {
        normalX = (Math.sign(pointX) * outsideX) / cornerDistance
        normalY = (Math.sign(pointY) * outsideY) / cornerDistance
      } else if (edgeX === edgeY) {
        normalX = Math.sign(pointX) * Math.SQRT1_2
        normalY = Math.sign(pointY) * Math.SQRT1_2
      } else {
        normalX = edgeX > edgeY ? Math.sign(pointX) : 0
        normalY = edgeY > edgeX ? Math.sign(pointY) : 0
      }

      // Smoothstep fades the curved bevel into a completely flat center.
      const progress = distanceInside / bevelDepth
      const strength = 1 - progress * progress * (3 - 2 * progress)
      pixels[index] = 128 + normalX * strength * 127
      pixels[index + 1] = 128 + normalY * strength * 127
    }
  }

  return { width: mapWidth, height: mapHeight, pixels }
}
