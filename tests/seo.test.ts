import assert from "node:assert/strict"
import { readFile, stat } from "node:fs/promises"
import path from "node:path"
import test from "node:test"

import { getCategoryDescription } from "../lib/seo/categories"
import { createPageMetadata, serializeJsonLd } from "../lib/seo/metadata"
import { breadcrumbJsonLd } from "../lib/seo/structured-data"
import { absoluteUrl, canonicalUrl } from "../lib/site"

test("JSON-LD serialization escapes script-sensitive product content", () => {
  const serialized = serializeJsonLd({
    name: `A & B </script><script>alert("x")</script>`,
  })
  assert.doesNotMatch(serialized, /[<>&]/)
  assert.match(serialized, /\\u003c\/script\\u003e/)
  assert.deepEqual(JSON.parse(serialized), {
    name: `A & B </script><script>alert("x")</script>`,
  })
})

test("page metadata keeps pagination self-canonical and search states noindex", () => {
  const paginated = createPageMetadata({
    title: "Products, page 2",
    description: "Published products on page 2.",
    path: "/products?page=2",
  })
  assert.equal(paginated.alternates?.canonical, absoluteUrl("/products?page=2"))
  assert.equal(
    paginated.robots && typeof paginated.robots === "object"
      ? paginated.robots.index
      : undefined,
    true
  )

  const search = createPageMetadata({
    title: "Search: example",
    description: "Product search results.",
    path: "/products?q=example",
    noIndex: true,
  })
  assert.equal(
    search.robots && typeof search.robots === "object"
      ? search.robots.index
      : undefined,
    false
  )
})

test("category descriptions are curated where available and useful otherwise", () => {
  assert.match(
    getCategoryDescription({
      name: "Developer Tools",
      slug: "developer-tools",
    }),
    /APIs/
  )
  assert.equal(
    getCategoryDescription({ name: "Robotics", slug: "robotics" }),
    "Explore robotics products, tools, and software organized by their primary use case."
  )
})

test("breadcrumb data uses canonical absolute item URLs", () => {
  const data = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Products", path: "/products" },
  ])
  assert.equal(data.itemListElement[1].position, 2)
  assert.equal(data.itemListElement[1].item, absoluteUrl("/products"))
})

test("canonical URLs remove tracking data without changing real pagination", () => {
  assert.equal(
    canonicalUrl(
      "/products/?page=2&utm_source=newsletter&fbclid=example#directory"
    ),
    absoluteUrl("/products?page=2")
  )
})

test("browser icon assets and manifest references are present", async () => {
  const root = process.cwd()
  for (const asset of [
    "app/favicon.ico",
    "app/apple-icon.png",
    "public/icon-192x192.png",
    "public/icon-512x512.png",
    "public/branding/shipbits-preview.png",
  ]) {
    assert.ok(
      (await stat(path.join(root, asset))).size > 0,
      `${asset} should not be empty`
    )
  }

  const manifest = await readFile(path.join(root, "app", "manifest.ts"), "utf8")
  assert.match(manifest, /icon-192x192\.png/)
  assert.match(manifest, /icon-512x512\.png/)
})
