-- Directory campaigns reuse products, drafts, ownership and listing_payments.
create type public.directory_campaign_status as enum ('draft', 'awaiting_payment', 'active', 'completed', 'cancelled');
create type public.directory_job_status as enum ('queued', 'processing', 'submitted', 'live', 'rejected', 'needs_action', 'skipped');

create table public.directories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 1 and 100),
  slug text unique not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  website_url text not null check (website_url ~ '^https?://'),
  submission_url text check (submission_url ~ '^https?://'),
  description text not null default '',
  topics text[] not null default '{general}',
  priority integer not null default 0,
  is_active boolean not null default true,
  requires_account boolean,
  requires_payment boolean,
  requires_manual_review boolean not null default true,
  submission_method text not null default 'manual' check (submission_method in ('manual', 'assisted', 'automatable')),
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index directories_name_unique on public.directories (lower(btrim(name)));

create table public.directory_campaigns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  product_id uuid references public.products(id),
  submission_id uuid references public.listing_submissions(id),
  plan text not null,
  target_count integer not null,
  price_centavos integer not null,
  price_paid_centavos integer not null default 0,
  status public.directory_campaign_status not null default 'awaiting_payment',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (product_id is not null or submission_id is not null),
  check ((plan = 'starter' and target_count = 10 and price_centavos = 19900)
    or (plan = 'launch' and target_count = 50 and price_centavos = 69900)
    or (plan = 'growth' and target_count = 100 and price_centavos = 149900)
    or (plan = 'done_for_you' and target_count = 100 and price_centavos = 299900)),
  check (price_paid_centavos in (0, price_centavos)),
  check (status not in ('active', 'completed') or (price_paid_centavos = price_centavos and product_id is not null))
);
create index directory_campaigns_user_idx on public.directory_campaigns(user_id, created_at desc);
create index directory_campaigns_status_idx on public.directory_campaigns(status, created_at);
create index directory_campaigns_product_idx on public.directory_campaigns(product_id);
create index directory_campaigns_submission_idx on public.directory_campaigns(submission_id);
create unique index directory_campaigns_pending_product on public.directory_campaigns(user_id, product_id)
  where status = 'awaiting_payment';
create unique index directory_campaigns_pending_submission on public.directory_campaigns(submission_id)
  where status = 'awaiting_payment';

create table public.directory_submissions (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.directory_campaigns(id),
  directory_id uuid not null references public.directories(id),
  status public.directory_job_status not null default 'queued',
  submitted_at timestamptz,
  published_at timestamptz,
  result_url text check (result_url ~ '^https?://'),
  rejection_reason text,
  action_required_message text,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(campaign_id, directory_id),
  check (status <> 'live' or (result_url is not null and published_at is not null)),
  check (status <> 'needs_action' or (action_required_message is not null and length(btrim(action_required_message)) > 0)),
  check (status <> 'rejected' or (rejection_reason is not null and length(btrim(rejection_reason)) > 0))
);
create index directory_submissions_directory_idx on public.directory_submissions(directory_id);

alter table public.listing_payments alter column submission_id drop not null;
alter table public.listing_payments add column campaign_id uuid references public.directory_campaigns(id);
alter table public.listing_payments add constraint listing_payment_target
  check (num_nonnulls(submission_id, campaign_id) = 1);
create unique index directory_campaign_pending_payment on public.listing_payments(campaign_id) where status = 'pending';
create unique index directory_campaign_paid_payment on public.listing_payments(campaign_id) where status = 'paid';
create index listing_payments_campaign_idx on public.listing_payments(campaign_id);

create trigger directories_updated before update on public.directories for each row execute function public.set_products_updated_at();
create trigger directory_campaigns_updated before update on public.directory_campaigns for each row execute function public.set_products_updated_at();
create trigger directory_submissions_updated before update on public.directory_submissions for each row execute function public.set_products_updated_at();
alter table public.directories enable row level security;
alter table public.directory_campaigns enable row level security;
alter table public.directory_submissions enable row level security;
revoke all on public.directories, public.directory_campaigns, public.directory_submissions from anon, authenticated;
grant all on public.directories, public.directory_campaigns, public.directory_submissions to service_role;
grant select on public.directory_campaigns to authenticated;
-- Job and catalog reads use authenticated server queries with explicit column lists;
-- private admin notes are never exposed through a public Data API table grant.
create policy "Read own directory campaigns" on public.directory_campaigns for select to authenticated
  using ((select auth.uid()) = user_id);

