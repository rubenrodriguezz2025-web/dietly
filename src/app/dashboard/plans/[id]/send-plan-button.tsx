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

// ── Icono WhatsApp ──────────────────────────────────────────────────────────

function IconWhatsApp({ className }: { className?: string }) {
  return (
    <svg viewBox='0 0 24 24' fill='currentColor' className={className} aria-hidden='true'>
      <path d='M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z' />
    </svg>
  );
}

// ── Toast ───────────────────────────────────────────────────────────────────

function WhatsAppToast({ visible }: { visible: boolean }) {
  return (
    <div
      role='status'
      aria-live='polite'
      aria-atomic='true'
      className='pointer-events-none fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-xl border border-[#25d366]/25 bg-zinc-900 px-4 py-3 shadow-xl shadow-black/40'
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(8px) scale(0.97)',
        transition: `opacity 220ms ${EASE_OUT_EXPO}, transform 220ms ${EASE_OUT_EXPO}`,
      }}
    >
      <IconWhatsApp className='h-4 w-4 flex-shrink-0 text-[#25d366]' />
      <span className='text-[13px] font-medium text-zinc-200'>
        WhatsApp abierto
      </span>
    </div>
  );
}

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

  // ── WhatsApp panel state ──────────────────────────────────────────────────
  const [waPanelOpen, setWaPanelOpen] = useState(false);
  const [waPanelVisible, setWaPanelVisible] = useState(false);
  const [waText, setWaText] = useState('');
  const waTextareaRef = useRef<HTMLTextAreaElement>(null);

  // ── Toast state ───────────────────────────────────────────────────────────
  const [toastMount, setToastMount] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Email modal state ─────────────────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const emailTextareaRef = useRef<HTMLTextAreaElement>(null);

  const appUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const planUrl = `${appUrl}/p/${patientToken}`;

  // ── Copiar enlace ─────────────────────────────────────────────────────────

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(planUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [planUrl]);

  // ── WhatsApp panel ────────────────────────────────────────────────────────

  const openWaPanel = useCallback(() => {
    const firstName = patientName.split(' ')[0];
    const defaultText = `Hola ${firstName}, aquí tienes tu plan nutricional personalizado: ${planUrl}`;
    setWaText(defaultText);
    setWaPanelOpen(true);
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        setWaPanelVisible(true);
        setTimeout(() => waTextareaRef.current?.focus(), 60);
      })
    );
  }, [planUrl, patientName]);

  const closeWaPanel = useCallback(() => {
    setWaPanelVisible(false);
    setTimeout(() => setWaPanelOpen(false), 230);
  }, []);

  const sendWhatsApp = useCallback(() => {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(waText)}`,
      '_blank',
      'noopener,noreferrer'
    );
    closeWaPanel();

    // Toast
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMount(true);
    requestAnimationFrame(() =>
      requestAnimationFrame(() => setToastVisible(true))
    );
    toastTimerRef.current = setTimeout(() => {
      setToastVisible(false);
      setTimeout(() => setToastMount(false), 250);
    }, 3000);
  }, [waText, closeWaPanel]);

  // ── Email modal ───────────────────────────────────────────────────────────

  function openModal() {
    setModalOpen(true);
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        setModalVisible(true);
        setTimeout(() => emailTextareaRef.current?.focus(), 60);
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

  // Cerrar modal con Escape + scroll lock
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

  // Cerrar panel WhatsApp con Escape
  useEffect(() => {
    if (!waPanelOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeWaPanel();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [waPanelOpen, closeWaPanel]);

  // Cerrar al recibir éxito en email
  useEffect(() => {
    if (state.ok) closeModal();
  }, [state.ok]);

  // Limpiar timers al desmontar
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  return (
    <>
      {/* ── Botones de acción ──────────────────────────────────────────────── */}
      <div className='flex flex-col items-end gap-2'>
        <div className='flex flex-wrap items-center justify-end gap-2'>
          {/* Copiar enlace */}
          <button
            type='button'
            onClick={handleCopy}
            title='Copiar enlace para el paciente'
            className='inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs font-medium text-zinc-300 transition-all duration-150 hover:border-zinc-600 hover:bg-zinc-700 active:scale-[0.97]'
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

          {/* Compartir por WhatsApp */}
          <button
            type='button'
            onClick={openWaPanel}
            title='Compartir plan por WhatsApp'
            className='inline-flex items-center gap-1.5 rounded-lg border border-[#25d366]/25 bg-[#25d366]/8 px-3 py-2 text-xs font-medium text-[#25d366] transition-all duration-150 hover:border-[#25d366]/50 hover:bg-[#25d366]/15 active:scale-[0.97]'
          >
            <IconWhatsApp className='h-3.5 w-3.5 flex-shrink-0' />
            WhatsApp
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
            Sin email — usa &quot;Copiar enlace&quot; o &quot;WhatsApp&quot; para compartir manualmente
          </p>
        )}

        {/* ── Panel WhatsApp (inline, expandible) ────────────────────────── */}
        {waPanelOpen && (
          <div
            className='w-full overflow-hidden'
            style={{
              display: 'grid',
              gridTemplateRows: waPanelVisible ? '1fr' : '0fr',
              transition: `grid-template-rows 260ms ${EASE_OUT_EXPO}`,
            }}
          >
            <div className='min-h-0'>
              <div
                className='mt-2 rounded-xl border border-[#25d366]/20 bg-zinc-900'
                style={{
                  opacity: waPanelVisible ? 1 : 0,
                  transform: waPanelVisible ? 'translateY(0)' : 'translateY(-6px)',
                  transition: `opacity 260ms ${EASE_OUT_EXPO}, transform 260ms ${EASE_OUT_EXPO}`,
                }}
              >
                {/* Cabecera del panel */}
                <div className='flex items-center justify-between border-b border-zinc-800 px-4 py-3'>
                  <div className='flex items-center gap-2'>
                    <IconWhatsApp className='h-3.5 w-3.5 text-[#25d366]' />
                    <span className='text-xs font-semibold text-zinc-300'>
                      Mensaje de WhatsApp
                    </span>
                  </div>
                  <button
                    type='button'
                    onClick={closeWaPanel}
                    className='rounded p-0.5 text-zinc-600 transition-colors hover:text-zinc-400'
                    aria-label='Cerrar'
                  >
                    <svg xmlns='http://www.w3.org/2000/svg' width='13' height='13' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
                      <line x1='18' y1='6' x2='6' y2='18' />
                      <line x1='6' y1='6' x2='18' y2='18' />
                    </svg>
                  </button>
                </div>

                {/* Textarea editable */}
                <div className='px-4 pb-3 pt-3'>
                  <p className='mb-2 text-[11px] text-zinc-600'>
                    Edita el mensaje antes de abrirlo en WhatsApp
                  </p>
                  <textarea
                    ref={waTextareaRef}
                    value={waText}
                    onChange={(e) => setWaText(e.target.value)}
                    rows={3}
                    className='w-full resize-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 transition-colors focus:border-[#25d366]/40 focus:outline-none focus:ring-1 focus:ring-[#25d366]/30'
                  />

                  {/* Acciones */}
                  <div className='mt-2.5 flex items-center justify-end gap-2'>
                    <button
                      type='button'
                      onClick={closeWaPanel}
                      className='rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200'
                    >
                      Cancelar
                    </button>
                    <button
                      type='button'
                      onClick={sendWhatsApp}
                      disabled={!waText.trim()}
                      className='inline-flex items-center gap-1.5 rounded-lg bg-[#25d366] px-3 py-1.5 text-xs font-semibold text-white transition-all duration-150 hover:bg-[#1fb956] disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.97]'
                    >
                      <IconWhatsApp className='h-3 w-3 flex-shrink-0' />
                      Abrir WhatsApp
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Toast WhatsApp ─────────────────────────────────────────────────── */}
      {toastMount && <WhatsAppToast visible={toastVisible} />}

      {/* ── Modal email ────────────────────────────────────────────────────── */}
      {modalOpen && (
        <div
          role='dialog'
          aria-modal='true'
          aria-labelledby='send-modal-title'
          className='fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4'
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
            className='relative w-full rounded-t-2xl border border-zinc-700/80 bg-zinc-900 shadow-2xl sm:max-w-md sm:rounded-2xl'
            style={{
              opacity: modalVisible ? 1 : 0,
              transform: modalVisible
                ? 'translateY(0) scale(1)'
                : 'translateY(20px) scale(0.97)',
              transition: `opacity 280ms ${EASE_OUT_EXPO}, transform 280ms ${EASE_OUT_EXPO}`,
            }}
          >
            {/* Tirador (móvil) */}
            <div className='flex justify-center pt-3 sm:hidden'>
              <div className='h-1 w-9 rounded-full bg-zinc-700' aria-hidden='true' />
            </div>

            {/* Cabecera */}
            <div className='flex items-start justify-between border-b border-zinc-800 px-5 pb-4 pt-4 sm:pt-5'>
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
                  {patientName
                    .split(' ')
                    .slice(0, 2)
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()}
                </div>
                <div className='min-w-0'>
                  <p className='truncate text-sm font-medium text-zinc-100'>
                    {patientName}
                  </p>
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
                  ref={emailTextareaRef}
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
