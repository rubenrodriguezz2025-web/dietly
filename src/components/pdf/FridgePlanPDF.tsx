// FridgePlanPDF.tsx — @react-pdf/renderer v4
// Formato compacto para imprimir y pegar en la nevera.
// Máximo 2 páginas · A4 horizontal.
//   Pág 1 → Tabla semanal (Lunes-Domingo × comidas del día, solo nombre del plato).
//   Pág 2 → Lista de la compra en 3 columnas (solo si el nutricionista la ha habilitado).

import React from 'react';
import path from 'path';

import { aggregateShoppingList } from '@/libs/shopping-list';
import type { PlanContent, Profile } from '@/types/dietly';
import { Document, Font, Page, StyleSheet, Text, View } from '@react-pdf/renderer';

// ── Fuentes locales ────────────────────────────────────────────────────────────

const fontsDir = path.join(process.cwd(), 'public', 'fonts');

Font.register({
  family: 'Inter',
  fonts: [
    { src: path.join(fontsDir, 'Inter-Regular.woff'), fontWeight: 400 },
    { src: path.join(fontsDir, 'Inter-Medium.woff'), fontWeight: 500 },
    { src: path.join(fontsDir, 'Inter-Bold.woff'), fontWeight: 700 },
  ],
});

Font.register({
  family: 'Lora',
  fonts: [
    { src: path.join(fontsDir, 'Lora-Regular.ttf'), fontWeight: 400 },
    { src: path.join(fontsDir, 'Lora-Regular.ttf'), fontWeight: 500 },
    { src: path.join(fontsDir, 'Lora-Regular.ttf'), fontWeight: 700 },
  ],
});

Font.register({
  family: 'Poppins',
  fonts: [
    { src: path.join(fontsDir, 'Poppins-Regular.ttf'), fontWeight: 400 },
    { src: path.join(fontsDir, 'Poppins-Medium.ttf'), fontWeight: 500 },
    { src: path.join(fontsDir, 'Poppins-Bold.ttf'), fontWeight: 700 },
  ],
});

Font.registerHyphenationCallback((word) => [word]);

// ── Tipos ──────────────────────────────────────────────────────────────────────

export type FontPreference = 'clasica' | 'moderna' | 'minimalista';

export type FridgePropsPDF = {
  plan: { week_start_date: string };
  content: PlanContent;
  patient: { name: string };
  profile: Pick<Profile, 'full_name' | 'clinic_name' | 'college_number'> & {
    primary_color?: string | null;
    show_shopping_list?: boolean | null;
    font_preference?: FontPreference | null;
  };
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function getFontFamily(pref?: FontPreference | null): string {
  if (pref === 'clasica') return 'Lora';
  if (pref === 'moderna') return 'Poppins';
  return 'Inter';
}

function hex15(color: string): string { return color + '26'; }
function hex08(color: string): string { return color + '14'; }

function weekLabel(isoDate: string): string {
  const d = new Date(isoDate);
  const end = new Date(d);
  end.setDate(d.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' };
  return `${d.toLocaleDateString('es-ES', opts)} – ${end.toLocaleDateString('es-ES', { ...opts, year: 'numeric' })}`;
}

function trunc(text: string, max: number): string {
  if (!text) return '';
  return text.length <= max ? text : text.slice(0, max - 1) + '…';
}

// Orden fijo de tipos de comida y su etiqueta
const MEAL_ORDER: Array<{ key: string; label: string }> = [
  { key: 'desayuno',     label: 'Desayuno' },
  { key: 'media_manana', label: 'Media mañana' },
  { key: 'almuerzo',     label: 'Almuerzo' },
  { key: 'merienda',     label: 'Merienda' },
  { key: 'cena',         label: 'Cena' },
];

// Mapa day_number → día de la semana (lunes=1, domingo=7)
const DAYS_ORDER: Array<{ num: number; label: string }> = [
  { num: 1, label: 'Lunes' },
  { num: 2, label: 'Martes' },
  { num: 3, label: 'Miércoles' },
  { num: 4, label: 'Jueves' },
  { num: 5, label: 'Viernes' },
  { num: 6, label: 'Sábado' },
  { num: 7, label: 'Domingo' },
];

// ── Estilos base ───────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  page: {
    fontSize: 8,
    color: '#1a1a1a',
    backgroundColor: '#ffffff',
    flexDirection: 'column',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  patientName: {
    fontWeight: 700,
    fontSize: 18,
    color: '#1a1a1a',
  },
  weekText: {
    fontWeight: 400,
    fontSize: 9,
    color: '#888888',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  profRight: {
    alignItems: 'flex-end',
  },
  profName: {
    fontWeight: 500,
    fontSize: 8,
    color: '#666666',
  },
  profMeta: {
    fontWeight: 400,
    fontSize: 7,
    color: '#999999',
    marginTop: 1,
  },

  // Tabla semanal
  tableHeaderRow: {
    flexDirection: 'row',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    overflow: 'hidden',
  },
  tableHeaderCell: {
    paddingVertical: 6,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableHeaderText: {
    fontWeight: 700,
    fontSize: 8.5,
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },

  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e5e5',
  },
  mealLabelCell: {
    paddingVertical: 6,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  mealLabelText: {
    fontWeight: 700,
    fontSize: 8,
    color: '#333333',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  mealCell: {
    paddingVertical: 6,
    paddingHorizontal: 5,
    justifyContent: 'center',
    borderLeftWidth: 0.5,
    borderLeftColor: '#eeeeee',
  },
  mealCellText: {
    fontWeight: 400,
    fontSize: 8,
    color: '#1a1a1a',
    lineHeight: 1.3,
  },

  footer: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 0.5,
    borderTopColor: '#e5e5e5',
    paddingTop: 6,
  },
  footerText: {
    fontWeight: 400,
    fontSize: 7,
    color: '#aaaaaa',
  },

  // Lista de la compra
  shopTitle: {
    fontWeight: 700,
    fontSize: 13,
    color: '#1a1a1a',
    marginBottom: 2,
  },
  shopSubtitle: {
    fontWeight: 400,
    fontSize: 8,
    color: '#888888',
    marginBottom: 10,
  },
  shopColumn: {
    flex: 1,
    flexDirection: 'column',
  },
  shopCategoryHeader: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 3,
    marginBottom: 5,
    marginTop: 8,
  },
  shopCategoryTitle: {
    fontWeight: 700,
    fontSize: 8.5,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  shopItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 2.5,
    paddingHorizontal: 3,
  },
  shopBullet: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    marginTop: 3,
    marginRight: 6,
    flexShrink: 0,
  },
  shopItemText: {
    fontWeight: 400,
    fontSize: 8,
    color: '#333333',
    flex: 1,
    lineHeight: 1.35,
  },
});