-- Extract the existing publication transaction, so both purchase types use it.
create function public.publish_listing_submission(p_submission_id uuid, p_product_slug text)
returns uuid language plpgsql set search_path = '' as $$
declare s public.listing_submissions%rowtype; created_product_id uuid;
begin
  select * into s from public.listing_submissions where id = p_submission_id for update;
  if not found then raise exception 'Listing submission not found'; end if;
  if s.product_id is not null then return s.product_id; end if;
  if s.archived_at is not null or s.name is null or s.short_description is null
    or s.tagline is null or s.category_id is null then raise exception 'Listing submission is incomplete'; end if;
  if (select count(*) from public.listing_submission_assets where submission_id = s.id and type in ('logo','cover')) <> 2
    then raise exception 'A logo and OG cover image are required before publishing'; end if;
  insert into public.products (category_id, created_by_user_id, listing_source, long_description,
    moderation_status, name, normalized_domain, published_at, short_description, slug, tagline, tags, website_url)
  values (s.category_id, s.user_id, 'paid', s.long_description, 'published', s.name,
    s.normalized_domain, now(), s.short_description, p_product_slug, s.tagline, s.tags, s.website_url)
  returning id into created_product_id;
  insert into public.product_builders(product_id,user_id,role,is_primary) values(created_product_id,s.user_id,'owner',true);
  insert into public.product_assets(mime_type,object_key,product_id,public_url,size_bytes,type)
    select mime_type,object_key,created_product_id,public_url,size_bytes,type from public.listing_submission_assets where submission_id=s.id;
  update public.listing_submissions set product_id=created_product_id, status='submitted' where id=s.id;
  return created_product_id;
end; $$;
revoke all on function public.publish_listing_submission(uuid,text) from public,anon,authenticated;
grant execute on function public.publish_listing_submission(uuid,text) to service_role;

