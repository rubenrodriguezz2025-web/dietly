/* eslint-disable jsx-a11y/alt-text */
// NutritionPlanPDF.tsx — react-pdf renderer
// Reglas estrictas:
//   - NUNCA position: absolute en texto
//   - Todo layout con flexbox
//   - Un elemento por línea, sin overlaps
//   - Macros: todos el mismo color de marca

import React from 'react';
import path from 'path';

import type { PlanContent, Profile } from '@/types/dietly';
import { Document, Font, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer';

// ── Fuentes locales (WOFF, sin CDN) ───────────────────────────────────────────

const fontsDir = path.join(process.cwd(), 'public', 'fonts');

Font.register({
  family: 'Inter',
  fonts: [
    { src: path.join(fontsDir, 'Inter-Regular.woff'), fontWeight: 400 },
    { src: path.join(fontsDir, 'Inter-Medium.woff'), fontWeight: 500 },
    { src: path.join(fontsDir, 'Inter-Bold.woff'), fontWeight: 700 },
  ],
});

Font.registerHyphenationCallback((word) => [word]); // sin silabeo automático

// ── Tipos ─────────────────────────────────────────────────────────────────────

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

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Color de marca al 15% de opacidad sobre blanco (hex) */
function brandBg15(color: string): string {
  return color + '26'; // 26 hex ≈ 15%
}

/** Color de marca al 10% de opacidad sobre blanco (hex) */
function brandBg10(color: string): string {
  return color + '1A'; // 1A hex ≈ 10%
}

function weekLabel(isoDate: string): string {
  const d = new Date(isoDate);
  const end = new Date(d);
  end.setDate(d.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' };
  return `Semana del ${d.toLocaleDateString('es-ES', opts)} al ${end.toLocaleDateString('es-ES', { ...opts, year: 'numeric' })}`;
}

// ── Estilos base ──────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  page: {
    fontFamily: 'Inter',
    fontSize: 10,
    color: '#1a1a1a',
    backgroundColor: '#ffffff',
    flexDirection: 'column',
  },

  // Footer de página
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    paddingHorizontal: 28,
    paddingVertical: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    fontFamily: 'Inter',
    fontWeight: 400,
    fontSize: 7,
    color: '#aaaaaa',
  },

  // Cuerpo de la página
  body: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 16,
    paddingBottom: 8,
  },

  // Píldoras de macros — pequeñas (para comidas)
  pillSmall: {
    borderRadius: 3,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderWidth: 1,
  },
  pillSmallText: {
    fontFamily: 'Inter',
    fontWeight: 700,
    fontSize: 7.5,
  },

  // Píldoras de macros — grandes (para portada)
  pillLarge: {
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
  },
  pillLargeText: {
    fontFamily: 'Inter',
    fontWeight: 700,
    fontSize: 11,
  },

  // Ingredientes
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 6,
  },
  ingredientQty: {
    fontFamily: 'Inter',
    fontWeight: 500,
    fontSize: 8.5,
    color: '#444444',
    width: 56,
  },
  ingredientName: {
    fontFamily: 'Inter',
    fontWeight: 400,
    fontSize: 8.5,
    color: '#444444',
    flex: 1,
  },

  // Preparación
  prepLabel: {
    fontFamily: 'Inter',
    fontWeight: 500,
    fontSize: 7.5,
    color: '#999999',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  prepText: {
    fontFamily: 'Inter',
    fontWeight: 400,
    fontSize: 8.5,
    color: '#555555',
    lineHeight: 1.55,
  },
});

// ── Componente: píldora de macro (pequeña, para comidas) ──────────────────────

function MacroPillSmall({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={[S.pillSmall, { backgroundColor: brandBg15(color), borderColor: color }]}>
      <Text style={[S.pillSmallText, { color }]}>{value} {label}</Text>
    </View>
  );
}

// ── Componente: píldora de macro (grande, para portada) ───────────────────────

function MacroPillLarge({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={[S.pillLarge, { backgroundColor: brandBg15(color), borderColor: color }]}>
      <Text style={[S.pillLargeText, { color }]}>{value} {label}</Text>
    </View>
  );
}

// ── Componente: footer de página ──────────────────────────────────────────────

