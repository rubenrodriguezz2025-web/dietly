import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';
import type { PlanContent } from '@/types/dietly';

import { NavegadorDias } from './navegador-dias';

export const metadata: Metadata = {
  title: 'Mi plan nutricional · Dietly',
  description: 'Tu plan nutricional personalizado',
  manifest: '/manifest.json',
  themeColor: '#16a34a',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    viewportFit: 'cover',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Mi Plan',
  },
};

export default async function PaginaPaciente({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ dia?: string }>;
}) {
  const { token } = await params;
  const { dia } = await searchParams;

  // Buscar el plan por token público (sin RLS — usamos admin client)
  const { data: plan } = await (supabaseAdminClient as any)
    .from('nutrition_plans')
    .select('*, patients(name)')
    .eq('patient_token', token)
    .eq('status', 'approved')
    .single();

  if (!plan) notFound();

  const content = plan.content as PlanContent | null;
  if (!content?.days?.length) notFound();

  const diaActual = Math.min(
    Math.max(parseInt(dia ?? '1', 10) || 1, 1),
    content.days.length
  );

  const diaSeleccionado = content.days.find((d) => d.day_number === diaActual) ?? content.days[0];
  const nombrePaciente = (plan.patients as { name: string } | null)?.name ?? 'Paciente';

  const fechaSemana = new Date(plan.week_start_date).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
  });

  return (
    <div className='min-h-screen bg-white'>
      {/* Cabecera */}
      <header className='sticky top-0 z-10 border-b border-zinc-100 bg-white/90 px-4 py-3 backdrop-blur-sm'>
        <div className='mx-auto max-w-lg'>
          <p className='text-xs font-semibold text-green-600'>Dietly</p>
          <h1 className='text-base font-bold text-zinc-900'>
            Plan nutricional · {nombrePaciente}
          </h1>
          <p className='text-xs text-zinc-500'>Semana del {fechaSemana}</p>
        </div>
      </header>

      <main className='mx-auto max-w-lg px-4 pb-10'>
        {/* Resumen semanal */}
        <section className='mt-4 rounded-xl bg-green-50 p-4'>
          <p className='mb-3 text-xs font-semibold uppercase tracking-wider text-green-700'>
            Objetivo semanal
          </p>
          <div className='grid grid-cols-4 gap-2 text-center'>
            <div>
              <p className='text-base font-bold text-green-800'>
                {content.week_summary.target_daily_calories}
              </p>
              <p className='text-[10px] text-green-700'>kcal</p>
            </div>
            <div>
              <p className='text-base font-bold text-green-800'>
                {content.week_summary.target_macros.protein_g}g
              </p>
              <p className='text-[10px] text-green-700'>proteína</p>
            </div>
            <div>
              <p className='text-base font-bold text-green-800'>
                {content.week_summary.target_macros.carbs_g}g
              </p>
              <p className='text-[10px] text-green-700'>carbos</p>
            </div>
            <div>
              <p className='text-base font-bold text-green-800'>
                {content.week_summary.target_macros.fat_g}g
              </p>
              <p className='text-[10px] text-green-700'>grasa</p>
            </div>
          </div>
        </section>

        {/* Navegación por días */}
        <NavegadorDias
          dias={content.days.map((d) => ({ numero: d.day_number, nombre: d.day_name }))}
          diaActual={diaActual}
          token={token}
        />

        {/* Comidas del día seleccionado */}
        <section className='mt-2'>
          <div className='mb-3 flex items-center justify-between'>
            <h2 className='text-lg font-bold text-zinc-900'>{diaSeleccionado.day_name}</h2>
            <div className='flex gap-2 rounded-lg bg-zinc-100 px-3 py-1.5 text-xs text-zinc-600'>
              <span className='font-semibold text-zinc-900'>
                {diaSeleccionado.total_calories} kcal
              </span>
              <span>·</span>
              <span>{diaSeleccionado.total_macros.protein_g}g P</span>
              <span>·</span>
              <span>{diaSeleccionado.total_macros.carbs_g}g C</span>
              <span>·</span>
              <span>{diaSeleccionado.total_macros.fat_g}g G</span>
            </div>
          </div>

          <div className='flex flex-col gap-3'>
            {diaSeleccionado.meals.map((comida, i) => (
              <TarjetaComida key={i} comida={comida} />
            ))}
          </div>
        </section>

        {/* Lista de la compra */}
        {content.shopping_list && (
          <section className='mt-8'>
            <h2 className='mb-3 text-base font-bold text-zinc-900'>Lista de la compra</h2>
            <div className='flex flex-col gap-4'>
              {CATEGORIAS_COMPRA.map(([clave, etiqueta]) => {
                const items = content.shopping_list[clave as keyof typeof content.shopping_list];
                if (!items?.length) return null;
                return (
                  <div key={clave}>
                    <p className='mb-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500'>
                      {etiqueta}
                    </p>
                    <ul className='flex flex-col gap-1'>
                      {items.map((item, i) => (
                        <li key={i} className='flex items-start gap-2 text-sm text-zinc-700'>
                          <span className='mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-green-500' />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Aviso legal */}
        <p className='mt-10 text-center text-[10px] text-zinc-400'>
          Plan elaborado por {nombrePaciente.split(' ')[0]} con Dietly · Revisado y aprobado por tu nutricionista
        </p>
      </main>

      {/* Script para registrar el service worker */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').catch(function() {});
              });
            }
          `,
        }}
      />
    </div>
  );
}

// ── Componentes ───────────────────────────────────────────────────────────────

const TIPOS_COMIDA: Record<string, string> = {
  desayuno: 'Desayuno',
  media_manana: 'Media mañana',
  almuerzo: 'Almuerzo',
  merienda: 'Merienda',
  cena: 'Cena',
};

const CATEGORIAS_COMPRA: Array<[string, string]> = [
  ['produce', 'Frutas y verduras'],
  ['protein', 'Proteínas'],
  ['dairy', 'Lácteos'],
  ['grains', 'Cereales y pan'],
  ['pantry', 'Despensa'],
];

type Comida = PlanContent['days'][0]['meals'][0];

function TarjetaComida({ comida }: { comida: Comida }) {
  return (
    <article className='overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm'>
      {/* Cabecera de comida */}
      <div className='flex items-start justify-between gap-3 px-4 pt-4 pb-2'>
        <div>
          <p className='text-[10px] font-semibold uppercase tracking-wider text-zinc-400'>
            {TIPOS_COMIDA[comida.meal_type] ?? comida.meal_type}
            {comida.time_suggestion && (
              <span className='font-normal text-zinc-300'> · {comida.time_suggestion}</span>
            )}
          </p>
          <h3 className='mt-0.5 text-base font-bold text-zinc-900'>{comida.meal_name}</h3>
        </div>
        {/* Macros siempre visibles (F-02) */}
        <div className='flex-shrink-0 rounded-lg bg-green-50 px-2.5 py-2 text-center'>
          <p className='text-base font-bold text-green-700'>{comida.calories}</p>
          <p className='text-[10px] text-green-600'>kcal</p>
        </div>
      </div>

      {/* Barra de macros */}
      <div className='mx-4 mb-3 flex gap-2 rounded-lg bg-zinc-50 px-3 py-2 text-xs'>
        <span className='text-zinc-500'>
          <span className='font-semibold text-zinc-700'>{comida.macros.protein_g}g</span> proteína
        </span>
        <span className='text-zinc-300'>·</span>
        <span className='text-zinc-500'>
          <span className='font-semibold text-zinc-700'>{comida.macros.carbs_g}g</span> carbos
        </span>
        <span className='text-zinc-300'>·</span>
        <span className='text-zinc-500'>
          <span className='font-semibold text-zinc-700'>{comida.macros.fat_g}g</span> grasa
        </span>
      </div>

      {/* Ingredientes siempre visibles (F-03) */}
      {comida.ingredients.length > 0 && (
        <div className='border-t border-zinc-100 px-4 py-3'>
          <p className='mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-400'>
            Ingredientes
          </p>
          <ul className='flex flex-wrap gap-1.5'>
            {comida.ingredients.map((ing, i) => (
              <li
                key={i}
                className='rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs text-zinc-700'
              >
                {ing.name}{' '}
                <span className='text-zinc-400'>
                  {ing.quantity} {ing.unit}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Preparación */}
      {comida.preparation && (
        <div className='border-t border-zinc-100 px-4 py-3'>
          <p className='mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400'>
            Preparación
          </p>
          <p className='text-sm leading-relaxed text-zinc-600'>{comida.preparation}</p>
        </div>
      )}
    </article>
  );
}