// ── PÁGINA 1 — Tabla semanal ───────────────────────────────────────────────────

function WeeklyTablePage({
  plan,
  content,
  patient,
  profile,
  color,
  nutritionistName,
  fontFamily,
}: {
  plan: FridgePropsPDF['plan'];
  content: PlanContent;
  patient: FridgePropsPDF['patient'];
  profile: FridgePropsPDF['profile'];
  color: string;
  nutritionistName: string;
  fontFamily: string;
}) {
  // Indexar días por day_number para lookup rápido
  const daysByNum = new Map<number, PlanContent['days'][0]>();
  for (const day of content.days) {
    daysByNum.set(day.day_number, day);
  }

  // Filtrar solo tipos de comida presentes en al menos un día
  const presentMealTypes = new Set<string>();
  for (const day of content.days) {
    for (const meal of day.meals) {
      presentMealTypes.add(meal.meal_type);
    }
  }
  const rows = MEAL_ORDER.filter((m) => presentMealTypes.has(m.key));

  // Helper: obtener nombre del plato de un día + tipo de comida
  function mealNameFor(dayNum: number, mealKey: string): string {
    const day = daysByNum.get(dayNum);
    if (!day) return '';
    const meal = day.meals.find((m) => m.meal_type === mealKey);
    return meal?.meal_name ?? '';
  }

  // Proporciones: columna de etiqueta 9%, cada día 13% (13×7 = 91%)
  const labelWidth = '9%';
  const dayWidth = '13%';

  return (
    <Page size="A4" orientation="landscape" style={[S.page, { fontFamily }]}>
      {/* Cabecera */}
      <View style={S.header}>
        <View>
          <Text style={S.patientName}>{patient.name}</Text>
          <Text style={S.weekText}>{weekLabel(plan.week_start_date)}</Text>
        </View>
        <View style={S.profRight}>
          <Text style={S.profName}>{nutritionistName}</Text>
          {profile.college_number ? (
            <Text style={S.profMeta}>Nº colegiado {profile.college_number}</Text>
          ) : null}
          {profile.clinic_name ? (
            <Text style={S.profMeta}>{profile.clinic_name}</Text>
          ) : null}
        </View>
      </View>

      {/* Cabecera de tabla */}
      <View style={[S.tableHeaderRow, { backgroundColor: color }]}>
        <View style={[S.tableHeaderCell, { width: labelWidth }]}>
          <Text style={S.tableHeaderText}> </Text>
        </View>
        {DAYS_ORDER.map((d) => (
          <View key={d.num} style={[S.tableHeaderCell, { width: dayWidth }]}>
            <Text style={S.tableHeaderText}>{d.label}</Text>
          </View>
        ))}
      </View>

      {/* Filas (una por tipo de comida) */}
      {rows.map((row, rowIdx) => {
        const zebra = rowIdx % 2 === 0 ? '#f9f9f9' : '#ffffff';
        return (
          <View key={row.key} style={[S.tableRow, { backgroundColor: zebra }]}>
            <View style={[S.mealLabelCell, { width: labelWidth, backgroundColor: hex08(color) }]}>
              <Text style={[S.mealLabelText, { color }]}>{row.label}</Text>
            </View>
            {DAYS_ORDER.map((d) => (
              <View key={d.num} style={[S.mealCell, { width: dayWidth }]}>
                <Text style={S.mealCellText}>{trunc(mealNameFor(d.num, row.key), 30)}</Text>
              </View>
            ))}
          </View>
        );
      })}

      {/* Footer */}
      <View style={S.footer}>
        <Text style={S.footerText}>Plan resumen para imprimir · {nutritionistName}</Text>
        <Text style={S.footerText} render={({ pageNumber, totalPages }) => `Pág ${pageNumber} de ${totalPages}`} />
      </View>
    </Page>
  );
}

