-- ============================================================
-- DIETLY — Schema inicial
-- Semana 1: profiles, patients, nutrition_plans, plan_generations
-- ============================================================

-- ---- ENUMS ----

create type specialty_type as enum ('weight_loss', 'sports', 'clinical', 'general');
create type activity_level_type as enum ('sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extra_active');
create type patient_goal_type as enum ('weight_loss', 'weight_gain', 'maintenance', 'muscle_gain', 'health');
create type plan_status_type as enum ('draft', 'approved', 'sent');
create type generation_status_type as enum ('pending', 'generating', 'completed', 'failed');

-- ============================================================
-- PROFILES
-- Datos del nutricionista (extiende auth.users)
-- ============================================================

create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  full_name text not null,
  clinic_name text,
  specialty specialty_type not null default 'general',
  created_at timestamp with time zone default timezone('utc', now()) not null,
  updated_at timestamp with time zone default timezone('utc', now()) not null
);

alter table profiles enable row level security;

create policy "Nutricionista ve su propio perfil"
  on profiles for select
  using (auth.uid() = id);

create policy "Nutricionista crea su propio perfil"
  on profiles for insert
  with check (auth.uid() = id);

create policy "Nutricionista actualiza su propio perfil"
  on profiles for update
  using (auth.uid() = id);

-- Trigger para updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on profiles
  for each row execute function public.handle_updated_at();

-- ============================================================
-- PATIENTS
-- Ficha clínica del paciente (F-06)
-- ============================================================

create table patients (
  id uuid default gen_random_uuid() not null primary key,
  nutritionist_id uuid references auth.users on delete cascade not null,

  -- Campos obligatorios (F-06)
  name text not null,
  email text,
  date_of_birth date,
  sex text check (sex in ('male', 'female', 'other')),
  weight_kg numeric(5, 2),
  height_cm numeric(5, 1),
  activity_level activity_level_type,
  goal patient_goal_type,

  -- Campos opcionales (F-06)
  dietary_restrictions text,
  allergies text,
  intolerances text,
  preferences text,
  medical_notes text,

  -- Campos calculados (se guardan para no recalcular siempre)
  tmb numeric(7, 2),
  tdee numeric(7, 2),

  created_at timestamp with time zone default timezone('utc', now()) not null,
  updated_at timestamp with time zone default timezone('utc', now()) not null
);

alter table patients enable row level security;

create policy "Nutricionista ve sus pacientes"
  on patients for select
  using (auth.uid() = nutritionist_id);

create policy "Nutricionista crea pacientes"
  on patients for insert
  with check (auth.uid() = nutritionist_id);

create policy "Nutricionista actualiza sus pacientes"
  on patients for update
  using (auth.uid() = nutritionist_id);

create policy "Nutricionista borra sus pacientes"
  on patients for delete
  using (auth.uid() = nutritionist_id);

create trigger patients_updated_at
  before update on patients
  for each row execute function public.handle_updated_at();

-- ============================================================
-- NUTRITION_PLANS
-- Plan semanal generado (F-01)
-- ============================================================

create table nutrition_plans (
  id uuid default gen_random_uuid() not null primary key,
  nutritionist_id uuid references auth.users on delete cascade not null,
  patient_id uuid references patients on delete cascade not null,

  status plan_status_type not null default 'draft',
  week_start_date date not null,

  -- Plan completo en JSON: { days: [{ day: 1, meals: [...] }] }
  content jsonb,

  -- Token único para el link del paciente (F-09)
  patient_token uuid default gen_random_uuid() not null unique,

  sent_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc', now()) not null,
  updated_at timestamp with time zone default timezone('utc', now()) not null
);

alter table nutrition_plans enable row level security;

create policy "Nutricionista ve sus planes"
  on nutrition_plans for select
  using (auth.uid() = nutritionist_id);

create policy "Nutricionista crea planes"
  on nutrition_plans for insert
  with check (auth.uid() = nutritionist_id);

create policy "Nutricionista actualiza sus planes"
  on nutrition_plans for update
  using (auth.uid() = nutritionist_id);

create policy "Nutricionista borra sus planes"
  on nutrition_plans for delete
  using (auth.uid() = nutritionist_id);

-- El paciente puede ver su plan por token (sin login, F-09)
create policy "Paciente ve su plan por token"
  on nutrition_plans for select
  using (true);

create trigger nutrition_plans_updated_at
  before update on nutrition_plans
  for each row execute function public.handle_updated_at();

-- ============================================================
-- PLAN_GENERATIONS
-- Registro de generaciones por día (F-01, F-04)
-- ============================================================

create table plan_generations (
  id uuid default gen_random_uuid() not null primary key,
  plan_id uuid references nutrition_plans on delete cascade not null,
  nutritionist_id uuid references auth.users on delete cascade not null,

  day_number integer not null check (day_number between 1 and 7),
  status generation_status_type not null default 'pending',

  -- Contenido del día generado por Claude API
  content jsonb,

  -- Error si falló la generación
  error text,

  created_at timestamp with time zone default timezone('utc', now()) not null,
  updated_at timestamp with time zone default timezone('utc', now()) not null,

  unique (plan_id, day_number)
);

alter table plan_generations enable row level security;

create policy "Nutricionista ve sus generaciones"
  on plan_generations for select
  using (auth.uid() = nutritionist_id);

create policy "Nutricionista crea generaciones"
  on plan_generations for insert
  with check (auth.uid() = nutritionist_id);

create policy "Nutricionista actualiza sus generaciones"
  on plan_generations for update
  using (auth.uid() = nutritionist_id);

create trigger plan_generations_updated_at
  before update on plan_generations
  for each row execute function public.handle_updated_at();
