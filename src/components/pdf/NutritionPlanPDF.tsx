// Componente PDF del plan nutricional — solo servidor
// Sin "use client", sin hooks, sin Context.
// Usar exclusivamente con renderToBuffer() en la API route.

import type { Patient, PlanContent, Profile } from '@/types/dietly';
import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';

// ── Paleta ────────────────────────────────────────────────────────────────────

const C = {
  primary: '#1a7a45',
  primaryDark: '#155f38',
  primaryLight: '#d1fae5',
  texto: '#18181b',
  apagado: '#52525b',
  apagadoClaro: '#a1a1aa',
  borde: '#e4e4e7',
  fondo: '#f4f4f5',
  blanco: '#ffffff',
  // Píldoras de macro
  kcalBg: '#d1fae5', kcalText: '#065f46',
  protBg: '#dbeafe', protText: '#1e40af',
  carbBg: '#fef3c7', carbText: '#92400e',
  fatBg: '#fce7f3', fatText: '#9d174d',
  // Colores por tipo de comida (borde izquierdo)
  mealDesayuno: '#f59e0b',
  mealMediaManana: '#f97316',
  mealAlmuerzo: '#1a7a45',
  mealMerienda: '#8b5cf6',
  mealCena: '#3b82f6',
  // Colores por categoría de compra
  catProteinas: '#1e40af',
  catVerduras: '#1a7a45',
  catLacteos: '#b45309',
  catCereales: '#92400e',
  catDespensa: '#52525b',
};

