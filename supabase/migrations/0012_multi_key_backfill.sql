-- Multiple connections per provider (named keys) + per-key usage attribution
-- + backfill source vocabulary.

-- Users can now hold many keys/plans per provider, identified by label.
alter table provider_connections
  drop constraint if exists provider_connections_user_id_provider_kind_key;
alter table provider_connections
  add column if not exists label text;

-- Attribute usage rows to the connection that produced them (null = manual
-- entry or a row written before this migration).
alter table usage_records
  add column if not exists connection_id uuid references provider_connections (id) on delete set null;
create index if not exists usage_records_connection on usage_records (connection_id);

-- Backfilled historical usage gets its own provenance tag.
alter table usage_records drop constraint if exists usage_records_source_check;
alter table usage_records
  add constraint usage_records_source_check
  check (source in ('api', 'tier_estimate', 'manual', 'backfill'));
