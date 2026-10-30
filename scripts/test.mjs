import { readdirSync } from "node:fs"
import { join } from "node:path"
import { spawnSync } from "node:child_process"

const files = ["components", "lib"]
  .flatMap((directory) =>
    readdirSync(directory, { recursive: true })
      .filter((file) => file.endsWith(".test.ts"))
      .map((file) => join(directory, file))
  )
  .sort()

if (files.length === 0) throw new Error("No test files found")

const result = spawnSync(
  process.execPath,
  ["--experimental-strip-types", "--test", ...files],
  { stdio: "inherit" }
)

if (result.error) throw result.error
process.exitCode = result.status ?? 1
