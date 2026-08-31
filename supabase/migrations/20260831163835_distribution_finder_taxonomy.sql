-- Controlled taxonomy additions needed by the seeded channel catalog.
insert into public.distribution_tags(type, slug, name)
values
  ('category', 'ai-directory', 'AI Directory'),
  ('category', 'startup-directory', 'Startup Directory'),
  ('category', 'api-marketplace', 'API Marketplace'),
  ('category', 'open-source', 'Open Source'),
  ('platform', 'github', 'GitHub'),
  ('platform', 'shopify', 'Shopify'),
  ('platform', 'wordpress', 'WordPress')
on conflict (type, slug) do nothing;

-- Replaces only classifier-owned tag sets. Admin saves claim the `tags` override,
-- so a classifier replay cannot remove or change an administrator's decisions.
create function public.distribution_replace_automated_tags(p_assignments jsonb)
returns integer
language plpgsql
set search_path = ''
as $$
declare
  assignment jsonb;
  v_channel_id uuid;
  v_applied integer := 0;
begin
  if jsonb_typeof(p_assignments) <> 'array' or jsonb_array_length(p_assignments) > 100 then
    raise exception 'Provide 1 to 100 classification assignments';
  end if;

  for assignment in select * from jsonb_array_elements(p_assignments) loop
    v_channel_id := (assignment ->> 'channel_id')::uuid;
    if jsonb_typeof(assignment -> 'tags') <> 'array' or jsonb_array_length(assignment -> 'tags') > 100 then
      raise exception 'Each classification assignment needs at most 100 tags';
    end if;

    perform 1
    from public.distribution_channels c
    where c.id = v_channel_id
      and c.archived_at is null
      and not exists (
        select 1
        from public.distribution_channel_field_overrides o
        where o.channel_id = c.id and o.field_name = 'tags'
      )
    for update;
    if not found then
      continue;
    end if;

    delete from public.distribution_channel_tags where channel_id = v_channel_id;
    insert into public.distribution_channel_tags(channel_id, tag_id, relevance_score, confidence_score)
    select
      v_channel_id,
      (tag ->> 'tag_id')::uuid,
      (tag ->> 'relevance_score')::smallint,
      (tag ->> 'confidence_score')::smallint
    from jsonb_array_elements(assignment -> 'tags') tag
    join public.distribution_tags t on t.id = (tag ->> 'tag_id')::uuid;
    v_applied := v_applied + 1;
  end loop;

  return v_applied;
end;
$$;

revoke all on function public.distribution_replace_automated_tags(jsonb) from public, anon, authenticated;
grant execute on function public.distribution_replace_automated_tags(jsonb) to service_role;

-- Candidate retrieval is deliberately narrow and deterministic. Detailed ranking
-- is performed in the server-side Finder service after this query.
create function public.distribution_finder_candidates(
  p_tag_ids uuid[],
  p_limit integer default 500
)
returns setof public.distribution_channels
language sql
stable
set search_path = ''
as $$
  select c.*
  from public.distribution_channels c
  where c.archived_at is null
    and c.status = 'active'
    and cardinality(p_tag_ids) between 1 and 50
    and p_limit between 1 and 1000
    and exists (
      select 1
      from public.distribution_channel_tags ct
      where ct.channel_id = c.id and ct.tag_id = any(p_tag_ids)
    )
  order by c.name, c.id
  limit p_limit;
$$;

revoke all on function public.distribution_finder_candidates(uuid[], integer) from public, anon, authenticated;
grant execute on function public.distribution_finder_candidates(uuid[], integer) to service_role;
