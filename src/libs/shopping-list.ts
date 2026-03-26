/**
 * Agrega los ítems de la lista de la compra sumando cantidades cuando el mismo
 * ingrediente aparece varias veces (ej: "Pechuga de pollo 600g" + "Pechuga de
 * pollo 200g" → "Pechuga de pollo 800g").
 *
 * Unidades soportadas: g, kg, ml, l, unidades/ud/u, x (formato "Aguacate x4").
 * Los ítems sin cantidad parseada se deduplicarán por nombre normalizado.
 */

type Parsed = {
  name: string;     // nombre normalizado (lowercase, sin espacios extra)
  display: string;  // nombre como viene del modelo (para mantener capitalización)
  qty: number | null;
  unit: string | null;
};

// Patrones al final del string, p.ej: "600g", "1.5kg", "200ml", "0.5l", "x4", "4 unidades"
const QTY_PATTERNS: Array<{ re: RegExp; unit: string }> = [
  { re: /\s+x\s*(\d+(?:[.,]\d+)?)\s*$/i,              unit: 'ud' },
  { re: /\s+(\d+(?:[.,]\d+)?)\s*x\s*$/i,              unit: 'ud' },
  { re: /\s+(\d+(?:[.,]\d+)?)\s*(?:unidades?|ud\.?|u\.?)\s*$/i, unit: 'ud' },
  { re: /\s+(\d+(?:[.,]\d+)?)\s*kg\s*$/i,             unit: 'g'  },  // normalizar a g
  { re: /\s+(\d+(?:[.,]\d+)?)\s*g\s*$/i,              unit: 'g'  },
  { re: /\s+(\d+(?:[.,]\d+)?)\s*l\s*$/i,              unit: 'ml' }, // normalizar a ml
  { re: /\s+(\d+(?:[.,]\d+)?)\s*ml\s*$/i,             unit: 'ml' },
];

function parseItem(raw: string): Parsed {
  const trimmed = raw.trim();

  for (const { re, unit } of QTY_PATTERNS) {
    const m = trimmed.match(re);
    if (m) {
      const qtyStr = m[1].replace(',', '.');
      let qty = parseFloat(qtyStr);
      // Convertir kg → g y l → ml
      const lowerFull = trimmed.toLowerCase();
      if (unit === 'g' && lowerFull.endsWith('kg')) qty *= 1000;
      if (unit === 'ml' && !lowerFull.endsWith('ml')) qty *= 1000;

      const display = trimmed.slice(0, trimmed.length - m[0].length).trim();
      return { name: display.toLowerCase(), display, qty, unit };
    }
  }

  // Sin cantidad parseada: tratar ítem entero como nombre
  return { name: trimmed.toLowerCase(), display: trimmed, qty: null, unit: null };
}

function formatItem(display: string, qty: number | null, unit: string | null): string {
  if (qty === null || unit === null) return display;

  if (unit === 'g') {
    if (qty >= 1000) return `${display} ${(qty / 1000).toLocaleString('es-ES', { maximumFractionDigits: 1 })}kg`;
    return `${display} ${Math.round(qty)}g`;
  }
  if (unit === 'ml') {
    if (qty >= 1000) return `${display} ${(qty / 1000).toLocaleString('es-ES', { maximumFractionDigits: 1 })}l`;
    return `${display} ${Math.round(qty)}ml`;
  }
  if (unit === 'ud') {
    const rounded = Math.round(qty);
    return `${display} x${rounded}`;
  }

  return `${display} ${qty} ${unit}`;
}

export function aggregateShoppingList(items: string[]): string[] {
  const map = new Map<string, { display: string; qty: number | null; unit: string | null }>();

  for (const raw of items) {
    if (!raw?.trim()) continue;
    const parsed = parseItem(raw);

    if (map.has(parsed.name)) {
      const existing = map.get(parsed.name)!;
      // Sumar cantidades solo si ambas tienen qty y la misma unidad
      if (
        existing.qty !== null &&
        parsed.qty !== null &&
        existing.unit === parsed.unit
      ) {
        existing.qty += parsed.qty;
      }
      // Si difieren en unidad o alguna no tiene qty, mantener el primero sin cantidad
      else if (parsed.qty === null || existing.qty === null || existing.unit !== parsed.unit) {
        existing.qty = null;
        existing.unit = null;
      }
    } else {
      map.set(parsed.name, {
        display: parsed.display,
        qty: parsed.qty,
        unit: parsed.unit,
      });
    }
  }

  return Array.from(map.values()).map(({ display, qty, unit }) =>
    formatItem(display, qty, unit)
  );
}
