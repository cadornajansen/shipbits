-- Simplify Distribution for direct researched SQL seeds while preserving existing data.
-- The legacy import/source tables remain available only for migration compatibility.

alter table public.distribution_channels
  rename column price_usd to price_amount;

alter table public.distribution_channels
  add column price_currency text;

update public.distribution_channels
set price_currency = 'USD'
where price_amount is not null;

alter table public.distribution_channels
  add constraint distribution_channels_price_currency_check check (
    price_currency is null or price_currency ~ '^[A-Z]{3}$'
  ),
  add constraint distribution_channels_price_pair_check check (
    (price_amount is null and price_currency is null)
    or (price_amount is not null and price_currency is not null)
  );

comment on column public.distribution_channels.traffic_tier is
  'Nullable deterministic ShipBits score or measured value; never model judgment.';
comment on column public.distribution_channels.authority_score is
  'Nullable deterministic ShipBits score or measured value; never model judgment.';
comment on column public.distribution_channels.quality_score is
  'Nullable deterministic ShipBits score or measured value; never model judgment.';
comment on column public.distribution_channels.competition_score is
  'Nullable deterministic ShipBits score or measured value; never model judgment.';
comment on column public.distribution_channels.submission_difficulty is
  'Nullable deterministic ShipBits score or measured value; never model judgment.';
comment on table public.distribution_sources is
  'Legacy JSON import dataset metadata. Direct SQL seeds must not depend on this table.';
comment on table public.distribution_channel_sources is
  'Legacy JSON import observations. Direct SQL seeds must not depend on this table.';

create index distribution_channels_status_idx
  on public.distribution_channels(status) where archived_at is null;
create index distribution_channels_type_idx
  on public.distribution_channels(channel_type) where archived_at is null;
create index distribution_channels_pricing_idx
  on public.distribution_channels(pricing_type) where archived_at is null;
create index distribution_channels_verified_idx
  on public.distribution_channels(last_verified_at desc nulls last) where archived_at is null;
create index distribution_channels_archived_idx
  on public.distribution_channels(archived_at) where archived_at is not null;

alter table public.distribution_channel_verifications
  add column result text,
  add column method text;

alter table public.distribution_channel_verifications
  add constraint distribution_channel_verifications_result_check check (
    result is null or result in ('reachable','unreachable','broken','inconclusive')
  ),
  add constraint distribution_channel_verifications_method_check check (
    method is null or (length(btrim(method)) between 1 and 100)
  );

-- Existing evidence becomes the first entry in an append-only field history.
alter table public.distribution_channel_field_evidence
  drop constraint distribution_channel_field_evidence_pkey;
alter table public.distribution_channel_field_evidence
  add column id uuid default gen_random_uuid();
update public.distribution_channel_field_evidence set id=gen_random_uuid() where id is null;
alter table public.distribution_channel_field_evidence
  alter column id set not null,
  add primary key(id);
alter table public.distribution_channel_field_evidence
  drop constraint if exists distribution_channel_field_evidence_field_name_check,
  drop constraint if exists distribution_channel_field_evidence_source_check;
alter table public.distribution_channel_field_evidence
  drop constraint distribution_channel_field_evidence_source_observation_id_fkey,
  add constraint distribution_field_evidence_legacy_observation_fkey
    foreign key(source_observation_id) references public.distribution_channel_sources(id) on delete set null,
  add constraint distribution_channel_field_evidence_field_name_check check (
    field_name ~ '^[a-z][a-z0-9_]{0,99}$'
  ),
  add constraint distribution_channel_field_evidence_method_check check (
    length(btrim(extraction_method)) between 1 and 100
  );
alter table public.distribution_channel_field_evidence
  alter column raw_value drop not null;

create index distribution_field_evidence_history_idx
  on public.distribution_channel_field_evidence(channel_id,field_name,enriched_at desc);
create index distribution_field_evidence_source_url_idx
  on public.distribution_channel_field_evidence(source_url)
  where source_url is not null;

-- Finder/admin aggregation now treats field evidence as provenance. Legacy dataset
-- observations are intentionally absent from the core query path.
create or replace function public.distribution_evidence(p_ids uuid[])
returns table(channel_id uuid,tags jsonb,sources jsonb,source_count bigint)
language plpgsql stable set search_path='' as $$
begin
  if cardinality(p_ids)>100 then raise exception 'Read at most 100 channels'; end if;
  return query select c.id,
    coalesce((select jsonb_agg(jsonb_build_object('tag_id',t.id,'relevance_score',ct.relevance_score,
      'confidence_score',ct.confidence_score,'tag',jsonb_build_object('id',t.id,'type',t.type,'slug',t.slug,'name',t.name))
      order by t.type,t.name) from public.distribution_channel_tags ct join public.distribution_tags t on t.id=ct.tag_id
      where ct.channel_id=c.id),'[]'::jsonb),
    coalesce(e.sources,'[]'::jsonb),coalesce(e.source_count,0)
    from public.distribution_channels c left join lateral (
      select jsonb_agg(jsonb_build_object('source_url',x.source_url,'observed_at',x.observed_at,
        'extraction_method',x.extraction_method) order by x.observed_at desc,x.source_url) as sources,
        count(*) as source_count from (
          select distinct on (f.source_url) f.source_url,f.observed_at,f.extraction_method
          from public.distribution_channel_field_evidence f
          where f.channel_id=c.id and f.source_url is not null
          order by f.source_url,f.observed_at desc
        ) x
    ) e on true where c.id=any(p_ids) and c.archived_at is null;
