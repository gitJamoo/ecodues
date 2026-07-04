-- Prioritize PPGF (100% pass-through) over Every.org (~85–92% delivered).
--
-- Rationale: at sub-$5 donations, Every.org's $0.30 per-transaction fee eats
-- a huge share of the gift. PPGF is fee-free at any amount. We raise
-- Every.org-only charities to a $10 internal minimum so that when the tab
-- clears via that path, fee efficiency is at least ~92%. PPGF-enrolled
-- charities stay at $1 min — every penny counts when PayPal absorbs fees.
--
-- Users see this split in the charity picker as "Premier · PayPal Giving Fund"
-- vs "Every.org · $10 min" groups.

update charities set min_donation_usd = 10 where paypal_giving_fund_url is null;
update charities set min_donation_usd = 1  where paypal_giving_fund_url is not null;
