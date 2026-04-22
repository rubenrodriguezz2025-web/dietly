'use client';

import { useState, useTransition } from 'react';

import { updateRequestStatus } from './actions';

type Request = {
  id: string;
  request_type: string;
  status: string;
  patient_id: string | null;
  patient_name_snapshot: string | null;
};

const TYPE_LABELS: Record<string, string> = {
  access: 'Acceso',
  rectification: 'Rectificación',
  erasure: 'Supresión',
  restriction: 'Limitación',
  portability: 'Portabilidad',
  objection: 'Oposición',
};

export function RequestActions({ request }: { request: Request }) {
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  function handleStatus(status: 'in_progress' | 'completed' | 'rejected') {
    startTransition(async () => {
      await updateRequestStatus(request.id, status);
    });
  }

  async function handleDelete() {
    if (!request.patient_id) return;
    startTransition(async () => {
      const res = await fetch(
        `/api/patients/${request.patient_id}/delete?request_id=${request.id}`,
        { method: 'DELETE' }
      );
      if (res.ok) {
        setConfirmDelete(false);
        // La página se actualizará por la revalidación de updateRequestStatus
        await updateRequestStatus(request.id, 'completed');
      }
    });
  }

  async function handleExport() {
    if (!request.patient_id) return;
    window.location.href = `/api/patients/${request.patient_id}/export`;
    // Marcar como completada automáticamente
    startTransition(async () => {
      await updateRequestStatus(request.id, 'completed');
    });
  }

  return (
    <div className='flex flex-wrap items-center gap-2'>
      {/* Acciones de estado */}
      {request.status === 'pending' && (
        <button
          type='button'
          disabled={isPending}
          onClick={() => handleStatus('in_progress')}
          className='rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:border-zinc-400 hover:text-zinc-900 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-500 dark:hover:text-zinc-200'
        >
          Marcar en progreso
        </button>
      )}

      {request.status !== 'completed' && request.status !== 'rejected' && (
        <button
          type='button'
          disabled={isPending}
          onClick={() => handleStatus('completed')}
          className='rounded-md border border-emerald-300 px-3 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:border-emerald-400 hover:text-emerald-800 disabled:opacity-40 dark:border-emerald-800/50 dark:text-emerald-500 dark:hover:border-emerald-700 dark:hover:text-emerald-400'
        >
          Completada
        </button>
      )}

      {request.status !== 'completed' && request.status !== 'rejected' && (
        <button
          type='button'
          disabled={isPending}
          onClick={() => handleStatus('rejected')}
          className='rounded-md border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-500 transition-colors hover:border-zinc-300 hover:text-zinc-700 disabled:opacity-40 dark:border-zinc-800 dark:text-zinc-600 dark:hover:border-zinc-700 dark:hover:text-zinc-400'
        >
          Rechazar
        </button>
      )}

      {/* Acción de portabilidad */}
      {request.request_type === 'portability' && request.patient_id && (
        <button
          type='button'
          disabled={isPending}
          onClick={handleExport}
          className='rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:border-zinc-400 hover:text-zinc-900 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-500 dark:hover:text-white'
        >
          Exportar JSON
        </button>
      )}

      {/* Acción de supresión */}
      {request.request_type === 'erasure' && request.patient_id && (
        confirmDelete ? (
          <div className='flex items-center gap-2'>
            <span className='text-xs text-red-600 dark:text-red-400'>¿Confirmar eliminación permanente?</span>
            <button
              type='button'
              disabled={isPending}
              onClick={handleDelete}
              className='rounded-md bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-200 disabled:opacity-40 dark:bg-red-900/60 dark:text-red-300 dark:hover:bg-red-900'
            >
              Sí, eliminar
            </button>
            <button
              type='button'
              disabled={isPending}
              onClick={() => setConfirmDelete(false)}
              className='text-xs text-zinc-600 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-300'
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button
            type='button'
            disabled={isPending}
            onClick={() => setConfirmDelete(true)}
            className='rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:border-red-300 hover:text-red-700 disabled:opacity-40 dark:border-red-900/40 dark:text-red-500 dark:hover:border-red-800 dark:hover:text-red-400'
          >
            Eliminar paciente
          </button>
        )
      )}
    </div>
  );
}

export function RequestTypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    access: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-900/40',
    rectification: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-900/40',
    erasure: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-900/40',
    restriction: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950/50 dark:text-orange-400 dark:border-orange-900/40',
    portability: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-900/40',
    objection: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-400 dark:border-purple-900/40',
  };
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${colors[type] ?? 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700'}`}>
      {TYPE_LABELS[type] ?? type}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending: { label: 'Pendiente', cls: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-900/40' },
    in_progress: { label: 'En progreso', cls: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-900/40' },
    completed: { label: 'Completada', cls: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-900/40' },
    rejected: { label: 'Rechazada', cls: 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-500 dark:border-zinc-700' },
  };
  const { label, cls } = map[status] ?? { label: status, cls: 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-500 dark:border-zinc-700' };
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${cls}`}>
      {label}
    </span>
  );
}