end; $$;

create table public.distribution_channel_field_overrides (
  channel_id uuid not null references public.distribution_channels(id) on delete cascade,
  field_name text not null check (field_name ~ '^[a-z][a-z0-9_]{0,99}$'),
  overridden_by uuid references auth.users(id) on delete set null,
  overridden_at timestamptz not null default now(),
  primary key(channel_id,field_name)
);
comment on table public.distribution_channel_field_overrides is
  'Fields owned by an administrator. Direct seeds and automation must skip these fields unless explicitly forced.';
alter table public.distribution_channel_field_overrides enable row level security;
revoke all on public.distribution_channel_field_overrides from anon,authenticated;
grant all on public.distribution_channel_field_overrides to service_role;

-- Admin saves preserve evidence history and explicitly claim every changed field.
create or replace function public.distribution_save(
  p_id uuid,p_data jsonb,p_tags jsonb,p_expected timestamptz,p_actor uuid default null
)
returns jsonb language plpgsql set search_path='' as $$
declare c public.distribution_channels%rowtype; saved_id uuid; t jsonb; field_key text;
begin
  if jsonb_typeof(p_data)<>'object' or exists(select 1 from jsonb_object_keys(p_data) k where k not in (
    'name','slug','description','website_url','canonical_url','submission_url','channel_type','pricing_type',
    'price_amount','price_currency','requires_account','requires_email_verification','requires_manual_review',
    'requires_payment','estimated_submission_minutes','backlink_possible','dofollow_possible','traffic_tier',
    'authority_score','quality_score','competition_score','submission_difficulty','submission_requirements','status'
  )) then raise exception 'Unsupported channel field'; end if;
  if p_id is null then
    c := jsonb_populate_record(null::public.distribution_channels,p_data);
    c.id := gen_random_uuid(); c.created_at := now(); c.updated_at := now();
    insert into public.distribution_channels select c.* returning id into saved_id;
  else
    select * into c from public.distribution_channels where id=p_id and archived_at is null for update;
    if not found then raise exception 'Channel not found'; end if;
    if p_expected is null or c.updated_at <> p_expected then raise exception 'Channel changed; reopen it and try again'; end if;
    c := jsonb_populate_record(c,p_data);
    update public.distribution_channels set name=c.name,slug=c.slug,description=c.description,website_url=c.website_url,
      canonical_url=c.canonical_url,submission_url=c.submission_url,channel_type=c.channel_type,pricing_type=c.pricing_type,
      price_amount=c.price_amount,price_currency=c.price_currency,requires_account=c.requires_account,
      requires_email_verification=c.requires_email_verification,requires_manual_review=c.requires_manual_review,
      requires_payment=c.requires_payment,estimated_submission_minutes=c.estimated_submission_minutes,
      backlink_possible=c.backlink_possible,dofollow_possible=c.dofollow_possible,traffic_tier=c.traffic_tier,
      authority_score=c.authority_score,quality_score=c.quality_score,competition_score=c.competition_score,
      submission_difficulty=c.submission_difficulty,submission_requirements=c.submission_requirements,status=c.status
      where id=p_id returning id into saved_id;
  end if;
  if p_tags is not null then
    if jsonb_typeof(p_tags) <> 'array' or jsonb_array_length(p_tags)>100 then raise exception 'Invalid tags'; end if;
    delete from public.distribution_channel_tags where channel_id=saved_id;
    for t in select * from jsonb_array_elements(p_tags) loop
      insert into public.distribution_channel_tags values(saved_id,(t->>'tag_id')::uuid,
        (t->>'relevance_score')::smallint,(t->>'confidence_score')::smallint);
    end loop;
  end if;
  if p_id is not null then
    for field_key in select key from jsonb_object_keys(p_data) key loop
      insert into public.distribution_channel_field_overrides(channel_id,field_name,overridden_by,overridden_at)
      values(saved_id,field_key,p_actor,now())
      on conflict(channel_id,field_name) do update set overridden_by=excluded.overridden_by,overridden_at=excluded.overridden_at;
    end loop;
    if p_tags is not null then
      insert into public.distribution_channel_field_overrides(channel_id,field_name,overridden_by,overridden_at)
      values(saved_id,'tags',p_actor,now())
      on conflict(channel_id,field_name) do update set overridden_by=excluded.overridden_by,overridden_at=excluded.overridden_at;
    end if;
  end if;
  return (select jsonb_build_object('id',id,'updated_at',updated_at) from public.distribution_channels where id=saved_id);
