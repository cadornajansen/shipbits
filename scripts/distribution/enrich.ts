import { z } from "zod"
import { runDistributionEnrichment } from "../../features/distribution/enrichment/run"
import { distributionScriptClient } from "./client"

const args = process.argv.slice(2)
const valueAfter = (flag: string) => {
  const index = args.indexOf(flag)
  return index < 0 ? undefined : args[index + 1]
}
const limitValue = valueAfter("--limit")
const channelValue = valueAfter("--channel-id")
const limit = limitValue ? z.coerce.number().int().positive().parse(limitValue) : undefined
const channelId = channelValue ? z.uuid().parse(channelValue) : undefined

const report = await runDistributionEnrichment(distributionScriptClient(), {
  dryRun: args.includes("--dry-run"),
  limit,
  channelId,
})
console.log(JSON.stringify(report, null, 2))
