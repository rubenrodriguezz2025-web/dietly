'use client';

import { useActionState,useState } from 'react';

import { approvePlan } from './actions';

export function ApproveButton({
  planId,
  hasDirty,
}: {
  planId: string;
  hasDirty?: boolean;
}) {
  const [showModal, setShowModal] = useState(false);
  const [checked, setChecked] = useState(false);
  const [state, action, pending] = useActionState(approvePlan.bind(null, planId), {});

  return (
    <>
      {/* Botón que abre el modal */}
      <div className='flex flex-col items-end gap-1'>
        {hasDirty && (
          <p className='text-xs text-amber-500'>Guarda todos los cambios antes de aprobar</p>
        )}
        <button
          type='button'
          disabled={hasDirty}
          onClick={() => setShowModal(true)}
          className='inline-flex items-center gap-2 rounded-lg bg-[#1a7a45] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#22c55e] hover:text-black disabled:cursor-not-allowed disabled:opacity-40'
        >
          Aprobar plan
        </button>
        <p className='text-xs text-zinc-600'>El plan pasará a estado &quot;Aprobado&quot;</p>
      </div>

      {/* Modal de aprobación */}
      {showModal && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm'
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div className='mx-4 w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl'>
            {/* Icono */}
            <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#1a7a45]/15'>
              <svg viewBox='0 0 24 24' fill='none' stroke='#22c55e' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='h-6 w-6'>
                <path d='M9 12l2 2 4-4'/>
                <path d='M12 2a10 10 0 110 20A10 10 0 0112 2z'/>
              </svg>
            </div>

            <h2 className='mb-1 text-lg font-semibold text-zinc-100'>Aprobar plan nutricional</h2>
            <p className='mb-5 text-sm text-zinc-500'>
              Una vez aprobado, el plan quedará registrado con tu firma profesional y podrás generar el PDF para el paciente.
            </p>

            {/* Checkbox de confirmación profesional */}
            <label className='flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4 transition-colors hover:border-zinc-700'>
              <input
                type='checkbox'
                checked={checked}
                onChange={(e) => setChecked(e.target.checked)}
                className='mt-0.5 h-4 w-4 flex-shrink-0 cursor-pointer accent-[#1a7a45]'
              />
              <span className='text-sm leading-relaxed text-zinc-300'>
                He revisado este plan nutricional en su totalidad y lo apruebo bajo{' '}
                <strong className='text-zinc-100'>mi criterio clínico profesional</strong>.
                Asumo la responsabilidad de su contenido como nutricionista titulado.
              </span>
            </label>

            {state.error && (
              <p className='mt-3 text-sm text-red-400'>{state.error}</p>
            )}

            <div className='mt-5 flex justify-end gap-3'>
              <button
                type='button'
                onClick={() => { setShowModal(false); setChecked(false); }}
                className='rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200'
              >
                Cancelar
              </button>

              {/* Formulario real que invoca el server action */}
              <form action={action}>
                <button
                  type='submit'
                  disabled={!checked || pending}
                  className='inline-flex items-center gap-2 rounded-lg bg-[#1a7a45] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#22c55e] hover:text-black disabled:cursor-not-allowed disabled:opacity-40'
                >
                  {pending ? (
                    <>
                      <span className='h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white' />
                      Aprobando...
                    </>
                  ) : (
                    'Confirmar aprobación'
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
