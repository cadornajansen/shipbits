-- Avoid PL/pgSQL variable/column collisions in the direct seed helper.
create or replace function public.distribution_seed_channel(
  p_data jsonb,
  p_force boolean default false
)
returns uuid
language plpgsql
set search_path=''
as $$
declare
  v_channel_id uuid;
  v_existing public.distribution_channels%rowtype;
  v_field_key text;
  v_patch jsonb := '{}'::jsonb;
begin
  if jsonb_typeof(p_data)<>'object' or nullif(btrim(p_data->>'canonical_url'),'') is null then
    raise exception 'A channel object with canonical_url is required';
  end if;
  if exists(
    select 1
    from jsonb_object_keys(p_data) as seed_key(key)
    where seed_key.key not in (
      'name','slug','description','website_url','canonical_url','submission_url','channel_type','pricing_type',
      'price_amount','price_currency','requires_account','requires_email_verification','requires_manual_review',
      'requires_payment','estimated_submission_minutes','backlink_possible','dofollow_possible','traffic_tier',
      'authority_score','quality_score','competition_score','submission_difficulty','submission_requirements','status'
    )
  ) then raise exception 'Unsupported seed field'; end if;
  select channels.*
  into v_existing
  from public.distribution_channels as channels
  where channels.canonical_url=p_data->>'canonical_url'
  for update;
  if not found then
    v_existing := jsonb_populate_record(null::public.distribution_channels,p_data);
    v_existing.id:=gen_random_uuid(); v_existing.created_at:=now(); v_existing.updated_at:=now();
    insert into public.distribution_channels select v_existing.* returning id into v_channel_id;
    return v_channel_id;
  end if;
  v_channel_id:=v_existing.id;
  for v_field_key in select seed_key.key from jsonb_object_keys(p_data) as seed_key(key) loop
    if v_field_key='canonical_url' or p_force or not exists(
      select 1
      from public.distribution_channel_field_overrides as overrides
      where overrides.channel_id=v_channel_id and overrides.field_name=v_field_key
    ) then v_patch:=v_patch || jsonb_build_object(v_field_key,p_data->v_field_key); end if;
  end loop;
  v_existing:=jsonb_populate_record(v_existing,v_patch);
  update public.distribution_channels as channels set name=v_existing.name,slug=v_existing.slug,
    description=v_existing.description,website_url=v_existing.website_url,canonical_url=v_existing.canonical_url,
    submission_url=v_existing.submission_url,channel_type=v_existing.channel_type,pricing_type=v_existing.pricing_type,
    price_amount=v_existing.price_amount,price_currency=v_existing.price_currency,requires_account=v_existing.requires_account,
    requires_email_verification=v_existing.requires_email_verification,requires_manual_review=v_existing.requires_manual_review,
    requires_payment=v_existing.requires_payment,estimated_submission_minutes=v_existing.estimated_submission_minutes,
    backlink_possible=v_existing.backlink_possible,dofollow_possible=v_existing.dofollow_possible,
    traffic_tier=v_existing.traffic_tier,authority_score=v_existing.authority_score,quality_score=v_existing.quality_score,
    competition_score=v_existing.competition_score,submission_difficulty=v_existing.submission_difficulty,
    submission_requirements=v_existing.submission_requirements,status=v_existing.status
    where channels.id=v_channel_id;
  return v_channel_id;
end;
$$;

revoke all on function public.distribution_seed_channel(jsonb,boolean) from public,anon,authenticated;
grant execute on function public.distribution_seed_channel(jsonb,boolean) to service_role;