end; $$;

revoke all on function public.distribution_save(uuid,jsonb,jsonb,timestamptz,uuid) from public,anon,authenticated;
grant execute on function public.distribution_save(uuid,jsonb,jsonb,timestamptz,uuid) to service_role;

-- Bulk administrator changes also claim field ownership.
create or replace function public.distribution_bulk(p_ids uuid[],p_operation text,p_value text,p_actor uuid)
returns integer language plpgsql set search_path='' as $$
declare affected integer; owned_field text;
begin
  if cardinality(p_ids) not between 1 and 500 then raise exception 'Select 1 to 500 channels'; end if;
  perform id from public.distribution_channels where id=any(p_ids) and archived_at is null order by id for update;
  select count(*) into affected from public.distribution_channels where id=any(p_ids) and archived_at is null;
  if affected <> cardinality(p_ids) then raise exception 'Selection changed; refresh and select again'; end if;
  case p_operation
    when 'status' then update public.distribution_channels set status=p_value where id=any(p_ids); owned_field:='status';
    when 'type' then update public.distribution_channels set channel_type=p_value where id=any(p_ids); owned_field:='channel_type';
    when 'pricing' then update public.distribution_channels set pricing_type=p_value where id=any(p_ids); owned_field:='pricing_type';
    when 'archive' then update public.distribution_channels set archived_at=now(),archived_by=p_actor where id=any(p_ids);
    when 'add_tag' then
      insert into public.distribution_channel_tags(channel_id,tag_id) select unnest(p_ids),p_value::uuid on conflict do nothing;
      update public.distribution_channels set updated_at=now() where id=any(p_ids); owned_field:='tags';
    when 'remove_tag' then
      delete from public.distribution_channel_tags where channel_id=any(p_ids) and tag_id=p_value::uuid;
      update public.distribution_channels set updated_at=now() where id=any(p_ids); owned_field:='tags';
    else raise exception 'Unsupported operation';
  end case;
  if owned_field is not null then
    insert into public.distribution_channel_field_overrides(channel_id,field_name,overridden_by,overridden_at)
      select unnest(p_ids),owned_field,p_actor,now()
      on conflict(channel_id,field_name) do update set overridden_by=excluded.overridden_by,overridden_at=excluded.overridden_at;
  end if;
  return affected;
end; $$;

-- Verification attempts remain append-only and carry an auditable result snapshot.
create or replace function public.distribution_finish_verification(
  p_id uuid,p_token uuid,p_website jsonb,p_submission jsonb,p_actor uuid
)
returns boolean language plpgsql set search_path='' as $$
declare c public.distribution_channels%rowtype; healthy boolean; dead boolean; snapshot text;
begin
  select * into c from public.distribution_channels where id=p_id and verification_token=p_token and archived_at is null for update;
  if not found then return false; end if;
  healthy := coalesce((p_website->>'reachable')::boolean,false)
    and (p_submission is null or coalesce((p_submission->>'reachable')::boolean,false));
  dead := coalesce((p_website->>'http_status')::integer in (404,410),false)
    or coalesce((p_submission->>'http_status')::integer in (404,410),false);
  snapshot := case when healthy then 'reachable' when dead then 'broken'
    when p_website ? 'reachable' then 'unreachable' else 'inconclusive' end;
  insert into public.distribution_channel_verifications(channel_id,website,submission,checked_by,result,method)
    values(p_id,p_website,p_submission,p_actor,snapshot,'safe_fetch');
  if c.website_url is distinct from p_website->>'requested_url'
    or c.submission_url is distinct from p_submission->>'requested_url' then
    update public.distribution_channels set verification_token=null,verification_lease_until=null where id=p_id;
    return false;
  end if;
  update public.distribution_channels set last_checked_at=now(),
    last_verified_at=case when healthy then now() else last_verified_at end,
    status=case when status in ('inactive','rejected') then status when dead then 'broken'
      when not healthy and status='active' then 'stale'
      when healthy and status in ('broken','stale') then 'unverified' else status end,
    verification_token=null,verification_lease_until=null where id=p_id;
  return true;
end; $$;