// ── Estilos ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  pagina: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: C.texto,
    backgroundColor: C.blanco,
    paddingBottom: 52,
    lineHeight: 1.4,
  },

  // ── Header verde por página ──────────────────────────────────────────────
  headerBarra: {
    backgroundColor: C.primary,
    paddingHorizontal: 36,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerIzquierda: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerLogo: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: C.blanco,
    letterSpacing: 0.8,
  },
  headerSeparador: {
    fontSize: 12,
    color: '#6ee7b7',
  },
  headerPlanLabel: {
    fontSize: 9,
    color: '#a7f3d0',
    letterSpacing: 0.3,
  },
  headerPaciente: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    color: C.blanco,
  },

  // ── Contenido interior ────────────────────────────────────────────────────
  cuerpo: {
    paddingHorizontal: 36,
  },

  // ── Portada ──────────────────────────────────────────────────────────────
  portadaHero: {
    backgroundColor: C.primary,
    paddingHorizontal: 44,
    paddingTop: 64,
    paddingBottom: 56,
    alignItems: 'center',
  },
  portadaLogoTexto: {
    fontSize: 36,
    fontFamily: 'Helvetica-Bold',
    color: C.blanco,
    letterSpacing: 2,
    marginBottom: 6,
  },
  portadaTagline: {
    fontSize: 12,
    color: '#a7f3d0',
    letterSpacing: 0.5,
  },
  portadaCuerpo: {
    flex: 1,
    paddingHorizontal: 44,
    paddingTop: 40,
    alignItems: 'center',
  },
  portadaSemana: {
    fontSize: 11,
    color: C.apagado,
    marginBottom: 24,
    letterSpacing: 0.3,
  },
  portadaTarjeta: {
    backgroundColor: C.fondo,
    borderRadius: 10,
    padding: 28,
    width: 360,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.borde,
    borderStyle: 'solid',
    borderLeftWidth: 4,
    borderLeftColor: C.primary,
    borderLeftStyle: 'solid',
  },
  portadaPaciente: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 6,
    textAlign: 'center',
    color: C.texto,
  },
  portadaNutri: {
    fontSize: 11,
    color: C.apagado,
    textAlign: 'center',
    marginBottom: 3,
  },
  portadaDivider: {
    width: 40,
    height: 2,
    backgroundColor: C.primaryLight,
    marginVertical: 14,
  },
  portadaAviso: {
    fontSize: 8,
    color: C.apagadoClaro,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 1.6,
    maxWidth: 280,
  },
  // Targets en portada
  portadaTargets: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 28,
    width: 360,
  },
  portadaTargetCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.borde,
    borderStyle: 'solid',
    backgroundColor: C.blanco,
  },
  portadaTargetValor: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
  },
  portadaTargetLabel: {
    fontSize: 7,
    color: C.apagadoClaro,
    textAlign: 'center',
  },

  // ── Título de sección ─────────────────────────────────────────────────────
  tituloSeccion: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: C.primary,
    marginBottom: 12,
    marginTop: 4,
    paddingBottom: 6,
    borderBottomWidth: 2,
    borderBottomColor: C.primaryLight,
    borderBottomStyle: 'solid',
  },

  // ── Resumen semanal ───────────────────────────────────────────────────────
  filaResumen: {
    flexDirection: 'row',
    marginBottom: 22,
    gap: 6,
  },
  tarjetaResumen: {
    flex: 1,
    backgroundColor: C.fondo,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.borde,
    borderStyle: 'solid',
  },
  valorResumen: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: C.primary,
    marginBottom: 3,
  },
  etiquetaResumen: {
    fontSize: 7.5,
    color: C.apagado,
    textAlign: 'center',
  },

  // ── Día ───────────────────────────────────────────────────────────────────
  contenedorDia: {
    marginBottom: 18,
  },
  cabeceraDia: {
    backgroundColor: C.primary,
    borderRadius: 7,
    paddingVertical: 8,
    paddingHorizontal: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  nombreDia: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: C.blanco,
    letterSpacing: 0.3,
  },
  macrosDia: {
    fontSize: 8.5,
    color: '#a7f3d0',
  },

  // ── Comida ────────────────────────────────────────────────────────────────
  contenedorComida: {
    backgroundColor: C.blanco,
    borderWidth: 1,
    borderColor: C.borde,
    borderStyle: 'solid',
    borderRadius: 7,
    padding: 11,
    marginBottom: 7,
    borderLeftWidth: 3,
    borderLeftStyle: 'solid',
  },
  cabeceraComida: {
    flexDirection: 'column',
    marginBottom: 10,
    gap: 6,
  },
  infoComida: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  tipoComida: {
    fontSize: 7.5,
    color: C.apagadoClaro,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 3,
  },
  nombreComida: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: C.texto,
    lineHeight: 1.3,
    maxWidth: 280,
  },
  horaComida: {
    fontSize: 8,
    color: C.apagadoClaro,
    marginTop: 2,
  },
  // Píldoras de macro en fila horizontal
  filaMacros: {
    flexDirection: 'row',
    gap: 5,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  pildora: {
    borderRadius: 20,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  pildoraTexto: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
  },

  // ── Ingredientes en grid 2 columnas ──────────────────────────────────────
  etiquetaSeccionComida: {
    fontSize: 7.5,
    color: C.apagado,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 5,
    marginTop: 2,
  },
  gridIngredientes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  celdaIngrediente: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingRight: 8,
  },
  puntoIngrediente: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.primaryLight,
    marginRight: 5,
    marginTop: 1,
  },
  nombreIngrediente: {
    fontSize: 8.5,
    color: C.texto,
    flex: 1,
  },
  cantidadIngrediente: {
    fontSize: 8,
    color: C.apagadoClaro,
    marginLeft: 3,
  },

  // ── Preparación ───────────────────────────────────────────────────────────
  contenedorPrep: {
    backgroundColor: '#f9fafb',
    borderLeftWidth: 2,
    borderLeftColor: C.primaryLight,
    borderLeftStyle: 'solid',
    paddingLeft: 8,
    paddingVertical: 5,
    paddingRight: 6,
    borderRadius: 2,
  },
  textoPrep: {
    fontSize: 8.5,
    color: C.apagado,
    lineHeight: 1.65,
  },

  // ── Lista de la compra ────────────────────────────────────────────────────
  seccionCompra: {
    marginBottom: 16,
  },
  cabCompra: {
    borderRadius: 5,
    paddingVertical: 6,
    paddingHorizontal: 11,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  indicadorCat: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  tituloCatCompra: {
    fontSize: 10.5,
    fontFamily: 'Helvetica-Bold',
    color: C.blanco,
  },
  gridCompra: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    paddingLeft: 2,
  },
  chipCompra: {
    backgroundColor: C.fondo,
    borderRadius: 4,
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderWidth: 1,
    borderColor: C.borde,
    borderStyle: 'solid',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dotCompra: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginRight: 1,
  },
  textoChipCompra: {
    fontSize: 8.5,
    color: C.texto,
  },

  // ── Footer ────────────────────────────────────────────────────────────────
  piePagina: {
    position: 'absolute',
    bottom: 18,
    left: 36,
    right: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: C.borde,
    borderTopStyle: 'solid',
    paddingTop: 7,
  },
  textoPie: {
    fontSize: 7.5,
    color: C.apagadoClaro,
  },
  textoPieDerecha: {
    fontSize: 7.5,
    color: C.apagadoClaro,
    fontStyle: 'italic',
  },
});

