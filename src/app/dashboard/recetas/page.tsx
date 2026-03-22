import { redirect } from 'next/navigation';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import type { Recipe } from '@/types/dietly';

import { RecipesClient } from './recipes-client';

export const metadata = { title: 'Mis recetas · Dietly' };

export default async function RecetasPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: recipes } = await (supabase as any)
    .from('recipes')
    .select('*')
    .eq('nutritionist_id', user.id)
    .order('created_at', { ascending: false });

  return <RecipesClient initialRecipes={(recipes as Recipe[]) ?? []} />;
}
