'use client';

import { useState } from 'react';

export function CopyButton({ text }: { text: string }) {
  const [copiado, setCopiado] = useState(false);

  async function handleClick() {
    try {
      await navigator.clipboard.writeText(text);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Fallback para contextos sin permisos de portapapeles
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    }
  }

  return (
    <button
      onClick={handleClick}
      className={`flex-shrink-0 rounded-md border px-3 py-1.5 text-xs transition-colors ${
        copiado
          ? 'border-emerald-700 text-emerald-400'
          : 'border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
      }`}
    >
      {copiado ? '✓ Copiado' : 'Copiar'}
    </button>
  );
}
