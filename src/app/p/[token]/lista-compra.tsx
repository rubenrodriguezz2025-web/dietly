'use client';

import { useCallback, useEffect, useState } from 'react';

type Props = {
  shoppingList: Record<string, string[]>;
  categorias: Array<[string, string, string]>;
  planId: string;
  aggregateFn: (items: string[]) => string[];
};

export function ListaCompraInteractiva({ shoppingList, categorias, planId, aggregateFn }: Props) {
  const storageKey = `dietly-compra-${planId}`;

  const [checked, setChecked] = useState<Record<string, boolean>>({});

  // Cargar estado del localStorage al montar
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) setChecked(JSON.parse(saved));
    } catch {
      // localStorage no disponible
    }
  }, [storageKey]);

  const toggle = useCallback(
    (itemKey: string) => {
      setChecked((prev) => {
        const next = { ...prev, [itemKey]: !prev[itemKey] };
        try {
          localStorage.setItem(storageKey, JSON.stringify(next));
        } catch {
          // localStorage lleno o no disponible
        }
        return next;
      });
    },
    [storageKey]
  );

  const totalItems = categorias.reduce((acc, [clave]) => {
    const raw = shoppingList[clave];
    return acc + (raw?.length ? aggregateFn(raw).length : 0);
  }, 0);

  const checkedCount = Object.values(checked).filter(Boolean).length;

  return (
    <section className='anim-compra mt-10'>
      <div className='mb-4 flex items-center gap-3'>
        <div className='h-px flex-1 bg-zinc-200' />
        <h2 className='text-xs font-bold uppercase tracking-widest text-zinc-400'>
          Lista de la compra
        </h2>
        <div className='h-px flex-1 bg-zinc-200' />
      </div>

      {/* Progreso */}
      {totalItems > 0 && checkedCount > 0 && (
        <div className='mb-3 flex items-center gap-2'>
          <div className='h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-100'>
            <div
              className='h-full rounded-full bg-emerald-500 transition-all duration-300'
              style={{ width: `${(checkedCount / totalItems) * 100}%` }}
            />
          </div>
          <span className='text-xs font-medium tabular-nums text-zinc-400'>
            {checkedCount}/{totalItems}
          </span>
        </div>
      )}

      <div className='overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm'>
        {categorias.map(([clave, etiqueta, icono], idx) => {
          const rawItems = shoppingList[clave];
          const items = rawItems?.length ? aggregateFn(rawItems) : null;
          if (!items?.length) return null;
          return (
            <div
              key={clave}
              className={idx > 0 ? 'border-t border-zinc-100' : ''}
            >
              <div className='flex items-center gap-2 px-4 py-3'>
                <span className='text-base'>{icono}</span>
                <span className='text-xs font-bold uppercase tracking-wider text-zinc-500'>
                  {etiqueta}
                </span>
              </div>
              <ul className='px-4 pb-3 pt-0'>
                {items.map((item, i) => {
                  const key = `${clave}-${i}`;
                  const isChecked = !!checked[key];
                  return (
                    <li key={i} className='py-1'>
                      <button
                        type='button'
                        onClick={() => toggle(key)}
                        className='flex w-full items-start gap-2.5 text-left'
                      >
                        <span
                          className={`mt-[3px] flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded border transition-colors ${
                            isChecked
                              ? 'border-emerald-500 bg-emerald-500'
                              : 'border-zinc-300 bg-white'
                          }`}
                        >
                          {isChecked && (
                            <svg
                              width='11'
                              height='11'
                              viewBox='0 0 24 24'
                              fill='none'
                              stroke='white'
                              strokeWidth='3'
                              strokeLinecap='round'
                              strokeLinejoin='round'
                            >
                              <polyline points='20 6 9 17 4 12' />
                            </svg>
                          )}
                        </span>
                        <span
                          className={`text-sm leading-snug transition-colors ${
                            isChecked
                              ? 'text-zinc-400 line-through'
                              : 'text-zinc-700'
                          }`}
                        >
                          {item}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
