import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"
import ts from "typescript"

import type {
  Control,
  ControlGroup,
  MaterialKind,
  MaterialPreset,
  MaterialSettings,
} from "./types"

function moduleUrl(source: string): string {
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
    },
  })
  return `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
}

// Load the actual pure helpers in memory: Node does not resolve the app's @ alias.
const typesUrl = moduleUrl(
  await readFile(new URL("./types.ts", import.meta.url), "utf8")
)
const { materialUniforms }: typeof import("./types") = await import(typesUrl)

interface MaterialFixture {
  name: MaterialKind
  defaults: MaterialSettings
  groups: ControlGroup[]
  presets: MaterialPreset[]
  normalize: (input: Partial<MaterialSettings>) => MaterialSettings
  shader: string
}

async function loadFixture(name: MaterialKind): Promise<MaterialFixture> {
  const source = await readFile(
    new URL(`./${name}.ts`, import.meta.url),
    "utf8"
  )
  const resolved = source.replace(
    /from\s+["'](?:@\/lib\/materials\/types|\.\/types)["']/g,
    `from "${typesUrl}"`
  )
  const loaded: Record<string, unknown> = await import(moduleUrl(resolved))
  const capitalized = name[0].toUpperCase() + name.slice(1)
  return {
    name,
    defaults: loaded[`default${capitalized}Settings`] as MaterialSettings,
    groups: loaded[`${name}ControlGroups`] as ControlGroup[],
    presets: loaded[`${name}Presets`] as MaterialPreset[],
    normalize: loaded[
      `normalize${capitalized}Settings`
    ] as MaterialFixture["normalize"],
    shader: await readFile(
      new URL(`../shaders/${name}.ts`, import.meta.url),
      "utf8"
    ),
  }
}

const materialNames: MaterialKind[] = ["foil", "titanium"]
const fixtures = await Promise.all(materialNames.map(loadFixture))

type UniformSignature = { type: string; precision: string }

function uniformSignatures(source: string): Map<string, UniformSignature> {
  const declarations = source.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, "")
  const floatPrecision = declarations.match(
    /precision\s+(lowp|mediump|highp)\s+float\s*;/
  )?.[1]
  assert.ok(
    floatPrecision,
    "Shader must declare its default floating-point precision"
  )
  const uniforms = new Map<string, UniformSignature>()
  for (const match of declarations.matchAll(
    /uniform\s+(?:(lowp|mediump|highp)\s+)?(float|vec[234]|mat[234])\s+(\w+)\s*;/g
  )) {
    uniforms.set(match[3], {
      type: match[2],
      precision: match[1] ?? floatPrecision,
    })
  }
  return uniforms
}

// Inspect the installed renderer's actual vertex contract, not a hand-maintained list.
const paperEntry = import.meta.resolve("@paper-design/shaders")
const paperVertex = await readFile(
  new URL("./vertex-shader.js", paperEntry),
  "utf8"
)
const paperUniforms = uniformSignatures(paperVertex)
assert.ok(
  paperUniforms.has("u_resolution"),
  "Paper's vertex shader exposes resolution"
)

function assertValid(settings: MaterialSettings, controls: Control[]): void {
  for (const control of controls) {
    const value = settings[control.key]
    if (control.kind === "color") {
      assert.equal(typeof value, "string", control.key)
      assert.match(value as string, /^#[0-9a-f]{6}$/, control.key)
    } else if (control.kind === "select") {
      assert.ok(
        control.options?.some((option) => option.value === value),
        control.key
      )
    } else {
      assert.equal(typeof value, "number", control.key)
      assert.ok(Number.isFinite(value), control.key)
      assert.ok((value as number) >= control.min!, control.key)
      assert.ok((value as number) <= control.max!, control.key)
    }
  }
}

for (const fixture of fixtures) {
  const { name, defaults, groups, presets, normalize, shader } = fixture
  const controls = groups.flatMap((group) => group.controls)

  test(`${name}: shared uniforms match Paper's vertex types and precision`, () => {
    const fragmentUniforms = uniformSignatures(shader)
    assert.ok(fragmentUniforms.has("u_resolution"))
    for (const [uniform, vertexSignature] of paperUniforms) {
      const fragmentSignature = fragmentUniforms.get(uniform)
      if (fragmentSignature) {
        assert.deepEqual(
          fragmentSignature,
          vertexSignature,
          `${uniform} must match across shader stages to link`
        )
      }
    }
  })

  test(`${name}: material settings cannot overwrite Paper's vertex uniforms`, () => {
    const settingsUniforms = materialUniforms(normalize({}), groups)
    for (const uniform of Object.keys(settingsUniforms)) {
      assert.equal(
        paperUniforms.has(uniform),
        false,
        `${uniform} is owned by Paper; use a material-specific setting name`
      )
    }
  })

  test(`${name}: controls cover every setting once and match shader input types`, () => {
    const keys = controls.map((control) => control.key)
    assert.equal(new Set(keys).size, keys.length)
    assert.deepEqual([...keys].sort(), Object.keys(defaults).sort())
    for (const control of controls) {
      assert.ok(control.label.length > 0)
      if (control.kind === "select") {
        const values = control.options?.map((option) => option.value) ?? []
        assert.ok(values.length > 1, control.key)
        assert.equal(new Set(values).size, values.length, control.key)
      } else if (control.kind !== "color") {
        assert.ok(Number.isFinite(control.min), control.key)
        assert.ok(Number.isFinite(control.max), control.key)
        assert.ok(control.max! > control.min!, control.key)
        assert.ok(
          Number.isFinite(control.step) && control.step! > 0,
          control.key
        )
      }
      // Speed is consumed by ShaderMount's clock instead of a shader uniform.
      if (control.key !== "speed") {
        const type = control.kind === "color" ? "vec3" : "float"
        assert.match(
          shader,
          new RegExp(`uniform\\s+${type}\\s+u_${control.key}\\s*;`)
        )
      }
    }
    assertValid(defaults, controls)
  })

  test(`${name}: defaults and presets are valid, stable, and copied without mutation`, () => {
    const defaultsBefore = structuredClone(defaults)
    const presetsBefore = structuredClone(presets)
    const initial = normalize({})
    assert.deepEqual(initial, defaults)
    assert.notEqual(initial, defaults)
    assert.ok(presets.length >= 3)
    assert.equal(
      new Set(presets.map((preset) => preset.name)).size,
      presets.length
    )
    for (const preset of presets) {
      const normalized = normalize(preset.settings)
      assertValid(normalized, controls)
      assert.deepEqual(normalized, preset.settings, preset.name)
      assert.deepEqual(normalize(normalized), normalized, preset.name)
      assert.notEqual(normalized, preset.settings, preset.name)
    }
    assert.deepEqual(defaults, defaultsBefore)
    assert.deepEqual(presets, presetsBefore)
  })

  test(`${name}: numeric inputs clamp finite extremes and reject nonfinite values`, () => {
    for (const control of controls.filter(
      (item) => !item.kind || item.kind === "range"
    )) {
      const { key, min, max } = control
      const span = max! - min!
      assert.equal(normalize({ [key]: min! - span })[key], min, key)
      assert.equal(normalize({ [key]: max! + span })[key], max, key)
      for (const invalid of [NaN, Infinity, -Infinity, "not a number"]) {
        assert.equal(normalize({ [key]: invalid })[key], defaults[key], key)
      }
      const precise = min! + span * 0.4137
      assert.equal(normalize({ [key]: precise })[key], precise, key)
    }
  })

  test(`${name}: colors and choices accept only supported values`, () => {
    for (const control of controls) {
      const { key } = control
      if (control.kind === "color") {
        for (const invalid of [
          "",
          "red",
          "#fff",
          "#ffffffff",
          "#gggggg",
          "url(example)",
          123,
        ]) {
          assert.equal(normalize({ [key]: invalid })[key], defaults[key], key)
        }
        assert.equal(normalize({ [key]: "#AbCdEf" })[key], "#abcdef", key)
      } else if (control.kind === "select") {
        for (const invalid of ["", "unknown-choice", -1, 999]) {
          assert.equal(normalize({ [key]: invalid })[key], defaults[key], key)
        }
        for (const option of control.options!) {
          assert.equal(
            normalize({ [key]: option.value })[key],
            option.value,
            key
          )
        }
      }
    }
    const input = { unrecognizedSetting: "ignored", lightAngle: 123 }
    const before = structuredClone(input)
    const normalized = normalize(input)
    assert.equal(Object.hasOwn(normalized, "unrecognizedSetting"), false)
    assert.deepEqual(input, before)
  })

  test(`${name}: every control translates into a finite GPU uniform`, () => {
    const input: Partial<MaterialSettings> = {}
    for (const control of controls) {
      if (control.kind === "color") input[control.key] = "#8040ff"
      else if (control.kind === "select")
        input[control.key] = control.options!.at(-1)!.value
      else
        input[control.key] = control.min! + (control.max! - control.min!) * 0.37
    }
    const settings = normalize(input)
    const uniforms = materialUniforms(settings, groups)
    assert.deepEqual(
      Object.keys(uniforms).sort(),
      controls.map((control) => `u_${control.key}`).sort()
    )
    for (const control of controls) {
      const value = uniforms[`u_${control.key}`]
      if (control.kind === "color") {
        assert.deepEqual(value, [128 / 255, 64 / 255, 1], control.key)
      } else if (control.kind === "select") {
        assert.equal(value, control.options!.length - 1, control.key)
      } else {
        assert.equal(value, settings[control.key], control.key)
      }
      for (const channel of Array.isArray(value) ? value : [value]) {
        assert.ok(Number.isFinite(channel), control.key)
      }
    }
  })
}
