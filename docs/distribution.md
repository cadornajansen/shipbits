# Distribution intelligence

Distribution is a small, researched catalog. Its supported write path is verified research followed by idempotent SQL, not bulk candidate ingestion.

## Schema

| Table | Purpose |
| --- | --- |
| `distribution_channels` | Canonical channel identity, nullable researched facts, lifecycle, verification timestamps, archive and verification leases |
| `distribution_tags` | Controlled taxonomy with unique `(type, slug)` |
| `distribution_channel_tags` | Channel relationships to controlled tags; nullable relevance/confidence are 0-100 |
| `distribution_channel_verifications` | Append-only verification attempts with website/submission payloads, result snapshot, method, time and optional actor |
| `distribution_channel_field_evidence` | Append-only field-level evidence; multiple records per channel and field are expected |
| `distribution_channel_field_overrides` | Explicit administrator ownership that direct seeds and automation must not overwrite |
| `distribution_sources` | Legacy JSON-import dataset metadata; not required by new seeds |
| `distribution_channel_sources` | Legacy raw observations; not required by new seeds |

All tables enable RLS. Browser roles have no direct access; service-role repository calls are protected by existing admin authorization. Finder reads use a server-side service client and return only active, non-archived channels. Runtime URL fetching continues to use the SSRF-safe fetcher; SQL only enforces HTTP/HTTPS shape and length.

## Facts and scoring

Unknown optional facts remain `NULL`. A nullable boolean has three meanings: `NULL` is unknown, `false` is verified false, and `true` is verified true. `pricing_type` defaults to `unknown`; `price_amount` and uppercase three-letter `price_currency` are either both present or both null. No currency conversion occurs in PostgreSQL.

`submission_requirements` is a bounded JSON object. Taxonomy values may only come from `distribution_tags`, whose allowed types are `product_type`, `category`, `audience`, `platform`, and `region`. Do not embed free-form generated tags in channel data.

Existing score/tier columns remain because Finder and admin currently use `quality_score` and expose the other fields. They must stay null unless produced by a documented deterministic ShipBits calculation or real measurement. Model judgment is not a valid source.

## Lifecycle

- `active`: independently verified by ShipBits and currently useful.
- `unverified`: stored but not sufficiently verified by ShipBits.
- `stale`: previously verified but beyond the freshness threshold or an inconclusive check made an active record stale.
- `broken`: checked and dead or unusable.
- `inactive`: manually disabled without asserting invalidity.
- `rejected`: determined not to be a relevant distribution channel.

`last_checked_at` is the latest completed check. `last_verified_at` is the latest successful check establishing validity; failures never advance it. A successful reachability check does not automatically approve an unverified channel as active.

## History and ownership

Verification attempts and field evidence are historical records. Evidence has an independent UUID and is indexed by `(channel_id, field_name, enriched_at desc)`; later evidence never deletes earlier facts. `source_url` may be null when the extraction method itself is sufficient provenance, but researched seeds should include official source URLs whenever available.

Admin edits through `distribution_save` insert or refresh rows in `distribution_channel_field_overrides`, including a synthetic `tags` field when relationships are edited. Bulk status/type/pricing/tag edits do the same. `distribution_seed_channel` skips overridden fields during reruns. Passing `p_force := true` is the explicit exceptional mechanism for replacing administrator-owned values. Evidence history is never deleted to transfer ownership.

## Direct SQL seeds

Future files belong in `supabase/seeds/distribution/` and run in numeric order. This phase intentionally provides no channel seed files or sample records.

Normalize URLs with `features/distribution/normalization.ts` before writing SQL. Canonical identity removes scheme/www/root slash/tracking differences but preserves meaningful paths and query parameters. Same host does not imply the same channel. `canonical_url` is the stable upsert key.

Use `distribution_seed_channel(jsonb)` for override-safe channel upserts. Then use standard idempotent SQL for tags and history, for example `ON CONFLICT (channel_id, tag_id) DO UPDATE`; verification/evidence inserts need stable seed-specific conflict keys or guarded `WHERE NOT EXISTS` clauses because their table identity is historical. A direct seed may create a channel, tag joins, verification snapshots and field evidence without any legacy source row.

## Legacy infrastructure

The old bootstrap/import/enrich package commands and admin enrichment button are removed. Their code and import RPCs remain temporarily so existing deployments and provenance can be migrated safely, but they are legacy/import-only and are not part of the supported workflow. A later cleanup can remove those scripts, RPCs, source tables and snapshot data after production migration and review.

Finder still filters active, non-archived records by taxonomy/type/pricing and orders by nullable `quality_score`; no replacement scoring algorithm was invented. Its provenance summary now comes from distinct field-evidence source URLs rather than legacy dataset attribution. Admin keeps editing, filters, bulk changes, verification history and evidence inspection; its price editor now supports amount plus currency.

## Operations

Apply the migration with the normal Supabase workflow. The optional destructive cleanup is `supabase/maintenance/clear_distribution_channels.sql`; it deletes channels and cascading dependent rows while preserving `distribution_tags`. It is never run automatically.

```powershell
pnpm exec supabase db push --dry-run --include-all
pnpm exec supabase db push --include-all --skip-vault
pnpm distribution:test
pnpm typecheck
```
