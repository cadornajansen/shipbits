-- Independent intelligence catalog; existing paid directory fulfillment is unchanged.
create table public.distribution_channels (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 1 and 160),
  slug text unique not null check (length(slug) <= 160 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text not null default '' check (length(description) <= 10000),
  website_url text not null check (website_url ~ '^https?://' and length(website_url) <= 2048),
  canonical_url text unique not null check (length(canonical_url) <= 2048),
  submission_url text check (submission_url ~ '^https?://' and length(submission_url) <= 2048),
  channel_type text check (channel_type in ('directory','launch_platform','community','newsletter','app_store','marketplace','forum')),
  pricing_type text not null default 'unknown' check (pricing_type in ('free','freemium','paid','unknown')),
  price_usd numeric(12,2) check (price_usd between 0 and 1000000),
  requires_account boolean, requires_email_verification boolean, requires_manual_review boolean, requires_payment boolean,
  estimated_submission_minutes integer check (estimated_submission_minutes between 1 and 10080),
  backlink_possible boolean, dofollow_possible boolean,
  traffic_tier smallint check (traffic_tier between 1 and 5),
  authority_score smallint check (authority_score between 0 and 100),
  quality_score smallint check (quality_score between 0 and 100),
  competition_score smallint check (competition_score between 0 and 100),
  submission_difficulty smallint check (submission_difficulty between 1 and 5),
  submission_requirements jsonb not null default '{}' check (jsonb_typeof(submission_requirements) = 'object' and octet_length(submission_requirements::text) <= 80000),
  status text not null default 'unverified' check (status in ('active','unverified','stale','broken','inactive','rejected')),
  last_verified_at timestamptz, last_checked_at timestamptz,
  verification_token uuid, verification_lease_until timestamptz,
  archived_at timestamptz, archived_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index distribution_channels_name_idx on public.distribution_channels(lower(name),id) where archived_at is null;
create index distribution_channels_filter_idx on public.distribution_channels(status,channel_type,pricing_type) where archived_at is null;
create index distribution_channels_quality_idx on public.distribution_channels(quality_score desc nulls last,id) where archived_at is null;
create index distribution_channels_stale_idx on public.distribution_channels(last_checked_at nulls first,id) where archived_at is null;
create index distribution_channels_search_idx on public.distribution_channels using gin(to_tsvector('simple',name || ' ' || description));
create trigger distribution_channels_updated before update on public.distribution_channels for each row execute function public.set_products_updated_at();

create table public.distribution_tags (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('product_type','category','audience','platform','region')),
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (length(btrim(name)) between 1 and 100), unique(type,slug)
);
create table public.distribution_channel_tags (
  channel_id uuid not null references public.distribution_channels(id) on delete cascade,
  tag_id uuid not null references public.distribution_tags(id) on delete restrict,
  relevance_score smallint check (relevance_score between 0 and 100),
  confidence_score smallint check (confidence_score between 0 and 100),
  primary key(channel_id,tag_id)
);
create index distribution_channel_tags_reverse_idx on public.distribution_channel_tags(tag_id,channel_id);
create table public.distribution_sources (
  id uuid primary key default gen_random_uuid(), name text not null,
  source_url text unique not null check (source_url ~ '^https?://'),
  license text not null, attribution text not null, imported_at timestamptz not null default now()
);
create table public.distribution_channel_sources (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.distribution_channels(id) on delete cascade,
  source_id uuid not null references public.distribution_sources(id) on delete restrict,
  source_record_id text not null, source_url text not null check (source_url ~ '^https?://'),
  raw_data jsonb not null, content_hash text not null,
  observed_at timestamptz not null default now(),
  unique(source_id,source_record_id,content_hash)
);
create index distribution_channel_sources_channel_idx on public.distribution_channel_sources(channel_id,observed_at desc);
create table public.distribution_channel_verifications (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.distribution_channels(id) on delete cascade,
  checked_at timestamptz not null default now(), website jsonb not null, submission jsonb,
  checked_by uuid references auth.users(id) on delete set null
);
create index distribution_verifications_channel_idx on public.distribution_channel_verifications(channel_id,checked_at desc);

