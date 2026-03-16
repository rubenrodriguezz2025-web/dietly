'use client';

import { useEffect } from 'react';

import { markBrandSettingsVisited } from './brand-actions';

/**
 * Componente invisible que registra la primera visita a la sección Mi marca.
 * Solo se renderiza cuando brand_settings_visited_at es null.
 */
export function BrandVisitTracker() {
  useEffect(() => {
    markBrandSettingsVisited();
  }, []);

  return null;
}
