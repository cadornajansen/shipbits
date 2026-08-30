create extension if not exists pgcrypto;

create type public.product_listing_source as enum ('admin', 'paid');
create type public.product_moderation_status as enum ('draft', 'published', 'rejected');
create type public.product_asset_type as enum ('logo', 'cover', 'screenshot');

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  slug text unique not null,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  normalized_domain text unique not null,
  slug text unique not null,
  name text not null,
  website_url text not null,
  short_description text not null check (char_length(short_description) <= 280),
  long_description text check (
    long_description is null or char_length(long_description) <= 5000
  ),
  category_id uuid not null references public.categories(id),
  listing_source public.product_listing_source not null default 'admin',
  moderation_status public.product_moderation_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create table public.product_assets (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  type public.product_asset_type not null,
  object_key text unique not null,
  public_url text not null,
  mime_type text not null,
  width integer,
  height integer,
  size_bytes bigint,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create unique index product_assets_one_logo_per_product_idx
  on public.product_assets (product_id)
  where type = 'logo';

create unique index product_assets_one_cover_per_product_idx
  on public.product_assets (product_id)
  where type = 'cover';

create unique index product_assets_screenshot_sort_order_per_product_idx
  on public.product_assets (product_id, sort_order)
  where type = 'screenshot';

create function public.set_products_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger products_set_updated_at
before update on public.products
for each row
execute function public.set_products_updated_at();

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_assets enable row level security;

revoke all on table public.categories from anon, authenticated;
revoke all on table public.products from anon, authenticated;
revoke all on table public.product_assets from anon, authenticated;

insert into public.categories (name, slug)
values
  ('Developer Tools', 'developer-tools'),
  ('Productivity', 'productivity'),
  ('Education', 'education'),
  ('AI', 'ai'),
  ('Design', 'design'),
  ('Finance', 'finance'),
  ('SaaS', 'saas'),
  ('Other', 'other')
on conflict (slug) do update
set name = excluded.name;
