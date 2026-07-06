-- Dashboard preference: show subscription-plan estimates inside "Usage by
-- source". Off by default — plans already have their own section.
alter table profiles
  add column if not exists show_plans_in_sources boolean not null default false;
