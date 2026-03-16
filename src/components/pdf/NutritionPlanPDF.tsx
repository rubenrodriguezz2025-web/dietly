/* eslint-disable jsx-a11y/alt-text */
// NutritionPlanPDF.tsx — react-pdf renderer
// Reglas estrictas:
//   - NUNCA position: absolute en texto
//   - Todo layout con flexbox
//   - Un elemento por línea, sin overlaps
//   - Macros: todos el mismo color de marca

import path from 'path';

import type { PlanContent, Profile } from '@/types/dietly';
import { Document, Font, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer';

// ── Fuentes locales (TTF, sin CDN) ────────────────────────────────────────────

const fontsDir = path.join(process.cwd(), 'public', 'fonts');

Font.register({
  family: 'Inter',
  fonts: [
    { src: path.join(fontsDir, 'Inter-Regular.ttf'), fontWeight: 400 },
    { src: path.join(fontsDir, 'Inter-Medium.ttf'), fontWeight: 500 },
    { src: path.join(fontsDir, 'Inter-Bold.ttf'), fontWeight: 700 },
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

// ── Estilos base ──────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  page: {
    fontFamily: 'Inter',
    fontSize: 10,
    color: '#1a1a1a',
    backgroundColor: '#ffffff',
    flexDirection: 'column',
  },

  // Header de página (color de marca)
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 10,
    height: 40,
  },
  pageHeaderText: {
    fontFamily: 'Inter',
    fontWeight: 500,
    fontSize: 9,
    color: '#ffffff',
    flex: 1,
  },

  // Cuerpo de la página
  body: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 16,
    paddingBottom: 8,
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
    color: '#999999',
  },

  // Sección de comida
  mealBlock: {
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
    gap: 8,
  },
  mealTime: {
    fontFamily: 'Inter',
    fontWeight: 400,
    fontSize: 8,
    color: '#888888',
  },
  mealName: {
    fontFamily: 'Inter',
    fontWeight: 700,
    fontSize: 11,
    color: '#1a1a1a',
    flex: 1,
  },

  // Píldoras de macros
  pillsRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  pill: {
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  pillText: {
    fontFamily: 'Inter',
    fontWeight: 500,
    fontSize: 8,
  },

  // Ingredientes
  ingredientsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 5,
  },
  ingredientItem: {
    width: '50%',
    flexDirection: 'row',
    gap: 3,
    marginBottom: 2,
  },
  ingredientQty: {
    fontFamily: 'Inter',
    fontWeight: 500,
    fontSize: 9,
    color: '#444444',
    width: 50,
  },
  ingredientName: {
    fontFamily: 'Inter',
    fontWeight: 400,
    fontSize: 9,
    color: '#444444',
    flex: 1,
  },

  // Preparación
  prepLabel: {
    fontFamily: 'Inter',
    fontWeight: 500,
    fontSize: 8,
    color: '#888888',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  prepText: {
    fontFamily: 'Inter',
    fontWeight: 400,
    fontSize: 9,
    color: '#555555',
    lineHeight: 1.5,
  },
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function brandBg(color: string): string {
  // Fondo suave al 15% de opacidad sobre blanco — aproximado con hex
  return color + '26'; // 26 hex = ~15% opacidad
}

function weekLabel(isoDate: string): string {
  const d = new Date(isoDate);
  const end = new Date(d);
  end.setDate(d.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' };
  return `Semana del ${d.toLocaleDateString('es-ES', opts)} al ${end.toLocaleDateString('es-ES', { ...opts, year: 'numeric' })}`;
}

// ── Componente: píldora de macro ──────────────────────────────────────────────

function MacroPill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={[S.pill, { backgroundColor: brandBg(color) }]}>
      <Text style={[S.pillText, { color }]}>{value} {label}</Text>
    </View>
  );
}

// ── Componente: footer de página ──────────────────────────────────────────────

function PageFooter({
  nutritionistName,
  pageNumber,
  totalPages,
}: {
  nutritionistName: string;
  pageNumber?: number;
  totalPages?: number;
}) {
  return (
    <View style={S.footer} fixed>
      <Text style={S.footerText}>Dietly · {nutritionistName}</Text>
      {pageNumber !== undefined && totalPages !== undefined ? (
        <Text style={S.footerText}>Pág {pageNumber} de {totalPages}</Text>
      ) : (
        <Text
          style={S.footerText}
          render={({ pageNumber: pn, totalPages: tp }) => `Pág ${pn} de ${tp}`}
        />
      )}
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
  const macroText = showMacros
    ? ` · ${totalCalories} kcal · ${macros.protein_g}g P · ${macros.carbs_g}g C · ${macros.fat_g}g G`
    : '';

  return (
    <View style={[S.pageHeader, { backgroundColor: brandColor }]}>
      <Text style={S.pageHeaderText}>
        {dayName}{macroText}
      </Text>
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
      style={[S.mealBlock, isLast ? { borderBottomWidth: 0, marginBottom: 0, paddingBottom: 0 } : {}]}
      minPresenceAhead={60}
      wrap={false}
    >
      {/* Hora + nombre */}
      <View style={S.mealHeader}>
        {meal.time_suggestion ? (
          <Text style={S.mealTime}>{meal.time_suggestion}</Text>
        ) : null}
        <Text style={S.mealName}>{meal.meal_name}</Text>
      </View>

      {/* Píldoras de macros */}
      {showMacros && (
        <View style={S.pillsRow}>
          <MacroPill label="kcal" value={String(meal.calories)} color={brandColor} />
          <MacroPill label="P" value={`${meal.macros.protein_g}g`} color={brandColor} />
          <MacroPill label="C" value={`${meal.macros.carbs_g}g`} color={brandColor} />
          <MacroPill label="G" value={`${meal.macros.fat_g}g`} color={brandColor} />
        </View>
      )}

      {/* Ingredientes */}
      {meal.ingredients && meal.ingredients.length > 0 && (
        <View style={S.ingredientsGrid}>
          {meal.ingredients.map((ing, idx) => (
            <View key={idx} style={S.ingredientItem}>
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
      {/* Header band */}
      <View style={{ backgroundColor: brandColor, height: 80, paddingHorizontal: 28, flexDirection: 'row', alignItems: 'center' }}>
        {is_pro && logo_uri ? (
          <Image src={logo_uri} style={{ height: 48, maxWidth: 160, objectFit: 'contain' }} />
        ) : (
          <Text style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 20, color: '#ffffff' }}>
            {profile.clinic_name || nutritionistName}
          </Text>
        )}
      </View>

      {/* Contenido principal */}
      <View style={{ flex: 1, paddingHorizontal: 40, paddingTop: 40, flexDirection: 'column', gap: 8 }}>
        {/* Nombre del paciente */}
        <Text style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 28, color: '#1a1a1a' }}>
          {patient.name}
        </Text>

        {/* Semana */}
        <Text style={{ fontFamily: 'Inter', fontWeight: 400, fontSize: 13, color: '#666666', marginBottom: 8 }}>
          {weekLabel(plan.week_start_date)}
        </Text>

        {/* Píldoras de macros objetivo */}
        {showMacros && (
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
            <View style={[S.pill, { backgroundColor: brandBg(brandColor), paddingHorizontal: 12, paddingVertical: 6 }]}>
              <Text style={[S.pillText, { color: brandColor, fontSize: 11 }]}>{targetCals} kcal/día</Text>
            </View>
            <View style={[S.pill, { backgroundColor: brandBg(brandColor), paddingHorizontal: 12, paddingVertical: 6 }]}>
              <Text style={[S.pillText, { color: brandColor, fontSize: 11 }]}>{targets.protein_g}g Proteína</Text>
            </View>
            <View style={[S.pill, { backgroundColor: brandBg(brandColor), paddingHorizontal: 12, paddingVertical: 6 }]}>
              <Text style={[S.pillText, { color: brandColor, fontSize: 11 }]}>{targets.carbs_g}g Carbohidratos</Text>
            </View>
            <View style={[S.pill, { backgroundColor: brandBg(brandColor), paddingHorizontal: 12, paddingVertical: 6 }]}>
              <Text style={[S.pillText, { color: brandColor, fontSize: 11 }]}>{targets.fat_g}g Grasas</Text>
            </View>
          </View>
        )}

        {/* Mensaje de bienvenida */}
        {profile.welcome_message && (
          <View style={{ marginTop: 20, padding: 14, backgroundColor: '#f9f9f9', borderRadius: 4 }}>
            <Text style={{ fontFamily: 'Inter', fontWeight: 400, fontSize: 10, color: '#555555', lineHeight: 1.6 }} wrap={true}>
              {profile.welcome_message}
            </Text>
          </View>
        )}
      </View>

      {/* Footer de portada */}
      <View style={[S.footer]}>
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
  const DayPages = content.days.map((day) => {
    const dayMacros = day.total_macros;

    return (
      <Page key={day.day_number} size="A4" style={S.page}>
        <DayPageHeader
          dayName={day.day_name}
          totalCalories={day.total_calories}
          macros={dayMacros}
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
    );
  });

  // ── LISTA DE LA COMPRA ───────────────────────────────────────────────────────
  const shoppingList = content.shopping_list;
  const ShoppingPage = showShoppingList && shoppingList ? (
    <Page size="A4" style={S.page}>
      <View style={[S.pageHeader, { backgroundColor: brandColor }]}>
        <Text style={S.pageHeaderText}>Lista de la compra</Text>
      </View>

      <View style={S.body}>
        {Object.entries(shoppingList).map(([category, items]) => {
          if (!items || (items as string[]).length === 0) return null;
          const labels: Record<string, string> = {
            produce: 'Verduras y fruta',
            protein: 'Proteína',
            dairy: 'Lácteos',
            grains: 'Cereales y pan',
            pantry: 'Despensa',
          };
          return (
            <View key={category} style={{ marginBottom: 14 }} wrap={false}>
              <Text style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 10, color: brandColor, marginBottom: 5, textTransform: 'uppercase' }}>
                {labels[category] ?? category}
              </Text>
              {(items as string[]).map((item, idx) => (
                <View key={idx} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 3 }}>
                  <Text style={{ fontFamily: 'Inter', fontWeight: 400, fontSize: 9, color: brandColor, marginRight: 6 }}>·</Text>
                  <Text style={{ fontFamily: 'Inter', fontWeight: 400, fontSize: 9, color: '#333333', flex: 1 }} wrap={true}>{item}</Text>
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
      <View style={[S.pageHeader, { backgroundColor: brandColor }]}>
        <Text style={S.pageHeaderText}>Información profesional</Text>
      </View>

      <View style={[S.body, { gap: 12 }]}>
        {/* Foto + datos del nutricionista */}
        {is_pro && signature_uri ? (
          <View style={{ marginBottom: 12 }}>
            <Image src={signature_uri} style={{ height: 40, maxWidth: 160, objectFit: 'contain' }} />
          </View>
        ) : null}

        <Text style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 14, color: '#1a1a1a' }}>
          {nutritionistName}
        </Text>

        {profile.clinic_name ? (
          <Text style={{ fontFamily: 'Inter', fontWeight: 400, fontSize: 10, color: '#666666' }}>
            {profile.clinic_name}
          </Text>
        ) : null}

        {profile.college_number ? (
          <Text style={{ fontFamily: 'Inter', fontWeight: 400, fontSize: 10, color: '#666666' }}>
            Nº Colegiado: {profile.college_number}
          </Text>
        ) : null}

        {approved_at ? (
          <Text style={{ fontFamily: 'Inter', fontWeight: 400, fontSize: 10, color: '#666666' }}>
            Fecha de aprobación: {approved_at}
          </Text>
        ) : null}

        {/* Separador */}
        <View style={{ borderTopWidth: 1, borderTopColor: '#e5e5e5', marginTop: 8, paddingTop: 16 }}>
          <Text style={{ fontFamily: 'Inter', fontWeight: 400, fontSize: 8, color: '#999999', lineHeight: 1.6 }} wrap={true}>
            Este plan nutricional ha sido elaborado y revisado por un profesional de la nutrición titulado.
            Está diseñado exclusivamente para el paciente indicado y no debe compartirse ni utilizarse como
            guía general. Ante cualquier duda, consulte a su nutricionista.
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
