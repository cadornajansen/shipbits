import type { Directory } from "./types"

const topicTerms: Record<string, RegExp> = {
  ai: /\b(ai|artificial intelligence|machine learning|llm|chatbot|code generation)\b/i,
  developer:
    /\b(developer|development|api|code|debugging|devops|database|infrastructure)\b/i,
  productivity:
    /\b(productivity|notes|note taking|tasks|project management|time tracking)\b/i,
  open_source: /\bopen[ -]source\b/i,
}

// Pure ranking core; called only by server workflows, never trusted as client input.
export function matchDirectories(
  directories: Directory[],
  category: string,
  tags: string[],
  target: number,
  excluded: string[] = []
): Directory[] {
  const text = [category, ...tags].join(" ")
  const relevant = new Set(
    Object.entries(topicTerms)
      .filter(([, pattern]) => pattern.test(text))
      .map(([topic]) => topic)
  )
  const excludedIds = new Set(excluded)
  const score = (directory: Directory): number =>
    directory.topics.filter((topic) => relevant.has(topic)).length
  return directories
    .filter(
      (directory) =>
        directory.is_active &&
        !excludedIds.has(directory.id) &&
        (score(directory) > 0 ||
          directory.topics.some((topic) =>
            ["general", "startup", "saas"].includes(topic)
          ))
    )
    .sort(
      (a, b) =>
        score(b) - score(a) ||
        b.priority - a.priority ||
        a.slug.localeCompare(b.slug, "en")
    )
    .slice(0, Math.max(0, Math.floor(target)))
}
