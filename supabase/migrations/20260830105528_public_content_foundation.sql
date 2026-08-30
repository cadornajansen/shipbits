create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null check (
    email = lower(btrim(email)) and char_length(email) between 3 and 254
    and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  ),
  status text not null default 'subscribed' check (status in ('subscribed', 'unsubscribed')),
  created_at timestamptz not null default now()
);

-- The API stores a keyed hash, never the request's IP address. These are short-
-- lived counters shared by every app instance, not an analytics event log.
create table public.public_request_limits (
  scope text not null check (scope in ('seo-checker', 'newsletter')),
  identifier_hash text not null,
  request_count integer not null check (request_count > 0),
  expires_at timestamptz not null,
  primary key (scope, identifier_hash)
);
create index public_request_limits_expiry_idx on public.public_request_limits (expires_at);

alter table public.newsletter_subscribers enable row level security;
alter table public.public_request_limits enable row level security;
revoke all on public.newsletter_subscribers, public.public_request_limits from public, anon, authenticated;
grant select, insert, update, delete on public.newsletter_subscribers, public.public_request_limits to service_role;

create function public.consume_public_rate_limit(
  p_scope text,
  p_identifier_hash text,
  p_window_seconds integer,
  p_limit integer,
  p_global_limit integer
)
returns table (allowed boolean, retry_after_seconds integer)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_count integer;
  v_expires timestamptz;
begin
  if p_scope not in ('seo-checker', 'newsletter')
     or p_identifier_hash !~ '^[a-f0-9]{64}$'
     or p_window_seconds not between 60 and 86400
     or p_limit not between 1 and 100
     or p_global_limit not between 1 and 10000 then
    raise exception 'Invalid public request limit configuration';
  end if;

  delete from public.public_request_limits as counters
  using (
    select scope, identifier_hash from public.public_request_limits
    where expires_at < v_now - interval '1 day'
    limit 100 for update skip locked
  ) as stale
  where counters.scope = stale.scope and counters.identifier_hash = stale.identifier_hash;

  -- Always take the global row before the visitor row to keep lock order stable.
  insert into public.public_request_limits as counters (scope, identifier_hash, request_count, expires_at)
  values (p_scope, 'global', 1, v_now + interval '1 hour')
  on conflict (scope, identifier_hash) do update
  set request_count = case when counters.expires_at <= v_now then 1
    else least(counters.request_count + 1, p_global_limit + 1) end,
    expires_at = case when counters.expires_at <= v_now then v_now + interval '1 hour'
      else counters.expires_at end
  returning counters.request_count, counters.expires_at into v_count, v_expires;

  if v_count > p_global_limit then
    return query select false, greatest(1, ceil(extract(epoch from v_expires - v_now))::integer);
    return;
  end if;

  insert into public.public_request_limits as counters (scope, identifier_hash, request_count, expires_at)
  values (p_scope, p_identifier_hash, 1, v_now + make_interval(secs => p_window_seconds))
  on conflict (scope, identifier_hash) do update
  set request_count = case when counters.expires_at <= v_now then 1
    else least(counters.request_count + 1, p_limit + 1) end,
    expires_at = case when counters.expires_at <= v_now then v_now + make_interval(secs => p_window_seconds)
      else counters.expires_at end
  returning counters.request_count, counters.expires_at into v_count, v_expires;

  return query select v_count <= p_limit,
    case when v_count <= p_limit then 0
      else greatest(1, ceil(extract(epoch from v_expires - v_now))::integer) end;
end;
$$;

revoke all on function public.consume_public_rate_limit(text, text, integer, integer, integer)
  from public, anon, authenticated;
grant execute on function public.consume_public_rate_limit(text, text, integer, integer, integer)
  to service_role;

create index products_public_publication_idx on public.products (published_at desc, id)
  where moderation_status = 'published' and archived_at is null;
create index products_public_category_idx on public.products (category_id, published_at desc, id)
  where moderation_status = 'published' and archived_at is null;

comment on table public.newsletter_subscribers is
  'Opt-in signup foundation only. No email delivery. Browsers cannot read or mutate this table.';
