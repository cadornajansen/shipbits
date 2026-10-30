import assert from "node:assert/strict"
import test from "node:test"

// Node runs the source directly; the app's bundler resolves extensionless types.
const sourcePath: string = "./glass-optics.ts"
const {
  createDisplacementMap,
  defaultGlassSettings,
  normalizeGlassSettings,
}: typeof import("./glass-optics") = await import(sourcePath)

type DisplacementMap = ReturnType<typeof createDisplacementMap>

function pixel(map: DisplacementMap, x: number, y: number): number[] {
  const index = (y * map.width + x) * 4
  return Array.from(map.pixels.slice(index, index + 4))
}

test("normalization keeps defaults and rejects nonfinite or unsafe settings", () => {
  assert.deepEqual(normalizeGlassSettings(), defaultGlassSettings)

  const settings = normalizeGlassSettings({
    lightAngle: Infinity,
    lightIntensity: -10,
    refraction: 140,
    depth: NaN,
    dispersion: -1,
    frost: Infinity,
    splay: 101,
    fillOpacity: -20,
    radius: -1,
    tint: "red; background: black",
  })

  assert.equal(settings.lightAngle, -45)
  assert.equal(settings.lightIntensity, 0)
  assert.equal(settings.refraction, 100)
  assert.equal(settings.depth, 20)
  assert.equal(settings.dispersion, 0)
  assert.equal(settings.frost, 4)
  assert.equal(settings.splay, 100)
  assert.equal(settings.fillOpacity, 0)
  assert.equal(settings.radius, 0)
  assert.equal(settings.tint, "#3f3f3f")
  assert.equal(normalizeGlassSettings({ tint: "#ABCDEF" }).tint, "#abcdef")
})

test("rounded lens has opposite edge normals and a neutral center and exterior", () => {
  const map = createDisplacementMap(162, 45, 22, 8)

  assert.deepEqual(pixel(map, 81, 22), [128, 128, 128, 255])
  assert.deepEqual(pixel(map, 0, 0), [128, 128, 128, 255])
  assert.ok(pixel(map, 0, 22)[0] < 128)
  assert.ok(pixel(map, 161, 22)[0] > 128)
  assert.ok(pixel(map, 81, 0)[1] < 128)
  assert.ok(pixel(map, 81, 44)[1] > 128)

  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      const current = pixel(map, x, y)
      const mirroredX = pixel(map, map.width - 1 - x, y)
      const mirroredY = pixel(map, x, map.height - 1 - y)
      assert.ok(Math.abs(current[0] + mirroredX[0] - 256) <= 1)
      assert.ok(Math.abs(current[1] + mirroredY[1] - 256) <= 1)
      assert.equal(current[1], mirroredX[1])
      assert.equal(current[0], mirroredY[0])
    }
  }
})

test("depth changes the bevel band without displacing the flat interior", () => {
  const shallow = createDisplacementMap(100, 60, 12, 4)
  const deep = createDisplacementMap(100, 60, 12, 12)

  assert.deepEqual(pixel(shallow, 50, 6), [128, 128, 128, 255])
  assert.ok(pixel(deep, 50, 6)[1] < 128)
  assert.deepEqual(pixel(deep, 50, 15), [128, 128, 128, 255])
  assert.ok(pixel(deep, 50, 0)[1] < pixel(deep, 50, 6)[1])
  assert.ok(pixel(deep, 50, 6)[1] < pixel(deep, 50, 10)[1])
})

test("large maps stay bounded and preserve aspect ratio and CSS bevel width", () => {
  const map = createDisplacementMap(2048, 1024, 80, 20)
  assert.equal(map.width, 512)
  assert.equal(map.height, 256)
  assert.equal(map.pixels.length, 512 * 256 * 4)
  assert.ok(pixel(map, 256, 0)[1] < 128)
  assert.deepEqual(pixel(map, 256, 5), [128, 128, 128, 255])

  for (let index = 0; index < map.pixels.length; index += 4) {
    assert.ok(Number.isFinite(map.pixels[index]))
    assert.ok(Number.isFinite(map.pixels[index + 1]))
    assert.equal(map.pixels[index + 2], 128)
    assert.equal(map.pixels[index + 3], 255)
  }
})

test("square corners and zero depth remain valid", () => {
  const square = createDisplacementMap(40, 20, 0, 4)
  assert.ok(pixel(square, 0, 10)[0] < 128)
  assert.ok(pixel(square, 20, 0)[1] < 128)
  assert.deepEqual(pixel(square, 20, 10), [128, 128, 128, 255])

  const flat = createDisplacementMap(40, 20, 0, 0)
  for (let y = 0; y < flat.height; y++) {
    for (let x = 0; x < flat.width; x++) {
      assert.deepEqual(pixel(flat, x, y), [128, 128, 128, 255])
    }
  }
})

test("invalid geometry produces a finite bounded map", () => {
  for (const [width, height, radius, depth] of [
    [NaN, Infinity, NaN, Infinity],
    [-10, 0, -20, -1],
    [Number.MAX_VALUE, 1, 99999, 99999],
  ]) {
    const map = createDisplacementMap(width, height, radius, depth)
    assert.ok(map.width >= 1 && map.width <= 512)
    assert.ok(map.height >= 1 && map.height <= 512)
    assert.equal(map.pixels.length, map.width * map.height * 4)
    for (const channel of map.pixels) assert.ok(Number.isFinite(channel))
  }
})
