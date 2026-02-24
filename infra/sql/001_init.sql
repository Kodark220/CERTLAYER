-- CertLayer initial schema (v0)
create extension if not exists pgcrypto;

create table users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  password_hash text,
  role_global text not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table wallet_identities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  wallet_address text not null,
  wallet_type text not null,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  unique (wallet_address)
);

create table protocols (
  id uuid primary key default gen_random_uuid(),
  protocol_slug text not null unique,
  display_name text not null,
  website_url text,
  protocol_type text not null,
  status text not null default 'active',
  registry_contract_id text,
  created_by uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table team_members (
  id uuid primary key default gen_random_uuid(),
  protocol_id uuid not null references protocols(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  role text not null,
  created_at timestamptz not null default now(),
  unique (protocol_id, user_id)
);

create table protocol_wallets (
  id uuid primary key default gen_random_uuid(),
  protocol_id uuid not null references protocols(id) on delete cascade,
  wallet_address text not null,
  wallet_role text not null,
  created_at timestamptz not null default now(),
  unique (protocol_id, wallet_address)
);

create table protocol_endpoints (
  id uuid primary key default gen_random_uuid(),
  protocol_id uuid not null references protocols(id) on delete cascade,
  endpoint_url text not null,
  endpoint_kind text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table sla_terms (
  id uuid primary key default gen_random_uuid(),
  protocol_id uuid not null references protocols(id) on delete cascade,
  version int not null,
  uptime_bps int not null,
  max_response_seconds int not null,
  compensation_model text not null,
  compensation_value numeric(30,10) not null,
  notice_period_days int not null default 30,
  effective_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (protocol_id, version)
);

create table coverage_pools (
  id uuid primary key default gen_random_uuid(),
  protocol_id uuid not null references protocols(id) on delete cascade,
  asset_symbol text not null default 'USDC',
  current_balance numeric(30,10) not null default 0,
  minimum_required numeric(30,10) not null default 0,
  health_status text not null default 'healthy',
  updated_at timestamptz not null default now(),
  unique (protocol_id)
);

create table monitor_checks (
  id uuid primary key default gen_random_uuid(),
  protocol_id uuid not null references protocols(id) on delete cascade,
  endpoint_id uuid references protocol_endpoints(id) on delete set null,
  checked_at timestamptz not null,
  http_status int,
  response_ms int,
  ok boolean not null,
  raw_payload jsonb
);
create index monitor_checks_protocol_checked_idx on monitor_checks (protocol_id, checked_at desc);

create table incident_candidates (
  id uuid primary key default gen_random_uuid(),
  protocol_id uuid not null references protocols(id) on delete cascade,
  opened_at timestamptz not null,
  closed_at timestamptz,
  status text not null default 'open',
  confidence numeric(5,2),
  summary text,
  created_at timestamptz not null default now()
);
create index incident_candidates_protocol_opened_idx on incident_candidates (protocol_id, opened_at desc);

create table incident_evidence (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references incident_candidates(id) on delete cascade,
  source_type text not null,
  source_ref text,
  observed_at timestamptz not null,
  payload jsonb,
  created_at timestamptz not null default now()
);

create table incident_decisions (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references incident_candidates(id) on delete cascade,
  decision text not null,
  reason text,
  decided_at timestamptz not null,
  policy_hash text,
  created_at timestamptz not null default now(),
  unique (incident_id)
);

create table enforcement_actions (
  id uuid primary key default gen_random_uuid(),
  protocol_id uuid not null references protocols(id) on delete cascade,
  incident_id uuid references incident_candidates(id) on delete set null,
  action_type text not null,
  status text not null,
  tx_hash text,
  initiated_at timestamptz not null,
  completed_at timestamptz
);

create table payout_batches (
  id uuid primary key default gen_random_uuid(),
  enforcement_action_id uuid not null references enforcement_actions(id) on delete cascade,
  protocol_id uuid not null references protocols(id) on delete cascade,
  total_amount numeric(30,10) not null,
  asset_symbol text not null default 'USDC',
  recipient_count int not null,
  created_at timestamptz not null default now()
);

create table payout_transfers (
  id uuid primary key default gen_random_uuid(),
  payout_batch_id uuid not null references payout_batches(id) on delete cascade,
  recipient_address text not null,
  amount numeric(30,10) not null,
  tx_hash text,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table reputation_scores (
  protocol_id uuid primary key references protocols(id) on delete cascade,
  score numeric(5,2) not null,
  grade text not null,
  uptime_component numeric(5,2) not null,
  incident_component numeric(5,2) not null,
  response_component numeric(5,2) not null,
  pool_health_component numeric(5,2) not null,
  updated_at timestamptz not null default now()
);

create table reputation_snapshots (
  id uuid primary key default gen_random_uuid(),
  protocol_id uuid not null references protocols(id) on delete cascade,
  score numeric(5,2) not null,
  grade text not null,
  snapshot_at timestamptz not null default now()
);
create index reputation_snapshots_protocol_snapshot_idx on reputation_snapshots (protocol_id, snapshot_at desc);

create table api_clients (
  id uuid primary key default gen_random_uuid(),
  org_name text not null,
  billing_email text not null,
  tier text not null,
  created_at timestamptz not null default now()
);

create table api_keys (
  id uuid primary key default gen_random_uuid(),
  api_client_id uuid not null references api_clients(id) on delete cascade,
  key_prefix text not null,
  key_hash text not null,
  scopes text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  unique (key_hash)
);

create table api_usage_daily (
  id uuid primary key default gen_random_uuid(),
  api_client_id uuid not null references api_clients(id) on delete cascade,
  usage_date date not null,
  request_count bigint not null default 0,
  unique (api_client_id, usage_date)
);

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references users(id),
  actor_wallet text,
  protocol_id uuid references protocols(id),
  action text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);
