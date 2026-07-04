create table charities (
  id text primary key,
  name text not null,
  description text not null,
  category text not null
);

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  multiplier numeric(3,2) not null default 2.00 check (multiplier between 1 and 3),
  charity_id text references charities,
  card_last4 text,
  onboarded_at timestamptz
);

create table provider_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  provider text not null check (provider in ('openrouter','openai','anthropic','gemini')),
  kind text not null check (kind in ('api_key','tier','manual')),
  encrypted_key text,
  tier_id text,
  status text not null default 'active' check (status in ('active','error')),
  created_at timestamptz not null default now(),
  unique (user_id, provider, kind)
);

create table usage_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  provider text not null,
  model text not null,
  period date not null,
  input_tokens bigint not null default 0,
  output_tokens bigint not null default 0,
  spend_usd numeric(10,4) not null default 0,
  source text not null check (source in ('api','tier_estimate','manual')),
  created_at timestamptz not null default now()
);
create index usage_records_user_period on usage_records (user_id, period);

create table emission_estimates (
  id uuid primary key default gen_random_uuid(),
  usage_record_id uuid not null references usage_records on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  period date not null,
  kwh numeric(12,6) not null,
  kg_co2e numeric(12,6) not null,
  liters_water numeric(12,6) not null,
  damage_usd numeric(10,4) not null,
  methodology_version text not null
);

create table donation_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  period date not null,
  damage_usd numeric(10,4) not null,
  multiplier numeric(3,2) not null,
  donation_usd numeric(10,2) not null,
  charity_id text references charities,
  status text not null default 'simulated' check (status in ('simulated','pending','completed')),
  created_at timestamptz not null default now(),
  unique (user_id, period)
);

alter table profiles enable row level security;
alter table provider_connections enable row level security;
alter table usage_records enable row level security;
alter table emission_estimates enable row level security;
alter table donation_ledger enable row level security;
alter table charities enable row level security;

create policy "own profile" on profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "own connections" on provider_connections for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own usage" on usage_records for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own estimates" on emission_estimates for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own ledger" on donation_ledger for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "charities readable" on charities for select using (true);

create function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, split_part(new.email, '@', 1));
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

insert into charities (id, name, description, category) values
  ('cleanairtaskforce',        'Clean Air Task Force',        'Advocates for technologies and policies to reach a zero-emissions, high-energy planet.',         'Policy'),
  ('rainforest-foundation-us', 'Rainforest Foundation US',    'Protects rainforests by securing land rights for indigenous communities.',                       'Forests'),
  ('carbon180',                'Carbon180',                   'Nonprofit driving carbon removal policy and innovation.',                                         'Carbon removal'),
  ('coolearth',                'Cool Earth',                  'Backs indigenous peoples to keep rainforest standing.',                                           'Forests'),
  ('cleanenergybuyersinstitute','Clean Energy Buyers Institute','Decarbonizing the grid that powers data centers.',                                             'Grid'),
  ('givingreen',               'Giving Green Fund',           'Evidence-based fund allocating to the highest-impact climate initiatives.',                       'Fund');
