-- Expired or failed QR attempts are not financial history and may be removed
-- with their unpaid campaign. A pending QR remains protected until it expires.
create or replace function public.cancel_and_delete_directory_campaign(
  p_campaign_id uuid,
  p_user_id uuid
) returns void language plpgsql set search_path = '' as $$
declare campaign public.directory_campaigns%rowtype;
begin
  select * into campaign from public.directory_campaigns
    where id = p_campaign_id for update;

  if not found or campaign.user_id <> p_user_id then
    raise exception 'Campaign not found';
  end if;
  if campaign.status not in ('draft', 'awaiting_payment', 'cancelled')
    or campaign.price_paid_centavos <> 0 then
    raise exception 'Only unpaid campaigns can be deleted';
  end if;
  if exists (
    select 1 from public.listing_payments
    where campaign_id = campaign.id and status not in ('expired', 'failed')
  ) or exists (select 1 from public.directory_submissions where campaign_id = campaign.id) then
    raise exception 'Campaign checkout or processing has started';
  end if;

  delete from public.listing_payments where campaign_id = campaign.id;
  delete from public.directory_campaigns where id = campaign.id;
end;
$$;
