// Run with: npm exec --yes --package=@electric-sql/pglite -- node scripts/test-directory-database.mjs
// An ephemeral WASM PostgreSQL database, not the configured Supabase project.
import assert from "node:assert/strict"
import { readFile, readdir } from "node:fs/promises"
import { createRequire } from "node:module"
import { delimiter, resolve } from "node:path"

const require = createRequire(import.meta.url)
const runtime = require.resolve("@electric-sql/pglite", {
  paths: (process.env.PATH ?? "")
    .split(delimiter)
    .map((path) => resolve(path, "..")),
})
const { PGlite } = require(runtime)
const db = new PGlite()
const userId = "00000000-0000-4000-8000-000000000001"
const stranger = "00000000-0000-4000-8000-000000000002"
try {
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema public,auth to anon,authenticated,service_role;
    grant execute on function auth.uid() to anon,authenticated,service_role;
    alter default privileges in schema public grant all on tables to service_role;
    insert into auth.users values('${userId}'),('${stranger}');`)
  for (const file of (await readdir("supabase/migrations"))
    .filter((file) => file.endsWith(".sql"))
    .sort()) {
    const sql = (await readFile(`supabase/migrations/${file}`, "utf8")).replace(
      "create extension if not exists pgcrypto;",
      ""
    )
    // gen_random_uuid is built in. No application migration uses other pgcrypto APIs.
    await db.exec(sql)
  }
  const seed = await readFile(
    "supabase/migrations/20260830170202_seed_directory_catalog.sql",
    "utf8"
  )
  await db.exec(seed)
  assert.equal(
    (await db.query("select count(*)::integer as count from directories"))
      .rows[0].count,
    24
  )
  const category = (await db.query("select id from categories limit 1")).rows[0]
    .id
  const makeDraft = async (name) => {
    const result = await db.query(
      `insert into listing_submissions(user_id,website_url,normalized_domain,name,slug,short_description,tagline,category_id)
      values($1,$2,$3,$4,$3,'A useful product','A useful product',$5) returning id`,
      [userId, `https://${name}.example`, name, name, category]
    )
    const id = result.rows[0].id
    await db.query(
      `insert into listing_submission_assets(submission_id,type,object_key,public_url,mime_type)
      values($1,'logo',$2,'https://example.com/logo.png','image/png'),($1,'cover',$3,'https://example.com/cover.png','image/png')`,
      [id, `${id}-logo`, `${id}-cover`]
    )
    return id
  }
  const draft = await makeDraft("directory-product")
  const campaign = (
    await db.query(
      "insert into directory_campaigns(user_id,submission_id,plan,target_count,price_centavos) values($1,$2,'starter',10,19900) returning id",
      [userId, draft]
    )
  ).rows[0].id
  const dirs = (
    await db.query("select id from directories order by slug limit 15")
  ).rows.map((row) => row.id)
  await assert.rejects(
    db.query(
      "insert into directory_submissions(campaign_id,directory_id) values($1,$2)",
      [campaign, dirs[0]]
    ),
    /not paid/
  )
  await assert.rejects(
    db.query(
      "insert into listing_payments(campaign_id,user_id,amount_centavos,provider_payment_intent_id) values($1,$2,100,'pi_wrong')",
      [campaign, userId]
    ),
    /Invalid campaign/
  )
  const payment = (
    await db.query(
      "insert into listing_payments(campaign_id,user_id,amount_centavos,provider_payment_intent_id) values($1,$2,19900,'pi_directory') returning id",
      [campaign, userId]
    )
  ).rows[0].id
  assert.equal(
    (
      await db.query("select status from listing_submissions where id=$1", [
        draft,
      ])
    ).rows[0].status,
    "pending_payment"
  )
  await assert.rejects(
    db.query(
      "insert into listing_payments(submission_id,user_id,amount_centavos,provider_payment_intent_id) values($1,$2,100,'pi_conflict')",
      [draft, userId]
    ),
    /directory package checkout/
  )
  await db.exec("set role service_role")
  await db.query(
    "select fulfill_directory_payment($1,'evt_directory','pay_directory','directory-product',$2)",
    [payment, dirs]
  )
  await db.query(
    "select fulfill_directory_payment($1,'evt_duplicate','pay_directory','directory-product',$2)",
    [payment, dirs]
  )
  const paid = (
    await db.query("select * from directory_campaigns where id=$1", [campaign])
  ).rows[0]
  assert.equal(paid.status, "active")
  assert.equal(paid.price_paid_centavos, 19900)
  assert.ok(paid.product_id)
  assert.equal(
    (
      await db.query(
        "select count(*)::integer as count from directory_submissions where campaign_id=$1",
        [campaign]
      )
    ).rows[0].count,
    10
  )
  assert.equal(
    (
      await db.query(
        "select count(*)::integer as count from product_builders where product_id=$1 and user_id=$2 and role='owner'",
        [paid.product_id, userId]
      )
    ).rows[0].count,
    1
  )
  await assert.rejects(
    db.query(
      "insert into directory_submissions(campaign_id,directory_id) values($1,$2)",
      [campaign, dirs[14]]
    ),
    /limit reached/
  )
  const jobs = (
    await db.query(
      "select id from directory_submissions where campaign_id=$1",
      [campaign]
    )
  ).rows
  await db.query(
    "select update_directory_submission($1,'needs_action',null,null,'Verify your email','private')",
    [jobs[0].id]
  )
  assert.equal(
    (
      await db.query(
        "select action_required_message from directory_submissions where id=$1",
        [jobs[0].id]
      )
    ).rows[0].action_required_message,
    "Verify your email"
  )
  await assert.rejects(
    db.query(
      "select update_directory_submission($1,'live',null,null,null,null)",
      [jobs[0].id]
    ),
    /check constraint/
  )
  for (const job of jobs)
    await db.query(
      "select update_directory_submission($1,'submitted',null,null,null,null)",
      [job.id]
    )
  assert.equal(
    (
      await db.query("select status from directory_campaigns where id=$1", [
        campaign,
      ])
    ).rows[0].status,
    "completed"
  )
  // Ordinary listing checkout still uses the extracted publication routine.
  await db.exec("reset role")
  const regularDraft = await makeDraft("regular-listing")
  const regularPayment = (
    await db.query(
      "insert into listing_payments(submission_id,user_id,amount_centavos,provider_payment_intent_id) values($1,$2,100,'pi_regular') returning id",
      [regularDraft, userId]
    )
  ).rows[0].id
  await db.exec("set role service_role")
  await db.query(
    "select fulfill_listing_payment($1,'pay_regular','evt_regular','regular-listing')",
    [regularPayment]
  )
  assert.equal(
    (
      await db.query("select status from listing_payments where id=$1", [
        regularPayment,
      ])
    ).rows[0].status,
    "paid"
  )
  // Existing product purchases reuse its ID and never create another product.
  const existingProduct = (
    await db.query("select product_id from listing_submissions where id=$1", [
      regularDraft,
    ])
  ).rows[0].product_id
  const existingCampaign = (
    await db.query(
      "insert into directory_campaigns(user_id,product_id,plan,target_count,price_centavos) values($1,$2,'growth',100,149900) returning id",
      [userId, existingProduct]
    )
  ).rows[0].id
  await assert.rejects(
    db.query(
      "insert into listing_payments(campaign_id,user_id,amount_centavos,provider_payment_intent_id) values($1,$2,149900,'pi_stranger')",
      [existingCampaign, stranger]
    ),
    /Invalid campaign/
  )
  const existingPayment = (
    await db.query(
      "insert into listing_payments(campaign_id,user_id,amount_centavos,provider_payment_intent_id) values($1,$2,149900,'pi_existing') returning id",
      [existingCampaign, userId]
    )
  ).rows[0].id
  await db.query(
    "select fulfill_directory_payment($1,'evt_existing','pay_existing','unused',$2)",
    [existingPayment, dirs]
  )
  assert.equal(
    (
      await db.query("select product_id from directory_campaigns where id=$1", [
        existingCampaign,
      ])
    ).rows[0].product_id,
    existingProduct
  )
  assert.equal(
    (await db.query("select count(*)::integer as count from products")).rows[0]
      .count,
    2
  )
  assert.equal(
    (
      await db.query(
        "select count(*)::integer as count from listing_payments where submission_id=$1 and status='paid'",
        [regularDraft]
      )
    ).rows[0].count,
    1
  )
  await assert.rejects(
    db.query(
      "insert into directory_campaigns(user_id,product_id,plan,target_count,price_centavos) values($1,$2,'starter',100,19900)",
      [userId, existingProduct]
    ),
    /check constraint/
  )
  // Actual authenticated role: no writes, no private notes, no fulfillment RPC.
  await db.exec("reset role; set role authenticated")
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
    stranger,
  ])
  assert.equal(
    (await db.query("select id from directory_campaigns")).rows.length,
    0
  )
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
    userId,
  ])
  assert.equal(
    (await db.query("select id from directory_campaigns")).rows.length,
    3
  )
  await assert.rejects(
    db.query("update directory_campaigns set status='active'"),
    /permission denied/
  )
  await assert.rejects(
    db.query("select admin_notes from directory_submissions"),
    /permission denied/
  )
  await assert.rejects(
    db.query("select fulfill_directory_payment($1,null,null,'spoof',$2)", [
      payment,
      dirs,
    ]),
    /permission denied/
  )
  console.log(
    "PASS: all migrations, repeat seed (24), ownership/RLS, checkout locks, confirmed fulfillment, idempotency, quota, admin states, original listing checkout, and spoof prevention."
  )
} catch (error) {
  console.error("FAIL:", error.message, error.detail ?? "", error.where ?? "")
  process.exitCode = 1
} finally {
  await db.close()
}
