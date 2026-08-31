-- Keep historical Starter amounts valid; never reprice issued payment intents.
-- The app issues new Starter campaigns at 100 centavos during live testing.
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

-- Lock against checkout's campaign row lock before looking for payment attempts.
-- Under READ COMMITTED the following UPDATE then sees any checkout that won first.
select id from public.directory_campaigns
where plan = 'starter' and status = 'awaiting_payment' and price_centavos = 19900
order by id for update;

update public.directory_campaigns campaign
set price_centavos = 100
where campaign.plan = 'starter' and campaign.status = 'awaiting_payment'
  and campaign.price_centavos = 19900 and campaign.price_paid_centavos = 0
  and not exists (select 1 from public.listing_payments payment where payment.campaign_id = campaign.id);
