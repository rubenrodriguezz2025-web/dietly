'use client';

import { useEffect, useState, useTransition } from 'react';

import { aceptarConsentimientoPlan } from './actions';

// Versión del texto de consentimiento — actualizar al cambiar el copy legal
export const PLAN_VIEW_CONSENT_VERSION = 'plan-view-v1-2026-03';

interface Props {
  planId: string;
  patientId: string;
  nutritionistId: string;
  primaryColor: string;
  nombreDN: string;
}

type Estado = 'pendiente' | 'rechazado';

const PUNTOS = [
  {
    icon: '🩺',
    getText: (nombre: string) =>
      `Este plan fue elaborado y aprobado por ${nombre}, que lo ha revisado profesionalmente.`,
  },
  {
    icon: '🔒',
    getText: () =>
      'Tus datos de salud son tratados de forma confidencial conforme al RGPD Art. 9.',
  },
  {
    icon: '📊',
    getText: () =>
      'Los valores nutricionales son estimaciones de referencia. Consulta cualquier duda directamente con tu nutricionista.',
  },
];

export function ConsentimientoView({
  planId,
  patientId,
  nutritionistId,
  primaryColor,
  nombreDN,
}: Props) {
  // Empieza visible para bloquear el plan — se oculta si ya hay consentimiento en localStorage
  const [visible, setVisible] = useState(true);
  const [saliendo, setSaliendo] = useState(false);
  const [estado, setEstado] = useState<Estado>('pendiente');
  const [checked, setChecked] = useState(false);
  const [isPending, startTransition] = useTransition();

  const storageKey = `dietly_consent_${planId}`;

  useEffect(() => {
    try {
      if (localStorage.getItem(storageKey)) {
        // Ya aceptó — ocultar sin animación (visita de vuelta)
        setVisible(false);
      }
    } catch {
      // localStorage no disponible (modo privado o SSR)
    }
  }, [storageKey]);

  const aceptar = () => {
    if (!checked || isPending) return;
    startTransition(async () => {
      try {
        await aceptarConsentimientoPlan(
          patientId,
          nutritionistId,
          planId,
          PLAN_VIEW_CONSENT_VERSION
        );
      } catch {
        // Silencioso — el plan se muestra igualmente (localStorage como fallback)
      }
      try {
        localStorage.setItem(storageKey, new Date().toISOString());
      } catch {
        // Silencioso
      }
      setSaliendo(true);
      setTimeout(() => setVisible(false), 310);
    });
  };

  if (!visible) return null;

  // ── Pantalla de rechazo ──────────────────────────────────────────────────────
  if (estado === 'rechazado') {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 200,
          background: 'var(--bg)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px 28px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 18,
            background: 'var(--chip-off)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
          }}
        >
          <svg
            width='28'
            height='28'
            viewBox='0 0 24 24'
            fill='none'
            stroke='var(--text-muted)'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          >
            <rect x='3' y='11' width='18' height='11' rx='2' ry='2' />
            <path d='M7 11V7a5 5 0 0 1 10 0v4' />
          </svg>
        </div>

        <h2
          style={{
            color: 'var(--text)',
            fontSize: 19,
            fontWeight: 700,
            margin: '0 0 12px',
            lineHeight: 1.3,
          }}
        >
          No podemos mostrar tu plan
        </h2>

        <p
          style={{
            color: 'var(--text-muted)',
            fontSize: 14,
            lineHeight: 1.65,
            margin: '0 0 28px',
            maxWidth: 300,
          }}
        >
          Para acceder a tu plan nutricional es necesario aceptar el tratamiento de tus datos de
          salud. Contacta con tu nutricionista si tienes cualquier duda.
        </p>

        <button
          onClick={() => setEstado('pendiente')}
          style={{
            padding: '12px 28px',
            borderRadius: 12,
            border: `1.5px solid ${primaryColor}`,
            background: 'transparent',
            color: primaryColor,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          ← Volver
        </button>
      </div>
    );
  }

  // ── Pantalla de consentimiento ───────────────────────────────────────────────
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-end',
      }}
    >
      {/* Zona superior — indicador visual */}
      <div
        style={{
          flex: 1,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 14,
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 18,
            background: `color-mix(in srgb, ${primaryColor} 12%, transparent)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg
            width='30'
            height='30'
            viewBox='0 0 24 24'
            fill='none'
            stroke={primaryColor}
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          >
            <path d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' />
          </svg>
        </div>
        <p
          style={{
            color: 'var(--text-muted)',
            fontSize: 13,
            margin: 0,
            fontWeight: 500,
          }}
        >
          Un momento — confirmación requerida
        </p>
      </div>

      {/* Bottom sheet */}
      <div
        className={saliendo ? 'pwa-bv-card saliendo' : 'pwa-bv-card'}
        style={{
          width: '100%',
          maxWidth: 480,
          margin: '0 auto',
          borderRadius: '24px 24px 0 0',
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderBottom: 'none',
          overflow: 'hidden',
        }}
      >
        {/* Header con color de marca */}
        <div
          style={{
            background: `linear-gradient(150deg, color-mix(in srgb, ${primaryColor} 60%, #000) 0%, ${primaryColor} 100%)`,
            padding: '22px 28px 26px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Decoración geométrica */}
          <div
            style={{
              position: 'absolute',
              top: -24,
              right: -24,
              width: 110,
              height: 110,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.05)',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: 44,
              right: 55,
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.06)',
              pointerEvents: 'none',
            }}
          />
          <p
            style={{
              color: 'rgba(255,255,255,0.65)',
              fontSize: 11,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              margin: '0 0 8px',
            }}
          >
            {nombreDN}
          </p>
          <h2
            style={{
              color: '#fff',
              fontSize: 18,
              fontWeight: 800,
              lineHeight: 1.3,
              margin: 0,
            }}
          >
            Antes de ver tu plan nutricional
          </h2>
        </div>

        {/* Cuerpo */}
        <div
          style={{
            padding: '20px 28px',
            paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)',
          }}
        >
          {/* Puntos informativos */}
          <ul
            style={{
              listStyle: 'none',
              margin: '0 0 18px',
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            {PUNTOS.map((punto) => (
              <li key={punto.icon} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 16, lineHeight: '1.5', flexShrink: 0 }}>{punto.icon}</span>
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    lineHeight: 1.55,
                    color: 'var(--text-muted)',
                  }}
                >
                  {punto.getText(nombreDN)}
                </p>
              </li>
            ))}
          </ul>

          {/* Checkbox — NO pre-marcado (RGPD exige consentimiento activo) */}
          <label
            style={{
              display: 'flex',
              gap: 12,
              alignItems: 'flex-start',
              padding: '13px 15px',
              borderRadius: 12,
              background: checked
                ? `color-mix(in srgb, ${primaryColor} 8%, transparent)`
                : 'var(--card2)',
              border: `1.5px solid ${checked ? primaryColor : 'var(--border)'}`,
              cursor: 'pointer',
              marginBottom: 14,
              transition: 'background 0.15s ease, border-color 0.15s ease',
            }}
          >
            <input
              type='checkbox'
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              aria-label='Consentimiento RGPD Art. 9'
              style={{
                marginTop: 2,
                width: 18,
                height: 18,
                accentColor: primaryColor,
                flexShrink: 0,
                cursor: 'pointer',
              }}
            />
            <span
              style={{
                fontSize: 13,
                lineHeight: 1.55,
                color: 'var(--text)',
                fontWeight: 500,
              }}
            >
              He leído la información y consiento el tratamiento de mis datos de salud para ver mi
              plan nutricional personalizado{' '}
              <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(RGPD Art. 9)</span>.
            </span>
          </label>

          {/* Botón principal */}
          <button
            onClick={aceptar}
            disabled={!checked || isPending}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: 14,
              border: 'none',
              background: checked ? primaryColor : 'var(--chip-off)',
              color: checked ? '#fff' : 'var(--text-muted)',
              fontSize: 15,
              fontWeight: 700,
              cursor: checked && !isPending ? 'pointer' : 'not-allowed',
              letterSpacing: '0.01em',
              transition: 'background 0.15s ease, color 0.15s ease',
              marginBottom: 10,
              fontFamily: 'inherit',
            }}
          >
            {isPending ? 'Guardando…' : 'Ver mi plan →'}
          </button>

          {/* Enlace de rechazo */}
          <button
            onClick={() => setEstado('rechazado')}
            style={{
              width: '100%',
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: 12,
              cursor: 'pointer',
              padding: '6px 0',
              fontFamily: 'inherit',
            }}
          >
            No acepto
          </button>
        </div>
      </div>
    </div>
  );
}
