import { z } from "zod"
import { verifyChannels } from "../../features/distribution/verification"
import { distributionScriptClient } from "./client"

const args = process.argv.slice(2)
const ids = args
  .filter((arg) => !arg.startsWith("--"))
  .map((id) => z.uuid().parse(id))
if (ids.length > 100) throw new Error("Select at most 100 IDs per command.")
const db = distributionScriptClient()
let checked = 0
let unhealthy = 0
let failures = 0
// Default: one bounded stale batch. --all-stale drains the eligible catalog.
do {
  const selected = ids.splice(0, 10)
  const result = await verifyChannels(
    db,
    { ids: selected, stale: !selected.length },
    null
  )
  checked += result.checked
  unhealthy += result.unhealthy
  failures += result.failed.length
  console.log(JSON.stringify(result))
  if (!result.claimed || result.failed.length) break
  if (!ids.length && !args.includes("--all-stale")) break
} while (true)
console.log(JSON.stringify({ checked, unhealthy, failures }))
if (failures) process.exitCode = 1
