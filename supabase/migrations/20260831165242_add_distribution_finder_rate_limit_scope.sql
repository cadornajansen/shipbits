alter table public.public_request_limits
  drop constraint if exists public_request_limits_scope_check;

alter table public.public_request_limits
  add constraint public_request_limits_scope_check check (scope in (
    'seo-checker', 'distribution-finder', 'newsletter', 'autocomplete',
    'listing-payment', 'directory-campaign', 'directory-payment', 'upvote-payment'
  ));

create or replace function public.consume_public_rate_limit(
  p_scope text, p_identifier_hash text, p_window_seconds integer,
  p_limit integer, p_global_limit integer
)
returns table(allowed boolean, retry_after_seconds integer)
language plpgsql
set search_path = ''
as $$
declare v_now timestamptz := clock_timestamp(); v_count integer; v_expires timestamptz;
begin
  if p_scope not in ('seo-checker', 'distribution-finder', 'newsletter', 'autocomplete', 'listing-payment', 'directory-campaign', 'directory-payment', 'upvote-payment')
    or p_identifier_hash !~ '^[a-f0-9]{64}$'
    or p_window_seconds not between 60 and 86400
    or p_limit not between 1 and 100
    or p_global_limit not between 1 and 10000 then
    raise exception 'Invalid public request limit configuration';
  end if;
  delete from public.public_request_limits as counters using (
    select scope, identifier_hash from public.public_request_limits
    where expires_at < v_now - interval '1 day' limit 100 for update skip locked
  ) as stale where counters.scope = stale.scope and counters.identifier_hash = stale.identifier_hash;
  insert into public.public_request_limits as counters (scope, identifier_hash, request_count, expires_at)
  values (p_scope, repeat('0', 64), 1, v_now + interval '1 hour')
  on conflict (scope, identifier_hash) do update set
    request_count = case when counters.expires_at <= v_now then 1 else least(counters.request_count + 1, p_global_limit + 1) end,
    expires_at = case when counters.expires_at <= v_now then v_now + interval '1 hour' else counters.expires_at end
  returning counters.request_count, counters.expires_at into v_count, v_expires;
  if v_count > p_global_limit then return query select false, greatest(1, ceil(extract(epoch from v_expires - v_now))::integer); return; end if;
  insert into public.public_request_limits as counters (scope, identifier_hash, request_count, expires_at)
  values (p_scope, p_identifier_hash, 1, v_now + make_interval(secs => p_window_seconds))
  on conflict (scope, identifier_hash) do update set
    request_count = case when counters.expires_at <= v_now then 1 else least(counters.request_count + 1, p_limit + 1) end,
    expires_at = case when counters.expires_at <= v_now then v_now + make_interval(secs => p_window_seconds) else counters.expires_at end
  returning counters.request_count, counters.expires_at into v_count, v_expires;
  return query select v_count <= p_limit, case when v_count <= p_limit then 0 else greatest(1, ceil(extract(epoch from v_expires - v_now))::integer) end;
end;
$$;