// ── PÁGINA 2 — Lista de la compra ──────────────────────────────────────────────

function ShoppingFridgePage({
  shopping,
  color,
  nutritionistName,
  fontFamily,
}: {
  shopping: PlanContent['shopping_list'];
  color: string;
  nutritionistName: string;
  fontFamily: string;
}) {
  // Distribución en 3 columnas según spec:
  //   Col 1 → Frutas y verduras + Proteínas
  //   Col 2 → Lácteos + Cereales
  //   Col 3 → Despensa
  const columns: Array<Array<{ key: keyof typeof shopping; label: string }>> = [
    [
      { key: 'produce', label: 'Frutas y verduras' },
      { key: 'protein', label: 'Proteínas' },
    ],
    [
      { key: 'dairy',  label: 'Lácteos' },
      { key: 'grains', label: 'Cereales y pan' },
    ],
    [
      { key: 'pantry', label: 'Despensa' },
    ],
  ];

  return (
    <Page size="A4" orientation="landscape" style={[S.page, { fontFamily }]}>
      <Text style={S.shopTitle}>Lista de la compra</Text>
      <Text style={S.shopSubtitle}>Todo lo necesario para la semana, agrupado por tipo.</Text>

      <View style={{ flex: 1, flexDirection: 'row', gap: 16 }}>
        {columns.map((col, colIdx) => (
          <View key={colIdx} style={S.shopColumn}>
            {col.map(({ key, label }) => {
              const rawItems = shopping?.[key] as string[] | undefined;
              const items = rawItems ? aggregateShoppingList(rawItems) : undefined;
              if (!items || items.length === 0) return null;
              return (
                <View key={key} wrap={false}>
                  <View style={[S.shopCategoryHeader, { backgroundColor: hex15(color) }]}>
                    <Text style={[S.shopCategoryTitle, { color }]}>{label}</Text>
                  </View>
                  {items.map((item, i) => (
                    <View key={i} style={S.shopItem}>
                      <View style={[S.shopBullet, { backgroundColor: color }]} />
                      <Text style={S.shopItemText}>{trunc(item, 70)}</Text>
                    </View>
                  ))}
                </View>
              );
            })}
          </View>
        ))}
      </View>

      <View style={S.footer}>
        <Text style={S.footerText}>Plan resumen para imprimir · {nutritionistName}</Text>
        <Text style={S.footerText} render={({ pageNumber, totalPages }) => `Pág ${pageNumber} de ${totalPages}`} />
      </View>
    </Page>
  );
}

// ── DOCUMENTO PRINCIPAL ────────────────────────────────────────────────────────

export function FridgePlanPDF({
  plan,
  content,
  patient,
  profile,
}: FridgePropsPDF) {
  const color = profile.primary_color || '#1a7a45';
  const showShoppingList = profile.show_shopping_list !== false;
  const nutritionistName = profile.full_name || 'Nutricionista';
  const fontFamily = getFontFamily(profile.font_preference);

  const hasShopping = showShoppingList && content.shopping_list &&
    Object.values(content.shopping_list).some((items) => Array.isArray(items) && items.length > 0);

  return (
    <Document
      title={`Plan nevera — ${patient.name}`}
      author={nutritionistName}
      creator={nutritionistName}
    >
      <WeeklyTablePage
        plan={plan}
        content={content}
        patient={patient}
        profile={profile}
        color={color}
        nutritionistName={nutritionistName}
        fontFamily={fontFamily}
      />

      {hasShopping && (
        <ShoppingFridgePage
          shopping={content.shopping_list}
          color={color}
          nutritionistName={nutritionistName}
          fontFamily={fontFamily}
        />
      )}
    </Document>
  );
}
