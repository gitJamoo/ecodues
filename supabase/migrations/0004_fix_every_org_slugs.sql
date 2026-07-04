-- Fix Every.org slugs that were 404-ing (verified via
-- https://partners.every.org/v0.2/nonprofit/{slug}). Broken slugs caused
-- checkout to land on Every.org's generic donate flow instead of the
-- charity page, which prompted a $10 "meaningful donation" minimum. Each
-- charity's real minimum on Every.org is $1 (platform default).

update charities set every_org_slug = 'carbon180'             where id = 'carbon180';
update charities set every_org_slug = 'coolearth'             where id = 'coolearth';
update charities set every_org_slug = 'giving-green'          where id = 'givingreen';

-- Rainforest Foundation US is not indexed on Every.org under any tested
-- slug — swap in Rainforest Trust which has the same "nature/forest"
-- category and confirmed live checkout.
update charities
set    id             = 'rainforesttrust',
       name           = 'Rainforest Trust',
       description    = 'Purchases and permanently protects tropical forest habitat.',
       url            = 'https://www.rainforesttrust.org',
       every_org_slug = 'rainforest-trust'
where  id = 'rainforest-foundation-us';

-- Clean Energy Buyers Institute isn't on Every.org — swap in Rewiring
-- America (electrification of U.S. homes and buildings).
update charities
set    id             = 'rewiringamerica',
       name           = 'Rewiring America',
       description    = 'Electrifying homes and buildings to slash U.S. household emissions.',
       url            = 'https://www.rewiringamerica.org',
       every_org_slug = 'rewiring-america-inc',
       category       = 'energy'
where  id = 'cleanenergybuyersinstitute';

-- Additional verified $1-min climate charities on Every.org
insert into charities (id, name, description, category, url, every_org_slug) values
  ('drawdown',    'Project Drawdown',                   'Research and analysis mapping the most effective climate solutions worldwide.',           'climate', 'https://drawdown.org',             'drawdown'),
  ('rmi',         'RMI',                                'Market-based decarbonization across power, industry, buildings, and transport.',          'energy',  'https://rmi.org',                  'rmi'),
  ('terrapraxis', 'TerraPraxis',                        'Repowering coal plants with advanced nuclear; hard-to-abate industrial decarbonization.', 'energy',  'https://www.terrapraxis.org',      'terrapraxis'),
  ('eiaglobal',   'Environmental Investigation Agency', 'Undercover investigations driving HFC and methane policy wins worldwide.',                'climate', 'https://eia-global.org',           'eia-global')
on conflict (id) do nothing;
