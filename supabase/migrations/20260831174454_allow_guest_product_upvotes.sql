alter table public.product_upvotes
  alter column user_id drop not null,
  add column visitor_id_hash text;

alter table public.product_upvotes
  add constraint product_upvotes_owner_check
  check (
    ((user_id is not null) <> (visitor_id_hash is not null))
    and (visitor_id_hash is null or visitor_id_hash ~ '^[a-f0-9]{64}$')
  );

create index product_upvotes_visitor_created_at_idx
  on public.product_upvotes (visitor_id_hash, created_at desc)
  where visitor_id_hash is not null;

create unique index product_upvotes_one_pending_per_visitor_product_idx
  on public.product_upvotes (product_id, visitor_id_hash)
  where status = 'pending' and visitor_id_hash is not null;
