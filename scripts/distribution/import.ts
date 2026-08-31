import { readFile, readdir } from "node:fs/promises"
import { resolve } from "node:path"
import {
  batchSchema,
  importBatch,
  prepareRecord,
} from "../../features/distribution/import"
import { distributionScriptClient } from "./client"

const argument = process.argv[2]
if (!argument)
  throw new Error(
    "Usage: pnpm distribution:import <batch-001|all|path.json> [--dry-run]"
  )
const dryRun = process.argv.includes("--dry-run")
const folder = resolve("scripts/distribution/batches")
const files =
  argument === "all"
    ? (await readdir(folder))
        .filter((file) => /^batch-.*\.json$/.test(file))
        .sort()
        .map((file) => resolve(folder, file))
    : [
        argument.endsWith(".json")
          ? resolve(argument)
          : resolve(folder, `${argument}.json`),
      ]
// Validate every selected batch before the first write.
const batches = await Promise.all(
  files.map(async (file) =>
    batchSchema.parse(JSON.parse(await readFile(file, "utf8")))
  )
)
const unique = new Set(
  batches.flatMap((batch) =>
    batch.records.map((record) => prepareRecord(record).canonical_url)
  )
)
if (dryRun) {
  console.log(
    JSON.stringify(
      {
        batches: batches.length,
        candidates: batches.reduce(
          (sum, batch) => sum + batch.records.length,
          0
        ),
        uniqueInFiles: unique.size,
        databaseWrites: 0,
      },
      null,
      2
    )
  )
} else {
  const db = distributionScriptClient()
  let inserted = 0
  let observations = 0
  let processed = 0
  for (let index = 0; index < batches.length; index++) {
    const result = await importBatch(db, batches[index])
    inserted += result.inserted
    observations += result.observations
    processed += result.processed
    console.log(
      `${index + 1}/${batches.length}: ${result.inserted} new channels, ${result.observations} new source observations`
    )
  }
  const counts = await Promise.all(
    ["active", "unverified", "broken"].map(async (status) => {
      const { count, error } = await db
        .from("distribution_channels")
        .select("id", { count: "exact", head: true })
        .eq("status", status)
        .is("archived_at", null)
      if (error) throw error
      return [status, count]
    })
  )
  console.log(
    JSON.stringify(
      {
        processed,
        inserted,
        observations,
        uniqueInFiles: unique.size,
        counts: Object.fromEntries(counts),
      },
      null,
      2
    )
  )
}