// ── Tipos ─────────────────────────────────────────────────────────────────────

export type PropsPDF = {
  plan: { week_start_date: string };
  content: PlanContent;
  patient: Pick<Patient, 'name' | 'email'>;
  profile: Pick<Profile, 'full_name' | 'clinic_name'>;
};

// ── Constantes ────────────────────────────────────────────────────────────────

const TIPOS_COMIDA: Record<string, string> = {
  desayuno: 'Desayuno',
  media_manana: 'Media mañana',
  almuerzo: 'Almuerzo',
  merienda: 'Merienda',
  cena: 'Cena',
};

const COLOR_COMIDA: Record<string, string> = {
  desayuno: C.mealDesayuno,
  media_manana: C.mealMediaManana,
  almuerzo: C.mealAlmuerzo,
  merienda: C.mealMerienda,
  cena: C.mealCena,
};

// ── Subcomponentes ─────────────────────────────────────────────────────────────

function HeaderPagina({ nombrePaciente }: { nombrePaciente: string }) {
  return (
    <View style={s.headerBarra} fixed>
      <View style={s.headerIzquierda}>
        <Text style={s.headerLogo}>Dietly</Text>
        <Text style={s.headerSeparador}>·</Text>
        <Text style={s.headerPlanLabel}>Plan Nutricional</Text>
      </View>
      <Text style={s.headerPaciente}>{nombrePaciente}</Text>
    </View>
  );
}

function Footer() {
  return (
    <View style={s.piePagina} fixed>
      <Text style={s.textoPie}>Dietly · Generado con IA · Revisado por nutricionista</Text>
      <Text
        style={s.textoPieDerecha}
        render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
      />
    </View>
  );
}

function PildoraMacro({
  valor,
  etiqueta,
  bg,
  color,
}: {
  valor: number | string;
  etiqueta: string;
  bg: string;
  color: string;
}) {
  return (
    <View style={[s.pildora, { backgroundColor: bg }]}>
      <Text style={[s.pildoraTexto, { color }]}>
        {valor} {etiqueta}
      </Text>
    </View>
  );
}

function FilaMacros({ calories, macros }: {
  calories: number;
  macros: { protein_g: number; carbs_g: number; fat_g: number };
}) {
  return (
    <View style={s.filaMacros}>
      <PildoraMacro valor={calories} etiqueta="kcal" bg={C.kcalBg} color={C.kcalText} />
      <PildoraMacro valor={macros.protein_g} etiqueta="g P" bg={C.protBg} color={C.protText} />
      <PildoraMacro valor={macros.carbs_g} etiqueta="g C" bg={C.carbBg} color={C.carbText} />
      <PildoraMacro valor={macros.fat_g} etiqueta="g G" bg={C.fatBg} color={C.fatText} />
    </View>
  );
}