create or replace function public.fulfill_listing_payment(p_listing_payment_id uuid, p_provider_payment_id text,
  p_provider_event_id text, p_product_slug text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare p public.listing_payments%rowtype; product_id uuid;
begin
  select * into p from public.listing_payments where id=p_listing_payment_id for update;
  if not found or p.campaign_id is not null then raise exception 'Listing payment not found'; end if;
  if p.status='paid' then return null; end if;
  if p.status<>'pending' then raise exception 'Listing payment is not pending'; end if;
  product_id := public.publish_listing_submission(p.submission_id,p_product_slug);
  update public.listing_payments set paid_at=now(),status='paid',provider_event_id=p_provider_event_id,
    provider_payment_id=p_provider_payment_id where id=p.id;
  return product_id;
end; $$;

-- Serialize job allocation with fulfillment and admin updates; enforce quota in DB.
create function public.guard_directory_submission() returns trigger language plpgsql set search_path='' as $$
declare c public.directory_campaigns%rowtype;
begin
  select * into c from public.directory_campaigns where id=new.campaign_id for update;
  if c.status not in ('active','completed') then raise exception 'Campaign is not paid and active'; end if;
  if tg_op='INSERT' and (select count(*) from public.directory_submissions where campaign_id=c.id)>=c.target_count
    then raise exception 'Campaign submission limit reached'; end if;
  if tg_op='UPDATE' and new.campaign_id<>old.campaign_id then raise exception 'Cannot move a submission'; end if;
  return new;
end; $$;
create trigger directory_submission_guard before insert or update on public.directory_submissions
  for each row execute function public.guard_directory_submission();

create function public.fulfill_directory_payment(p_payment_id uuid,p_event_id text,p_provider_payment_id text,
  p_product_slug text,p_directory_ids uuid[])
returns uuid language plpgsql set search_path='' as $$
declare p public.listing_payments%rowtype; c public.directory_campaigns%rowtype; published_product uuid;
begin
  select * into p from public.listing_payments where id=p_payment_id for update;
  if not found or p.campaign_id is null then raise exception 'Campaign payment not found'; end if;
  select * into c from public.directory_campaigns where id=p.campaign_id for update;
  if p.status='paid' then return c.id; end if;
  if c.status<>'awaiting_payment' or p.user_id<>c.user_id or p.amount_centavos<>c.price_centavos or p.currency<>'PHP'
    then raise exception 'Campaign payment mismatch'; end if;
  published_product := c.product_id;
  if published_product is null then
    if not exists(select 1 from public.listing_submissions where id=c.submission_id and user_id=c.user_id)
      then raise exception 'Submission owner mismatch'; end if;
    published_product := public.publish_listing_submission(c.submission_id,p_product_slug);
  end if;
  if not exists(select 1 from public.product_builders where product_id=published_product and user_id=c.user_id and role='owner')
    then raise exception 'Product owner mismatch'; end if;
  update public.listing_payments set status='paid',paid_at=now(),provider_event_id=p_event_id,
    provider_payment_id=p_provider_payment_id where id=p.id;
  update public.directory_campaigns set product_id=published_product,price_paid_centavos=p.amount_centavos,status='active' where id=c.id;
  insert into public.directory_submissions(campaign_id,directory_id)
    select c.id,d.id from unnest(p_directory_ids) with ordinality ids(id,position)
    join public.directories d on d.id=ids.id and d.is_active
    order by ids.position limit c.target_count on conflict(campaign_id,directory_id) do nothing;
  return c.id;
end; $$;
revoke all on function public.fulfill_directory_payment(uuid,text,text,text,uuid[]) from public,anon,authenticated;
grant execute on function public.fulfill_directory_payment(uuid,text,text,text,uuid[]) to service_role;

create function public.update_directory_submission(p_job_id uuid,p_status public.directory_job_status,
  p_result_url text,p_rejection_reason text,p_action_message text,p_admin_notes text)
returns void language plpgsql set search_path='' as $$
declare campaign uuid; target integer;
begin
  select campaign_id into campaign from public.directory_submissions where id=p_job_id;
  if not found then raise exception 'Submission not found'; end if;
  select target_count into target from public.directory_campaigns where id=campaign for update;
  update public.directory_submissions set status=p_status,result_url=p_result_url,
    rejection_reason=p_rejection_reason,action_required_message=p_action_message,admin_notes=p_admin_notes,
    submitted_at=case when p_status in ('submitted','live') then coalesce(submitted_at,now()) else submitted_at end,
    published_at=case when p_status='live' then coalesce(published_at,now()) else null end
  where id=p_job_id;
  -- Rejections before an actual submission and skipped jobs do not fulfill paid quota.
  update public.directory_campaigns set status=case when
    (select count(*) from public.directory_submissions where campaign_id=campaign and submitted_at is not null
      and status in ('submitted','live','rejected')) >= target then 'completed'::public.directory_campaign_status
    else 'active'::public.directory_campaign_status end where id=campaign;
end; $$;
revoke all on function public.update_directory_submission(uuid,public.directory_job_status,text,text,text,text) from public,anon,authenticated;
grant execute on function public.update_directory_submission(uuid,public.directory_job_status,text,text,text,text) to service_role;

create function public.guard_campaign_checkout() returns trigger language plpgsql set search_path='' as $$
declare c public.directory_campaigns%rowtype; s public.listing_submissions%rowtype;
begin
  if new.campaign_id is not null then
    select * into c from public.directory_campaigns where id=new.campaign_id for update;
    if c.status<>'awaiting_payment' or c.user_id<>new.user_id or c.price_centavos<>new.amount_centavos
      then raise exception 'Invalid campaign checkout'; end if;
    if c.product_id is not null then
      if not exists(select 1 from public.product_builders b join public.products p on p.id=b.product_id
        where b.product_id=c.product_id and b.user_id=c.user_id and b.role='owner' and p.archived_at is null)
        then raise exception 'Product is no longer available to this owner'; end if;
    else
      select * into s from public.listing_submissions where id=c.submission_id for update;
      if s.user_id<>c.user_id or s.archived_at is not null or s.product_id is not null
        then raise exception 'Draft is no longer available'; end if;
      if s.name is null or s.short_description is null or s.tagline is null or s.category_id is null
        or (select count(*) from public.listing_submission_assets where submission_id=s.id and type in ('logo','cover'))<>2
        then raise exception 'Complete the product details and media before payment'; end if;
      if exists(select 1 from public.products where normalized_domain=s.normalized_domain)
        then raise exception 'This website is already listed'; end if;
      if exists(select 1 from public.listing_payments where submission_id=s.id and status in ('pending','paid'))
        then raise exception 'An existing listing checkout must finish first'; end if;
      update public.listing_submissions set status='pending_payment' where id=s.id;
    end if;
  else
    perform 1 from public.listing_submissions where id=new.submission_id for update;
    if exists(select 1 from public.directory_campaigns campaigns join public.listing_payments payments on payments.campaign_id=campaigns.id
      where campaigns.submission_id=new.submission_id and payments.status='pending')
      then raise exception 'A directory package checkout is already pending'; end if;
  end if;
  return new;
end; $$;
create trigger campaign_checkout_guard before insert on public.listing_payments
  for each row execute function public.guard_campaign_checkout();

create function public.change_directory_campaign_plan(p_campaign_id uuid,p_user_id uuid,p_plan text,p_target integer,p_price integer)
returns void language plpgsql set search_path='' as $$
declare c public.directory_campaigns%rowtype;
begin
  select * into c from public.directory_campaigns where id=p_campaign_id for update;
  if not found or c.user_id<>p_user_id or c.status<>'awaiting_payment' then raise exception 'Campaign not available'; end if;
  -- Once a QR has ever been prepared its immutable amount must remain reconcilable.
  if exists(select 1 from public.listing_payments where campaign_id=c.id) then raise exception 'Checkout has already started'; end if;
  update public.directory_campaigns set plan=p_plan,target_count=p_target,price_centavos=p_price where id=c.id;
end; $$;
revoke all on function public.change_directory_campaign_plan(uuid,uuid,text,integer,integer) from public,anon,authenticated;
grant execute on function public.change_directory_campaign_plan(uuid,uuid,text,integer,integer) to service_role;
