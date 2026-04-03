'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';

import { approvePlan, sendPlanToPatient } from './actions';

// ── Constantes ────────────────────────────────────────────────────────────────

const EASE_OUT_EXPO = 'cubic-bezier(0.16, 1, 0.3, 1)';
const MAX_MSG_LENGTH = 500;

// ── Iconos ────────────────────────────────────────────────────────────────────

function IconDownload({ className }: { className?: string }) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' width='13' height='13' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true' className={className}>
      <path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' />
      <polyline points='7 10 12 15 17 10' />
      <line x1='12' y1='15' x2='12' y2='3' />
    </svg>
  );
}

function IconSend({ className }: { className?: string }) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' width='13' height='13' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true' className={className}>
      <line x1='22' y1='2' x2='11' y2='13' />
      <polygon points='22 2 15 22 11 13 2 9 22 2' />
    </svg>
  );
}

function IconCheck({ className }: { className?: string }) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' width='13' height='13' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true' className={className}>
      <polyline points='20 6 9 17 4 12' />
    </svg>
  );
}

function IconCopy({ className }: { className?: string }) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true' className={className}>
      <rect x='9' y='9' width='13' height='13' rx='2' ry='2' />
      <path d='M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1' />
    </svg>
  );
}

function IconClose({ className }: { className?: string }) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true' className={className}>
      <line x1='18' y1='6' x2='6' y2='18' />
      <line x1='6' y1='6' x2='18' y2='18' />
    </svg>
  );
}

function IconWhatsApp({ className }: { className?: string }) {
  return (
    <svg viewBox='0 0 24 24' fill='currentColor' aria-hidden='true' className={className}>
      <path d='M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z' />
    </svg>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────

type ToastConfig = { type: 'success' | 'error'; message: string };

function Toast({ visible, config }: { visible: boolean; config: ToastConfig }) {
  return (
    <div
      role='status'
      aria-live='polite'
      aria-atomic='true'
      className={[
        'pointer-events-none fixed bottom-5 right-5 z-[60] flex items-center gap-2 rounded-xl border px-4 py-3 text-[13px] font-medium shadow-xl shadow-black/50',
        config.type === 'success'
          ? 'border-[#1a7a45]/40 bg-zinc-950 text-emerald-400'
          : 'border-red-800/40 bg-zinc-950 text-red-400',
      ].join(' ')}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(10px) scale(0.96)',
        transition: `opacity 220ms ${EASE_OUT_EXPO}, transform 220ms ${EASE_OUT_EXPO}`,
      }}
    >
      {config.message}
    </div>
  );
}

// ── Spinner ───────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <span className='h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white' />
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  planId: string;
  status: string;
  patientToken: string;
  signedPlanUrl?: string;
  patientName: string;
  patientEmail: string;
  planTitle: string;
  hasEmail: boolean;
  hasCollegeNumber?: boolean;
  approvedDaysCount?: number;
  totalDaysCount?: number;
  sentAt?: string | null;
}

// ── PlanActionsBar ────────────────────────────────────────────────────────────

