create type public.product_import_status as enum (
  'queued',
  'extracting',
  'generating',
  'ready',
  'failed'
);

create table public.product_imports (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete set null,
  source_url text not null,
  normalized_domain text not null,
  status public.product_import_status not null default 'queued',
  firecrawl_job_id text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create index product_imports_normalized_domain_idx
  on public.product_imports (normalized_domain);

create index product_imports_status_idx
  on public.product_imports (status);

create index product_imports_created_at_idx
  on public.product_imports (created_at desc);

create table public.product_evidence (
  id uuid primary key default gen_random_uuid(),
  import_id uuid not null references public.product_imports(id) on delete cascade,
  source_url text not null,
  title text,
  markdown text not null,
  metadata jsonb not null default '{}'::jsonb,
  content_hash text not null,
  fetched_at timestamptz not null default now(),
  unique (import_id)
);

create trigger product_imports_set_updated_at
before update on public.product_imports
for each row
execute function public.set_products_updated_at();

alter table public.product_imports enable row level security;
alter table public.product_evidence enable row level security;

revoke all on table public.product_imports from anon, authenticated;
revoke all on table public.product_evidence from anon, authenticated;
