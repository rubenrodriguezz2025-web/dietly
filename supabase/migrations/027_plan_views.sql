CREATE TABLE IF NOT EXISTS plan_views (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid references nutrition_plans(id) on delete cascade,
  patient_token text,
  first_opened_at timestamptz default now(),
  last_opened_at timestamptz default now(),
  open_count int default 1,
  ip_address text
);
