alter table public.product_assets
  add column source text;

alter table public.product_assets
  add constraint product_assets_source_check
  check (source is null or source in ('admin_upload', 'product_import'));
