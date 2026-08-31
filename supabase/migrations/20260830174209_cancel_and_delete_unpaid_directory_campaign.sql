-- Only service-side actions may remove an unpaid campaign. The row lock also
-- serializes against the checkout trigger, so a payment cannot be created as it is deleted.
create function public.cancel_and_delete_directory_campaign(
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
  if exists (select 1 from public.listing_payments where campaign_id = campaign.id)
    or exists (select 1 from public.directory_submissions where campaign_id = campaign.id) then
    raise exception 'Campaign checkout or processing has started';
  end if;

  delete from public.directory_campaigns where id = campaign.id;
end;
$$;

revoke all on function public.cancel_and_delete_directory_campaign(uuid, uuid) from public, anon, authenticated;
grant execute on function public.cancel_and_delete_directory_campaign(uuid, uuid) to service_role;
