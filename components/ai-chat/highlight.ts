import type { ThemedToken } from "shiki"

const cache = new Map<string, Promise<ThemedToken[][]>>()
const languages = {
  tsx: () => import("shiki/langs/tsx.mjs"),
  typescript: () => import("shiki/langs/typescript.mjs"),
  javascript: () => import("shiki/langs/javascript.mjs"),
  json: () => import("shiki/langs/json.mjs"),
  css: () => import("shiki/langs/css.mjs"),
  bash: () => import("shiki/langs/bash.mjs"),
  diff: () => import("shiki/langs/diff.mjs"),
  markdown: () => import("shiki/langs/markdown.mjs"),
}

async function createHighlighter() {
  const [{ createHighlighterCore }, { createJavaScriptRegexEngine }] =
    await Promise.all([import("shiki/core"), import("shiki/engine/javascript")])
  return createHighlighterCore({
    themes: [import("shiki/themes/github-dark.mjs")],
    langs: [],
    engine: createJavaScriptRegexEngine(),
  })
}
let highlighter: ReturnType<typeof createHighlighter> | undefined

export function highlight(
  code: string,
  language: string
): Promise<ThemedToken[][]> {
  const lang =
    language === "ts"
      ? "typescript"
      : language === "js"
        ? "javascript"
        : language === "sh"
          ? "bash"
          : language
  const key = `${lang}\0${code}`
  const existing = cache.get(key)
  if (existing) return existing
  const promise = (async () => {
    highlighter ??= createHighlighter()
    const engine = await highlighter
    const load: (() => Promise<unknown>) | undefined = Object.hasOwn(
      languages,
      lang
    )
      ? languages[lang as keyof typeof languages]
      : undefined
    if (load && !engine.getLoadedLanguages().includes(lang))
      await engine.loadLanguage(
        await languages[lang as keyof typeof languages]()
      )
    return engine.codeToTokens(code, {
      lang: load ? lang : "text",
      theme: "github-dark",
    }).tokens
  })()
  if (cache.size >= 32) cache.delete(cache.keys().next().value!)
  cache.set(key, promise)
  void promise.catch(() => {
    cache.delete(key)
    highlighter = undefined
  })
  return promise
}
