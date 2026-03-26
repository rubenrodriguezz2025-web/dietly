/* eslint-disable jsx-a11y/alt-text */
// NutritionPlanPDF.tsx — @react-pdf/renderer v4
// Layout: 100% Flexbox. Sin position:absolute en texto.
// Estructura fija: Portada | Resumen | Lunes-Dom (7p) | Compra | Firma

import React from 'react';
import path from 'path';

import { aggregateShoppingList } from '@/libs/shopping-list';
import type { PlanContent, Profile } from '@/types/dietly';
import { Document, Font, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer';

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

export type PropsPDF = {
  plan: { week_start_date: string };
  content: PlanContent;
  patient: { name: string; email?: string };
  profile: Pick<Profile, 'full_name' | 'clinic_name' | 'college_number'> & {
    primary_color?: string | null;
    show_macros?: boolean | null;
    show_shopping_list?: boolean | null;
    welcome_message?: string | null;
    font_preference?: FontPreference | null;
    profile_photo_url?: string | null;
  };
  logo_uri?: string | null;
  signature_uri?: string | null;
  profile_photo_uri?: string | null;
  is_pro?: boolean;
  approved_at?: string;
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function getFontFamily(pref?: FontPreference | null): string {
  if (pref === 'clasica') return 'Lora';
  if (pref === 'moderna') return 'Poppins';
  return 'Inter'; // 'minimalista' o por defecto
}

function hex15(color: string): string { return color + '26'; }
function hex10(color: string): string { return color + '1A'; }
function hex08(color: string): string { return color + '14'; }

function weekLabel(isoDate: string): string {
  const d = new Date(isoDate);
  const end = new Date(d);
  end.setDate(d.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' };
  return `${d.toLocaleDateString('es-ES', opts)} – ${end.toLocaleDateString('es-ES', { ...opts, year: 'numeric' })}`;
}

function goalLabel(goal: string): string {
  const map: Record<string, string> = {
    // Valores del enum patient_goal_type en la BD
    weight_loss: 'Pérdida de peso',
    weight_gain: 'Ganancia de peso',
    muscle_gain: 'Ganancia muscular',
    maintenance: 'Mantenimiento',
    health: 'Alimentación saludable',
    sports_performance: 'Rendimiento deportivo',
    // Aliases alternativos presentes en planes generados por IA
    lose_weight: 'Pérdida de peso',
    gain_muscle: 'Ganancia muscular',
    maintain: 'Mantenimiento',
    eat_healthy: 'Alimentación saludable',
  };
  return map[goal] ?? goal;
}

// Trunca texto a N caracteres añadiendo "…"
function trunc(text: string, max: number): string {
  if (!text) return '';
  return text.length <= max ? text : text.slice(0, max - 1) + '…';
}

// ── Estilos base ───────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  page: {
    fontSize: 9,
    color: '#1a1a1a',
    backgroundColor: '#ffffff',
    flexDirection: 'column',
  },

  // Header band (todas las páginas salvo portada)
  band: {
    height: 28,
    paddingHorizontal: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bandText: {
    fontWeight: 700,
    fontSize: 10,
    color: '#ffffff',
  },
  bandSub: {
    fontWeight: 400,
    fontSize: 8,
    color: 'rgba(255,255,255,0.82)',
  },

  // Cuerpo de página
  body: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 14,
    paddingBottom: 6,
    flexDirection: 'column',
  },

  // Footer fijo
  footer: {
    borderTopWidth: 0.5,
    borderTopColor: '#e5e5e5',
    paddingHorizontal: 28,
    paddingVertical: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    fontWeight: 400,
    fontSize: 7,
    color: '#bbbbbb',
  },

  // Píldoras pequeñas (comidas)
  pill: {
    borderRadius: 3,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
  },
  pillText: {
    fontWeight: 700,
    fontSize: 7,
  },

  // Separador entre comidas
  mealSep: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#eeeeee',
    marginBottom: 8,
    marginTop: 8,
  },

  // Tabla de ingredientes
  ingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 5,
  },
  ingQty: {
    fontWeight: 500,
    fontSize: 7.5,
    color: '#555555',
    width: 52,
    flexShrink: 0,
  },
  ingName: {
    fontWeight: 400,
    fontSize: 7.5,
    color: '#444444',
    flex: 1,
  },
});

