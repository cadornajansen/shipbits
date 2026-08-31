-- New Starter campaigns use ₱199. Keep ₱1 valid for historical test records.
do $$
declare price_constraint text;
begin
  for price_constraint in
    select conname from pg_constraint
    where conrelid = 'public.directory_campaigns'::regclass and contype = 'c'
      and pg_get_constraintdef(oid) like '%plan%'
      and pg_get_constraintdef(oid) like '%price_centavos%'
  loop
    execute format('alter table public.directory_campaigns drop constraint %I', price_constraint);
  end loop;
end; $$;

alter table public.directory_campaigns add constraint directory_campaigns_plan_price_check check (
  (plan = 'starter' and target_count = 10 and price_centavos in (100, 19900))
  or (plan = 'launch' and target_count = 50 and price_centavos = 69900)
  or (plan = 'growth' and target_count = 100 and price_centavos = 149900)
  or (plan = 'done_for_you' and target_count = 100 and price_centavos = 299900)
);
