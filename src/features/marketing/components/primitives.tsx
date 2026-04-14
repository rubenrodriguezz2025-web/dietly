// Primitivas reutilizables de la landing
import Link from 'next/link';
import type { ReactNode } from 'react';

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
      {children}
    </div>
  );
}

export function H2({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={`font-display text-4xl leading-tight text-white sm:text-5xl ${className}`}
    >
      {children}
    </h2>
  );
}

export function CtaButton({
  href,
  children,
  variant = 'primary',
}: {
  href: string;
  children: ReactNode;
  variant?: 'primary' | 'ghost';
}) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 font-semibold transition-colors';
  const styles =
    variant === 'primary'
      ? 'bg-[#1a7a45] text-white hover:bg-[#22c55e]'
      : 'border border-zinc-700 text-zinc-200 hover:border-zinc-500 hover:text-white';
  return (
    <Link href={href} className={`${base} ${styles}`}>
      {children}
    </Link>
  );
}