function PageFooter({ nutritionistName }: { nutritionistName: string }) {
  return (
    <View style={S.footer} fixed>
      <Text style={S.footerText}>Dietly · {nutritionistName}</Text>
      <Text
        style={S.footerText}
        render={({ pageNumber, totalPages }) => `Pág ${pageNumber} de ${totalPages}`}
      />
    </View>
  );
}

// ── Componente: header de página de día ──────────────────────────────────────

function DayPageHeader({
  dayName,
  totalCalories,
  macros,
  brandColor,
  showMacros,
}: {
  dayName: string;
  totalCalories: number;
  macros: { protein_g: number; carbs_g: number; fat_g: number };
  brandColor: string;
  showMacros: boolean;
}) {
  return (
    <View
      style={{
        backgroundColor: brandColor,
        height: 36,
        paddingHorizontal: 28,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <Text style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 11, color: '#ffffff' }}>
        {dayName}
      </Text>
      {showMacros && (
        <Text style={{ fontFamily: 'Inter', fontWeight: 400, fontSize: 8.5, color: 'rgba(255,255,255,0.85)' }}>
          {totalCalories} kcal · {macros.protein_g}g P · {macros.carbs_g}g C · {macros.fat_g}g G
        </Text>
      )}
    </View>
  );
}

// ── Componente: bloque de comida ──────────────────────────────────────────────

