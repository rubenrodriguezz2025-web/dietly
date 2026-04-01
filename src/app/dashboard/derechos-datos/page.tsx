import Link from 'next/link';
import { redirect } from 'next/navigation';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

import { RequestActions, RequestTypeBadge, StatusBadge } from './request-actions';

type DataRightsRequest = {
  id: string;
  patient_id: string | null;
  nutritionist_id: string;
  request_type: string;
  status: string;
  patient_name_snapshot: string | null;
  patient_email_snapshot: string | null;
  notes: string | null;
  response_due_at: string;
  responded_at: string | null;
  created_at: string;
};

function daysLeft(dueAt: string): number {
  return Math.ceil((new Date(dueAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export default async function DerechosDatosPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: requests } = await (supabase as any)
    .from('data_rights_requests')
    .select('*')
    .eq('nutritionist_id', user.id)
    .order('created_at', { ascending: false });

  const all = (requests ?? []) as DataRightsRequest[];
  const active = all.filter((r) => r.status === 'pending' || r.status === 'in_progress');
  const resolved = all.filter((r) => r.status === 'completed' || r.status === 'rejected');
  const overdue = active.filter((r) => daysLeft(r.response_due_at) < 0);

  return (
    <div className='flex flex-col gap-6'>
      {/* Header */}
      <div className='flex items-start justify-between gap-4'>
        <div>
          <h1 className='text-xl font-bold text-zinc-100'>Derechos RGPD</h1>
          <p className='mt-1 text-sm text-zinc-500'>
            Solicitudes de ejercicio de derechos de tus pacientes. Plazo de respuesta: 30 días.
          </p>
        </div>
        <a
          href='/derechos-datos'
          target='_blank'
          rel='noopener noreferrer'
          className='flex-shrink-0 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-200'
        >
          Ver página del paciente →
        </a>
      </div>

      {/* Banner de vencidos */}
      {overdue.length > 0 && (
        <div className='rounded-xl border border-red-900/40 bg-red-950/20 px-4 py-3'>
          <p className='text-sm font-medium text-red-400'>
            {overdue.length === 1
              ? '1 solicitud ha superado el plazo legal de 30 días'
              : `${overdue.length} solicitudes han superado el plazo legal de 30 días`}
            {' '}— actúa de inmediato para cumplir el Art. 12.3 RGPD.
          </p>
        </div>
      )}

      {/* Solicitudes activas */}
      <section className='flex flex-col gap-3'>
        <h2 className='text-xs font-semibold uppercase tracking-wider text-zinc-500'>
          Pendientes ({active.length})
        </h2>

        {active.length === 0 ? (
          <div className='rounded-xl border border-zinc-800 bg-gray-50 dark:bg-zinc-900/30 px-6 py-8 text-center'>
            <p className='text-sm text-zinc-600'>No hay solicitudes pendientes.</p>
            <p className='mt-1 text-xs text-zinc-700'>
              Cuando un paciente use{' '}
              <span className='text-zinc-600'>/derechos-datos</span>, aparecerá aquí.
            </p>
          </div>
        ) : (
          <div className='flex flex-col gap-2'>
            {active.map((r) => {
              const days = daysLeft(r.response_due_at);
              const isOverdue = days < 0;
              return (
                <div
                  key={r.id}
                  className={`rounded-xl border bg-gray-50 dark:bg-zinc-900/40 px-4 py-4 ${
                    isOverdue ? 'border-red-900/50' : 'border-zinc-800'
                  }`}
                >
                  <div className='flex flex-wrap items-start justify-between gap-3'>
                    <div className='flex flex-col gap-1.5'>
                      <div className='flex flex-wrap items-center gap-2'>
                        <RequestTypeBadge type={r.request_type} />
                        <StatusBadge status={r.status} />
                        {isOverdue ? (
                          <span className='text-xs font-medium text-red-400'>
                            Vencida hace {Math.abs(days)} días
                          </span>
                        ) : (
                          <span className={`text-xs ${days <= 5 ? 'text-amber-500' : 'text-zinc-600'}`}>
                            {days} días restantes
                          </span>
                        )}
                      </div>
                      <p className='text-sm font-medium text-zinc-200'>
                        {r.patient_name_snapshot ?? 'Paciente eliminado'}
                      </p>
                      {r.patient_email_snapshot && (
                        <p className='text-xs text-zinc-500'>{r.patient_email_snapshot}</p>
                      )}
                      {r.notes && (
                        <p className='text-xs italic text-zinc-600'>&ldquo;{r.notes}&rdquo;</p>
                      )}
                      <p className='text-xs text-zinc-700'>
                        Recibida el{' '}
                        {new Date(r.created_at).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                    </div>

                    {/* Enlace al paciente si existe */}
                    {r.patient_id && (
                      <Link
                        href={`/dashboard/patients/${r.patient_id}`}
                        className='flex-shrink-0 text-xs text-zinc-600 underline-offset-2 hover:text-zinc-400 hover:underline'
                      >
                        Ver ficha →
                      </Link>
                    )}
                  </div>

                  <div className='mt-3 border-t border-zinc-800/60 pt-3'>
                    <RequestActions request={r} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Solicitudes resueltas */}
      {resolved.length > 0 && (
        <section className='flex flex-col gap-3'>
          <h2 className='text-xs font-semibold uppercase tracking-wider text-zinc-500'>
            Historial ({resolved.length})
          </h2>
          <div className='flex flex-col gap-2'>
            {resolved.map((r) => (
              <div
                key={r.id}
                className='flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-800/60 bg-gray-50/50 dark:bg-zinc-900/20 px-4 py-3 opacity-60'
              >
                <div className='flex flex-wrap items-center gap-2'>
                  <RequestTypeBadge type={r.request_type} />
                  <StatusBadge status={r.status} />
                  <span className='text-xs text-zinc-600'>
                    {r.patient_name_snapshot ?? 'Paciente eliminado'}
                  </span>
                </div>
                <span className='text-xs text-zinc-700'>
                  {r.responded_at
                    ? `Respondida el ${new Date(r.responded_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`
                    : new Date(r.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Info legal */}
      <div className='rounded-xl border border-zinc-800/40 bg-gray-50/50 dark:bg-zinc-900/20 px-4 py-3'>
        <p className='text-xs leading-relaxed text-zinc-600'>
          <strong className='text-zinc-500'>Obligaciones legales:</strong> Debes responder en
          30 días naturales (Art. 12.3 RGPD). Para supresión: borra los datos del paciente con
          el botón correspondiente. Para portabilidad: exporta el JSON y envíaselo al paciente
          por email. Para acceso o rectificación: responde directamente al paciente. Si rechazas
          una solicitud, debes justificarlo por escrito.
        </p>
      </div>
    </div>
  );
}
