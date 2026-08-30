import assert from "node:assert/strict"
import path from "node:path"
import test from "node:test"

import {
  findPublishedArticle,
  getArticleHeadings,
  parseArticle,
  publishedArticles,
  readArticleFiles,
} from "../features/blog/content"

function fixture(overrides: Record<string, unknown> = {}, content = "## Useful steps\n\nDo a useful thing.") {
  return `---\n${Object.entries({
    title: "A useful guide",
    slug: "useful-guide",
    description: "A useful description of the guide.",
    publishedAt: "2026-08-20",
    author: "ShipBits editorial team",
    category: "Launch",
    draft: false,
    ...overrides,
  }).map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join("\n")}\n---\n${content}`
}

test("frontmatter produces typed metadata, content, and reading time", () => {
  const article = parseArticle(fixture(), "guide.md")
  assert.equal(article.slug, "useful-guide")
  assert.equal(article.readingMinutes, 1)
  assert.equal(article.headings[0].id, "useful-steps")
  assert.ok(article.content.includes("Do a useful thing"))
})

test("draft and future articles are hidden from lists and direct slug lookups", () => {
  const articles = [
    parseArticle(fixture(), "guide.md"),
    parseArticle(fixture({ slug: "private-draft", draft: true }), "draft.md"),
    parseArticle(fixture({ slug: "future-guide", publishedAt: "2027-01-01" }), "future.md"),
  ]
  const now = new Date("2026-08-30T12:00:00Z")
  assert.deepEqual(publishedArticles(articles, now).map((article) => article.slug), ["useful-guide"])
  assert.equal(findPublishedArticle(articles, "private-draft", now), null)
  assert.equal(findPublishedArticle(articles, "future-guide", now), null)
  assert.equal(findPublishedArticle(articles, "useful-guide", now)?.slug, "useful-guide")
})

test("route slugs cannot become filesystem traversal or unpublished metadata", () => {
  const articles = [parseArticle(fixture(), "guide.md")]
  for (const slug of ["../../.env.local", "%2e%2e", "useful-guide.md", "useful/guide", ""])
    assert.equal(findPublishedArticle(articles, slug), null)
})

test("publication checks respect the date even when the raw catalog is cached", () => {
  const article = parseArticle(fixture({ publishedAt: "2026-08-31" }), "guide.md")
  assert.equal(publishedArticles([article], new Date("2026-08-30T23:59:59Z")).length, 0)
  assert.equal(publishedArticles([article], new Date("2026-08-31T00:00:00Z")).length, 1)
})

test("invalid frontmatter fails clearly rather than silently publishing", () => {
  assert.throws(() => parseArticle(fixture({ slug: "../invalid" }), "bad.md"), /Invalid blog frontmatter/)
  assert.throws(() => parseArticle(fixture({ publishedAt: "2026-02-30" }), "bad.md"), /valid calendar date/)
  assert.throws(() => parseArticle(fixture({ updatedAt: "2026-01-01" }), "bad.md"), /cannot precede/)
  assert.throws(() => parseArticle(fixture({ cover: "javascript:alert(1)" }), "bad.md"), /Cover must/)
  assert.throws(() => parseArticle(fixture({ draft: "false" }), "bad.md"), /Invalid blog frontmatter/)
  assert.throws(() => parseArticle(fixture({}, ""), "bad.md"), /no content/)
})

test("heading anchors are deterministic, unique, and ignore fenced code", () => {
  const markdown = "## First *steps*\n\n```md\n## Not a heading\n```\n\n## First steps\n### First steps 2\n## First steps\n\n~~~\n## Also code\n~~~\n## Café basics"
  const headings = getArticleHeadings(markdown)
  assert.deepEqual(headings.map((heading) => heading.id), ["first-steps", "first-steps-2", "first-steps-2-2", "first-steps-3", "cafe-basics"])
  assert.deepEqual(getArticleHeadings(markdown), headings)
  assert.equal(headings[0].line, 1)
  assert.equal(headings[2].depth, 3)
})

test("all four starter articles validate and include useful internal and primary-source links", async () => {
  const articles = await readArticleFiles(path.join(process.cwd(), "content", "blog"))
  assert.equal(articles.length, 4)
  assert.equal(publishedArticles(articles, new Date("2026-08-30T12:00:00Z")).length, 4)
  assert.equal(new Set(articles.map((article) => article.slug)).size, 4)
  for (const article of articles) {
    assert.ok(article.wordCount > 500, `${article.slug} needs substantive content`)
    assert.ok(article.headings.length >= 3)
    assert.match(article.content, /\]\(\/(blog|resources|products|categories)/)
    assert.match(article.content, /https:\/\/(developers\.google\.com|help\.producthunt\.com|news\.ycombinator\.com)/)
  }
})
