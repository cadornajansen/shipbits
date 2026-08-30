-- Founder identity is kept separate from an administrative import/create actor.
create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (display_name is null or char_length(display_name) <= 80),
  handle text unique check (
    handle is null or handle ~ '^[a-z0-9](?:[a-z0-9-]{0,28}[a-z0-9])?$'
  ),
  headline text check (headline is null or char_length(headline) <= 120),
  role text check (role is null or char_length(role) <= 80),
  bio text check (bio is null or char_length(bio) <= 500),
  location text check (location is null or char_length(location) <= 100),
  website_url text,
  github_url text,
  linkedin_url text,
  avatar_object_key text unique,
  avatar_url text,
  profile_visible boolean not null default true,
  email_product_updates boolean not null default true,
  email_payment_updates boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_products_updated_at();

alter table public.products
  add column created_by_user_id uuid references auth.users(id) on delete set null;

create index products_created_by_user_id_idx
  on public.products (created_by_user_id);

create table public.product_builders (
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'builder')),
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (product_id, user_id)
);

create unique index product_builders_one_primary_per_product_idx
  on public.product_builders (product_id)
  where is_primary;

create index product_builders_user_id_idx
  on public.product_builders (user_id);

-- Paid submissions already carry the founder's identity. Preserve it on their
-- products and create the initial primary builder relationship.
update public.products
set created_by_user_id = listing_submissions.user_id
from public.listing_submissions
where listing_submissions.product_id = products.id
  and products.created_by_user_id is null;

insert into public.product_builders (product_id, user_id, role, is_primary)
select product_id, user_id, 'owner', true
from public.listing_submissions
where product_id is not null
on conflict (product_id, user_id) do update
set role = excluded.role,
    is_primary = excluded.is_primary;

alter table public.product_imports
  add column created_by_user_id uuid references auth.users(id) on delete set null;

alter table public.profiles enable row level security;
alter table public.product_builders enable row level security;

revoke all on table public.profiles from anon, authenticated;
grant select, insert, update on table public.profiles to authenticated;

create policy "Users can read their own profile"
on public.profiles for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their own profile"
on public.profiles for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own profile"
on public.profiles for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

revoke all on table public.product_builders from anon, authenticated;
grant select on table public.product_builders to authenticated;

create policy "Users can read their own product builder links"
on public.product_builders for select to authenticated
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
    or submission_row.tagline is null
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
    set paid_at = now(),
        provider_event_id = coalesce(provider_event_id, p_provider_event_id),
        provider_payment_id = coalesce(provider_payment_id, p_provider_payment_id),
        status = 'paid'
    where id = payment_row.id;

    return submission_row.product_id;
  end if;

  insert into public.products (
    category_id, created_by_user_id, listing_source, long_description,
    moderation_status, name, normalized_domain, published_at,
    short_description, slug, tagline, website_url
  ) values (
    submission_row.category_id, submission_row.user_id, 'paid',
    submission_row.long_description, 'published', submission_row.name,
    submission_row.normalized_domain, now(), submission_row.short_description,
    p_product_slug, submission_row.tagline, submission_row.website_url
  ) returning id into created_product_id;

  insert into public.product_builders (product_id, user_id, role, is_primary)
  values (created_product_id, submission_row.user_id, 'owner', true);

  insert into public.product_assets (
    mime_type, object_key, product_id, public_url, size_bytes, type
  )
  select mime_type, object_key, created_product_id, public_url, size_bytes, type
  from public.listing_submission_assets
  where submission_id = submission_row.id;

  update public.listing_payments
  set paid_at = now(),
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
