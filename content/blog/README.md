# Publishing a ShipBits article

Add a UTF-8 `.md` file in this folder. The filename is for editors; the frontmatter `slug` is the public URL and must be unique. No CMS, HTML scripts, or executable MDX are supported.

```yaml
---
title: "A clear article title"
slug: "a-clear-article-title"
description: "A useful, short summary for the index and metadata."
publishedAt: "2026-08-30"
updatedAt: "2026-08-31" # optional; do not update just to appear fresh
author: "ShipBits editorial team"
category: "Launch"
cover: "/assets/article-cover.png" # optional; local path or HTTPS URL
draft: true
---
```

- Dates use `YYYY-MM-DD` and are interpreted in UTC. Future-dated articles and `draft: true` articles are never returned by public queries, metadata, or the sitemap.
- Change `draft` to `false` only when the article is ready. Redeploy after publishing or editing repository content. Production caches the article catalog for the lifetime of the deployment; development reloads files on the next request.
- The page renders the title as its H1. Use `##` and `###` headings in the body. The table of contents is generated from those ATX-style headings, with deterministic duplicate-safe anchors. Code-block headings are ignored.
- Reading time is a rough estimate of 200 words per minute, not a measurement.
- Use Markdown links to cite factual claims and useful related pages. Raw HTML is dropped. `react-markdown` keeps its default safe URL transformation; no `rehype-raw` or executable MDX is enabled.
- Covers are optional: no placeholder photo is needed to publish an honest text-first guide. Page metadata falls back to the site's shared image when no cover is supplied.
- Frontmatter errors and duplicate slugs fail the content read/build so that they cannot silently publish ambiguous pages.

Run the content tests with `pnpm exec tsx --test tests/blog-content.test.ts` before publishing.
