import { classifyChannel } from "../../features/distribution/classification"
import type { Channel, DistributionTag } from "../../features/distribution/types"
import { distributionScriptClient } from "./client"

const args = new Set(process.argv.slice(2))
const dryRun = args.has("--dry-run")
const limitIndex = process.argv.indexOf("--limit")
const limit = limitIndex >= 0 ? Number(process.argv[limitIndex + 1]) : undefined
const channelIndex = process.argv.indexOf("--channel-id")
const channelId = channelIndex >= 0 ? process.argv[channelIndex + 1] : undefined

if (limit !== undefined && (!Number.isInteger(limit) || limit < 1 || limit > 1000)) throw new Error("--limit must be an integer from 1 to 1000")
if (channelId && !/^[0-9a-f-]{36}$/i.test(channelId)) throw new Error("--channel-id must be a UUID")

const db = distributionScriptClient()
let channelsQuery = db
  .from("distribution_channels")
  .select("id,name,description,canonical_url,channel_type")
  .is("archived_at", null)
  .order("id")
if (channelId) channelsQuery = channelsQuery.eq("id", channelId)
if (limit) channelsQuery = channelsQuery.limit(limit)

const [{ data: channels, error: channelsError }, { data: taxonomy, error: taxonomyError }, { data: overrides, error: overridesError }] = await Promise.all([
  channelsQuery,
  db.from("distribution_tags").select("id,type,slug,name").order("type").order("slug"),
  db.from("distribution_channel_field_overrides").select("channel_id").eq("field_name", "tags"),
])
if (channelsError || taxonomyError || overridesError) throw new Error(channelsError?.message ?? taxonomyError?.message ?? overridesError?.message)

const owned = new Set((overrides ?? []).map((row) => row.channel_id as string))
const assignments = (channels as Pick<Channel, "id" | "name" | "description" | "canonical_url" | "channel_type">[])
  .filter((channel) => !owned.has(channel.id))
  .map((channel) => ({
    channel_id: channel.id,
    name: channel.name,
    tags: classifyChannel(channel, taxonomy as DistributionTag[]).map((classified) => ({
      tag_id: classified.tag_id,
      relevance_score: classified.relevance_score,
      confidence_score: classified.confidence_score,
    })),
  }))

const summary = {
  dryRun,
  scanned: channels?.length ?? 0,
  skippedAdminOwned: (channels ?? []).filter((channel) => owned.has(channel.id as string)).length,
  classified: assignments.filter((assignment) => assignment.tags.length > 0).length,
  zeroTags: assignments.filter((assignment) => assignment.tags.length === 0).map((assignment) => assignment.name),
  relationships: assignments.reduce((total, assignment) => total + assignment.tags.length, 0),
}

if (!dryRun) {
  for (let index = 0; index < assignments.length; index += 100) {
    const batch = assignments.slice(index, index + 100).map(({ channel_id, tags }) => ({ channel_id, tags }))
    if (!batch.length) continue
    const { error } = await db.rpc("distribution_replace_automated_tags", { p_assignments: batch })
    if (error) throw new Error(error.message)
  }
}

console.log(JSON.stringify({ ...summary, sample: assignments.slice(0, 20) }, null, 2))
