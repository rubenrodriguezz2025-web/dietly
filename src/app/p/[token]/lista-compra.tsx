'use client';

import { useCallback, useEffect, useState } from 'react';

type Props = {
  shoppingList: Record<string, string[]>;
  categorias: Array<[string, string, string]>;
  planId: string;
};

export function ListaCompraInteractiva({ shoppingList, categorias, planId }: Props) {
  const storageKey = `dietly-compra-${planId}`;
  const [checked, setChecked] = useState<Record<string, boolean>>({});

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
    return acc + (raw?.length ?? 0);
  }, 0);

  const checkedCount = Object.values(checked).filter(Boolean).length;

  return (
    <section className='anim-compra mt-10'>
      <div className='mb-4 flex items-center gap-3'>
        <div className='h-px flex-1' style={{ background: 'var(--border)' }} />
        <h2
          className='text-xs font-bold uppercase tracking-widest'
          style={{ color: 'var(--text-muted)' }}
        >
          Lista de la compra
        </h2>
        <div className='h-px flex-1' style={{ background: 'var(--border)' }} />
      </div>

      {/* Barra de progreso */}
      {totalItems > 0 && checkedCount > 0 && (
        <div className='mb-3 flex items-center gap-2'>
          <div
            className='h-1.5 flex-1 overflow-hidden rounded-full'
            style={{ background: 'var(--chip-off)' }}
          >
            <div
              className='h-full rounded-full bg-emerald-500 transition-all duration-300'
              style={{ width: `${(checkedCount / totalItems) * 100}%` }}
            />
          </div>
          <span
            className='text-xs font-medium tabular-nums'
            style={{ color: 'var(--text-muted)' }}
          >
            {checkedCount}/{totalItems}
          </span>
        </div>
      )}

      <div
        className='overflow-hidden rounded-2xl shadow-sm'
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        {categorias.map(([clave, etiqueta, icono], idx) => {
          const items = shoppingList[clave]?.length ? shoppingList[clave] : null;
          if (!items?.length) return null;
          return (
            <div
              key={clave}
              style={idx > 0 ? { borderTop: '1px solid var(--border)' } : undefined}
            >
              <div className='flex items-center gap-2 px-4 py-3'>
                <span className='text-base'>{icono}</span>
                <span
                  className='text-xs font-bold uppercase tracking-wider'
                  style={{ color: 'var(--text-muted)' }}
                >
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
                          className='mt-[3px] flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded border transition-colors'
                          style={
                            isChecked
                              ? { borderColor: '#10b981', background: '#10b981' }
                              : { borderColor: 'var(--text-muted)', background: 'var(--card)', opacity: 0.6 }
                          }
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
                          className='text-sm leading-snug transition-colors'
                          style={{
                            color: isChecked ? 'var(--text-muted)' : 'var(--text)',
                            textDecoration: isChecked ? 'line-through' : 'none',
                            opacity: isChecked ? 0.6 : 1,
                          }}
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