// ── Sub-componentes ────────────────────────────────────────────────────────────

function Band({ color, left, right }: { color: string; left: React.ReactNode; right?: React.ReactNode }) {
  return (
    <View style={[S.band, { backgroundColor: color }]}>
      <View style={{ flex: 1 }}>{left}</View>
      {right ? <View style={{ flexShrink: 0, marginLeft: 8 }}>{right}</View> : null}
    </View>
  );
}

function Footer({ name }: { name: string }) {
  return (
    <View style={S.footer} fixed>
      <Text style={S.footerText}>{name}</Text>
      <Text style={S.footerText} render={({ pageNumber, totalPages }) => `Pág ${pageNumber} de ${totalPages}`} />
    </View>
  );
}

function Pill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={[S.pill, { backgroundColor: hex15(color), borderWidth: 0.5, borderColor: color }]}>
      <Text style={[S.pillText, { color }]}>{value} {label}</Text>
    </View>
  );
}

function MacroRow({ calories, macros, color }: {
  calories: number;
  macros: { protein_g: number; carbs_g: number; fat_g: number };
  color: string;
}) {
  return (
    <View style={{ flexDirection: 'row', gap: 3, flexWrap: 'wrap' }}>
      <Pill label="kcal" value={String(calories)} color={color} />
      <Pill label="P" value={`${macros.protein_g}g`} color={color} />
      <Pill label="C" value={`${macros.carbs_g}g`} color={color} />
      <Pill label="G" value={`${macros.fat_g}g`} color={color} />
    </View>
  );
}