function TarjetaComida({ meal }: { meal: PropsPDF['content']['days'][0]['meals'][0] }) {
  const colorBorde = COLOR_COMIDA[meal.meal_type] ?? C.primary;

  return (
    <View style={[s.contenedorComida, { borderLeftColor: colorBorde }]}>
      {/* Cabecera: tipo/hora + nombre + píldoras */}
      <View style={s.cabeceraComida}>
        <View style={s.infoComida}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={s.tipoComida}>
              {TIPOS_COMIDA[meal.meal_type] ?? meal.meal_type}
            </Text>
            <Text style={s.nombreComida}>{meal.meal_name}</Text>
            {meal.time_suggestion ? (
              <Text style={s.horaComida}>{meal.time_suggestion}</Text>
            ) : null}
          </View>
        </View>
        <FilaMacros calories={meal.calories} macros={meal.macros} />
      </View>

      {/* Ingredientes en grid de 2 columnas */}
      {meal.ingredients.length > 0 && (
        <>
          <Text style={s.etiquetaSeccionComida}>Ingredientes</Text>
          <View style={s.gridIngredientes}>
            {meal.ingredients.map((ing, i) => (
              <View key={i} style={s.celdaIngrediente}>
                <View style={s.puntoIngrediente} />
                <Text style={s.nombreIngrediente}>{ing.name}</Text>
                <Text style={s.cantidadIngrediente}>
                  {ing.quantity} {ing.unit}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}

      {/* Preparación con fondo sutil y borde verde */}
      {meal.preparation && (
        <>
          <Text style={s.etiquetaSeccionComida}>Preparación</Text>
          <View style={s.contenedorPrep}>
            <Text style={s.textoPrep}>{meal.preparation}</Text>
          </View>
        </>
      )}
    </View>
  );
}

function SeccionDia({ day }: { day: PropsPDF['content']['days'][0] }) {
  return (
    <View style={s.contenedorDia}>
      <View style={s.cabeceraDia}>
        <Text style={s.nombreDia}>{day.day_name}</Text>
        <Text style={s.macrosDia}>
          {day.total_calories} kcal · {day.total_macros.protein_g}g P ·{' '}
          {day.total_macros.carbs_g}g C · {day.total_macros.fat_g}g G
        </Text>
      </View>
      {day.meals.map((meal, i) => (
        <TarjetaComida key={i} meal={meal} />
      ))}
    </View>
  );
}

// ── Lista de la compra ─────────────────────────────────────────────────────────

const CATEGORIAS_PLAN: Array<[keyof PropsPDF['content']['shopping_list'], string, string]> = [
  ['protein', 'Proteínas', C.catProteinas],
  ['produce', 'Frutas y verduras', C.catVerduras],
  ['dairy', 'Lácteos', C.catLacteos],
  ['grains', 'Cereales y pan', C.catCereales],
  ['pantry', 'Despensa', C.catDespensa],
];

const PALABRAS_CATEGORIA: Record<string, string[]> = {
  'Proteínas': [
    'pollo', 'pechuga', 'carne', 'ternera', 'cerdo', 'pavo', 'cordero', 'salmón', 'merluza',
    'atún', 'bacalao', 'dorada', 'lubina', 'gambas', 'mejillón', 'calamar', 'huevo', 'tofu',
    'tempeh', 'seitán', 'lenteja', 'garbanzo', 'judía', 'alubia', 'proteína',
  ],
  'Frutas y verduras': [
    'tomate', 'lechuga', 'zanahoria', 'espinaca', 'brócoli', 'coliflor', 'pimiento',
    'cebolla', 'ajo', 'pepino', 'calabacín', 'berenjena', 'champiñón', 'seta', 'alcachofa',
    'espárrago', 'judía verde', 'guisante', 'maíz', 'remolacha', 'apio', 'puerro',
    'manzana', 'plátano', 'naranja', 'pera', 'uva', 'fresa', 'arándano', 'kiwi',
    'mango', 'piña', 'melocotón', 'ciruela', 'cereza', 'limón', 'pomelo', 'fruta', 'verdura',
  ],
  'Lácteos': [
    'leche', 'yogur', 'queso', 'kéfir', 'mantequilla', 'nata', 'crema', 'requesón',
    'mozzarella', 'ricotta', 'cottage',
  ],
  'Cereales y pan': [
    'arroz', 'pan', 'pasta', 'avena', 'quinoa', 'cuscús', 'bulgur', 'centeno',
    'espelta', 'tortita', 'galleta', 'cereales', 'copos', 'harina',
  ],
};

function categorizarIngrediente(nombre: string): string {
  const lower = nombre.toLowerCase();
  for (const [cat, palabras] of Object.entries(PALABRAS_CATEGORIA)) {
    if (palabras.some((p) => lower.includes(p))) return cat;
  }
  return 'Despensa';
}

type ListaCompra = Array<{ etiqueta: string; color: string; items: string[] }>;

function construirListaCompra(content: PlanContent): ListaCompra {
  const sl = content.shopping_list;

  // 1. Usar shopping_list del plan si tiene items
  const totalItems = CATEGORIAS_PLAN.reduce(
    (acc, [key]) => acc + (sl[key]?.length ?? 0),
    0
  );

  if (totalItems > 0) {
    return CATEGORIAS_PLAN
      .filter(([key]) => (sl[key]?.length ?? 0) > 0)
      .map(([key, etiqueta, color]) => ({ etiqueta, color, items: sl[key] ?? [] }));
  }

  // 2. Fallback: agregar ingredientes únicos de todos los días
  const vistos = new Set<string>();
  const porCategoria: Record<string, string[]> = {};

  for (const day of content.days) {
    for (const meal of day.meals) {
      for (const ing of meal.ingredients) {
        const clave = ing.name.toLowerCase().trim();
        if (vistos.has(clave)) continue;
        vistos.add(clave);
        const cat = categorizarIngrediente(ing.name);
        if (!porCategoria[cat]) porCategoria[cat] = [];
        porCategoria[cat].push(`${ing.name} — ${ing.quantity} ${ing.unit}`);
      }
    }
  }

  return CATEGORIAS_PLAN
    .filter(([, etiqueta]) => (porCategoria[etiqueta]?.length ?? 0) > 0)
    .map(([, etiqueta, color]) => ({ etiqueta, color, items: porCategoria[etiqueta] ?? [] }));
}

function ListaCompraPage({
  content,
  nombrePaciente,
}: {
  content: PlanContent;
  nombrePaciente: string;
}) {
  const lista = construirListaCompra(content);

  return (
    <Page size="A4" style={s.pagina}>
      <HeaderPagina nombrePaciente={nombrePaciente} />
      <View style={s.cuerpo}>
        <Text style={s.tituloSeccion}>Lista de la compra</Text>

        {lista.length === 0 && (
          <Text style={{ fontSize: 9, color: C.apagado }}>Sin datos de lista de la compra.</Text>
        )}

        {lista.map(({ etiqueta, color, items }) => (
          <View key={etiqueta} style={s.seccionCompra}>
            <View style={[s.cabCompra, { backgroundColor: color }]}>
              <View style={[s.indicadorCat, { backgroundColor: 'rgba(255,255,255,0.3)' }]} />
              <Text style={s.tituloCatCompra}>{etiqueta}</Text>
            </View>
            <View style={s.gridCompra}>
              {items.map((item, i) => (
                <View key={i} style={s.chipCompra}>
                  <View style={[s.dotCompra, { backgroundColor: color }]} />
                  <Text style={s.textoChipCompra}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>
      <Footer />
    </Page>
  );
}

// ── Documento PDF principal ───────────────────────────────────────────────────

export function NutritionPlanPDF({ plan, content, patient, profile }: PropsPDF) {
  const fechaSemana = new Date(plan.week_start_date).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const nombreNutricionista = profile.full_name || 'Nutricionista';
  const { target_daily_calories, target_macros } = content.week_summary;

  return (
    <Document
      title={`Plan nutricional - ${patient.name}`}
      author={nombreNutricionista}
      creator="Dietly"
    >
      {/* ── Portada ── */}
      <Page size="A4" style={s.pagina}>
        {/* Hero verde */}
        <View style={s.portadaHero}>
          <Text style={s.portadaLogoTexto}>Dietly</Text>
          <Text style={s.portadaTagline}>Plan Nutricional Personalizado</Text>
        </View>

        {/* Cuerpo de la portada */}
        <View style={s.portadaCuerpo}>
          <Text style={s.portadaSemana}>Semana del {fechaSemana}</Text>

          {/* Tarjeta del paciente */}
          <View style={s.portadaTarjeta}>
            <Text style={s.portadaPaciente}>{patient.name}</Text>
            {profile.clinic_name ? (
              <Text style={s.portadaNutri}>{profile.clinic_name}</Text>
            ) : null}
            <Text style={s.portadaNutri}>{nombreNutricionista}</Text>
            <View style={s.portadaDivider} />
            <Text style={s.portadaAviso}>
              Este plan ha sido generado con asistencia de IA y revisado por el
              nutricionista responsable. Cualquier modificación debe consultarse con
              el profesional.
            </Text>
          </View>

          {/* Targets nutricionales */}
          <View style={s.portadaTargets}>
            <View style={s.portadaTargetCard}>
              <Text style={[s.portadaTargetValor, { color: C.kcalText }]}>
                {target_daily_calories}
              </Text>
              <Text style={s.portadaTargetLabel}>kcal/día</Text>
            </View>
            <View style={s.portadaTargetCard}>
              <Text style={[s.portadaTargetValor, { color: C.protText }]}>
                {target_macros.protein_g}g
              </Text>
              <Text style={s.portadaTargetLabel}>Proteína</Text>
            </View>
            <View style={s.portadaTargetCard}>
              <Text style={[s.portadaTargetValor, { color: C.carbText }]}>
                {target_macros.carbs_g}g
              </Text>
              <Text style={s.portadaTargetLabel}>Carbohidratos</Text>
            </View>
            <View style={s.portadaTargetCard}>
              <Text style={[s.portadaTargetValor, { color: C.fatText }]}>
                {target_macros.fat_g}g
              </Text>
              <Text style={s.portadaTargetLabel}>Grasas</Text>
            </View>
          </View>
        </View>

        <Footer />
      </Page>

      {/* ── Resumen semanal + primeros 2 días ── */}
      <Page size="A4" style={s.pagina}>
        <HeaderPagina nombrePaciente={patient.name} />
        <View style={s.cuerpo}>
          <Text style={s.tituloSeccion}>Resumen semanal</Text>
          <View style={s.filaResumen}>
            <View style={s.tarjetaResumen}>
              <Text style={s.valorResumen}>{target_daily_calories} kcal</Text>
              <Text style={s.etiquetaResumen}>Calorías objetivo/día</Text>
            </View>
            <View style={s.tarjetaResumen}>
              <Text style={s.valorResumen}>{target_macros.protein_g}g</Text>
              <Text style={s.etiquetaResumen}>Proteína</Text>
            </View>
            <View style={s.tarjetaResumen}>
              <Text style={s.valorResumen}>{target_macros.carbs_g}g</Text>
              <Text style={s.etiquetaResumen}>Carbohidratos</Text>
            </View>
            <View style={s.tarjetaResumen}>
              <Text style={s.valorResumen}>{target_macros.fat_g}g</Text>
              <Text style={s.etiquetaResumen}>Grasas</Text>
            </View>
          </View>

          {content.days.slice(0, 2).map((day) => (
            <SeccionDia key={day.day_number} day={day} />
          ))}
        </View>
        <Footer />
      </Page>

      {/* ── Días restantes (de 3 en adelante, uno por página) ── */}
      {content.days.slice(2).map((day) => (
        <Page key={day.day_number} size="A4" style={s.pagina}>
          <HeaderPagina nombrePaciente={patient.name} />
          <View style={s.cuerpo}>
            <SeccionDia day={day} />
          </View>
          <Footer />
        </Page>
      ))}

      {/* ── Lista de la compra ── */}
      <ListaCompraPage content={content} nombrePaciente={patient.name} />
    </Document>
  );
}
