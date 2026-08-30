create type public.listing_submission_status as enum (
  'draft',
  'pending_payment',
  'submitted'
);

create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.listing_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  website_url text not null,
  normalized_domain text not null,
  name text,
  slug text,
  short_description text check (
    short_description is null or char_length(short_description) <= 280
  ),
  long_description text check (
    long_description is null or char_length(long_description) <= 5000
  ),
  category_id uuid references public.categories(id),
  status public.listing_submission_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index listing_submissions_user_id_idx
  on public.listing_submissions (user_id);

create index listing_submissions_normalized_domain_idx
  on public.listing_submissions (normalized_domain);

create index listing_submissions_status_idx
  on public.listing_submissions (status);

create index listing_submissions_created_at_idx
  on public.listing_submissions (created_at desc);

create trigger listing_submissions_set_updated_at
before update on public.listing_submissions
for each row
execute function public.set_products_updated_at();

alter table public.admin_users enable row level security;
alter table public.listing_submissions enable row level security;

revoke all on table public.admin_users from anon, authenticated;
revoke all on table public.listing_submissions from anon;
grant select, insert, update on table public.listing_submissions to authenticated;
grant select on table public.categories to anon, authenticated;

create policy "Categories are readable for submission forms"
on public.categories
for select
to anon, authenticated
using (true);

create policy "Users can read their own listing submissions"
on public.listing_submissions
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their own listing submissions"
on public.listing_submissions
for insert
to authenticated
with check ((select auth.uid()) = user_id and status = 'draft');

create policy "Users can update their own draft submissions"
on public.listing_submissions
for update
to authenticated
using ((select auth.uid()) = user_id and status = 'draft')
with check ((select auth.uid()) = user_id and status = 'draft');
