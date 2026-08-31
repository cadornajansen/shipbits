alter table public.distribution_channels
  drop constraint distribution_channels_channel_type_check;

alter table public.distribution_channels
  add constraint distribution_channels_channel_type_check
  check (
    channel_type in (
      'directory',
      'review_site',
      'launch_platform',
      'community',
      'newsletter',
      'app_store',
      'marketplace',
      'forum'
    )
  );
