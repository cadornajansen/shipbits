// Ephemeral PostgreSQL only. Run with the command documented in docs/distribution.md.
import assert from "node:assert/strict"
import { readFile, readdir } from "node:fs/promises"
import { createRequire } from "node:module"
import { delimiter, resolve } from "node:path"
import { prepareRecord } from "../../features/distribution/import.ts"

const require = createRequire(import.meta.url)
const runtime = require.resolve("@electric-sql/pglite", {
  paths: (process.env.PATH ?? "")
    .split(delimiter)
    .map((path) => resolve(path, "..")),
})
const { PGlite } = require(runtime)
const db = new PGlite()
const actor = "00000000-0000-4000-8000-000000000001"
const scalar = async (sql, params = []) =>
  Object.values((await db.query(sql, params)).rows[0])[0]
const callImport = async (batch) =>
  scalar("select distribution_import($1::jsonb,$2::jsonb)", [
    JSON.stringify(batch.source),
    JSON.stringify(batch.records.map(prepareRecord)),
  ])
try {
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth;create table auth.users(id uuid primary key);insert into auth.users values('${actor}');
    grant usage on schema public to anon,authenticated,service_role;
    create function public.set_products_updated_at() returns trigger language plpgsql as $$ begin new.updated_at=now();return new;end;$$;`)
  const migration = (await readdir("supabase/migrations")).find((file) =>
    file.endsWith("_distribution_intelligence_foundation.sql")
  )
  await db.exec(await readFile(`supabase/migrations/${migration}`, "utf8"))
  const batches = await Promise.all(
    (await readdir("scripts/distribution/batches"))
      .filter((file) => file.endsWith(".json"))
      .sort()
      .map(async (file) =>
        JSON.parse(
          await readFile(`scripts/distribution/batches/${file}`, "utf8")
        )
      )
  )
  let imported = 0
  let observations = 0
  for (const batch of batches) {
    const result = await callImport(batch)
    imported += result.inserted
    observations += result.observations
  }
  const report = JSON.parse(
    await readFile("scripts/distribution/bootstrap-report.json", "utf8")
  )
  assert.equal(imported, report.unique)
  const countBefore = await scalar(
    "select count(*)::int from distribution_channel_sources"
  )
  for (const batch of batches) {
    const result = await callImport(batch)
    assert.equal(result.inserted, 0)
    assert.equal(result.observations, 0)
  }
  assert.equal(
    await scalar("select count(*)::int from distribution_channel_sources"),
    countBefore
  )
  assert.equal(
    await scalar(
      "select count(*)::int from distribution_channels where status='unverified'"
    ),
    report.unique
  )
  assert.equal(
    await scalar(
      "select count(*)::int from distribution_channels where authority_score is not null or backlink_possible is not null or quality_score is not null"
    ),
    0
  )
  const ids = (
    await db.query("select id from distribution_channels order by id limit 2")
  ).rows.map((row) => row.id)
  await scalar(
    "select distribution_bulk($1::uuid[],'status','active',$2::uuid)",
    [ids, actor]
  )
  assert.equal(
    await scalar("select count(*)::int from distribution_search('{}',true)"),
    2
  )
  await assert.rejects(() =>
    scalar("select distribution_bulk($1::uuid[],'status','made-up',$2::uuid)", [
      ids,
      actor,
    ])
  )
  assert.equal(
    await scalar(
      "select count(*)::int from distribution_channels where status='active'"
    ),
    2
  )
  await assert.rejects(() =>
    scalar(
      "select distribution_bulk($1::uuid[],'status','inactive',$2::uuid)",
      [[ids[0], actor], actor]
    )
  )
  assert.equal(
    await scalar("select status from distribution_channels where id=$1", [
      ids[0],
    ]),
    "active"
  )
  const region = await scalar(
    "select id from distribution_tags where type='region' and slug='philippines'"
  )
  await scalar("select distribution_bulk($1::uuid[],'add_tag',$2,$3::uuid)", [
    ids,
    region,
    actor,
  ])
  assert.equal(
    await scalar(
      'select count(*)::int from distribution_search(\'{"region":"philippines"}\',true)'
    ),
    2
  )
  assert.equal(
    await scalar(
      'select count(*)::int from distribution_search(\'{"platform":"ios"}\',true)'
    ),
    0
  )
  assert.equal(
    await scalar(
      "select count(*)::int from distribution_search($1::jsonb,true)",
      [JSON.stringify({ tagIds: [region] })]
    ),
    2
  )
  await scalar(
    "select distribution_bulk($1::uuid[],'remove_tag',$2,$3::uuid)",
    [[ids[1]], region, actor]
  )
  assert.equal(
    await scalar(
      'select count(*)::int from distribution_search(\'{"region":"philippines"}\',true)'
    ),
    1
  )
  const original = await scalar(
    "select updated_at::text from distribution_channels where id=$1",
    [ids[0]]
  )
  await scalar(
    "select distribution_save($1,'{\"quality_score\":81}',null,$2)",
    [ids[0], original]
  )
  await assert.rejects(
    () =>
      scalar("select distribution_save($1,'{\"quality_score\":25}',null,$2)", [
        ids[0],
        original,
      ]),
    /Channel changed/
  )
  assert.equal(
    await scalar(
      "select quality_score from distribution_channels where id=$1",
      [ids[0]]
    ),
    81
  )
  const fresh = await scalar(
    "select updated_at::text from distribution_channels where id=$1",
    [ids[0]]
  )
  await assert.rejects(() =>
    scalar("select distribution_save($1,'{\"quality_score\":26}',$2,$3)", [
      ids[0],
      JSON.stringify([{ tag_id: actor }]),
      fresh,
    ])
  )
  assert.equal(
    await scalar(
      "select quality_score from distribution_channels where id=$1",
      [ids[0]]
    ),
    81
  )
  // API roles cannot read private data or bypass application authorization via RPC.
  for (const role of ["anon", "authenticated"]) {
    await db.exec(`set role ${role}`)
    await assert.rejects(
      () => db.query("select * from distribution_channels"),
      /permission denied/
    )
    await assert.rejects(
      () =>
        db.query("select distribution_bulk($1::uuid[],'status','active',$2)", [
          ids,
          actor,
        ]),
      /permission denied/
    )
    await assert.rejects(
      () => db.query("select distribution_search('{}',false)"),
      /permission denied/
    )
    await assert.rejects(
      () =>
        db.query("select distribution_claim_verification('{}',true,$1)", [
          actor,
        ]),
      /permission denied/
    )
    await db.exec("reset role")
  }
  await db.exec("set role service_role")
  assert.equal(
    await scalar("select count(*)::int from distribution_search('{}',true)"),
    2
  )
  await db.exec("reset role")
  const claimed = (
    await db.query(
      "select id,website_url,submission_url from distribution_claim_verification('{}',true,$1)",
      [actor]
    )
  ).rows
  assert.equal(claimed.length, 10)
  assert.equal(
    (
      await db.query(
        "select id from distribution_claim_verification('{}',true,gen_random_uuid())"
      )
    ).rows.length,
    0
  )
  const healthy = {
    requested_url: claimed[0].website_url,
    reachable: true,
    http_status: 200,
    final_url: "https://example.com",
    failure: null,
  }
  await scalar("select distribution_finish_verification($1,$2,$3,$4,$2)", [
    claimed[0].id,
    actor,
    JSON.stringify(healthy),
    claimed[0].submission_url
      ? JSON.stringify({ ...healthy, requested_url: claimed[0].submission_url })
      : null,
  ])
  const state = await scalar(
    "select status from distribution_channels where id=$1",
    [claimed[0].id]
  )
  assert.ok(["unverified", "active"].includes(state))
  const dead = {
    ...healthy,
    requested_url: claimed[1].website_url,
    reachable: false,
    http_status: 404,
    failure: "HTTP 404",
  }
  await scalar("select distribution_finish_verification($1,$2,$3,$4,$2)", [
    claimed[1].id,
    actor,
    JSON.stringify(dead),
    claimed[1].submission_url
      ? JSON.stringify({ ...healthy, requested_url: claimed[1].submission_url })
      : null,
  ])
  assert.equal(
    await scalar("select status from distribution_channels where id=$1", [
      claimed[1].id,
    ]),
    "broken"
  )
  assert.equal(
    await scalar(
      "select count(*)::int from distribution_channel_verifications"
    ),
    2
  )
  await scalar("select distribution_bulk($1::uuid[],'archive','',$2)", [
    ids,
    actor,
  ])
  assert.equal(
    await scalar(
      "select count(*)::int from distribution_channels where archived_at is not null"
    ),
    2
  )
  assert.equal(
    await scalar("select count(*)::int from distribution_search('{}',true)"),
    0
  )
  assert.equal(
    await scalar("select count(*)::int from distribution_channel_sources"),
    countBefore
  )
  for (const batch of batches) {
    const result = await callImport(batch)
    assert.equal(result.inserted, 0)
  }
  assert.equal(
    await scalar(
      "select count(*)::int from distribution_channels where archived_at is not null"
    ),
    2
  )
  console.log(
    JSON.stringify(
      {
        result: "PASS",
        candidateRecords: report.candidates,
        importedUnique: imported,
        sourceObservations: observations,
        checks: [
          "migration",
          "all real batches",
          "idempotency",
          "unknown metrics",
          "transaction rollback",
          "optimistic locking",
          "tag filters",
          "public eligibility",
          "anon/authenticated denial",
          "service role access",
          "global verification leases",
          "history",
          "archive retention",
        ],
      },
      null,
      2
    )
  )
} finally {
  await db.close()
}
