alter table charities add column if not exists url text;

update charities set url = 'https://www.catf.us'                                  where id = 'catf';
update charities set url = 'https://carbon180.org'                                 where id = 'carbon180';
update charities set url = 'https://www.rewiringamerica.org'                        where id = 'rewiring';
update charities set url = 'https://www.coolearth.org'                             where id = 'coolearth';
update charities set url = 'https://www.rainforestcoalition.org'                   where id = 'rfn';
update charities set url = 'https://founderspledge.com/funds/climate-change-fund'  where id = 'fp_climate';
