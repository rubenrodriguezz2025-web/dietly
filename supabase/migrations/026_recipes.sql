-- Recetario personal del nutricionista
CREATE TABLE IF NOT EXISTS recipes (
  id uuid primary key default gen_random_uuid(),
  nutritionist_id uuid references profiles(id) on delete cascade,
  name text not null,
  category text,
  servings int default 1,
  ingredients jsonb,
  instructions text,
  notes text,
  calories_per_serving numeric,
  protein_g_per_serving numeric,
  carbs_g_per_serving numeric,
  fat_g_per_serving numeric,
  values_source text default 'ai_estimated',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Nutricionistas ven sus propias recetas" ON recipes
  FOR ALL USING ((select auth.uid()) = nutritionist_id);