-- No public Data API access, including to provenance or raw imported data.
alter table public.distribution_channels enable row level security;
alter table public.distribution_tags enable row level security;
alter table public.distribution_channel_tags enable row level security;
alter table public.distribution_sources enable row level security;
alter table public.distribution_channel_sources enable row level security;
alter table public.distribution_channel_verifications enable row level security;
revoke all on public.distribution_channels,public.distribution_tags,public.distribution_channel_tags,public.distribution_sources,public.distribution_channel_sources,public.distribution_channel_verifications from anon,authenticated;
grant all on public.distribution_channels,public.distribution_tags,public.distribution_channel_tags,public.distribution_sources,public.distribution_channel_sources,public.distribution_channel_verifications to service_role;

insert into public.distribution_tags(type,slug,name)
select type,slug,initcap(replace(slug,'-',' ')) from (values
 ('product_type',array['saas','ai-tool','developer-tool','mobile-app','web-app','desktop-app','browser-extension','marketplace','ecommerce','open-source','api','game','consumer-app','b2b-software','education','fintech','productivity']),
 ('category',array['artificial-intelligence','developer-tools','business','design','marketing','education','finance','productivity','ecommerce','gaming','health','communication','analytics','security']),
 ('audience',array['developers','founders','students','designers','marketers','creators','businesses','startups','consumers','indie-hackers','early-adopters','educators']),
 ('platform',array['web','ios','android','windows','macos','linux','browser','api']),
 ('region',array['global','philippines','asia'])
) as taxonomy(type,slugs) cross join lateral unnest(slugs) as slug;

-- Optimistic locking prevents a stale editor from overwriting another admin.
create function public.distribution_save(p_id uuid,p_data jsonb,p_tags jsonb,p_expected timestamptz)
returns jsonb language plpgsql set search_path='' as $$
declare c public.distribution_channels%rowtype; saved_id uuid; t jsonb;
begin
  if exists(select 1 from jsonb_object_keys(p_data) k where k not in (
    'name','slug','description','website_url','canonical_url','submission_url','channel_type','pricing_type','price_usd',
    'requires_account','requires_email_verification','requires_manual_review','requires_payment','estimated_submission_minutes',
    'backlink_possible','dofollow_possible','traffic_tier','authority_score','quality_score','competition_score',
    'submission_difficulty','submission_requirements','status')) then raise exception 'Unsupported channel field'; end if;
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
      price_usd=c.price_usd,requires_account=c.requires_account,requires_email_verification=c.requires_email_verification,
      requires_manual_review=c.requires_manual_review,requires_payment=c.requires_payment,estimated_submission_minutes=c.estimated_submission_minutes,
      backlink_possible=c.backlink_possible,dofollow_possible=c.dofollow_possible,traffic_tier=c.traffic_tier,
      authority_score=c.authority_score,quality_score=c.quality_score,competition_score=c.competition_score,
      submission_difficulty=c.submission_difficulty,submission_requirements=c.submission_requirements,status=c.status
      where id=p_id returning id into saved_id;
  end if;
  if p_tags is not null then
    if jsonb_typeof(p_tags) <> 'array' or jsonb_array_length(p_tags)>100 then raise exception 'Invalid tags'; end if;
    delete from public.distribution_channel_tags where channel_id=saved_id;
    for t in select * from jsonb_array_elements(p_tags) loop
      insert into public.distribution_channel_tags values(saved_id,(t->>'tag_id')::uuid,(t->>'relevance_score')::smallint,(t->>'confidence_score')::smallint);
    end loop;
  end if;
  return (select jsonb_build_object('id',id,'updated_at',updated_at) from public.distribution_channels where id=saved_id);
end; $$;

create function public.distribution_bulk(p_ids uuid[],p_operation text,p_value text,p_actor uuid)
returns integer language plpgsql set search_path='' as $$
declare affected integer;
begin
  if cardinality(p_ids) not between 1 and 500 then raise exception 'Select 1 to 500 channels'; end if;
  perform id from public.distribution_channels where id=any(p_ids) and archived_at is null order by id for update;
  select count(*) into affected from public.distribution_channels where id=any(p_ids) and archived_at is null;
  if affected <> cardinality(p_ids) then raise exception 'Selection changed; refresh and select again'; end if;
  case p_operation
    when 'status' then update public.distribution_channels set status=p_value where id=any(p_ids);
    when 'type' then update public.distribution_channels set channel_type=p_value where id=any(p_ids);
    when 'pricing' then update public.distribution_channels set pricing_type=p_value where id=any(p_ids);
    when 'archive' then update public.distribution_channels set archived_at=now(),archived_by=p_actor where id=any(p_ids);
    when 'add_tag' then
      insert into public.distribution_channel_tags(channel_id,tag_id) select unnest(p_ids),p_value::uuid on conflict do nothing;
      update public.distribution_channels set updated_at=now() where id=any(p_ids);
    when 'remove_tag' then
      delete from public.distribution_channel_tags where channel_id=any(p_ids) and tag_id=p_value::uuid;
      update public.distribution_channels set updated_at=now() where id=any(p_ids);
    else raise exception 'Unsupported operation';
  end case;
  return affected;
