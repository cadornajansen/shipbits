alter table public.products
  add column tagline text;

alter table public.listing_submissions
  add column tagline text;

update public.products
set tagline = array_to_string(
  (regexp_split_to_array(trim(short_description), '\s+'))[1:15],
  ' '
)
where tagline is null;

alter table public.products
  alter column tagline set not null;

alter table public.products
  add constraint products_tagline_word_count_check
  check (cardinality(regexp_split_to_array(trim(tagline), '\s+')) between 1 and 15);

alter table public.listing_submissions
  add constraint listing_submissions_tagline_word_count_check
  check (
    tagline is null
    or cardinality(regexp_split_to_array(trim(tagline), '\s+')) between 1 and 15
  );

create table public.product_upvotes (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'paymongo' check (provider = 'paymongo'),
  provider_payment_intent_id text unique not null,
  provider_payment_id text unique,
  provider_event_id text unique,
  amount_centavos integer not null check (amount_centavos >= 100),
  currency text not null default 'PHP' check (currency = 'PHP'),
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'expired')),
  qr_expires_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index product_upvotes_product_status_idx
  on public.product_upvotes (product_id, status);

create index product_upvotes_user_created_at_idx
  on public.product_upvotes (user_id, created_at desc);

create unique index product_upvotes_one_pending_per_user_product_idx
  on public.product_upvotes (product_id, user_id)
  where status = 'pending';

create trigger product_upvotes_set_updated_at
before update on public.product_upvotes
for each row
execute function public.set_products_updated_at();

alter table public.product_upvotes enable row level security;

revoke all on table public.product_upvotes from anon, authenticated;
grant select on table public.product_upvotes to authenticated;

create policy "Users can view their own product upvotes"
on public.product_upvotes
for select
to authenticated
using ((select auth.uid()) = user_id);

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

  select * into submission_row
  from public.listing_submissions
  where id = payment_row.submission_id
  for update;

  if not found then
    raise exception 'Listing submission not found';
  end if;

  if submission_row.name is null
    or submission_row.short_description is null
    or submission_row.tagline is null
    or submission_row.category_id is null then
    raise exception 'Listing submission is incomplete';
  end if;

  select count(*) into media_count
  from public.listing_submission_assets
  where submission_id = submission_row.id
    and type in ('logo', 'cover');

  if media_count <> 2 then
    raise exception 'Listing submission media is incomplete';
  end if;

  if payment_row.status = 'paid' then
    return submission_row.product_id;
  end if;

  if submission_row.product_id is not null then
    update public.listing_payments
    set status = 'paid',
        paid_at = coalesce(paid_at, now()),
        provider_event_id = coalesce(provider_event_id, p_provider_event_id),
        provider_payment_id = coalesce(provider_payment_id, p_provider_payment_id)
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
    tagline,
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
    submission_row.tagline,
    submission_row.website_url
  )
  returning id into created_product_id;

  insert into public.product_assets (
    product_id,
    type,
    object_key,
    public_url,
    mime_type,
    width,
    height,
    size_bytes,
    sort_order
  )
  select
    created_product_id,
    asset.type,
    asset.object_key,
    asset.public_url,
    asset.mime_type,
    asset.width,
    asset.height,
    asset.size_bytes,
    asset.sort_order
  from public.listing_submission_assets as asset
  where asset.submission_id = submission_row.id
  on conflict do nothing;

  update public.listing_submissions
  set status = 'submitted',
      product_id = created_product_id
  where id = submission_row.id;

  update public.listing_payments
  set status = 'paid',
      paid_at = now(),
      provider_event_id = p_provider_event_id,
      provider_payment_id = p_provider_payment_id
  where id = payment_row.id;

  return created_product_id;
end;
$$;
