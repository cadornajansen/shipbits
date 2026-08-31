-- Explicit destructive maintenance operation. Review before running.
-- Channel-dependent tags, verifications, evidence, overrides, and legacy observations
-- are deleted by cascading foreign keys. The controlled taxonomy is preserved.
delete from public.distribution_channels;

-- Optional after confirming no retained legacy observations still reference datasets:
-- delete from public.distribution_sources;
