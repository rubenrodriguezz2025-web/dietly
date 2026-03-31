'use client';

import { useEffect, useState } from 'react';

interface Props {
  planId: string;
  nombreDN: string;
  clinicName?: string | null;
  primaryColor: string;
}

const PUNTOS = [
  { emoji: '📅', texto: 'Navega entre los días con las flechas o deslizando' },
  { emoji: '🛒', texto: 'Encuentra tu lista de la compra al final de la página' },
  { emoji: '💬', texto: 'Consulta cualquier duda directamente con tu nutricionista' },
];

export function BienvenidaPwa({ planId, nombreDN, clinicName, primaryColor }: Props) {
  const [visible, setVisible] = useState(false);
  const [saliendo, setSaliendo] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(`dietly_pwa_welcomed_${planId}`)) {
        setVisible(true);
      }
    } catch {
      // localStorage no disponible (modo privado / SSR)
    }
  }, [planId]);

  const cerrar = () => {
    setSaliendo(true);
    setTimeout(() => {
      try {
        localStorage.setItem(`dietly_pwa_welcomed_${planId}`, 'true');
      } catch { /* silencioso */ }
      setVisible(false);
    }, 280);
  };

  if (!visible) return null;

  const from = clinicName ?? nombreDN;

  return (
    <>
      {/* Backdrop */}
      <div
        className={saliendo ? 'pwa-bv-backdrop saliendo' : 'pwa-bv-backdrop'}
        onClick={cerrar}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 100,
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(3px)',
          WebkitBackdropFilter: 'blur(3px)',
        }}
      />

      {/* Bottom sheet */}
      <div
        className={saliendo ? 'pwa-bv-card saliendo' : 'pwa-bv-card'}
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 101,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 480,
            borderRadius: '24px 24px 0 0',
            overflow: 'hidden',
            background: 'var(--card)',
          }}
        >
          {/* Handle nativo */}
          <div style={{ padding: '12px 0 0', display: 'flex', justifyContent: 'center' }}>
            <div
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                background: 'var(--border)',
                opacity: 0.7,
              }}
            />
          </div>

          {/* Header con gradiente */}
          <div
            style={{
              background: `linear-gradient(150deg, color-mix(in srgb, ${primaryColor} 55%, #000) 0%, ${primaryColor} 100%)`,
              padding: '22px 28px 28px',
              marginTop: 12,
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
                color: 'rgba(255,255,255,0.6)',
                fontSize: 11,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                margin: '0 0 8px',
              }}
            >
              {from}
            </p>
            <h2
              style={{
                color: '#ffffff',
                fontSize: 20,
                fontWeight: 800,
                lineHeight: 1.25,
                margin: 0,
              }}
            >
              Tu plan nutricional personalizado está listo
            </h2>
          </div>

          {/* Cuerpo */}
          <div
            style={{
              padding: '24px 28px',
              paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)',
            }}
          >
            <ul
              style={{
                listStyle: 'none',
                margin: '0 0 24px',
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              {PUNTOS.map((punto) => (
                <li
                  key={punto.emoji}
                  style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}
                >
                  <span style={{ fontSize: 19, lineHeight: '1.4', flexShrink: 0 }}>
                    {punto.emoji}
                  </span>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 14,
                      lineHeight: 1.55,
                      color: 'var(--text)',
                      fontWeight: 500,
                    }}
                  >
                    {punto.texto}
                  </p>
                </li>
              ))}
            </ul>

            <button
              onClick={cerrar}
              style={{
                width: '100%',
                padding: '15px',
                borderRadius: 14,
                border: 'none',
                background: primaryColor,
                color: '#ffffff',
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
                letterSpacing: '0.01em',
              }}
            >
              Ver mi plan →
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
