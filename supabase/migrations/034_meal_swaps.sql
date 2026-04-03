-- 034_meal_swaps.sql
-- Tabla de intercambios de platos realizados por pacientes desde la PWA.
-- El paciente puede cambiar una comida por una alternativa generada por IA.
-- El nutricionista ve el historial de intercambios desde el dashboard.

create table if not exists public.meal_swaps (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.nutrition_plans(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  nutritionist_id uuid not null references public.profiles(id) on delete cascade,
  day_number smallint not null check (day_number between 1 and 7),
  meal_index smallint not null check (meal_index >= 0),
  original_meal jsonb not null,
  selected_meal jsonb not null,
  alternatives jsonb not null default '[]'::jsonb,
  reason text,
  reverted_at timestamptz,
  created_at timestamptz not null default now()
);

-- Índices para consultas frecuentes
create index if not exists idx_meal_swaps_plan_id on public.meal_swaps(plan_id);
create index if not exists idx_meal_swaps_patient_id on public.meal_swaps(patient_id);
create index if not exists idx_meal_swaps_nutritionist_id on public.meal_swaps(nutritionist_id);

-- RLS
alter table public.meal_swaps enable row level security;

-- El nutricionista puede leer los intercambios de sus pacientes
create policy "Nutricionista lee intercambios de sus pacientes"
  on public.meal_swaps for select
  using ((select auth.uid()) = nutritionist_id);

-- Inserciones públicas (el paciente no tiene auth, usa supabaseAdmin desde API)
-- No se crea policy de insert para anon — las inserciones se hacen con service_role
-- desde el endpoint /api/plans/confirm-swap

-- El nutricionista puede actualizar (para revertir)
create policy "Nutricionista actualiza intercambios"
  on public.meal_swaps for update
  using ((select auth.uid()) = nutritionist_id);
