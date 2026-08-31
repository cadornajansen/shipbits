-- Remove only the unsafe live pilot output; retain earlier imported pricing provenance.
delete from public.distribution_channel_tags ct
using public.distribution_channel_field_evidence e
where ct.channel_id='ee012244-abc3-40da-96af-2fda90956ce3'
  and e.channel_id=ct.channel_id and e.field_name='tags'
  and ct.tag_id in (select (jsonb_array_elements_text(e.resulting_value))::uuid);

delete from public.distribution_channel_field_evidence
where channel_id='ee012244-abc3-40da-96af-2fda90956ce3'
  and field_name in ('description','status','tags');

delete from public.distribution_channel_verifications
where channel_id='ee012244-abc3-40da-96af-2fda90956ce3'
  and id='553480c2-6f6f-400b-8863-df9c4a9d7cb2';

update public.distribution_channels
set description='',status='unverified',last_verified_at=null,last_checked_at=null,
  enriched_at=(select max(enriched_at) from public.distribution_channel_field_evidence where channel_id=distribution_channels.id)
where id='ee012244-abc3-40da-96af-2fda90956ce3';
