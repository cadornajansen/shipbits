create or replace function public.distribution_apply_live_enrichment(
  p_id uuid,p_expected timestamptz,p_updates jsonb,p_tags uuid[],p_evidence jsonb,p_website jsonb,p_submission jsonb
)
returns boolean language plpgsql set search_path='' as $$
declare c public.distribution_channels%rowtype; item jsonb; update_field text; allowed boolean; update_value jsonb;
begin
  if jsonb_typeof(p_updates)<>'object' or jsonb_typeof(p_evidence)<>'array' or jsonb_array_length(p_evidence)>30
    or coalesce(cardinality(p_tags),0)>54 then raise exception 'Invalid live enrichment payload'; end if;
  if exists(select 1 from jsonb_object_keys(p_updates) k where k not in (
    'name','description','website_url','canonical_url','submission_url','channel_type','pricing_type','price_usd',
    'requires_account','requires_email_verification','requires_manual_review','requires_payment','backlink_possible',
    'dofollow_possible','submission_requirements','status')) then raise exception 'Unsupported live enrichment field'; end if;
  select * into c from public.distribution_channels where id=p_id and archived_at is null for update;
  if not found or c.updated_at<>p_expected then return false; end if;

  for update_field,update_value in select j.key,j.value from jsonb_each(p_updates) j loop
    allowed := exists(select 1 from public.distribution_channel_field_evidence e where e.channel_id=c.id and e.field_name=update_field)
      or case update_field
        when 'description' then c.description=''
        when 'submission_url' then c.submission_url is null
        when 'channel_type' then c.channel_type is null
        when 'pricing_type' then c.pricing_type='unknown'
        when 'price_usd' then c.price_usd is null
        when 'requires_account' then c.requires_account is null
        when 'requires_email_verification' then c.requires_email_verification is null
        when 'requires_manual_review' then c.requires_manual_review is null
        when 'requires_payment' then c.requires_payment is null
        when 'backlink_possible' then c.backlink_possible is null
        when 'dofollow_possible' then c.dofollow_possible is null
        when 'submission_requirements' then c.submission_requirements='{}'::jsonb
        when 'status' then c.status in ('unverified','stale','broken')
        else false end;
    if allowed then
      case update_field
        when 'description' then c.description:=update_value#>>'{}';
        when 'submission_url' then c.submission_url:=update_value#>>'{}';
        when 'channel_type' then c.channel_type:=update_value#>>'{}';
        when 'pricing_type' then c.pricing_type:=update_value#>>'{}';
        when 'price_usd' then c.price_usd:=(update_value#>>'{}')::numeric;
        when 'requires_account' then c.requires_account:=(update_value#>>'{}')::boolean;
        when 'requires_email_verification' then c.requires_email_verification:=(update_value#>>'{}')::boolean;
        when 'requires_manual_review' then c.requires_manual_review:=(update_value#>>'{}')::boolean;
        when 'requires_payment' then c.requires_payment:=(update_value#>>'{}')::boolean;
        when 'backlink_possible' then c.backlink_possible:=(update_value#>>'{}')::boolean;
        when 'dofollow_possible' then c.dofollow_possible:=(update_value#>>'{}')::boolean;
        when 'submission_requirements' then c.submission_requirements:=update_value;
        when 'status' then c.status:=update_value#>>'{}';
      end case;
    end if;
  end loop;
  update public.distribution_channels set description=c.description,submission_url=c.submission_url,channel_type=c.channel_type,
    pricing_type=c.pricing_type,price_usd=c.price_usd,requires_account=c.requires_account,
    requires_email_verification=c.requires_email_verification,requires_manual_review=c.requires_manual_review,
    requires_payment=c.requires_payment,backlink_possible=c.backlink_possible,dofollow_possible=c.dofollow_possible,
    submission_requirements=c.submission_requirements,status=c.status,last_checked_at=now(),
    last_verified_at=case when c.status='active' then now() else last_verified_at end,enriched_at=now()
    where id=c.id;
  insert into public.distribution_channel_verifications(channel_id,website,submission) values(c.id,p_website,p_submission);

  if p_tags is not null and (not exists(select 1 from public.distribution_channel_tags where channel_id=c.id)
    or exists(select 1 from public.distribution_channel_field_evidence where channel_id=c.id and field_name='tags')) then
    delete from public.distribution_channel_tags where channel_id=c.id;
    insert into public.distribution_channel_tags(channel_id,tag_id)
      select c.id,t.id from public.distribution_tags t where t.id=any(p_tags);
  end if;
  for item in select * from jsonb_array_elements(p_evidence) loop
    insert into public.distribution_channel_field_evidence(
      channel_id,field_name,source_observation_id,source_url,resulting_value,source_value,raw_value,
      extraction_method,observed_at,enriched_at
    ) values(c.id,item->>'field',null,item->>'source_url',item->'value',item->'source_value',
      coalesce(item->'source_value','null'::jsonb),item->>'extraction_method',(item->>'observed_at')::timestamptz,now())
    on conflict(channel_id,field_name) do update set source_observation_id=null,source_url=excluded.source_url,
      resulting_value=excluded.resulting_value,source_value=excluded.source_value,raw_value=excluded.raw_value,
      extraction_method=excluded.extraction_method,observed_at=excluded.observed_at,enriched_at=now();
  end loop;
  return true;
end; $$;
