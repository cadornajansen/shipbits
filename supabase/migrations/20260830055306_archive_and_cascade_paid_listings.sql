alter table public.products
  add column archived_at timestamptz,
  add column archived_by uuid references auth.users(id) on delete set null;

alter table public.listing_submissions
  add column archived_at timestamptz,
  add column archived_by uuid references auth.users(id) on delete set null;

create index products_archived_at_idx
  on public.products (archived_at)
  where archived_at is not null;

create index listing_submissions_archived_at_idx
  on public.listing_submissions (archived_at)
  where archived_at is not null;

alter table public.listing_submissions
  drop constraint listing_submissions_product_id_fkey;

alter table public.listing_submissions
  add constraint listing_submissions_product_id_fkey
  foreign key (product_id)
  references public.products(id)
  on delete cascade;
