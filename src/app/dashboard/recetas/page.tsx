import { redirect } from 'next/navigation';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

import { getRecipes } from './actions';
import { RecipesClient } from './recipes-client';

export const metadata = { title: 'Mis recetas · Dietly' };

export default async function RecetasPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { recipes } = await getRecipes();
  return <RecipesClient initialRecipes={recipes ?? []} />;
}
