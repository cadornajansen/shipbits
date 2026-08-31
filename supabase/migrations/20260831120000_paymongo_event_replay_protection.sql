-- A provider event is global, not scoped to a payment table. Claiming it before
-- fulfillment prevents duplicate deliveries from repeating provider requests.
create table public.paymongo_webhook_events (
  event_id text primary key check (length(event_id) between 1 and 255),
  status text not null check (status in ('processing', 'completed')),
  claimed_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.paymongo_webhook_events enable row level security;
revoke all on public.paymongo_webhook_events from public, anon, authenticated;
grant select, insert, update, delete on public.paymongo_webhook_events to service_role;

create function public.claim_paymongo_webhook_event(p_event_id text)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if p_event_id is null or length(p_event_id) not between 1 and 255 then
    raise exception 'Invalid PayMongo event identifier';
  end if;

  insert into public.paymongo_webhook_events(event_id, status)
  values (p_event_id, 'processing')
  on conflict (event_id) do nothing;
  return found;
end;
$$;

revoke all on function public.claim_paymongo_webhook_event(text) from public, anon, authenticated;
grant execute on function public.claim_paymongo_webhook_event(text) to service_role;
