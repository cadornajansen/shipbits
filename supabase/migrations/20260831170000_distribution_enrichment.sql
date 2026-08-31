-- Field evidence distinguishes imported values from administrator-curated values.
alter table public.distribution_channels
  add column if not exists enriched_at timestamptz;

create table if not exists public.distribution_channel_field_evidence (
  channel_id uuid not null references public.distribution_channels(id) on delete cascade,
  field_name text not null check (field_name in ('pricing_type','submission_url')),
  source_observation_id uuid not null references public.distribution_channel_sources(id) on delete cascade,
  raw_value jsonb not null,
  extraction_method text not null,
  observed_at timestamptz not null,
  enriched_at timestamptz not null default now(),
  primary key(channel_id,field_name)
);
alter table public.distribution_channel_field_evidence enable row level security;
revoke all on public.distribution_channel_field_evidence from anon,authenticated;
grant all on public.distribution_channel_field_evidence to service_role;

-- Admin writes take precedence permanently by removing enrichment ownership.
create or replace function public.distribution_save(p_id uuid,p_data jsonb,p_tags jsonb,p_expected timestamptz)
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
    delete from public.distribution_channel_field_evidence
      where channel_id=saved_id and field_name in (select key from jsonb_object_keys(p_data) key where key in ('pricing_type','submission_url'));
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

create or replace function public.distribution_enrichment_candidates(p_after uuid default null,p_limit integer default 100,p_channel_id uuid default null)
returns table(channel_id uuid,updates jsonb,evidence jsonb,usable_pricing boolean,usable_submission_url boolean,source_claim boolean,rejected_count integer,still_unknown boolean)
language plpgsql stable set search_path='' as $$
begin
  if p_limit not between 1 and 100 then raise exception 'Read 1 to 100 channels'; end if;
  return query
  with selected as (
    select c.id,c.pricing_type,c.submission_url,
      exists(select 1 from public.distribution_channel_field_evidence e where e.channel_id=c.id and e.field_name='pricing_type') pricing_owned,
      exists(select 1 from public.distribution_channel_field_evidence e where e.channel_id=c.id and e.field_name='submission_url') submission_owned
    from public.distribution_channels c where c.archived_at is null
      and (p_channel_id is null or c.id=p_channel_id) and (p_after is null or c.id::text>p_after::text)
    order by c.id::text limit p_limit
  ), observations as (
    select s.*,cs.id observation_id,cs.source_record_id,cs.source_url,cs.observed_at,cs.raw_data,
      case lower(btrim(cs.raw_data->>'pricing')) when 'free' then 'free' when 'freemium' then 'freemium'
        when 'paid' then 'paid' when 'paid listing' then 'paid' end normalized_pricing,
      case when jsonb_typeof(cs.raw_data->'verification_status')='string' and btrim(cs.raw_data->>'verification_status')<>'' then true else false end has_claim
    from selected s left join public.distribution_channel_sources cs on cs.channel_id=s.id
  ), chosen as (
    select o.*,
      first_value(observation_id) over (partition by id order by (normalized_pricing is not null) desc,observed_at desc,observation_id) pricing_observation,
      first_value(normalized_pricing) over (partition by id order by (normalized_pricing is not null) desc,observed_at desc,observation_id) pricing_value
    from observations o
  )
  select c.id,
    case when (c.pricing_type='unknown' or c.pricing_owned) and c.pricing_value is not null and c.pricing_type<>c.pricing_value
      then jsonb_build_object('pricing_type',c.pricing_value) else '{}'::jsonb end,
    case when (c.pricing_type='unknown' or c.pricing_owned) and c.pricing_value is not null and c.pricing_type<>c.pricing_value then
      jsonb_build_array(jsonb_build_object('field','pricing_type','value',c.pricing_value,'source_observation_id',c.pricing_observation,
        'raw_value',(select raw_data->'pricing' from observations x where x.observation_id=c.pricing_observation),
        'extraction_method','raw_data.pricing')) else '[]'::jsonb end,
    c.pricing_value is not null,false,bool_or(c.has_claim),
    count(*) filter(where c.raw_data ? 'pricing' and lower(btrim(c.raw_data->>'pricing')) not in ('free','freemium','paid','paid listing','unknown'))::integer,
    c.pricing_value is null and c.submission_url is null
  from chosen c group by c.id,c.pricing_type,c.submission_url,c.pricing_owned,c.pricing_value,c.pricing_observation;
