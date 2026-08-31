import { readdir, readFile, stat } from "node:fs/promises"
import path from "node:path"
import matter from "gray-matter"

const errors = []
const warnings = []
const root = process.cwd()

function error(message) {
  errors.push(message)
}

function warning(message) {
  warnings.push(message)
}

const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://shipbits.dev"
try {
  const url = new URL(configuredUrl)
  if (
    !/^https?:$/.test(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== "/"
  ) {
    error(
      "NEXT_PUBLIC_SITE_URL must be a credential-free HTTP(S) origin without a path."
    )
  }
  if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
    error("Production NEXT_PUBLIC_SITE_URL must use HTTPS.")
  }
} catch {
  error("NEXT_PUBLIC_SITE_URL is not a valid URL.")
}

const contentDirectory = path.join(root, "content", "blog")
const entries = await readdir(contentDirectory, { withFileTypes: true })
const slugs = new Set()
for (const entry of entries) {
  if (
    !entry.isFile() ||
    !/\.mdx?$/.test(entry.name) ||
    entry.name === "README.md"
  )
    continue
  const source = await readFile(path.join(contentDirectory, entry.name), "utf8")
  const { data, content } = matter(source)
  for (const field of [
    "title",
    "slug",
    "description",
    "publishedAt",
    "author",
    "category",
  ]) {
    if (typeof data[field] !== "string" || !data[field].trim())
      error(`${entry.name}: missing ${field}.`)
  }
  if (typeof data.draft !== "boolean")
    error(`${entry.name}: draft must be a boolean.`)
  if (
    typeof data.publishedAt === "string" &&
    !/^\d{4}-\d{2}-\d{2}$/.test(data.publishedAt)
  ) {
    error(`${entry.name}: publishedAt must use YYYY-MM-DD.`)
  }
  if (slugs.has(data.slug))
    error(`${entry.name}: duplicate blog slug ${data.slug}.`)
  slugs.add(data.slug)
  if (!content.trim()) error(`${entry.name}: article content is empty.`)
  if (typeof data.description === "string" && data.description.length < 50)
    warning(`${entry.name}: description is unusually short.`)
}

const staticRoutes = [
  "/",
  "/products",
  "/directory-submission",
  "/blog",
  "/resources",
  "/resources/seo-checker",
  "/privacy",
  "/terms",
  "/refund-policy",
]
if (new Set(staticRoutes).size !== staticRoutes.length)
  error("Duplicate canonical static route detected.")

const browserAssets = [
  "app/favicon.ico",
  "app/apple-icon.png",
  "public/icon-192x192.png",
  "public/icon-512x512.png",
  "public/branding/shipbits-preview.png",
]
for (const asset of browserAssets) {
  try {
    if ((await stat(path.join(root, asset))).size === 0)
      error(`${asset}: asset is empty.`)
  } catch {
    error(`${asset}: required browser asset is missing.`)
  }
}

const manifestSource = await readFile(
  path.join(root, "app", "manifest.ts"),
  "utf8"
)
for (const asset of ["/icon-192x192.png", "/icon-512x512.png"]) {
  if (!manifestSource.includes(asset)) error(`manifest.ts: missing ${asset}.`)
}

const siteSource = await readFile(path.join(root, "lib", "site.ts"), "utf8")
if (
  !siteSource.includes(
    'DEFAULT_OG_IMAGE_PATH = "/branding/shipbits-preview.png"'
  )
) {
  error(
    "site.ts: the default social image must use the ShipBits preview asset."
  )
}

const categorySource = await readFile(
  path.join(root, "lib", "seo", "categories.ts"),
  "utf8"
)
for (const slug of [
  "developer-tools",
  "education",
  "productivity",
  "saas",
  "seo",
]) {
  if (
    !categorySource.includes(`${slug}:`) &&
    !categorySource.includes(`"${slug}":`)
  ) {
    warning(`High-value category ${slug} has no curated SEO description.`)
  }
}

for (const message of warnings) console.warn(`WARN: ${message}`)
for (const message of errors) console.error(`ERROR: ${message}`)
console.log(
  `SEO audit checked ${slugs.size} blog articles and ${staticRoutes.length} canonical static routes.`
)
if (errors.length) process.exitCode = 1
else console.log(`SEO audit passed with ${warnings.length} warning(s).`)
