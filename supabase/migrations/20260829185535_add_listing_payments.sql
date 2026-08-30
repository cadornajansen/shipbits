create type public.listing_payment_status as enum (
  'pending',
  'paid',
  'failed',
  'expired'
);

create table public.listing_payments (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.listing_submissions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'paymongo' check (provider = 'paymongo'),
  provider_payment_intent_id text unique not null,
  provider_payment_id text unique,
  provider_event_id text unique,
  amount_centavos integer not null check (amount_centavos >= 100),
  currency text not null default 'PHP' check (currency = 'PHP'),
  status public.listing_payment_status not null default 'pending',
  qr_expires_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index listing_payments_submission_id_idx
  on public.listing_payments (submission_id);

create index listing_payments_user_id_idx
  on public.listing_payments (user_id);

create index listing_payments_status_idx
  on public.listing_payments (status);

create index listing_payments_created_at_idx
  on public.listing_payments (created_at desc);

create trigger listing_payments_set_updated_at
before update on public.listing_payments
for each row
execute function public.set_products_updated_at();

alter table public.listing_payments enable row level security;

revoke all on table public.listing_payments from anon, authenticated;
grant select on table public.listing_payments to authenticated;

create policy "Users can read their own listing payments"
on public.listing_payments
for select
to authenticated
using ((select auth.uid()) = user_id);

create function public.fulfill_listing_payment(
  p_listing_payment_id uuid,
  p_provider_payment_id text,
  p_provider_event_id text,
  p_product_slug text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  payment_row public.listing_payments%rowtype;
  submission_row public.listing_submissions%rowtype;
  created_product_id uuid;
begin
  select * into payment_row
  from public.listing_payments
  where id = p_listing_payment_id
  for update;

  if not found then
    raise exception 'Listing payment not found';
  end if;

  if payment_row.status = 'paid' then
    return null;
  end if;

  if payment_row.status <> 'pending' then
    raise exception 'Listing payment is not pending';
  end if;

  select * into submission_row
  from public.listing_submissions
  where id = payment_row.submission_id
  for update;

  if not found then
    raise exception 'Listing submission not found';
  end if;

  if submission_row.name is null
    or submission_row.short_description is null
    or submission_row.category_id is null then
    raise exception 'Listing submission is incomplete';
  end if;

  if submission_row.status = 'submitted' then
    update public.listing_payments
    set
      paid_at = now(),
      provider_event_id = coalesce(provider_event_id, p_provider_event_id),
      provider_payment_id = coalesce(provider_payment_id, p_provider_payment_id),
      status = 'paid'
    where id = payment_row.id;

    return null;
  end if;

  insert into public.products (
    category_id,
    listing_source,
    long_description,
    moderation_status,
    name,
    normalized_domain,
    published_at,
    short_description,
    slug,
    website_url
  ) values (
    submission_row.category_id,
    'paid',
    submission_row.long_description,
    'draft',
    submission_row.name,
    submission_row.normalized_domain,
    null,
    submission_row.short_description,
    p_product_slug,
    submission_row.website_url
  )
  on conflict (normalized_domain) do nothing
  returning id into created_product_id;

  update public.listing_payments
  set
    paid_at = now(),
    provider_event_id = coalesce(provider_event_id, p_provider_event_id),
    provider_payment_id = coalesce(provider_payment_id, p_provider_payment_id),
    status = 'paid'
  where id = payment_row.id;

  update public.listing_submissions
  set status = 'submitted'
  where id = submission_row.id;

  return created_product_id;
end;
$$;

revoke all on function public.fulfill_listing_payment(uuid, text, text, text)
  from public, anon, authenticated;
grant execute on function public.fulfill_listing_payment(uuid, text, text, text)
  to service_role;
