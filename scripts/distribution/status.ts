import { readFile } from "node:fs/promises"
import { distributionScriptClient } from "./client"
import {
  getStats,
  getTaxonomy,
  listChannels,
} from "../../features/distribution/repository"
import { parseFilters } from "../../features/distribution/validation"

const db = distributionScriptClient()
const linked = (await readFile("supabase/.temp/project-ref", "utf8")).trim()
const matches =
  new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname.split(".")[0] ===
  linked
console.log(JSON.stringify({ configuredDatabaseMatchesLinkedProject: matches }))
if (!matches)
  throw new Error(
    "Configured application database and linked migration target differ; inspect configuration before migrating."
  )
if (!process.argv.includes("--target-only")) {
  const [counts, taxonomy, firstPage, lastPage] = await Promise.all([
    getStats(db),
    getTaxonomy(db),
    listChannels(db, parseFilters({})),
    listChannels(db, parseFilters({ page: "100000" })),
  ])
  console.log(
    JSON.stringify(
      {
        counts,
        taxonomy: taxonomy.length,
        pageSize: firstPage.rows.length,
        lastPage: lastPage.page,
        lastPageRows: lastPage.rows.length,
      },
      null,
      2
    )
  )
}
