'use client';

import { useActionState, useCallback, useEffect, useRef, useState } from 'react';

import { sendPlanToPatient } from './actions';

// ── Tipos ──────────────────────────────────────────────────────────────────────

interface Props {
  planId: string;
  hasEmail: boolean;
  patientToken: string;
  alreadySent: boolean;
  patientName: string;
  patientEmail: string;
  planTitle: string;
}

const MAX_MSG_LENGTH = 500;
// ease-out-expo: confiado, decidido — sin bounce
const EASE_OUT_EXPO = 'cubic-bezier(0.16, 1, 0.3, 1)';

// ── Componente principal ──────────────────────────────────────────────────────

export function SendPlanButton({
  planId,
  hasEmail,
  patientToken,
  alreadySent,
  patientName,
  patientEmail,
  planTitle,
}: Props) {
  const [state, action, pending] = useActionState(
    sendPlanToPatient.bind(null, planId),
    {}
  );
  const [copied, setCopied] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const appUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const planUrl = `${appUrl}/p/${patientToken}`;

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(planUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [planUrl]);

  function openModal() {
    setModalOpen(true);
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        setModalVisible(true);
        setTimeout(() => textareaRef.current?.focus(), 60);
      })
    );
  }

  function closeModal() {
    setModalVisible(false);
    setTimeout(() => {
      setModalOpen(false);
      setMensaje('');
    }, 230);
  }

  // Cerrar con Escape + scroll lock
  useEffect(() => {
    if (!modalOpen) return;

    document.body.style.overflow = 'hidden';

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeModal();
    }
    window.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [modalOpen]);

  // Cerrar al recibir éxito
  useEffect(() => {
    if (state.ok) closeModal();
  }, [state.ok]);

  return (
    <>
      {/* ── Botones de acción ──────────────────────────────────────────────── */}
      <div className='flex flex-col items-end gap-2'>
        <div className='flex items-center gap-2'>
          {/* Copiar enlace */}
          <button
            type='button'
            onClick={handleCopy}
            title='Copiar enlace para el paciente'
            className='inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs font-medium text-zinc-300 transition-colors duration-150 hover:border-zinc-600 hover:bg-zinc-700 active:scale-[0.97]'
          >
            {copied ? (
              <>
                <svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
                  <polyline points='20 6 9 17 4 12' />
                </svg>
                Copiado
              </>
            ) : (
              <>
                <svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
                  <rect x='9' y='9' width='13' height='13' rx='2' ry='2' />
                  <path d='M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1' />
                </svg>
                Copiar enlace
              </>
            )}
          </button>

          {/* Enviar por email */}
          {!hasEmail ? (
            <button
              disabled
              title='El paciente no tiene email. Añádelo en su ficha.'
              className='inline-flex cursor-not-allowed items-center gap-2 rounded-lg bg-[#1a7a45] px-4 py-2 text-sm font-semibold text-white opacity-40'
            >
              Enviar al paciente
            </button>
          ) : (
            <button
              type='button'
              onClick={openModal}
              className='inline-flex items-center gap-2 rounded-lg bg-[#1a7a45] px-4 py-2 text-sm font-semibold text-white transition-all duration-150 hover:bg-[#155f38] active:scale-[0.97]'
            >
              <svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
                <line x1='22' y1='2' x2='11' y2='13' />
                <polygon points='22 2 15 22 11 13 2 9 22 2' />
              </svg>
              {alreadySent ? 'Reenviar al paciente' : 'Enviar al paciente'}
            </button>
          )}
        </div>

        {state.ok && (
          <p className='text-xs text-emerald-500'>✓ Email enviado correctamente</p>
        )}
        {state.error && (
          <p className='max-w-xs text-right text-xs text-red-400'>{state.error}</p>
        )}
        {!hasEmail && (
          <p className='text-xs text-zinc-600'>
            El paciente no tiene email — usa &quot;Copiar enlace&quot; para compartirlo manualmente
          </p>
        )}
      </div>

      {/* ── Modal ─────────────────────────────────────────────────────────── */}
      {modalOpen && (
        <div
          role='dialog'
          aria-modal='true'
          aria-labelledby='send-modal-title'
          className='fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4'
        >
          {/* Backdrop */}
          <div
            className='absolute inset-0 bg-black/70 backdrop-blur-[2px]'
            style={{
              opacity: modalVisible ? 1 : 0,
              transition: `opacity 230ms ${EASE_OUT_EXPO}`,
            }}
            onClick={closeModal}
            aria-hidden='true'
          />

          {/* Tarjeta del modal */}
          <div
            className='relative w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border border-zinc-700/80 bg-zinc-900 shadow-2xl'
            style={{
              opacity: modalVisible ? 1 : 0,
              transform: modalVisible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.97)',
              transition: `opacity 280ms ${EASE_OUT_EXPO}, transform 280ms ${EASE_OUT_EXPO}`,
            }}
          >
            {/* Tirador (móvil) */}
            <div className='flex justify-center pt-3 sm:hidden'>
              <div className='h-1 w-9 rounded-full bg-zinc-700' aria-hidden='true' />
            </div>

            {/* Cabecera */}
            <div className='flex items-start justify-between px-5 pb-4 pt-4 sm:pt-5 border-b border-zinc-800'>
              <div>
                <h2
                  id='send-modal-title'
                  className='text-sm font-semibold text-zinc-100'
                >
                  Confirmar envío del plan
                </h2>
                <p className='mt-0.5 text-xs text-zinc-500'>{planTitle}</p>
              </div>
              <button
                type='button'
                onClick={closeModal}
                className='ml-4 flex-shrink-0 rounded-md p-1 text-zinc-600 transition-colors duration-150 hover:text-zinc-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-500'
                aria-label='Cerrar modal'
              >
                <svg xmlns='http://www.w3.org/2000/svg' width='15' height='15' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
                  <line x1='18' y1='6' x2='6' y2='18' />
                  <line x1='6' y1='6' x2='18' y2='18' />
                </svg>
              </button>
            </div>

            {/* Cuerpo */}
            <div className='px-5 py-5'>
              {/* Destinatario */}
              <div className='mb-4 flex items-center gap-3 rounded-xl bg-zinc-800/60 px-4 py-3'>
                <div className='flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-zinc-700 text-xs font-semibold text-zinc-300'>
                  {patientName.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()}
                </div>
                <div className='min-w-0'>
                  <p className='truncate text-sm font-medium text-zinc-100'>{patientName}</p>
                  <p className='truncate text-xs text-zinc-500'>{patientEmail}</p>
                </div>
              </div>

              {/* Mensaje personal */}
              <label className='block'>
                <span className='mb-1.5 block text-xs font-medium text-zinc-400'>
                  Mensaje personal para tu paciente{' '}
                  <span className='font-normal text-zinc-600'>(opcional)</span>
                </span>
                <textarea
                  ref={textareaRef}
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)}
                  maxLength={MAX_MSG_LENGTH}
                  rows={3}
                  placeholder={`Hola ${patientName.split(' ')[0]}, aquí tienes tu plan personalizado…`}
                  className='w-full resize-none rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 transition-colors duration-150 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500'
                />
                <div className='mt-1 flex justify-end'>
                  <span
                    className={`text-[11px] tabular-nums transition-colors duration-150 ${
                      mensaje.length >= MAX_MSG_LENGTH
                        ? 'text-red-400'
                        : mensaje.length > MAX_MSG_LENGTH * 0.9
                        ? 'text-amber-400'
                        : 'text-zinc-700'
                    }`}
                  >
                    {mensaje.length}/{MAX_MSG_LENGTH}
                  </span>
                </div>
              </label>
            </div>

            {/* Acciones */}
            <div className='flex justify-end gap-2 border-t border-zinc-800 px-5 py-4'>
              <button
                type='button'
                onClick={closeModal}
                disabled={pending}
                className='rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 transition-colors duration-150 hover:border-zinc-600 hover:text-zinc-200 disabled:opacity-40'
              >
                Cancelar
              </button>
              <form action={action}>
                <input type='hidden' name='personal_message' value={mensaje} />
                <button
                  type='submit'
                  disabled={pending}
                  className='inline-flex items-center gap-2 rounded-lg bg-[#1a7a45] px-5 py-2 text-sm font-semibold text-white transition-all duration-150 hover:bg-[#155f38] disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.97]'
                >
                  {pending ? (
                    <>
                      <span className='h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white' />
                      Enviando…
                    </>
                  ) : (
                    <>
                      <svg xmlns='http://www.w3.org/2000/svg' width='13' height='13' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
                        <line x1='22' y1='2' x2='11' y2='13' />
                        <polygon points='22 2 15 22 11 13 2 9 22 2' />
                      </svg>
                      Confirmar envío
                    </>
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
