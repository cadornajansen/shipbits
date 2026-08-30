import { load } from "cheerio"

export type SeoCheckStatus = "pass" | "warning" | "fail"
export type SeoCheck = { id: string; title: string; status: SeoCheckStatus; detail: string }
export type FileProbe = "found" | "missing" | "unavailable"
export type SeoCheckerResult = {
  url: string
  score: number
  passed: number
  warnings: number
  failures: number
  checks: SeoCheck[]
}

type ScoringInput = {
  html: string
  url: string
  robots: FileProbe
  sitemap: FileProbe
  indexingBlocked?: boolean
}

function text(value: string | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim()
}

function isHttpReference(value: string, base: string): boolean {
  if (!value) return false
  try {
    const url = new URL(value, base)
    return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password
  } catch {
    return false
  }
}

function presence(id: string, title: string, found: boolean, missing: string): SeoCheck {
  return { id, title, status: found ? "pass" : "fail", detail: found ? "Present in the fetched HTML." : missing }
}

function metadataCheck(id: string, title: string, value: string, min: number, max: number): SeoCheck {
  if (!value) return { id, title, status: "fail", detail: `Add a descriptive ${title.toLowerCase()} to this page.` }
  const comfortable = value.length >= min && value.length <= max
  return {
    id,
    title,
    status: comfortable ? "pass" : "warning",
    detail: `${value.length} characters. ${comfortable ? "Within" : "Outside"} our ${min}–${max} character review range. This is a writing heuristic, not a search-engine limit.`,
  }
}

function fileCheck(id: string, title: string, state: FileProbe): SeoCheck {
  return {
    id,
    title,
    status: state === "found" ? "pass" : "warning",
    detail: state === "found"
      ? "A readable file was found on this origin. Its full contents were not audited."
      : state === "missing"
        ? "No recognizable file was found at the checked location. This alone does not prevent indexing."
        : "Could not verify this file within the checker's safety and time limits. Review it manually.",
  }
}

export function scoreSeoPage({ html, url, robots, sitemap, indexingBlocked = false }: ScoringInput): SeoCheckerResult {
  const $ = load(html)
  const metas = new Map<string, string>()
  $("head meta").each((_index, element) => {
    const name = text($(element).attr("name") ?? $(element).attr("property")).toLowerCase()
    if (name && !metas.has(name)) metas.set(name, text($(element).attr("content")))
  })

  const links = $("head link").toArray()
  const canonicalLinks = links.filter((element) => text($(element).attr("rel")).toLowerCase().split(" ").includes("canonical"))
  const canonical = text($(canonicalLinks[0]).attr("href"))
  const favicon = links.some((element) => {
    const rel = text($(element).attr("rel")).toLowerCase().split(" ")
    const href = text($(element).attr("href"))
    return (rel.includes("icon") || rel.includes("apple-touch-icon")) &&
      (isHttpReference(href, url) || /^data:image\/(?:png|svg\+xml|x-icon|vnd\.microsoft\.icon);/i.test(href))
  })

  let validStructuredData = false
  let invalidStructuredData = false
  $('script[type="application/ld+json"]').each((_index, element) => {
    try {
      const value: unknown = JSON.parse($(element).text())
      const objects: unknown[] = Array.isArray(value) ? value : [value]
      if (objects.some((item) => item && typeof item === "object" && ("@type" in item || "@graph" in item))) {
        validStructuredData = true
      } else invalidStructuredData = true
    } catch {
      invalidStructuredData = true
    }
  })
  const hasMicrodata = $("[itemscope][itemtype], [vocab][typeof]").length > 0
  const h1s = $("h1").toArray().filter((element) => text($(element).text()))
  const canonicalCheck = presence("canonical", "Canonical URL", isHttpReference(canonical, url), "Add a canonical link with a valid http/https URL.")
  if (canonicalCheck.status === "pass" && canonicalLinks.length !== 1) {
    canonicalCheck.status = "warning"
    canonicalCheck.detail = "Multiple canonical links were found. Make the preferred URL unambiguous."
  }

  const robotsCheck = fileCheck("robots", "Robots.txt / crawler access", robots)
  const noindex = [...metas.entries()].some(([key, value]) =>
    ["robots", "googlebot"].includes(key) && /(?:^|[\s,])(?:noindex|none)(?:$|[\s,])/i.test(value)
  )
  if (noindex || indexingBlocked) {
    robotsCheck.status = "fail"
    robotsCheck.detail = "A noindex directive or a site-wide crawler block was found. Confirm this is intentional before launch."
  }

  const structuredDataCheck: SeoCheck = {
    id: "structured-data",
    title: "Basic structured data",
    status: invalidStructuredData ? "warning" : validStructuredData || hasMicrodata ? "pass" : "warning",
    detail: invalidStructuredData
      ? "A JSON-LD block is malformed or lacks a recognizable type. Validate it separately."
      : validStructuredData || hasMicrodata
        ? "Structured data markup was found. This is a presence check, not schema or rich-result validation."
        : "No JSON-LD or basic microdata was found. Add only structured data that truthfully describes the page.",
  }

  const checks: SeoCheck[] = [
    { id: "https", title: "HTTPS", status: new URL(url).protocol === "https:" ? "pass" : "fail", detail: new URL(url).protocol === "https:" ? "The final page uses HTTPS." : "Serve the page securely over HTTPS." },
    metadataCheck("title", "Page title", text($("head title").first().text()), 15, 65),
    metadataCheck("description", "Meta description", metas.get("description") ?? "", 50, 170),
    canonicalCheck,
    presence("og-title", "Open Graph title", Boolean(metas.get("og:title")), "Add og:title for a useful link preview."),
    presence("og-description", "Open Graph description", Boolean(metas.get("og:description")), "Add og:description for a useful link preview."),
    presence("og-image", "Open Graph image", isHttpReference(metas.get("og:image") ?? metas.get("og:image:url") ?? "", url), "Add an og:image URL. This checker does not download or validate the image."),
    { id: "favicon", title: "Favicon", status: favicon ? "pass" : "warning", detail: favicon ? "An icon link is declared in the HTML. The image itself was not downloaded." : "No icon link was found. A default /favicon.ico may still exist; add an explicit icon link for clarity." },
    { id: "h1", title: "Main heading", status: h1s.length === 1 ? "pass" : h1s.length ? "warning" : "fail", detail: h1s.length === 1 ? "One non-empty h1 was found." : h1s.length ? `${h1s.length} h1 headings found. Check that the page hierarchy is clear.` : "No non-empty h1 was found in the fetched HTML." },
    structuredDataCheck,
    robotsCheck,
    fileCheck("sitemap", "Sitemap discoverability", sitemap),
  ]

  return {
    url,
    score: Math.round(checks.reduce((total, check) => total + (check.status === "pass" ? 1 : check.status === "warning" ? 0.5 : 0), 0) / checks.length * 100),
    passed: checks.filter((check) => check.status === "pass").length,
    warnings: checks.filter((check) => check.status === "warning").length,
    failures: checks.filter((check) => check.status === "fail").length,
    checks,
  }
}
