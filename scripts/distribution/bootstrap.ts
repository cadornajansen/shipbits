import { mkdir, readFile, writeFile } from "node:fs/promises"
import { resolve } from "node:path"
import {
  parseCsv,
  prepareRecord,
  type ImportBatch,
} from "../../features/distribution/import"
import { normalizeUrl } from "../../features/distribution/normalization"
import type { ChannelType, Json } from "../../features/distribution/types"

const sources = [
  {
    repo: "mezmer90/saas-directories",
    revision: "6e4ceb73db796261b2103f6abe169e1ba2099e6a",
    file: "saas-directories.csv",
    license: "CC BY 4.0",
    attribution:
      "SaaS Directories by mezmer90 / AI BrandFactory. Adapted by ShipBits through URL normalization and deduplication; no endorsement implied.",
  },
  {
    repo: "volodstaimi/Startup-Launch-List",
    revision: "63088c1789199fff0e41f17963e346fe9464e22c",
    file: "data/directories.json",
    license: "MIT",
    attribution:
      "Startup Launch List by volodstaimi and contributors. MIT copyright and permission notice retained in snapshots/LICENSE files.",
  },
  {
    repo: "whatsuppiyush/backlink-claude-skill",
    revision: "77183c0dba926624529619cf7688d905ef383c02",
    file: "data/directories.md",
    license: "MIT",
    attribution:
      "Backlink Claude Skill by whatsuppiyush and contributors. MIT copyright and permission notice retained in snapshots/LICENSE files.",
  },
]
const root = resolve("scripts/distribution")
await mkdir(resolve(root, "snapshots"), { recursive: true })
await mkdir(resolve(root, "batches"), { recursive: true })
const offline = process.argv.includes("--offline")
async function snapshot(
  repo: string,
  revision: string,
  path: string
): Promise<string> {
  const name = `${repo.replace("/", "--")}--${path.replaceAll("/", "--")}`
  if (offline) return readFile(resolve(root, "snapshots", name), "utf8")
  const response = await fetch(
    `https://raw.githubusercontent.com/${repo}/${revision}/${path}`,
    { signal: AbortSignal.timeout(20000) }
  )
  if (!response.ok) throw new Error(`${repo}/${path}: HTTP ${response.status}`)
  const text = await response.text()
  if (text.length > 5000000)
    throw new Error("Dataset is too large; inspect before importing")
  await writeFile(resolve(root, "snapshots", name), text)
  return text
}
function classify(category: string): ChannelType | null {
  const value = category
    .toLowerCase()
    .replace(/[^a-z /]/g, "")
    .trim()
  if (
    [
      "ai directory",
      "saas / startup directory",
      "startup directory",
      "ai directories",
      "general startup / saas directories",
      "b2b review sites",
    ].includes(value)
  )
    return "directory"
  if (value === "launch platforms") return "launch_platform"
  if (value === "communities") return "community"
  return null
}
function markdownRows(text: string): Record<string, string>[] {
  const rows: Record<string, string>[] = []
  let section = ""
  for (const line of text.split(/\r?\n/)) {
    if (line.startsWith("### ")) section = line.slice(4)
    if (!/^\| \[|^- \[/.test(line)) continue
    const link = line.match(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/)
    if (!link) continue
    const columns = line.split("|").map((column) => column.trim())
    rows.push({
      name: link[1],
      url: link[2],
      category: line.startsWith("|") ? section : "",
      submission_url:
        line.startsWith("|") && /^https?:\/\/\S+$/.test(columns[5] ?? "")
          ? columns[5]
          : "",
      original_line: line,
    })
  }
  return rows
}
const observedAt = new Date().toISOString()
const batches: ImportBatch[] = []
const rejected: { source: string; record: Json; error: string }[] = []
const report: {
  source: string
  revision: string
  candidates: number
  accepted: number
}[] = []
for (const source of sources) {
  const text = await snapshot(source.repo, source.revision, source.file)
  await snapshot(source.repo, source.revision, "LICENSE")
  const rows: Record<string, Json>[] = source.file.endsWith(".csv")
    ? parseCsv(text)
    : source.file.endsWith(".json")
      ? JSON.parse(text)
      : markdownRows(text)
  const accepted: ImportBatch["records"] = []
  rows.forEach((raw, index) => {
    try {
      const name = String(raw.name ?? "").trim()
      const url = normalizeUrl(String(raw.url ?? ""))
      const record: ImportBatch["records"][number] = {
        name,
        website_url: url.url,
        submission_url:
          typeof raw.submission_url === "string" && raw.submission_url
            ? normalizeUrl(raw.submission_url).url
            : null,
        channel_type: classify(String(raw.category ?? "")),
        source_record_id: `${source.file}:${index + 1}`,
        source_url: `https://github.com/${source.repo}/blob/${source.revision}/${source.file}`,
        observed_at: observedAt,
        raw_data: raw,
      }
      prepareRecord(record)
      accepted.push(record)
    } catch (error) {
      rejected.push({
        source: source.repo,
        record: raw,
        error: error instanceof Error ? error.message : "Invalid record",
      })
    }
  })
  report.push({
    source: source.repo,
    revision: source.revision,
    candidates: rows.length,
    accepted: accepted.length,
  })
  for (let start = 0; start < accepted.length; start += 100)
    batches.push({
      source: {
        name: source.repo,
        source_url: `https://github.com/${source.repo}`,
        license: source.license,
        attribution: source.attribution,
      },
      records: accepted.slice(start, start + 100),
    })
}
// Merge a known submission endpoint with an observed root listing of the SAME
// name/domain. Never collapse communities, tenant paths, or unrelated names.
const records = batches.flatMap((batch) => batch.records)
const nameKey = (name: string): string =>
  name.toLowerCase().replace(/[^a-z0-9]/g, "")
const roots = new Map<string, string>()
for (const record of records) {
  const url = new URL(normalizeUrl(record.website_url).canonical)
  if (url.pathname === "/" && !url.search)
    roots.set(`${url.hostname}:${nameKey(record.name)}`, record.website_url)
}
let consolidated = 0
for (const record of records) {
  const url = new URL(normalizeUrl(record.website_url).canonical)
  const existing = roots.get(`${url.hostname}:${nameKey(record.name)}`)
  if (
    existing &&
    /^\/(submit(?:[-/][a-z-]+)?|add[-/]?(?:url|site|startup|product)|posts\/new)\/?$/i.test(
      url.pathname
    )
  ) {
    record.website_url = existing
    consolidated++
  }
}
for (let index = 0; index < batches.length; index++)
  await writeFile(
    resolve(
      root,
      "batches",
      `batch-${String(index + 1).padStart(3, "0")}.json`
    ),
    JSON.stringify(batches[index], null, 2) + "\n"
  )
const unique = new Set(
  records.map((record) => prepareRecord(record).canonical_url)
)
const result = {
  observedAt,
  sources: report,
  candidates: report.reduce((sum, source) => sum + source.candidates, 0),
  accepted: records.length,
  rejected: rejected.length,
  unique: unique.size,
  duplicates: records.length - unique.size,
  submissionEndpointsConsolidated: consolidated,
  batches: batches.length,
  status: "unverified",
}
await writeFile(
  resolve(root, "bootstrap-report.json"),
  JSON.stringify(result, null, 2) + "\n"
)
await writeFile(
  resolve(root, "rejected-records.json"),
  JSON.stringify(rejected, null, 2) + "\n"
)
console.log(JSON.stringify(result, null, 2))
