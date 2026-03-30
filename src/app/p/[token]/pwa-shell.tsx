'use client';

import { type CSSProperties, useEffect, useRef } from 'react';

type Props = {
  children: React.ReactNode;
  className?: string;
  style?: CSSProperties;
};

/**
 * Wrapper cliente que detecta prefers-color-scheme y aplica data-pwa-theme="dark|light".
 * Los hijos usan CSS variables (--bg, --card, --text, etc.) para adaptarse al tema.
 * Scoped solo a la PWA del paciente, sin afectar al dashboard.
 */
export function PwaShell({ children, className, style }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const apply = (dark: boolean) =>
      el.setAttribute('data-pwa-theme', dark ? 'dark' : 'light');

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    apply(mq.matches);

    const handler = (e: MediaQueryListEvent) => apply(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return (
    <div ref={ref} data-pwa-theme='light' className={className} style={style}>
      {children}
    </div>
  );
}