-- Legacy enrichment is retained only so old deployments fail safely: overrides always win,
-- and evidence inserts append rather than replacing history.
create or replace function public.distribution_apply_enrichment(p_candidates jsonb)
returns integer language plpgsql set search_path='' as $$
declare candidate jsonb; item jsonb; c public.distribution_channels%rowtype; affected integer := 0;
begin
  if jsonb_typeof(p_candidates)<>'array' or jsonb_array_length(p_candidates)>100 then raise exception 'Apply at most 100 candidates'; end if;
  for candidate in select * from jsonb_array_elements(p_candidates) loop
    select * into c from public.distribution_channels where id=(candidate->>'channel_id')::uuid and archived_at is null for update;
    if not found then continue; end if;
    if candidate->'updates' ? 'pricing_type' and c.pricing_type='unknown'
      and not exists(select 1 from public.distribution_channel_field_overrides o where o.channel_id=c.id and o.field_name='pricing_type') then
      update public.distribution_channels set pricing_type=candidate->'updates'->>'pricing_type',enriched_at=now() where id=c.id;
      affected:=affected+1;
    end if;
    for item in select * from jsonb_array_elements(candidate->'evidence') loop
      if item->>'field'='pricing_type' then
        insert into public.distribution_channel_field_evidence(channel_id,field_name,source_observation_id,raw_value,extraction_method,observed_at)
        select c.id,'pricing_type',(item->>'source_observation_id')::uuid,item->'raw_value','legacy_import',cs.observed_at
        from public.distribution_channel_sources cs where cs.id=(item->>'source_observation_id')::uuid and cs.channel_id=c.id;
      end if;
    end loop;
  end loop;
  return affected;
end; $$;

drop function public.distribution_apply_live_enrichment(uuid,timestamptz,jsonb,uuid[],jsonb,jsonb,jsonb);
drop function public.distribution_save(uuid,jsonb,jsonb,timestamptz);

-- Direct seed helper: explicit allowlisted fields, canonical identity, and override-safe reruns.
create function public.distribution_seed_channel(p_data jsonb,p_force boolean default false)
returns uuid language plpgsql set search_path='' as $$
declare channel_id uuid; existing public.distribution_channels%rowtype; field_key text; patch jsonb := '{}'::jsonb;
begin
  if jsonb_typeof(p_data)<>'object' or nullif(btrim(p_data->>'canonical_url'),'') is null then
    raise exception 'A channel object with canonical_url is required';
  end if;
  if exists(select 1 from jsonb_object_keys(p_data) k where k not in (
    'name','slug','description','website_url','canonical_url','submission_url','channel_type','pricing_type',
    'price_amount','price_currency','requires_account','requires_email_verification','requires_manual_review',
    'requires_payment','estimated_submission_minutes','backlink_possible','dofollow_possible','traffic_tier',
    'authority_score','quality_score','competition_score','submission_difficulty','submission_requirements','status'
  )) then raise exception 'Unsupported seed field'; end if;
  select * into existing from public.distribution_channels where canonical_url=p_data->>'canonical_url' for update;
  if not found then
    existing := jsonb_populate_record(null::public.distribution_channels,p_data);
    existing.id:=gen_random_uuid(); existing.created_at:=now(); existing.updated_at:=now();
    insert into public.distribution_channels select existing.* returning id into channel_id;
    return channel_id;
  end if;
  channel_id:=existing.id;
  for field_key in select key from jsonb_object_keys(p_data) key loop
    if field_key='canonical_url' or p_force or not exists(
      select 1 from public.distribution_channel_field_overrides o where o.channel_id=channel_id and o.field_name=field_key
    ) then patch:=patch || jsonb_build_object(field_key,p_data->field_key); end if;
  end loop;
  existing:=jsonb_populate_record(existing,patch);
  update public.distribution_channels set name=existing.name,slug=existing.slug,description=existing.description,
    website_url=existing.website_url,canonical_url=existing.canonical_url,submission_url=existing.submission_url,
    channel_type=existing.channel_type,pricing_type=existing.pricing_type,price_amount=existing.price_amount,
    price_currency=existing.price_currency,requires_account=existing.requires_account,
    requires_email_verification=existing.requires_email_verification,requires_manual_review=existing.requires_manual_review,
    requires_payment=existing.requires_payment,estimated_submission_minutes=existing.estimated_submission_minutes,
    backlink_possible=existing.backlink_possible,dofollow_possible=existing.dofollow_possible,traffic_tier=existing.traffic_tier,
    authority_score=existing.authority_score,quality_score=existing.quality_score,competition_score=existing.competition_score,
    submission_difficulty=existing.submission_difficulty,submission_requirements=existing.submission_requirements,
    status=existing.status where id=channel_id;
  return channel_id;
end; $$;
revoke all on function public.distribution_seed_channel(jsonb,boolean) from public,anon,authenticated;
grant execute on function public.distribution_seed_channel(jsonb,boolean) to service_role;
