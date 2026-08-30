alter table public.listing_submissions
  add column product_id uuid unique references public.products(id) on delete set null;

create table public.listing_submission_assets (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.listing_submissions(id) on delete cascade,
  type public.product_asset_type not null check (type in ('logo', 'cover')),
  object_key text unique not null,
  public_url text not null,
  mime_type text not null,
  size_bytes bigint,
  created_at timestamptz not null default now(),
  unique (submission_id, type)
);

create index listing_submission_assets_submission_id_idx
  on public.listing_submission_assets (submission_id);

alter table public.listing_submission_assets enable row level security;

revoke all on table public.listing_submission_assets from anon, authenticated;
grant select on table public.listing_submission_assets to authenticated;

create policy "Users can read assets for their own listing submissions"
on public.listing_submission_assets
for select
to authenticated
using (
  exists (
    select 1
    from public.listing_submissions
    where listing_submissions.id = listing_submission_assets.submission_id
      and listing_submissions.user_id = (select auth.uid())
  )
);

create or replace function public.fulfill_listing_payment(
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
  media_count integer;
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

  select count(*) into media_count
  from public.listing_submission_assets
  where submission_id = submission_row.id
    and type in ('logo', 'cover');

  if media_count <> 2 then
    raise exception 'A logo and OG cover image are required before publishing';
  end if;

  if submission_row.status = 'submitted' then
    update public.listing_payments
    set
      paid_at = now(),
      provider_event_id = coalesce(provider_event_id, p_provider_event_id),
      provider_payment_id = coalesce(provider_payment_id, p_provider_payment_id),
      status = 'paid'
    where id = payment_row.id;

    return submission_row.product_id;
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
    'published',
    submission_row.name,
    submission_row.normalized_domain,
    now(),
    submission_row.short_description,
    p_product_slug,
    submission_row.website_url
  )
  returning id into created_product_id;

  insert into public.product_assets (
    mime_type,
    object_key,
    product_id,
    public_url,
    size_bytes,
    type
  )
  select
    mime_type,
    object_key,
    created_product_id,
    public_url,
    size_bytes,
    type
  from public.listing_submission_assets
  where submission_id = submission_row.id;

  update public.listing_payments
  set
    paid_at = now(),
    provider_event_id = coalesce(provider_event_id, p_provider_event_id),
    provider_payment_id = coalesce(provider_payment_id, p_provider_payment_id),
    status = 'paid'
  where id = payment_row.id;

  update public.listing_submissions
  set product_id = created_product_id, status = 'submitted'
  where id = submission_row.id;

  return created_product_id;
end;
$$;

revoke all on function public.fulfill_listing_payment(uuid, text, text, text)
  from public, anon, authenticated;
grant execute on function public.fulfill_listing_payment(uuid, text, text, text)
  to service_role;
