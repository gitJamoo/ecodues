-- PayPal Giving Fund (PPGF) support. PPGF passes 100% to the charity —
-- PayPal covers all card processing as a corporate contribution and PPGF
-- takes no platform fee. When a charity has a PPGF page we prefer it over
-- Every.org's checkout. Amount pre-fill is NOT supported by PPGF's SPA,
-- so the UX has to nudge users to enter the tab amount manually.
--
-- Coverage of our current charity set is spotty (3 of 10 enrolled at time
-- of writing). Every.org stays as the universal fallback.

alter table charities add column if not exists paypal_giving_fund_url text;

update charities set paypal_giving_fund_url = 'https://www.paypal.com/us/fundraiser/charity/1301357' where id = 'cleanairtaskforce';
update charities set paypal_giving_fund_url = 'https://www.paypal.com/us/fundraiser/charity/25602'   where id = 'rainforesttrust';
update charities set paypal_giving_fund_url = 'https://www.paypal.com/us/fundraiser/charity/47750'   where id = 'rmi';