// Bloque de una comida
// El encabezado + ingredientes están en wrap={false} para evitar cortes en medio de la tabla.
// La preparación queda fuera del wrap={false} para que texto largo no genere páginas en blanco.
function MealBlock({
  meal,
  color,
  showMacros,
  isLast,
}: {
  meal: PlanContent['days'][0]['meals'][0];
  color: string;
  showMacros: boolean;
  isLast: boolean;
}) {
  return (
    <View>
      {/* Encabezado + ingredientes — sin cortes a mitad */}
      <View wrap={false}>
        {/* Fila: hora | nombre comida */}
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
          {meal.time_suggestion ? (
            <Text style={{ fontWeight: 500, fontSize: 8, color, flexShrink: 0 }}>
              {meal.time_suggestion}
            </Text>
          ) : null}
          <Text style={{ fontWeight: 700, fontSize: 10, color: '#1a1a1a', flex: 1 }}>
            {meal.meal_name}
          </Text>
          {/* Macros inline a la derecha para ahorrar línea */}
          {showMacros && (
            <View style={{ flexShrink: 0, marginLeft: 4 }}>
              <MacroRow calories={meal.calories} macros={meal.macros} color={color} />
            </View>
          )}
        </View>

        {/* Ingredientes — tabla compacta */}
        {meal.ingredients && meal.ingredients.length > 0 && (
          <View style={{ marginBottom: 4, borderRadius: 2, overflow: 'hidden' }}>
            {meal.ingredients.map((ing, i) => (
              <View key={i} style={[S.ingRow, { backgroundColor: i % 2 === 0 ? '#f9f9f9' : '#ffffff' }]}>
                <Text style={S.ingQty}>{`${ing.quantity} ${ing.unit}`}</Text>
                <Text style={S.ingName}>{ing.name}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Preparación — fuera del wrap={false} para que texto largo pueda continuar en la página siguiente */}
      {meal.preparation && meal.preparation.trim() !== '' && (
        <Text style={{ fontWeight: 400, fontSize: 7.5, color: '#666666', lineHeight: 1.5, marginBottom: 2 }}>
          {meal.preparation}
        </Text>
      )}

      {/* Separador */}
      {!isLast && <View style={S.mealSep} />}
    </View>
  );
}

// ── PORTADA ────────────────────────────────────────────────────────────────────

function CoverPage({
  plan,
  content,
  patient,
  profile,
  logo_uri,
  is_pro,
  approved_at,
  color,
  showMacros,
  fontFamily,
}: {
  plan: PropsPDF['plan'];
  content: PlanContent;
  patient: PropsPDF['patient'];
  profile: PropsPDF['profile'];
  logo_uri?: string | null;
  is_pro?: boolean;
  approved_at?: string;
  color: string;
  showMacros: boolean;
  fontFamily: string;
}) {
  const targets = content.week_summary?.target_macros ?? { protein_g: 0, carbs_g: 0, fat_g: 0 };
  const targetCals = content.week_summary?.target_daily_calories ?? 0;
  const nutritionistName = profile.full_name || 'Nutricionista';

  return (
    <Page size="A4" style={[S.page, { fontFamily }]}>
      {/* Header banda — height 80 */}
      <View style={{ backgroundColor: color, height: 80, paddingHorizontal: 40, flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        {is_pro && logo_uri ? (
          <Image src={logo_uri} style={{ height: 48, maxWidth: 180, objectFit: 'contain' }} />
        ) : (
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontWeight: 700, fontSize: 20, color: '#ffffff' }}>
              {profile.clinic_name || nutritionistName}
            </Text>
            {profile.clinic_name ? (
              <Text style={{ fontWeight: 400, fontSize: 9, color: 'rgba(255,255,255,0.72)', marginTop: 3 }}>
                {nutritionistName}
              </Text>
            ) : null}
          </View>
        )}
      </View>

      {/* Cuerpo */}
      <View style={{ flex: 1, paddingHorizontal: 40, paddingTop: 48, flexDirection: 'column' }}>

        {/* Nombre del paciente */}
        <Text style={{ fontWeight: 700, fontSize: 28, color: '#1a1a1a', marginBottom: 6 }}>
          {patient.name}
        </Text>
        <Text style={{ fontWeight: 400, fontSize: 11, color: '#888888', marginBottom: 4 }}>
          Plan nutricional personalizado
        </Text>
        <Text style={{ fontWeight: 400, fontSize: 9, color: '#aaaaaa', marginBottom: 32 }}>
          {weekLabel(plan.week_start_date)}
        </Text>

        {/* 4 píldoras de macros objetivo */}
        {showMacros && (
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 32 }}>
            {[
              { label: 'kcal / día', value: String(targetCals) },
              { label: 'Proteína', value: `${targets.protein_g}g` },
              { label: 'Carbohidratos', value: `${targets.carbs_g}g` },
              { label: 'Grasas', value: `${targets.fat_g}g` },
            ].map((p) => (
              <View key={p.label} style={{ backgroundColor: hex15(color), borderWidth: 1, borderColor: color, borderRadius: 5, paddingHorizontal: 14, paddingVertical: 8 }}>
                <Text style={{ fontWeight: 700, fontSize: 13, color, marginBottom: 1 }}>{p.value}</Text>
                <Text style={{ fontWeight: 400, fontSize: 8, color: '#666666' }}>{p.label}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Mensaje de bienvenida */}
        {profile.welcome_message ? (
          <View style={{ borderLeftWidth: 2, borderLeftColor: color, paddingLeft: 12, paddingVertical: 6, backgroundColor: hex08(color), borderRadius: 2, marginBottom: 24 }}>
            <Text style={{ fontWeight: 400, fontSize: 9.5, color: '#444444', lineHeight: 1.65 }}>
              {trunc(profile.welcome_message, 500)}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Footer de portada */}
      <View style={[S.footer, { borderTopColor: hex15(color) }]}>
        <Text style={S.footerText}>
          Elaborado por {nutritionistName}{profile.college_number ? ` · Nº colegiado ${profile.college_number}` : ''}{approved_at ? ` · ${approved_at}` : ''}
        </Text>
        <Text style={S.footerText}>Pág 1</Text>
      </View>
    </Page>
  );
}

// ── RESUMEN SEMANAL (pág 2) ────────────────────────────────────────────────────

function SummaryPage({
  content,
  color,
  showMacros,
  nutritionistName,
  fontFamily,
}: {
  content: PlanContent;
  color: string;
  showMacros: boolean;
  nutritionistName: string;
  fontFamily: string;
}) {
  const ws = content.week_summary;
  const days = content.days;

  return (
    <Page size="A4" style={[S.page, { fontFamily }]}>
      <Band
        color={color}
        left={<Text style={S.bandText}>Resumen semanal</Text>}
        right={ws?.goal ? <Text style={S.bandSub}>{goalLabel(ws.goal)}</Text> : undefined}
      />

      <View style={S.body}>
        {/* Tabla de días */}
        {days.length > 0 && (
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontWeight: 700, fontSize: 8, color: '#888888', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
              Distribución por día
            </Text>

            {/* Cabecera tabla */}
            <View style={{ flexDirection: 'row', backgroundColor: color, borderRadius: 3, paddingHorizontal: 10, paddingVertical: 5, marginBottom: 1 }}>
              <Text style={{ fontWeight: 700, fontSize: 8, color: '#ffffff', width: 72 }}>Día</Text>
              <Text style={{ fontWeight: 700, fontSize: 8, color: '#ffffff', flex: 1, textAlign: 'right' }}>Kcal</Text>
              {showMacros && (
                <>
                  <Text style={{ fontWeight: 700, fontSize: 8, color: '#ffffff', flex: 1, textAlign: 'right' }}>Prot.</Text>
                  <Text style={{ fontWeight: 700, fontSize: 8, color: '#ffffff', flex: 1, textAlign: 'right' }}>HC</Text>
                  <Text style={{ fontWeight: 700, fontSize: 8, color: '#ffffff', flex: 1, textAlign: 'right' }}>Grasas</Text>
                </>
              )}
              <Text style={{ fontWeight: 700, fontSize: 8, color: '#ffffff', width: 52, textAlign: 'right' }}>Comidas</Text>
            </View>

            {days.map((day, i) => (
              <View
                key={day.day_number}
                style={{ flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 5, backgroundColor: i % 2 === 0 ? '#f9f9f9' : '#ffffff', borderRadius: 2 }}
              >
                <Text style={{ fontWeight: 500, fontSize: 8.5, color: '#1a1a1a', width: 72 }}>{day.day_name}</Text>
                <Text style={{ fontWeight: 400, fontSize: 8.5, color: '#333333', flex: 1, textAlign: 'right' }}>{day.total_calories}</Text>
                {showMacros && (
                  <>
                    <Text style={{ fontWeight: 400, fontSize: 8.5, color: '#333333', flex: 1, textAlign: 'right' }}>{day.total_macros.protein_g}g</Text>
                    <Text style={{ fontWeight: 400, fontSize: 8.5, color: '#333333', flex: 1, textAlign: 'right' }}>{day.total_macros.carbs_g}g</Text>
                    <Text style={{ fontWeight: 400, fontSize: 8.5, color: '#333333', flex: 1, textAlign: 'right' }}>{day.total_macros.fat_g}g</Text>
                  </>
                )}
                <Text style={{ fontWeight: 400, fontSize: 8.5, color: '#333333', width: 52, textAlign: 'right' }}>{day.meals.length}</Text>
              </View>
            ))}

            {/* Fila de promedios */}
            {ws?.weekly_averages && ws.weekly_averages.calories > 0 && (
              <View style={{ flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 5, backgroundColor: hex10(color), borderRadius: 2, marginTop: 1 }}>
                <Text style={{ fontWeight: 700, fontSize: 8.5, color, width: 72 }}>Promedio</Text>
                <Text style={{ fontWeight: 700, fontSize: 8.5, color, flex: 1, textAlign: 'right' }}>{ws.weekly_averages.calories}</Text>
                {showMacros && (
                  <>
                    <Text style={{ fontWeight: 700, fontSize: 8.5, color, flex: 1, textAlign: 'right' }}>{ws.weekly_averages.protein_g}g</Text>
                    <Text style={{ fontWeight: 700, fontSize: 8.5, color, flex: 1, textAlign: 'right' }}>{ws.weekly_averages.carbs_g}g</Text>
                    <Text style={{ fontWeight: 700, fontSize: 8.5, color, flex: 1, textAlign: 'right' }}>{ws.weekly_averages.fat_g}g</Text>
                  </>
                )}
                <Text style={{ fontWeight: 700, fontSize: 8.5, color, width: 52, textAlign: 'right' }}>—</Text>
              </View>
            )}
          </View>
        )}

        {/* Objetivos nutricionales */}
        {ws && (
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontWeight: 700, fontSize: 8, color: '#888888', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
              Objetivos nutricionales diarios
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              {[
                { label: 'Calorías objetivo', value: `${ws.target_daily_calories} kcal` },
                { label: 'Proteína', value: `${ws.target_macros.protein_g}g${ws.protein_per_kg ? ` (${ws.protein_per_kg}g/kg)` : ''}` },
                { label: 'Carbohidratos', value: `${ws.target_macros.carbs_g}g` },
                { label: 'Grasas', value: `${ws.target_macros.fat_g}g` },
              ].map((item) => (
                showMacros || item.label === 'Calorías objetivo' ? (
                  <View key={item.label} style={{ borderWidth: 0.5, borderColor: '#e5e5e5', borderRadius: 4, paddingHorizontal: 12, paddingVertical: 7, minWidth: 100 }}>
                    <Text style={{ fontWeight: 700, fontSize: 11, color: '#1a1a1a', marginBottom: 2 }}>{item.value}</Text>
                    <Text style={{ fontWeight: 400, fontSize: 7.5, color: '#999999' }}>{item.label}</Text>
                  </View>
                ) : null
              ))}
            </View>
          </View>
        )}

        {/* Nota profesional */}
        <View style={{ borderTopWidth: 0.5, borderTopColor: '#eeeeee', paddingTop: 14 }}>
          <Text style={{ fontWeight: 400, fontSize: 8, color: '#aaaaaa', lineHeight: 1.7 }}>
            Este plan ha sido elaborado y revisado por un profesional de la nutrición. Está diseñado
            exclusivamente para el paciente indicado. Ante cualquier duda o incidencia, contacte con su nutricionista.
          </Text>
        </View>
      </View>

      <Footer name={nutritionistName} />
    </Page>
  );
}

// ── PÁGINA DE DÍA ──────────────────────────────────────────────────────────────

function DayPage({
  day,
  color,
  showMacros,
  nutritionistName,
  fontFamily,
}: {
  day: PlanContent['days'][0];
  color: string;
  showMacros: boolean;
  nutritionistName: string;
  fontFamily: string;
}) {
  return (
    <Page size="A4" style={[S.page, { fontFamily }]}>
      <Band
        color={color}
        left={
          <Text style={S.bandText}>{day.day_name.toUpperCase()}</Text>
        }
        right={
          showMacros ? (
            <Text style={S.bandSub}>
              {day.total_calories} kcal · {day.total_macros.protein_g}g P · {day.total_macros.carbs_g}g C · {day.total_macros.fat_g}g G
            </Text>
          ) : undefined
        }
      />

      <View style={S.body}>
        {day.meals.map((meal, idx) => (
          <MealBlock
            key={idx}
            meal={meal}
            color={color}
            showMacros={showMacros}
            isLast={idx === day.meals.length - 1}
          />
        ))}
      </View>

      <Footer name={nutritionistName} />
    </Page>
  );
}

// ── LISTA DE LA COMPRA (pág 10) ────────────────────────────────────────────────

function ShoppingPage({
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
  const categories: Array<{ key: keyof typeof shopping; label: string }> = [
    { key: 'protein', label: 'Proteínas' },
    { key: 'produce', label: 'Verduras y fruta' },
    { key: 'grains', label: 'Cereales y pan' },
    { key: 'dairy', label: 'Lácteos' },
    { key: 'pantry', label: 'Despensa' },
  ];

  // Dividir en 2 columnas
  const leftCats = categories.slice(0, 3);
  const rightCats = categories.slice(3);

  return (
    <Page size="A4" style={[S.page, { fontFamily }]}>
      <Band
        color={color}
        left={<Text style={S.bandText}>LISTA DE LA COMPRA</Text>}
      />

      <View style={[S.body, { flexDirection: 'row', gap: 16 }]}>
        {[leftCats, rightCats].map((cols, colIdx) => (
          <View key={colIdx} style={{ flex: 1, flexDirection: 'column', gap: 14 }}>
            {cols.map(({ key, label }) => {
              const rawItems = shopping?.[key] as string[] | undefined;
              const items = rawItems ? aggregateShoppingList(rawItems) : undefined;
              if (!items || items.length === 0) return null;
              return (
                <View key={key} wrap={false}>
                  <View style={{ backgroundColor: hex10(color), paddingHorizontal: 8, paddingVertical: 4, borderRadius: 3, marginBottom: 5 }}>
                    <Text style={{ fontWeight: 700, fontSize: 8, color, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                      {label}
                    </Text>
                  </View>
                  {items.map((item, i) => (
                    <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 3, paddingHorizontal: 3 }}>
                      <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: color, marginTop: 2.5, marginRight: 7, flexShrink: 0 }} />
                      <Text style={{ fontWeight: 400, fontSize: 8, color: '#333333', flex: 1 }}>
                        {trunc(item, 60)}
                      </Text>
                    </View>
                  ))}
                </View>
              );
            })}
          </View>
        ))}
      </View>

      <Footer name={nutritionistName} />
    </Page>
  );
}

// ── FIRMA Y DISCLAIMER (pág 11) ───────────────────────────────────────────────

function SignaturePage({
  profile,
  signature_uri,
  is_pro,
  approved_at,
  color,
  nutritionistName,
  fontFamily,
}: {
  profile: PropsPDF['profile'];
  signature_uri?: string | null;
  is_pro?: boolean;
  approved_at?: string;
  color: string;
  nutritionistName: string;
  fontFamily: string;
}) {
  return (
    <Page size="A4" style={[S.page, { fontFamily }]}>
      <Band
        color={color}
        left={<Text style={S.bandText}>Información profesional</Text>}
      />

      <View style={[S.body, { justifyContent: 'space-between' }]}>
        <View style={{ gap: 8 }}>
          {/* Firma digital */}
          {is_pro && signature_uri && (
            <Image src={signature_uri} style={{ height: 42, maxWidth: 160, objectFit: 'contain', marginBottom: 4 }} />
          )}

          <Text style={{ fontWeight: 700, fontSize: 14, color: '#1a1a1a' }}>
            {nutritionistName}
          </Text>

          {profile.clinic_name ? (
            <Text style={{ fontWeight: 400, fontSize: 9, color: '#666666', marginTop: -2 }}>
              {profile.clinic_name}
            </Text>
          ) : null}

          {profile.college_number ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: color }} />
              <Text style={{ fontWeight: 500, fontSize: 9, color: '#333333' }}>
                Nº Colegiado: {profile.college_number}
              </Text>
            </View>
          ) : null}

          {approved_at ? (
            <Text style={{ fontWeight: 400, fontSize: 8, color: '#aaaaaa', marginTop: 2 }}>
              Plan aprobado el {approved_at}
            </Text>
          ) : null}

          {/* Disclaimer profesional */}
          <View style={{ borderTopWidth: 0.5, borderTopColor: '#eeeeee', marginTop: 20, paddingTop: 14 }}>
            <Text style={{ fontWeight: 400, fontSize: 8, color: '#aaaaaa', lineHeight: 1.75 }}>
              Este plan nutricional ha sido elaborado y revisado por un profesional de la nutrición titulado y colegiado.
              Está diseñado exclusivamente para el paciente indicado y no debe compartirse ni utilizarse como guía general.
              Ante cualquier duda, consulte directamente con su nutricionista. La información contenida en este documento
              no sustituye en ningún caso la consulta médica o nutricional personalizada.
            </Text>
          </View>

          {/* Transparencia IA */}
          <View style={{ borderTopWidth: 0.5, borderTopColor: '#eeeeee', marginTop: 12, paddingTop: 12 }}>
            <Text style={{ fontWeight: 700, fontSize: 7, color: '#cccccc', letterSpacing: 0.5, marginBottom: 4 }}>
              ELABORACIÓN DEL PLAN
            </Text>
            <Text style={{ fontWeight: 400, fontSize: 7.5, color: '#aaaaaa', lineHeight: 1.7 }}>
              {'El borrador de este plan fue generado mediante herramientas digitales de asistencia y fue revisado y aprobado por '}
              <Text style={{ fontWeight: 500, color: '#888888' }}>{nutritionistName}</Text>
              {profile.college_number ? `, nº colegiado ${profile.college_number}` : ''}
              {approved_at ? `, el ${approved_at}` : ''}
              {'. El criterio clínico final corresponde exclusivamente al profesional que lo aprueba.'}
            </Text>
          </View>
        </View>

      </View>

      <Footer name={nutritionistName} />
    </Page>
  );
}

// ── DOCUMENTO PRINCIPAL ────────────────────────────────────────────────────────

export function NutritionPlanPDF({
  plan,
  content,
  patient,
  profile,
  logo_uri,
  signature_uri,
  profile_photo_uri: _profile_photo_uri,
  is_pro,
  approved_at,
}: PropsPDF) {
  const color = profile.primary_color || '#1a7a45';
  const showMacros = profile.show_macros !== false;
  const showShoppingList = profile.show_shopping_list !== false;
  const nutritionistName = profile.full_name || 'Nutricionista';
  const fontFamily = getFontFamily(profile.font_preference);

  return (
    <Document
      title={`Plan nutricional — ${patient.name}`}
      author={nutritionistName}
      creator={nutritionistName}
    >
      {/* Pág 1: Portada */}
      <CoverPage
        plan={plan}
        content={content}
        patient={patient}
        profile={profile}
        logo_uri={logo_uri}
        is_pro={is_pro}
        approved_at={approved_at}
        color={color}
        showMacros={showMacros}
        fontFamily={fontFamily}
      />

      {/* Pág 2: Resumen semanal */}
      <SummaryPage
        content={content}
        color={color}
        showMacros={showMacros}
        nutritionistName={nutritionistName}
        fontFamily={fontFamily}
      />

      {/* Págs 3-9: Un día por página — solo si tiene comidas */}
      {content.days.filter((day) => day.meals && day.meals.length > 0).map((day) => (
        <DayPage
          key={day.day_number}
          day={day}
          color={color}
          showMacros={showMacros}
          nutritionistName={nutritionistName}
          fontFamily={fontFamily}
        />
      ))}

      {/* Pág 10: Lista de la compra — solo si hay algún artículo */}
      {showShoppingList && content.shopping_list &&
        Object.values(content.shopping_list).some((items) => Array.isArray(items) && items.length > 0) && (
        <ShoppingPage
          shopping={content.shopping_list}
          color={color}
          nutritionistName={nutritionistName}
          fontFamily={fontFamily}
        />
      )}

      {/* Pág 11: Firma y disclaimer */}
      <SignaturePage
        profile={profile}
        signature_uri={signature_uri}
        is_pro={is_pro}
        approved_at={approved_at}
        color={color}
        nutritionistName={nutritionistName}
        fontFamily={fontFamily}
      />
    </Document>
  );
}
