-- Add Every.org slug to charities (used to build checkout URLs)
alter table charities add column if not exists every_org_slug text;

-- Fix URLs from 0002 (that migration used wrong IDs — these use the correct ones from 0001)
update charities set url = 'https://www.catf.us'                   where id = 'cleanairtaskforce';
update charities set url = 'https://www.rainforestfoundation.org'  where id = 'rainforest-foundation-us';
update charities set url = 'https://carbon180.org'                 where id = 'carbon180';
update charities set url = 'https://www.coolearth.org'             where id = 'coolearth';
update charities set url = 'https://cebuyers.org'                  where id = 'cleanenergybuyersinstitute';
update charities set url = 'https://www.givinggreen.earth'         where id = 'givingreen';

-- Every.org slugs — verify each at https://www.every.org/<slug> before going live
update charities set every_org_slug = 'clean-air-task-force'           where id = 'cleanairtaskforce';
update charities set every_org_slug = 'rainforest-foundation-us'       where id = 'rainforest-foundation-us';
update charities set every_org_slug = 'carbon-180'                     where id = 'carbon180';
update charities set every_org_slug = 'cool-earth'                     where id = 'coolearth';
update charities set every_org_slug = 'clean-energy-buyers-institute'  where id = 'cleanenergybuyersinstitute';
update charities set every_org_slug = 'giving-green-fund'              where id = 'givingreen';

-- Add checkout tracking columns to donation_ledger
alter table donation_ledger add column if not exists checkout_link    text;
alter table donation_ledger add column if not exists checkout_token   text;
alter table donation_ledger add column if not exists every_org_id     text;  -- populated by webhook
