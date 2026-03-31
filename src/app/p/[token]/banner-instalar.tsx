'use client';

import { useEffect, useState } from 'react';

interface Props {
  planId: string;
}

type Dispositivo = 'ios' | 'android' | 'otro';

const INSTRUCCIONES: Record<Dispositivo, string> = {
  ios: 'Pulsa el botón compartir ↑ en Safari y selecciona "Añadir a pantalla de inicio"',
  android: 'Pulsa el menú ⋮ en Chrome y selecciona "Añadir a pantalla de inicio"',
  otro: 'Desde el menú del navegador, busca la opción "Añadir a pantalla de inicio" o "Instalar"',
};

function detectarDispositivo(): Dispositivo {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'otro';
}

export function BannerInstalar({ planId }: Props) {
  const [visible, setVisible] = useState(false);
  const [saliendo, setSaliendo] = useState(false);
  const [expandido, setExpandido] = useState(false);
  const [dispositivo, setDispositivo] = useState<Dispositivo>('otro');

  useEffect(() => {
    // No mostrar si ya es PWA instalada
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    try {
      // Solo mostrar en visitas de vuelta (la bienvenida ya fue vista)
      if (!localStorage.getItem(`dietly_pwa_welcomed_${planId}`)) return;
      if (localStorage.getItem('dietly_pwa_install_prompted')) return;
    } catch {
      return;
    }

    setDispositivo(detectarDispositivo());
    const timer = setTimeout(() => setVisible(true), 3000);
    return () => clearTimeout(timer);
  }, [planId]);

  const cerrar = () => {
    setSaliendo(true);
    setTimeout(() => {
      try {
        localStorage.setItem('dietly_pwa_install_prompted', 'true');
      } catch { /* silencioso */ }
      setVisible(false);
    }, 280);
  };

  if (!visible) return null;

  return (
    <div
      className={saliendo ? 'pwa-banner saliendo' : 'pwa-banner'}
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        padding: '12px 16px',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)',
      }}
    >
      <div
        style={{
          maxWidth: 480,
          margin: '0 auto',
          borderRadius: 16,
          overflow: 'hidden',
          background: 'var(--card)',
          border: '1px solid var(--border)',
          boxShadow: '0 -2px 20px rgba(0,0,0,0.12)',
        }}
      >
        {/* Fila principal */}
        <div
          style={{
            padding: '14px 14px 14px 14px',
            display: 'flex',
            gap: 12,
            alignItems: 'flex-start',
          }}
        >
          {/* Icono smartphone */}
          <div
            style={{
              flexShrink: 0,
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'var(--chip-off)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg
              width='18'
              height='18'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              style={{ color: 'var(--text-muted)' }}
            >
              <rect x='5' y='2' width='14' height='20' rx='2' />
              <path d='M12 18h.01' />
            </svg>
          </div>

          <p
            style={{
              flex: 1,
              margin: 0,
              fontSize: 13,
              lineHeight: 1.45,
              color: 'var(--text)',
              fontWeight: 500,
            }}
          >
            Añade esta página a tu pantalla de inicio para acceder a tu plan fácilmente cada día
          </p>

          <button
            onClick={cerrar}
            aria-label='Cerrar'
            style={{
              flexShrink: 0,
              background: 'none',
              border: 'none',
              padding: '2px',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              lineHeight: 1,
            }}
          >
            <svg
              width='16'
              height='16'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2.5'
            >
              <path d='M18 6L6 18M6 6l12 12' />
            </svg>
          </button>
        </div>

        {/* Botón "Cómo hacerlo" + instrucciones expandibles */}
        <div style={{ padding: '0 14px 14px' }}>
          <button
            onClick={() => setExpandido((v) => !v)}
            style={{
              background: 'var(--chip-off)',
              border: 'none',
              borderRadius: 8,
              padding: '7px 12px',
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            Cómo hacerlo
            <svg
              width='11'
              height='11'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2.5'
              style={{
                transform: expandido ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease',
              }}
            >
              <path d='M6 9l6 6 6-6' />
            </svg>
          </button>

          {/* Expansión con grid-template-rows para animación fluida */}
          <div
            className={expandido ? 'pwa-instruc-wrap open' : 'pwa-instruc-wrap'}
            style={{ marginTop: expandido ? 10 : 0 }}
          >
            <div className='pwa-instruc-inner'>
              <p
                style={{
                  margin: 0,
                  padding: '12px 14px',
                  borderRadius: 10,
                  background: 'var(--card2)',
                  border: '1px solid var(--border)',
                  fontSize: 13,
                  lineHeight: 1.5,
                  color: 'var(--text)',
                }}
              >
                {INSTRUCCIONES[dispositivo]}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
