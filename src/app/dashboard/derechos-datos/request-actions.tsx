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
          className='rounded-md border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-200 disabled:opacity-40'
        >
          Marcar en progreso
        </button>
      )}

      {request.status !== 'completed' && request.status !== 'rejected' && (
        <button
          type='button'
          disabled={isPending}
          onClick={() => handleStatus('completed')}
          className='rounded-md border border-emerald-800/50 px-3 py-1.5 text-xs font-medium text-emerald-500 transition-colors hover:border-emerald-700 hover:text-emerald-400 disabled:opacity-40'
        >
          Completada
        </button>
      )}

      {request.status !== 'completed' && request.status !== 'rejected' && (
        <button
          type='button'
          disabled={isPending}
          onClick={() => handleStatus('rejected')}
          className='rounded-md border border-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:border-zinc-700 hover:text-zinc-400 disabled:opacity-40'
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
          className='rounded-md border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white disabled:opacity-40'
        >
          Exportar JSON
        </button>
      )}

      {/* Acción de supresión */}
      {request.request_type === 'erasure' && request.patient_id && (
        confirmDelete ? (
          <div className='flex items-center gap-2'>
            <span className='text-xs text-red-400'>¿Confirmar eliminación permanente?</span>
            <button
              type='button'
              disabled={isPending}
              onClick={handleDelete}
              className='rounded-md bg-red-900/60 px-3 py-1.5 text-xs font-semibold text-red-300 transition-colors hover:bg-red-900 disabled:opacity-40'
            >
              Sí, eliminar
            </button>
            <button
              type='button'
              disabled={isPending}
              onClick={() => setConfirmDelete(false)}
              className='text-xs text-zinc-500 hover:text-zinc-300'
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button
            type='button'
            disabled={isPending}
            onClick={() => setConfirmDelete(true)}
            className='rounded-md border border-red-900/40 px-3 py-1.5 text-xs font-medium text-red-500 transition-colors hover:border-red-800 hover:text-red-400 disabled:opacity-40'
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
    access: 'bg-blue-950/50 text-blue-400 border-blue-900/40',
    rectification: 'bg-amber-950/50 text-amber-400 border-amber-900/40',
    erasure: 'bg-red-950/50 text-red-400 border-red-900/40',
    restriction: 'bg-orange-950/50 text-orange-400 border-orange-900/40',
    portability: 'bg-emerald-950/50 text-emerald-400 border-emerald-900/40',
    objection: 'bg-purple-950/50 text-purple-400 border-purple-900/40',
  };
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${colors[type] ?? 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
      {TYPE_LABELS[type] ?? type}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending: { label: 'Pendiente', cls: 'bg-amber-950/50 text-amber-400 border-amber-900/40' },
    in_progress: { label: 'En progreso', cls: 'bg-blue-950/50 text-blue-400 border-blue-900/40' },
    completed: { label: 'Completada', cls: 'bg-emerald-950/50 text-emerald-400 border-emerald-900/40' },
    rejected: { label: 'Rechazada', cls: 'bg-zinc-800 text-zinc-500 border-zinc-700' },
  };
  const { label, cls } = map[status] ?? { label: status, cls: 'bg-zinc-800 text-zinc-500 border-zinc-700' };
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${cls}`}>
      {label}
    </span>
  );
}