end; $$;

-- A batch is one transaction. Replays preserve manual edits and archived records.
create function public.distribution_import(p_source jsonb,p_records jsonb)
returns jsonb language plpgsql set search_path='' as $$
declare sid uuid; cid uuid; r jsonb; inserted_count integer := 0; linked_count integer := 0; inserted_id uuid;
begin
  if jsonb_typeof(p_records)<>'array' or jsonb_array_length(p_records)>100 then raise exception 'Import at most 100 records per batch'; end if;
  insert into public.distribution_sources(name,source_url,license,attribution)
    values(p_source->>'name',p_source->>'source_url',p_source->>'license',p_source->>'attribution')
    on conflict(source_url) do update set imported_at=now() returning id into sid;
  for r in select * from jsonb_array_elements(p_records) loop
    inserted_id := null;
    insert into public.distribution_channels(name,slug,website_url,canonical_url,submission_url,channel_type)
      values(r->>'name',r->>'slug',r->>'website_url',r->>'canonical_url',r->>'submission_url',r->>'channel_type')
      on conflict(canonical_url) do nothing returning id into inserted_id;
    if inserted_id is not null then inserted_count:=inserted_count+1; end if;
    select id into cid from public.distribution_channels where canonical_url=r->>'canonical_url';
    insert into public.distribution_channel_sources(channel_id,source_id,source_record_id,source_url,raw_data,content_hash,observed_at)
      values(cid,sid,r->>'source_record_id',r->>'source_url',r->'raw_data',r->>'content_hash',(r->>'observed_at')::timestamptz)
      on conflict(source_id,source_record_id,content_hash) do nothing;
    if found then linked_count:=linked_count+1; end if;
  end loop;
  return jsonb_build_object('inserted',inserted_count,'observations',linked_count,'processed',jsonb_array_length(p_records));
end; $$;

-- A database lease caps concurrent checks across browser tabs/server instances.
create function public.distribution_claim_verification(p_ids uuid[],p_stale boolean,p_token uuid)
returns setof public.distribution_channels language plpgsql set search_path='' as $$
declare slots integer;
begin
  perform pg_advisory_xact_lock(81271423);
  select greatest(0,10-count(*)) into slots from public.distribution_channels where verification_lease_until>now();
  if cardinality(p_ids)>10 then raise exception 'Verify at most 10 channels at a time'; end if;
  return query with candidates as (
    select id from public.distribution_channels where archived_at is null
      and (verification_lease_until is null or verification_lease_until<now())
      and ((not p_stale and id=any(p_ids)) or (p_stale and status not in ('inactive','rejected') and (last_checked_at is null or last_checked_at<now()-interval '30 days')))
      order by last_checked_at nulls first,id limit slots for update skip locked
  ) update public.distribution_channels c set verification_token=p_token,verification_lease_until=now()+interval '5 minutes'
    from candidates where c.id=candidates.id returning c.*;
end; $$;

create function public.distribution_finish_verification(p_id uuid,p_token uuid,p_website jsonb,p_submission jsonb,p_actor uuid)
returns boolean language plpgsql set search_path='' as $$
declare c public.distribution_channels%rowtype; healthy boolean; dead boolean;
begin
  select * into c from public.distribution_channels where id=p_id and verification_token=p_token and archived_at is null for update;
  if not found then return false; end if;
  insert into public.distribution_channel_verifications(channel_id,website,submission,checked_by) values(p_id,p_website,p_submission,p_actor);
  if c.website_url is distinct from p_website->>'requested_url' or c.submission_url is distinct from p_submission->>'requested_url' then
    update public.distribution_channels set verification_token=null,verification_lease_until=null where id=p_id;
    return false;
  end if;
  healthy := (p_website->>'reachable')::boolean and (p_submission is null or (p_submission->>'reachable')::boolean);
  dead := coalesce((p_website->>'http_status')::integer in (404,410),false) or coalesce((p_submission->>'http_status')::integer in (404,410),false);
  update public.distribution_channels set last_checked_at=now(),
    last_verified_at=case when healthy then now() else last_verified_at end,
    status=case when status in ('inactive','rejected') then status when dead then 'broken'
      when not healthy and status='active' then 'stale'
      when healthy and status in ('broken','stale') then 'unverified' else status end,
    verification_token=null,verification_lease_until=null where id=p_id;
  return true;