end; $$;

create or replace function public.distribution_apply_enrichment(p_candidates jsonb)
returns integer language plpgsql set search_path='' as $$
declare candidate jsonb; item jsonb; c public.distribution_channels%rowtype; affected integer := 0;
begin
  if jsonb_typeof(p_candidates)<>'array' or jsonb_array_length(p_candidates)>100 then raise exception 'Apply at most 100 candidates'; end if;
  for candidate in select * from jsonb_array_elements(p_candidates) loop
    select * into c from public.distribution_channels where id=(candidate->>'channel_id')::uuid and archived_at is null for update;
    if not found then continue; end if;
    if candidate->'updates' ? 'pricing_type' and (c.pricing_type='unknown' or exists(select 1 from public.distribution_channel_field_evidence e where e.channel_id=c.id and e.field_name='pricing_type')) then
      update public.distribution_channels set pricing_type=candidate->'updates'->>'pricing_type',enriched_at=now() where id=c.id;
      affected:=affected+1;
    end if;
    for item in select * from jsonb_array_elements(candidate->'evidence') loop
      if item->>'field'='pricing_type' then
        insert into public.distribution_channel_field_evidence(channel_id,field_name,source_observation_id,raw_value,extraction_method,observed_at)
        select c.id,'pricing_type',(item->>'source_observation_id')::uuid,item->'raw_value',item->>'extraction_method',cs.observed_at
        from public.distribution_channel_sources cs where cs.id=(item->>'source_observation_id')::uuid and cs.channel_id=c.id
        on conflict(channel_id,field_name) do update set source_observation_id=excluded.source_observation_id,raw_value=excluded.raw_value,
          extraction_method=excluded.extraction_method,observed_at=excluded.observed_at,enriched_at=now();
      end if;
    end loop;
  end loop;
  return affected;
end; $$;

-- Import is still unverified; the caller runs the same enrichment pipeline afterward.
revoke all on function public.distribution_enrichment_candidates(uuid,integer,uuid),public.distribution_apply_enrichment(jsonb) from public,anon,authenticated;
grant execute on function public.distribution_enrichment_candidates(uuid,integer,uuid),public.distribution_apply_enrichment(jsonb) to service_role;

-- Return affected channel IDs so future imports immediately run deterministic enrichment.
create or replace function public.distribution_import(p_source jsonb,p_records jsonb)
returns jsonb language plpgsql set search_path='' as $$
declare sid uuid; cid uuid; r jsonb; inserted_count integer := 0; linked_count integer := 0; inserted_id uuid; channel_ids uuid[] := '{}';
begin
  if jsonb_typeof(p_records)<>'array' or jsonb_array_length(p_records)>100 then raise exception 'Import at most 100 records per batch'; end if;
  insert into public.distribution_sources(name,source_url,license,attribution)
    values(p_source->>'name',p_source->>'source_url',p_source->>'license',p_source->>'attribution')
    on conflict(source_url) do update set imported_at=now() returning id into sid;
  for r in select * from jsonb_array_elements(p_records) loop
    inserted_id := null;
    insert into public.distribution_channels(name,slug,website_url,canonical_url,submission_url,channel_type,status)
      values(r->>'name',r->>'slug',r->>'website_url',r->>'canonical_url',r->>'submission_url',r->>'channel_type','unverified')
      on conflict(canonical_url) do nothing returning id into inserted_id;
    if inserted_id is not null then inserted_count:=inserted_count+1; end if;
    select id into cid from public.distribution_channels where canonical_url=r->>'canonical_url';
    channel_ids:=array_append(channel_ids,cid);
    insert into public.distribution_channel_sources(channel_id,source_id,source_record_id,source_url,raw_data,content_hash,observed_at)
      values(cid,sid,r->>'source_record_id',r->>'source_url',r->'raw_data',r->>'content_hash',(r->>'observed_at')::timestamptz)
      on conflict(source_id,source_record_id,content_hash) do nothing;
    if found then linked_count:=linked_count+1; end if;
  end loop;
  return jsonb_build_object('inserted',inserted_count,'observations',linked_count,'processed',jsonb_array_length(p_records),'channel_ids',to_jsonb(channel_ids));
end; $$;
