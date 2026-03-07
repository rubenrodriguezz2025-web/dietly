// Componente PDF del plan nutricional — solo servidor
// Sin "use client", sin hooks, sin Context.
// Usar exclusivamente con renderToBuffer() en la API route.

import type { Patient, PlanContent, Profile } from '@/types/dietly';
import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';

const C = {
  primary: '#16a34a',
  primaryLight: '#dcfce7',
  texto: '#18181b',
  apagado: '#71717a',
  apagadoClaro: '#a1a1aa',
  borde: '#e4e4e7',
  fondo: '#f9fafb',
  blanco: '#ffffff',
};

const estilos = StyleSheet.create({
  pagina: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: C.texto,
    paddingTop: 44,
    paddingBottom: 52,
    paddingHorizontal: 44,
    lineHeight: 1.4,
  },
  // Portada
  portada: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  portadaTitulo: {
    fontSize: 28,
    fontFamily: 'Helvetica-Bold',
    color: C.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  portadaSubtitulo: {
    fontSize: 14,
    color: C.apagado,
    marginBottom: 40,
    textAlign: 'center',
  },
  portadaCaja: {
    backgroundColor: C.fondo,
    borderRadius: 8,
    padding: 24,
    width: 380,
    alignItems: 'center',
  },
  portadaPaciente: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 6,
    textAlign: 'center',
  },
  portadaMeta: {
    fontSize: 10,
    color: C.apagado,
    textAlign: 'center',
    marginBottom: 4,
  },
  portadaAviso: {
    fontSize: 8,
    color: C.apagadoClaro,
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },
  // Cabecera de página
  cabeceraPagina: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.borde,
    borderBottomStyle: 'solid',
  },
  cabeceraPaginaTitulo: {
    fontSize: 9,
    color: C.apagado,
  },
  cabeceraPaginaMarca: {
    fontSize: 9,
    color: C.primary,
    fontFamily: 'Helvetica-Bold',
  },
  // Título de sección
  tituloSeccion: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: C.primary,
    marginBottom: 10,
    marginTop: 16,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: C.primaryLight,
    borderBottomStyle: 'solid',
  },
  // Resumen semanal
  filaResumen: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  tarjetaResumen: {
    flex: 1,
    backgroundColor: C.fondo,
    borderRadius: 6,
    padding: 10,
    marginRight: 6,
    alignItems: 'center',
  },
  tarjetaResumenUltima: {
    marginRight: 0,
  },
  valorResumen: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: C.primary,
    marginBottom: 2,
  },
  etiquetaResumen: {
    fontSize: 8,
    color: C.apagado,
    textAlign: 'center',
  },
  // Día
  contenedorDia: {
    marginBottom: 20,
  },
  cabeceraDia: {
    backgroundColor: C.primary,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  nombreDia: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: C.blanco,
  },
  macrosDia: {
    fontSize: 9,
    color: C.primaryLight,
  },
  // Comida
  contenedorComida: {
    backgroundColor: C.blanco,
    borderWidth: 1,
    borderColor: C.borde,
    borderStyle: 'solid',
    borderRadius: 6,
    padding: 10,
    marginBottom: 6,
  },
  cabeceraComida: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  tipoComida: {
    fontSize: 8,
    color: C.apagadoClaro,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  nombreComida: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
  },
  cajaMacros: {
    backgroundColor: C.fondo,
    borderRadius: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  kcalGrande: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: C.primary,
    marginRight: 6,
  },
  itemMacro: {
    fontSize: 8,
    color: C.apagado,
    marginRight: 4,
  },
  // Ingredientes
  etiquetaIngredientes: {
    fontSize: 8,
    color: C.apagado,
    marginBottom: 4,
  },
  filaIngredientes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chipIngrediente: {
    backgroundColor: C.fondo,
    borderRadius: 3,
    paddingVertical: 2,
    paddingHorizontal: 6,
    marginRight: 4,
    marginBottom: 3,
    flexDirection: 'row',
  },
  nombreIngrediente: {
    fontSize: 8,
    color: C.texto,
    marginRight: 2,
  },
  cantidadIngrediente: {
    fontSize: 8,
    color: C.apagadoClaro,
  },
  // Preparación
  etiquetaPrep: {
    fontSize: 8,
    color: C.apagado,
    marginTop: 6,
    marginBottom: 2,
  },
  textoPrep: {
    fontSize: 9,
    color: C.texto,
    lineHeight: 1.5,
  },
  // Lista de la compra
  seccionCompra: {
    marginBottom: 14,
  },
  tituloCategoriaCompra: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: C.texto,
    marginBottom: 5,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: C.borde,
    borderBottomStyle: 'solid',
  },
  itemCompra: {
    fontSize: 9,
    color: C.apagado,
    marginBottom: 3,
    paddingLeft: 8,
  },
  // Pie de página
  piePagina: {
    position: 'absolute',
    bottom: 24,
    left: 44,
    right: 44,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textoPie: {
    fontSize: 8,
    color: C.apagadoClaro,
  },
  avisoLegalPie: {
    fontSize: 7,
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

// ── Subcomponentes ─────────────────────────────────────────────────────────────

function CabeceraPagina({
  nombrePaciente,
  nombreNutricionista,
}: {
  nombrePaciente: string;
  nombreNutricionista: string;
}) {
  return (
    <View style={estilos.cabeceraPagina}>
      <Text style={estilos.cabeceraPaginaTitulo}>Plan nutricional · {nombrePaciente}</Text>
      <Text style={estilos.cabeceraPaginaMarca}>Dietly · {nombreNutricionista}</Text>
    </View>
  );
}

function PiePagina({ nombreNutricionista }: { nombreNutricionista: string }) {
  return (
    <View style={estilos.piePagina}>
      <Text style={estilos.textoPie}>{nombreNutricionista}</Text>
      <Text style={estilos.avisoLegalPie}>
        Borrador generado por IA · Revisado y aprobado por el nutricionista
      </Text>
    </View>
  );
}

const TIPOS_COMIDA: Record<string, string> = {
  desayuno: 'Desayuno',
  media_manana: 'Media mañana',
  almuerzo: 'Almuerzo',
  merienda: 'Merienda',
  cena: 'Cena',
};

const CATEGORIAS_COMPRA: Array<[string, string]> = [
  ['produce', 'Frutas y verduras'],
  ['protein', 'Proteínas'],
  ['dairy', 'Lácteos'],
  ['grains', 'Cereales y pan'],
  ['pantry', 'Despensa'],
];

function TarjetaComida({ meal }: { meal: PropsPDF['content']['days'][0]['meals'][0] }) {
  return (
    <View style={estilos.contenedorComida}>
      <View style={estilos.cabeceraComida}>
        <View>
          <Text style={estilos.tipoComida}>
            {TIPOS_COMIDA[meal.meal_type] ?? meal.meal_type}
            {meal.time_suggestion ? `  ·  ${meal.time_suggestion}` : ''}
          </Text>
          <Text style={estilos.nombreComida}>{meal.meal_name}</Text>
        </View>
        <View style={estilos.cajaMacros}>
          <Text style={estilos.kcalGrande}>{meal.calories} kcal</Text>
          <Text style={estilos.itemMacro}>{meal.macros.protein_g}g P</Text>
          <Text style={estilos.itemMacro}>{meal.macros.carbs_g}g C</Text>
          <Text style={estilos.itemMacro}>{meal.macros.fat_g}g G</Text>
        </View>
      </View>

      {meal.ingredients.length > 0 && (
        <>
          <Text style={estilos.etiquetaIngredientes}>Ingredientes</Text>
          <View style={estilos.filaIngredientes}>
            {meal.ingredients.map((ing, i) => (
              <View key={i} style={estilos.chipIngrediente}>
                <Text style={estilos.nombreIngrediente}>{ing.name}</Text>
                <Text style={estilos.cantidadIngrediente}>
                  {ing.quantity} {ing.unit}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}

      {meal.preparation && (
        <>
          <Text style={estilos.etiquetaPrep}>Preparación</Text>
          <Text style={estilos.textoPrep}>{meal.preparation}</Text>
        </>
      )}
    </View>
  );
}

function SeccionDia({ day }: { day: PropsPDF['content']['days'][0] }) {
  return (
    <View style={estilos.contenedorDia}>
      <View style={estilos.cabeceraDia}>
        <Text style={estilos.nombreDia}>{day.day_name}</Text>
        <Text style={estilos.macrosDia}>
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

// ── Documento PDF principal ───────────────────────────────────────────────────

export function NutritionPlanPDF({ plan, content, patient, profile }: PropsPDF) {
  const fechaSemana = new Date(plan.week_start_date).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const nombreNutricionista = profile.full_name || 'Nutricionista';

  return (
    <Document
      title={`Plan nutricional - ${patient.name}`}
      author={nombreNutricionista}
      creator="Dietly"
    >
      {/* Portada */}
      <Page size="A4" style={estilos.pagina}>
        <View style={estilos.portada}>
          <Text style={estilos.portadaTitulo}>Plan Nutricional</Text>
          <Text style={estilos.portadaSubtitulo}>Semana del {fechaSemana}</Text>
          <View style={estilos.portadaCaja}>
            <Text style={estilos.portadaPaciente}>{patient.name}</Text>
            {profile.clinic_name && (
              <Text style={estilos.portadaMeta}>{profile.clinic_name}</Text>
            )}
            <Text style={estilos.portadaMeta}>{nombreNutricionista}</Text>
            <Text style={estilos.portadaAviso}>
              Este plan ha sido generado con asistencia de IA y revisado por el
              nutricionista responsable. Cualquier modificación debe consultarse con
              el profesional.
            </Text>
          </View>
        </View>
        <PiePagina nombreNutricionista={nombreNutricionista} />
      </Page>

      {/* Resumen semanal + primeros 2 días */}
      <Page size="A4" style={estilos.pagina}>
        <CabeceraPagina nombrePaciente={patient.name} nombreNutricionista={nombreNutricionista} />

        <Text style={estilos.tituloSeccion}>Resumen semanal</Text>
        <View style={estilos.filaResumen}>
          <View style={estilos.tarjetaResumen}>
            <Text style={estilos.valorResumen}>
              {content.week_summary.target_daily_calories} kcal
            </Text>
            <Text style={estilos.etiquetaResumen}>Calorías objetivo/día</Text>
          </View>
          <View style={estilos.tarjetaResumen}>
            <Text style={estilos.valorResumen}>
              {content.week_summary.target_macros.protein_g}g
            </Text>
            <Text style={estilos.etiquetaResumen}>Proteína</Text>
          </View>
          <View style={estilos.tarjetaResumen}>
            <Text style={estilos.valorResumen}>
              {content.week_summary.target_macros.carbs_g}g
            </Text>
            <Text style={estilos.etiquetaResumen}>Carbohidratos</Text>
          </View>
          <View style={[estilos.tarjetaResumen, estilos.tarjetaResumenUltima]}>
            <Text style={estilos.valorResumen}>
              {content.week_summary.target_macros.fat_g}g
            </Text>
            <Text style={estilos.etiquetaResumen}>Grasas</Text>
          </View>
        </View>

        {content.days.slice(0, 2).map((day) => (
          <SeccionDia key={day.day_number} day={day} />
        ))}

        <PiePagina nombreNutricionista={nombreNutricionista} />
      </Page>

      {/* Días restantes (uno por página) */}
      {content.days.slice(2).map((day) => (
        <Page key={day.day_number} size="A4" style={estilos.pagina}>
          <CabeceraPagina
            nombrePaciente={patient.name}
            nombreNutricionista={nombreNutricionista}
          />
          <SeccionDia day={day} />
          <PiePagina nombreNutricionista={nombreNutricionista} />
        </Page>
      ))}

      {/* Lista de la compra */}
      <Page size="A4" style={estilos.pagina}>
        <CabeceraPagina nombrePaciente={patient.name} nombreNutricionista={nombreNutricionista} />
        <Text style={estilos.tituloSeccion}>Lista de la compra</Text>

        {CATEGORIAS_COMPRA.map(([clave, etiqueta]) => {
          const items =
            content.shopping_list[clave as keyof typeof content.shopping_list];
          if (!items || items.length === 0) return null;
          return (
            <View key={clave} style={estilos.seccionCompra}>
              <Text style={estilos.tituloCategoriaCompra}>{etiqueta}</Text>
              {items.map((item, i) => (
                <Text key={i} style={estilos.itemCompra}>
                  · {item}
                </Text>
              ))}
            </View>
          );
        })}

        <PiePagina nombreNutricionista={nombreNutricionista} />
      </Page>
    </Document>
  );
}