end; $$;

-- Every function remains service-only; no SECURITY DEFINER privilege bypass.
revoke all on function public.distribution_save(uuid,jsonb,jsonb,timestamptz),public.distribution_bulk(uuid[],text,text,uuid),public.distribution_import(jsonb,jsonb),public.distribution_claim_verification(uuid[],boolean,uuid),public.distribution_finish_verification(uuid,uuid,jsonb,jsonb,uuid) from public,anon,authenticated;
grant execute on function public.distribution_save(uuid,jsonb,jsonb,timestamptz),public.distribution_bulk(uuid[],text,text,uuid),public.distribution_import(jsonb,jsonb),public.distribution_claim_verification(uuid[],boolean,uuid),public.distribution_finish_verification(uuid,uuid,jsonb,jsonb,uuid) to service_role;

create function public.distribution_search(p_filters jsonb,p_public boolean default false)
returns setof public.distribution_channels language sql stable set search_path='' as $$
  select c.* from public.distribution_channels c where c.archived_at is null
    and (not p_public or c.status='active')
    and (coalesce(p_filters->>'status','')='' or c.status=p_filters->>'status')
    and (coalesce(p_filters->>'type','')='' or c.channel_type=p_filters->>'type')
    and (coalesce(p_filters->>'pricing','')='' or c.pricing_type=p_filters->>'pricing')
    and (coalesce(p_filters->>'search','')='' or position(lower(p_filters->>'search') in lower(c.name))>0
      or to_tsvector('simple',c.name || ' ' || c.description) @@ websearch_to_tsquery('simple',p_filters->>'search'))
    and (not(p_filters ? 'minimumQuality') or c.quality_score >= (p_filters->>'minimumQuality')::integer)
    and (coalesce(p_filters->>'region','')='' or exists (
      select 1 from public.distribution_channel_tags ct join public.distribution_tags t on t.id=ct.tag_id
      where ct.channel_id=c.id and t.type='region' and t.slug=p_filters->>'region'))
    and (coalesce(p_filters->>'platform','')='' or exists (
      select 1 from public.distribution_channel_tags ct join public.distribution_tags t on t.id=ct.tag_id
      where ct.channel_id=c.id and t.type='platform' and t.slug=p_filters->>'platform'))
    and (not(p_filters ? 'tagIds') or not exists (
      select 1 from jsonb_array_elements_text(p_filters->'tagIds') requested where not exists (
        select 1 from public.distribution_channel_tags ct where ct.channel_id=c.id and ct.tag_id=requested::uuid)));
$$;
revoke all on function public.distribution_search(jsonb,boolean) from public,anon,authenticated;
grant execute on function public.distribution_search(jsonb,boolean) to service_role;

-- Aggregate bounded pages in SQL so PostgREST's row cap cannot truncate tags.
create function public.distribution_evidence(p_ids uuid[])
returns table(channel_id uuid,tags jsonb,sources jsonb,source_count bigint)
language plpgsql stable set search_path='' as $$
begin
  if cardinality(p_ids)>100 then raise exception 'Read at most 100 channels'; end if;
  return query select c.id,
    coalesce((select jsonb_agg(jsonb_build_object('tag_id',t.id,'relevance_score',ct.relevance_score,'confidence_score',ct.confidence_score,
      'tag',jsonb_build_object('id',t.id,'type',t.type,'slug',t.slug,'name',t.name)) order by t.type,t.name)
      from public.distribution_channel_tags ct join public.distribution_tags t on t.id=ct.tag_id where ct.channel_id=c.id),'[]'::jsonb),
    coalesce(e.sources,'[]'::jsonb),coalesce(e.source_count,0)
    from public.distribution_channels c left join lateral (
      select jsonb_agg(jsonb_build_object('name',s.name,'source_url',s.source_url,'license',s.license,'attribution',s.attribution) order by s.name) as sources,
        count(*) as source_count from public.distribution_sources s where exists (
          select 1 from public.distribution_channel_sources cs where cs.channel_id=c.id and cs.source_id=s.id)
    ) e on true where c.id=any(p_ids) and c.archived_at is null;
end; $$;
revoke all on function public.distribution_evidence(uuid[]) from public,anon,authenticated;
grant execute on function public.distribution_evidence(uuid[]) to service_role;