export function PlanActionsBar({
  planId,
  status,
  patientToken: _patientToken,
  signedPlanUrl,
  patientName,
  patientEmail,
  planTitle,
  hasEmail,
  hasCollegeNumber = true,
  approvedDaysCount = 0,
  totalDaysCount = 7,
  sentAt,
}: Props) {
  const router = useRouter();
  const isDraft = status === 'draft';
  const isSent = status === 'sent';
  // Auto-notificado al aprobar (sent_at set pero status todavía 'approved')
  const autoNotified = !!sentAt && status === 'approved';

  // ── Toast ─────────────────────────────────────────────────────────────────
  const [toastMount, setToastMount] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastConfig, setToastConfig] = useState<ToastConfig>({ type: 'success', message: '' });
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastConfig({ type, message });
    setToastMount(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setToastVisible(true)));
    toastTimerRef.current = setTimeout(() => {
      setToastVisible(false);
      setTimeout(() => setToastMount(false), 250);
    }, 3500);
  }, []);

  useEffect(() => () => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
  }, []);

  // ── Plan URL — firmada con HMAC-SHA256 (generada en el servidor) ──────────
  const planUrl = signedPlanUrl ?? '';

  // ── Copiar enlace ─────────────────────────────────────────────────────────
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    if (!planUrl) return;
    navigator.clipboard.writeText(planUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [planUrl]);

  // ── WhatsApp panel ────────────────────────────────────────────────────────
  const [waPanelOpen, setWaPanelOpen] = useState(false);
  const [waPanelVisible, setWaPanelVisible] = useState(false);
  const [waText, setWaText] = useState('');
  const waTextareaRef = useRef<HTMLTextAreaElement>(null);

  const openWaPanel = useCallback(() => {
    if (!planUrl) return;
    const firstName = patientName.split(' ')[0];
    setWaText(`Hola ${firstName}, aquí tienes tu plan nutricional personalizado: ${planUrl}`);
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
    window.open(`https://wa.me/?text=${encodeURIComponent(waText)}`, '_blank', 'noopener,noreferrer');
    closeWaPanel();
    showToast('success', 'WhatsApp abierto');
  }, [waText, closeWaPanel, showToast]);

  useEffect(() => {
    if (!waPanelOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeWaPanel(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [waPanelOpen, closeWaPanel]);

  // ── Email modal ───────────────────────────────────────────────────────────
  const [emailPending, startEmailTransition] = useTransition();
  const [emailState, setEmailState] = useState<{ error?: string; ok?: boolean }>({});
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailModalVisible, setEmailModalVisible] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const emailTextareaRef = useRef<HTMLTextAreaElement>(null);

  const openEmailModal = useCallback(() => {
    setEmailModalOpen(true);
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        setEmailModalVisible(true);
        setTimeout(() => emailTextareaRef.current?.focus(), 60);
      })
    );
  }, []);

  const closeEmailModal = useCallback(() => {
    setEmailModalVisible(false);
    setTimeout(() => { setEmailModalOpen(false); setMensaje(''); }, 230);
  }, []);

  useEffect(() => {
    if (!emailModalOpen) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeEmailModal(); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey); };
  }, [emailModalOpen, closeEmailModal]);

  const handleEmailSubmit = useCallback(() => {
    const mensaje = emailTextareaRef.current?.value ?? '';
    startEmailTransition(async () => {
      const fd = new FormData();
      fd.append('personal_message', mensaje);
      const result = await sendPlanToPatient(planId, {}, fd);
      setEmailState(result);
      if (result.ok) {
        closeEmailModal();
        showToast('success', '✓ Email enviado correctamente');
      } else if (result.error) {
        showToast('error', result.error);
      }
    });
  }, [planId, closeEmailModal, showToast, startEmailTransition]);

  // ── Approve modal ─────────────────────────────────────────────────────────
  const [approvePending, startApproveTransition] = useTransition();
  const [approveError, setApproveError] = useState<string | null>(null);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approveModalVisible, setApproveModalVisible] = useState(false);
  const [approveChecked, setApproveChecked] = useState(false);

  const openApproveModal = useCallback(() => {
    setApproveModalOpen(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setApproveModalVisible(true)));
  }, []);

  const closeApproveModal = useCallback(() => {
    if (approvePending) return;
    setApproveModalVisible(false);
    setTimeout(() => { setApproveModalOpen(false); setApproveChecked(false); }, 230);
  }, [approvePending]);

  useEffect(() => {
    if (!approveModalOpen) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeApproveModal(); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey); };
  }, [approveModalOpen, closeApproveModal]);

  const handleApproveSubmit = useCallback(() => {
    setApproveError(null);
    startApproveTransition(async () => {
      const result = await approvePlan(planId);
      if (result.ok) {
        closeApproveModal();
        showToast('success', '✓ Plan aprobado correctamente');
        router.refresh();
      } else {
        setApproveError(result.error ?? 'Error desconocido.');
        showToast('error', result.error ?? 'Error al aprobar el plan.');
      }
    });
  }, [planId, closeApproveModal, showToast, router, startApproveTransition]);

  const pdfHref = `/api/plans/${planId}/pdf`;
  const patientInitials = patientName.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();

  return (
    <>
      {/* ── Botones de acción ─────────────────────────────────────────────── */}
      <div className='flex flex-col items-end gap-2'>
        <div className='flex flex-wrap items-center justify-end gap-2'>

          {/* PDF — solo visible cuando el plan está aprobado o enviado */}
          {!isDraft && (
            <a
              href={pdfHref}
              download
              className='inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs font-medium text-zinc-300 transition-all duration-150 hover:border-zinc-600 hover:bg-zinc-700 active:scale-[0.97]'
            >
              <IconDownload />
              PDF
            </a>
          )}

          {/* Copiar enlace — aprobado y enviado */}
          {!isDraft && (
            <button
              type='button'
              onClick={handleCopy}
              title='Copiar enlace para el paciente'
              className='inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs font-medium text-zinc-300 transition-all duration-150 hover:border-zinc-600 hover:bg-zinc-700 active:scale-[0.97]'
            >
              {copied ? (
                <>
                  <IconCheck />
                  Copiado
                </>
              ) : (
                <>
                  <IconCopy />
                  Copiar enlace
                </>
              )}
            </button>
          )}

          {/* WhatsApp — aprobado y enviado */}
          {!isDraft && (
            <button
              type='button'
              onClick={openWaPanel}
              title='Compartir plan por WhatsApp'
              className='inline-flex items-center gap-1.5 rounded-lg border border-[#25d366]/25 bg-[#25d366]/8 px-3 py-2 text-xs font-medium text-[#25d366] transition-all duration-150 hover:border-[#25d366]/50 hover:bg-[#25d366]/15 active:scale-[0.97]'
            >
              <IconWhatsApp className='h-3.5 w-3.5 flex-shrink-0' />
              WhatsApp
            </button>
          )}

          {/* Botón primario: Aprobar (borrador) */}
          {isDraft && !hasCollegeNumber && (
            <span className='inline-flex items-center gap-1.5 rounded-lg border border-amber-800/40 bg-amber-950/30 px-3 py-2 text-xs text-amber-400'>
              <span>Añade tu nº colegiado en</span>
              <a href='/dashboard/ajustes' className='font-medium underline underline-offset-2 hover:text-amber-300'>Ajustes</a>
              <span>para aprobar</span>
            </span>
          )}
          {isDraft && hasCollegeNumber && (
            <button
              type='button'
              onClick={openApproveModal}
              className='inline-flex items-center gap-2 rounded-lg bg-[#1a7a45] px-4 py-2 text-sm font-semibold text-white transition-all duration-150 hover:bg-[#155f38] active:scale-[0.97]'
            >
              <IconCheck />
              Aprobar plan
            </button>
          )}

          {/* Botón primario: Enviar / Reenviar (aprobado / enviado) */}
          {!isDraft && (
            hasEmail ? (
              <button
                type='button'
                onClick={openEmailModal}
                className='inline-flex items-center gap-2 rounded-lg bg-[#1a7a45] px-4 py-2 text-sm font-semibold text-white transition-all duration-150 hover:bg-[#155f38] active:scale-[0.97]'
              >
                <IconSend />
                {isSent || autoNotified ? 'Reenviar por email (con PDF)' : 'Enviar al paciente'}
              </button>
            ) : (
              <button
                disabled
                title='El paciente no tiene email. Añádelo en su ficha.'
                className='inline-flex cursor-not-allowed items-center gap-2 rounded-lg bg-[#1a7a45] px-4 py-2 text-sm font-semibold text-white opacity-40'
              >
                {isSent || autoNotified ? 'Reenviar por email (con PDF)' : 'Enviar al paciente'}
              </button>
            )
          )}
        </div>

        {/* Mensajes de estado */}
        {emailState.error && (
          <p className='max-w-xs text-right text-xs text-red-400'>{emailState.error}</p>
        )}
        {emailState.ok && (
          <p className='text-xs text-emerald-500'>✓ Email enviado correctamente</p>
        )}

        {!hasEmail && !isDraft && (
          <p className='text-xs text-zinc-600'>
            Sin email — usa &quot;Copiar enlace&quot; o &quot;WhatsApp&quot;
          </p>
        )}

        {/* ── Panel WhatsApp (inline expandible) ──────────────────────────── */}
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
                <div className='flex items-center justify-between border-b border-zinc-800 px-4 py-3'>
                  <div className='flex items-center gap-2'>
                    <IconWhatsApp className='h-3.5 w-3.5 text-[#25d366]' />
                    <span className='text-xs font-semibold text-zinc-300'>Mensaje de WhatsApp</span>
                  </div>
                  <button
                    type='button'
                    onClick={closeWaPanel}
                    className='rounded p-0.5 text-zinc-600 transition-colors hover:text-zinc-400'
                    aria-label='Cerrar'
                  >
                    <IconClose />
                  </button>
                </div>
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

      {/* ── Modal de aprobación ───────────────────────────────────────────── */}
      {approveModalOpen && createPortal(
        <div
          className='fixed inset-0 z-50 flex items-center justify-center p-4'
          style={{
            opacity: approveModalVisible ? 1 : 0,
            transition: `opacity 230ms ${EASE_OUT_EXPO}`,
          }}
        >
          {/* Backdrop */}
          <div
            className='absolute inset-0 bg-black/75 backdrop-blur-[2px]'
            aria-hidden='true'
            onClick={closeApproveModal}
          />

          {/* Tarjeta */}
          <div
            className='relative mx-4 w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl shadow-black/60'
            style={{
              transform: approveModalVisible ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(12px)',
              transition: `transform 280ms ${EASE_OUT_EXPO}`,
            }}
          >
            {/* Icono */}
            <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#1a7a45]/15'>
              <svg viewBox='0 0 24 24' fill='none' stroke='#22c55e' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='h-6 w-6'>
                <path d='M9 12l2 2 4-4' />
                <path d='M12 2a10 10 0 110 20A10 10 0 0112 2z' />
              </svg>
            </div>

            <h2 className='mb-1 text-lg font-semibold text-zinc-100'>Aprobar plan nutricional</h2>
            <p className='mb-5 text-sm text-zinc-500'>
              Una vez aprobado, el plan quedará registrado con tu firma profesional y podrás enviarlo al paciente.
            </p>

            {/* Progreso de revisión por día */}
            {totalDaysCount > 0 && approvedDaysCount < totalDaysCount && (
              <div className='mb-4 rounded-xl border border-amber-900/40 bg-amber-950/20 px-4 py-3'>
                <div className='mb-2 flex items-center justify-between text-xs'>
                  <span className='font-medium text-amber-400'>Revisión día a día</span>
                  <span className='tabular-nums text-zinc-500'>
                    {approvedDaysCount}/{totalDaysCount} días marcados
                  </span>
                </div>
                <div className='h-1 overflow-hidden rounded-full bg-zinc-800'>
                  <div
                    className='h-full rounded-full bg-amber-500 transition-all duration-300'
                    style={{ width: `${(approvedDaysCount / totalDaysCount) * 100}%` }}
                  />
                </div>
                <p className='mt-2 text-xs text-zinc-600'>
                  Puedes marcar cada día como revisado individualmente antes de aprobar el plan completo.
                </p>
              </div>
            )}
            {totalDaysCount > 0 && approvedDaysCount === totalDaysCount && (
              <div className='mb-4 flex items-center gap-2 rounded-xl border border-[#1a7a45]/30 bg-[#1a7a45]/10 px-4 py-3'>
                <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='#22c55e' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
                  <polyline points='20 6 9 17 4 12' />
                </svg>
                <span className='text-xs font-medium text-emerald-400'>Todos los días revisados día a día</span>
              </div>
            )}

            {/* Checkbox de responsabilidad profesional */}
            <label className='flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4 transition-colors hover:border-zinc-700'>
              <input
                type='checkbox'
                checked={approveChecked}
                onChange={(e) => setApproveChecked(e.target.checked)}
                className='mt-0.5 h-4 w-4 flex-shrink-0 cursor-pointer accent-[#1a7a45]'
              />
              <span className='text-sm leading-relaxed text-zinc-300'>
                He revisado este plan nutricional en su totalidad y lo apruebo bajo{' '}
                <strong className='text-zinc-100'>mi criterio clínico profesional</strong>.
                Asumo la responsabilidad de su contenido como nutricionista titulado.
              </span>
            </label>

            {approveError && (
              <p className='mt-3 text-sm text-red-400'>{approveError}</p>
            )}

            <div className='mt-5 flex justify-end gap-3'>
              <button
                type='button'
                onClick={closeApproveModal}
                disabled={approvePending}
                className='rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200 disabled:opacity-40'
              >
                Cancelar
              </button>
              <button
                type='button'
                onClick={handleApproveSubmit}
                disabled={!approveChecked || approvePending}
                className='inline-flex items-center gap-2 rounded-lg bg-[#1a7a45] px-5 py-2 text-sm font-semibold text-white transition-all duration-150 hover:bg-[#155f38] disabled:cursor-not-allowed disabled:opacity-40 active:scale-[0.97]'
              >
                {approvePending ? (
                  <>
                    <Spinner />
                    Aprobando…
                  </>
                ) : (
                  'Confirmar aprobación'
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Modal de envío por email ──────────────────────────────────────── */}
      {emailModalOpen && createPortal(
        <div
          className='fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4'
          role='dialog'
          aria-modal='true'
          aria-labelledby='send-modal-title'
        >
          {/* Backdrop */}
          <div
            className='absolute inset-0 bg-black/70 backdrop-blur-[2px]'
            aria-hidden='true'
            style={{ opacity: emailModalVisible ? 1 : 0, transition: `opacity 230ms ${EASE_OUT_EXPO}` }}
            onClick={closeEmailModal}
          />

          {/* Tarjeta */}
          <div
            className='relative w-full rounded-t-2xl border border-zinc-700/80 bg-zinc-900 shadow-2xl sm:max-w-md sm:rounded-2xl'
            style={{
              opacity: emailModalVisible ? 1 : 0,
              transform: emailModalVisible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.97)',
              transition: `opacity 280ms ${EASE_OUT_EXPO}, transform 280ms ${EASE_OUT_EXPO}`,
            }}
          >
            {/* Tirador móvil */}
            <div className='flex justify-center pt-3 sm:hidden' aria-hidden='true'>
              <div className='h-1 w-9 rounded-full bg-zinc-700' />
            </div>

            {/* Cabecera */}
            <div className='flex items-start justify-between border-b border-zinc-800 px-5 pb-4 pt-4 sm:pt-5'>
              <div>
                <h2 id='send-modal-title' className='text-sm font-semibold text-zinc-100'>
                  Confirmar envío del plan
                </h2>
                <p className='mt-0.5 text-xs text-zinc-500'>{planTitle}</p>
              </div>
              <button
                type='button'
                onClick={closeEmailModal}
                className='ml-4 flex-shrink-0 rounded-md p-1 text-zinc-600 transition-colors hover:text-zinc-300'
                aria-label='Cerrar modal'
              >
                <IconClose className='h-4 w-4' />
              </button>
            </div>

            {/* Cuerpo */}
            <div className='px-5 py-5'>
              {/* Destinatario */}
              <div className='mb-4 flex items-center gap-3 rounded-xl bg-zinc-800/60 px-4 py-3'>
                <div className='flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-zinc-700 text-xs font-semibold text-zinc-300'>
                  {patientInitials}
                </div>
                <div className='min-w-0'>
                  <p className='truncate text-sm font-medium text-zinc-100'>{patientName}</p>
                  <p className='truncate text-xs text-zinc-500'>{patientEmail}</p>
                </div>
              </div>

              {/* Mensaje personal */}
              <label className='block'>
                <span className='mb-1.5 block text-xs font-medium text-zinc-400'>
                  Mensaje personal{' '}
                  <span className='font-normal text-zinc-600'>(opcional)</span>
                </span>
                <textarea
                  ref={emailTextareaRef}
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)}
                  maxLength={MAX_MSG_LENGTH}
                  rows={3}
                  placeholder={`Hola ${patientName.split(' ')[0]}, aquí tienes tu plan personalizado…`}
                  className='w-full resize-none rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 transition-colors focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500'
                />
                <div className='mt-1 flex justify-end'>
                  <span
                    className={[
                      'text-[11px] tabular-nums transition-colors duration-150',
                      mensaje.length >= MAX_MSG_LENGTH
                        ? 'text-red-400'
                        : mensaje.length > MAX_MSG_LENGTH * 0.9
                          ? 'text-amber-400'
                          : 'text-zinc-700',
                    ].join(' ')}
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
                onClick={closeEmailModal}
                disabled={emailPending}
                className='rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200 disabled:opacity-40'
              >
                Cancelar
              </button>
              <button
                type='button'
                onClick={handleEmailSubmit}
                disabled={emailPending}
                className='inline-flex items-center gap-2 rounded-lg bg-[#1a7a45] px-5 py-2 text-sm font-semibold text-white transition-all duration-150 hover:bg-[#155f38] disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.97]'
              >
                {emailPending ? (
                  <>
                    <Spinner />
                    Enviando…
                  </>
                ) : (
                  <>
                    <IconSend />
                    Confirmar envío
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Toast ─────────────────────────────────────────────────────────── */}
      {toastMount && createPortal(<Toast visible={toastVisible} config={toastConfig} />, document.body)}
    </>
  );
}
