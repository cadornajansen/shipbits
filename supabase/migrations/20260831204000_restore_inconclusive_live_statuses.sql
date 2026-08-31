-- A single endpoint failure is inconclusive when search still finds official-domain pages.
delete from public.distribution_channel_field_evidence
where field_name='status' and extraction_method='deterministic_inference'
  and resulting_value='"broken"'::jsonb
  and channel_id in (
    '0b8d896d-0d07-4de1-bc31-7e959df7e054',
    '03237783-4348-4909-b736-ff7660bd5aa1',
    '0bc41e7e-97e4-4aed-a2c0-46dfc0942645'
  );

update public.distribution_channels
set status='unverified',last_verified_at=null
where id in (
  '0b8d896d-0d07-4de1-bc31-7e959df7e054',
  '03237783-4348-4909-b736-ff7660bd5aa1',
  '0bc41e7e-97e4-4aed-a2c0-46dfc0942645'
);