function MealBlock({
  meal,
  brandColor,
  showMacros,
  isLast,
}: {
  meal: PlanContent['days'][0]['meals'][0];
  brandColor: string;
  showMacros: boolean;
  isLast: boolean;
}) {
  return (
    <View
      style={{
        marginBottom: isLast ? 0 : 12,
        paddingBottom: isLast ? 0 : 12,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: '#e5e5e5',
      }}
      minPresenceAhead={60}
      wrap={false}
    >
      {/* Hora + nombre */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5, gap: 8 }}>
        {meal.time_suggestion ? (
          <Text style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 8, color: brandColor }}>
            {meal.time_suggestion}
          </Text>
        ) : null}
        <Text style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 11, color: '#1a1a1a', flex: 1 }}>
          {meal.meal_name}
        </Text>
      </View>

      {/* Píldoras de macros */}
      {showMacros && (
        <View style={{ flexDirection: 'row', gap: 4, marginBottom: 7, flexWrap: 'wrap' }}>
          <MacroPillSmall label="kcal" value={String(meal.calories)} color={brandColor} />
          <MacroPillSmall label="P" value={`${meal.macros.protein_g}g`} color={brandColor} />
          <MacroPillSmall label="C" value={`${meal.macros.carbs_g}g`} color={brandColor} />
          <MacroPillSmall label="G" value={`${meal.macros.fat_g}g`} color={brandColor} />
        </View>
      )}

      {/* Ingredientes con filas alternas */}
      {meal.ingredients && meal.ingredients.length > 0 && (
        <View style={{ marginBottom: 7, borderRadius: 3, overflow: 'hidden' }}>
          {meal.ingredients.map((ing, idx) => (
            <View
              key={idx}
              style={[
                S.ingredientRow,
                { backgroundColor: idx % 2 === 0 ? '#f8f8f8' : '#ffffff' },
              ]}
            >
              <Text style={S.ingredientQty}>{ing.quantity} {ing.unit}</Text>
              <Text style={S.ingredientName}>{ing.name}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Preparación */}
      {meal.preparation && meal.preparation.trim() !== '' && (
        <View>
          <Text style={S.prepLabel}>Preparación</Text>
          <Text style={S.prepText} wrap={true}>{meal.preparation}</Text>
        </View>
      )}
    </View>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

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
  const brandColor = profile.primary_color || '#1a7a45';
  const showMacros = profile.show_macros !== false;
  const showShoppingList = profile.show_shopping_list !== false;
  const nutritionistName = profile.full_name || 'Nutricionista';

  const targets = content.week_summary?.target_macros ?? { protein_g: 0, carbs_g: 0, fat_g: 0 };
  const targetCals = content.week_summary?.target_daily_calories ?? 0;

  // ── PORTADA ─────────────────────────────────────────────────────────────────
  const CoverPage = (
    <Page size="A4" style={S.page}>
      {/* Header band 120px — logo o nombre centrados */}
      <View
        style={{
          backgroundColor: brandColor,
          height: 120,
          paddingHorizontal: 40,
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {is_pro && logo_uri ? (
          <Image src={logo_uri} style={{ height: 56, maxWidth: 200, objectFit: 'contain' }} />
        ) : (
          <>
            <Text style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 22, color: '#ffffff' }}>
              {profile.clinic_name || nutritionistName}
            </Text>
            {profile.clinic_name && (
              <Text style={{ fontFamily: 'Inter', fontWeight: 400, fontSize: 10, color: 'rgba(255,255,255,0.75)', marginTop: 4 }}>
                {nutritionistName}
              </Text>
            )}
          </>
        )}
      </View>

      {/* Contenido principal */}
      <View style={{ flex: 1, paddingHorizontal: 40, paddingTop: 44 }}>
        {/* Nombre del paciente */}
        <Text style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 30, color: '#1a1a1a' }}>
          {patient.name}
        </Text>

        {/* Semana */}
        <Text style={{ fontFamily: 'Inter', fontWeight: 400, fontSize: 13, color: '#888888', marginTop: 6, marginBottom: 28 }}>
          {weekLabel(plan.week_start_date)}
        </Text>

        {/* Píldoras de macros objetivo */}
        {showMacros && (
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            <MacroPillLarge label="kcal / día" value={String(targetCals)} color={brandColor} />
            <MacroPillLarge label="Proteína" value={`${targets.protein_g}g`} color={brandColor} />
            <MacroPillLarge label="Carbohidratos" value={`${targets.carbs_g}g`} color={brandColor} />
            <MacroPillLarge label="Grasas" value={`${targets.fat_g}g`} color={brandColor} />
          </View>
        )}

        {/* Mensaje de bienvenida */}
        {profile.welcome_message && (
          <View
            style={{
              marginTop: 28,
              padding: 16,
              backgroundColor: '#f9f9f9',
              borderRadius: 4,
              borderLeftWidth: 3,
              borderLeftColor: brandColor,
            }}
          >
            <Text style={{ fontFamily: 'Inter', fontWeight: 400, fontSize: 10, color: '#555555', lineHeight: 1.6 }} wrap={true}>
              {profile.welcome_message}
            </Text>
          </View>
        )}
      </View>

      {/* Footer de portada */}
      <View style={S.footer}>
        <Text style={S.footerText}>
          Elaborado por {nutritionistName}
          {profile.college_number ? ` · Nº colegiado ${profile.college_number}` : ''}
          {approved_at ? ` · ${approved_at}` : ''}
        </Text>
        <Text style={S.footerText}>Pág 1</Text>
      </View>
    </Page>
  );

  // ── PÁGINAS DE DÍAS ──────────────────────────────────────────────────────────
  const DayPages = content.days.map((day) => (
    <Page key={day.day_number} size="A4" style={S.page}>
      <DayPageHeader
        dayName={day.day_name}
        totalCalories={day.total_calories}
        macros={day.total_macros}
        brandColor={brandColor}
        showMacros={showMacros}
      />

      <View style={S.body}>
        {day.meals.map((meal, idx) => (
          <MealBlock
            key={idx}
            meal={meal}
            brandColor={brandColor}
            showMacros={showMacros}
            isLast={idx === day.meals.length - 1}
          />
        ))}
      </View>

      <PageFooter nutritionistName={nutritionistName} />
    </Page>
  ));

  // ── LISTA DE LA COMPRA ───────────────────────────────────────────────────────
  const shoppingList = content.shopping_list;
  const categoryLabels: Record<string, string> = {
    produce: 'Verduras y fruta',
    protein: 'Proteína',
    dairy: 'Lácteos',
    grains: 'Cereales y pan',
    pantry: 'Despensa',
  };

  const ShoppingPage = showShoppingList && shoppingList ? (
    <Page size="A4" style={S.page}>
      {/* Header band */}
      <View style={{ backgroundColor: brandColor, height: 36, paddingHorizontal: 28, flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 11, color: '#ffffff' }}>
          Lista de la compra
        </Text>
      </View>

      <View style={S.body}>
        {Object.entries(shoppingList).map(([category, items]) => {
          if (!items || (items as string[]).length === 0) return null;
          return (
            <View key={category} style={{ marginBottom: 16 }} wrap={false}>
              {/* Cabecera de categoría con fondo tenue */}
              <View
                style={{
                  backgroundColor: brandBg10(brandColor),
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 3,
                  marginBottom: 6,
                }}
              >
                <Text style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 9, color: brandColor, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {categoryLabels[category] ?? category}
                </Text>
              </View>

              {/* Items */}
              {(items as string[]).map((item, idx) => (
                <View key={idx} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4, paddingHorizontal: 4 }}>
                  <View
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: 2.5,
                      backgroundColor: brandColor,
                      marginTop: 2.5,
                      marginRight: 8,
                      flexShrink: 0,
                    }}
                  />
                  <Text style={{ fontFamily: 'Inter', fontWeight: 400, fontSize: 9, color: '#333333', flex: 1 }} wrap={true}>
                    {item}
                  </Text>
                </View>
              ))}
            </View>
          );
        })}
      </View>

      <PageFooter nutritionistName={nutritionistName} />
    </Page>
  ) : null;

  // ── PÁGINA FINAL ─────────────────────────────────────────────────────────────
  const FinalPage = (
    <Page size="A4" style={S.page}>
      {/* Header band */}
      <View style={{ backgroundColor: brandColor, height: 36, paddingHorizontal: 28, flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 11, color: '#ffffff' }}>
          Información profesional
        </Text>
      </View>

      <View style={[S.body, { justifyContent: 'space-between' }]}>
        {/* Bloque superior: firma + datos */}
        <View style={{ gap: 10 }}>
          {/* Firma digital */}
          {is_pro && signature_uri && (
            <View style={{ marginBottom: 8 }}>
              <Image src={signature_uri} style={{ height: 44, maxWidth: 180, objectFit: 'contain' }} />
            </View>
          )}

          {/* Nombre del nutricionista */}
          <Text style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 15, color: '#1a1a1a' }}>
            {nutritionistName}
          </Text>

          {/* Clínica */}
          {profile.clinic_name ? (
            <Text style={{ fontFamily: 'Inter', fontWeight: 400, fontSize: 10, color: '#666666', marginTop: -4 }}>
              {profile.clinic_name}
            </Text>
          ) : null}

          {/* Nº colegiado */}
          {profile.college_number ? (
            <Text style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 10, color: '#333333' }}>
              Nº Colegiado: {profile.college_number}
            </Text>
          ) : null}

          {/* Fecha de aprobación */}
          {approved_at ? (
            <Text style={{ fontFamily: 'Inter', fontWeight: 400, fontSize: 9, color: '#888888' }}>
              Plan aprobado el {approved_at}
            </Text>
          ) : null}

          {/* Separador */}
          <View style={{ borderTopWidth: 1, borderTopColor: '#e5e5e5', marginTop: 16, paddingTop: 14 }}>
            <Text style={{ fontFamily: 'Inter', fontWeight: 400, fontSize: 8, color: '#aaaaaa', lineHeight: 1.7 }} wrap={true}>
              Este plan nutricional ha sido elaborado y revisado por un profesional de la nutrición
              titulado. Está diseñado exclusivamente para el paciente indicado y no debe compartirse
              ni utilizarse como guía general. Ante cualquier duda, consulte a su nutricionista.
            </Text>
          </View>
        </View>

        {/* Bloque inferior: marca Dietly */}
        <View style={{ alignItems: 'center', paddingBottom: 8 }}>
          <Text style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 9, color: '#cccccc', letterSpacing: 1 }}>
            DIETLY
          </Text>
          <Text style={{ fontFamily: 'Inter', fontWeight: 400, fontSize: 7, color: '#dddddd', marginTop: 2 }}>
            dietly.es
          </Text>
        </View>
      </View>

      <PageFooter nutritionistName={nutritionistName} />
    </Page>
  );

  return (
    <Document
      title={`Plan nutricional — ${patient.name}`}
      author={nutritionistName}
      creator="Dietly"
    >
      {CoverPage}
      {DayPages}
      {ShoppingPage}
      {FinalPage}
    </Document>
  );
}
