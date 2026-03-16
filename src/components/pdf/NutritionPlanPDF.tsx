// Componente PDF del plan nutricional — solo servidor
// Sin "use client", sin hooks, sin Context.
// Usar exclusivamente con renderToBuffer() en la API route.

import type { Patient, PlanContent, Profile } from '@/types/dietly';
import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer';

// ── Paleta base ────────────────────────────────────────────────────────────────

const BASE = {
  texto: '#18181b',
  apagado: '#52525b',
  apagadoClaro: '#a1a1aa',
  borde: '#e4e4e7',
  fondo: '#f4f4f5',
  fondoSutil: '#f9fafb',
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

// ── Tipos ─────────────────────────────────────────────────────────────────────

export type FontPreference = 'clasica' | 'moderna' | 'minimalista';

export type PropsPDF = {
  plan: { week_start_date: string };
  content: PlanContent;
  patient: Pick<Patient, 'name' | 'email'>;
  profile: Pick<Profile, 'full_name' | 'clinic_name' | 'college_number'> & {
    primary_color?: string | null;
    show_macros?: boolean | null;
    show_shopping_list?: boolean | null;
    welcome_message?: string | null;
    font_preference?: FontPreference | null;
    profile_photo_url?: string | null;
  };
  /** Data URI (base64) del logo del nutricionista. Solo se muestra si is_pro=true. */
  logo_uri: string | null;
  /** Data URI (base64) de la firma del nutricionista. Solo se muestra si is_pro=true. */
  signature_uri: string | null;
  /** Data URI (base64) de la foto de perfil del nutricionista. */
  profile_photo_uri?: string | null;
  /** true = Plan Pro → mostrar logo/firma en header, portada y footer */
  is_pro: boolean;
  /** Fecha de aprobación formateada (dd/mm/yyyy) o null si aún no aprobado */
  approved_at: string | null;
};

// ── Helpers de tipografía según preferencia ────────────────────────────────────

function getFontFamily(preference: FontPreference | null | undefined, bold = false): string {
  // react-pdf solo admite Helvetica y Courier como fuentes seguras sin registro
  // Clásica → Helvetica (serio, estándar)
  // Moderna → Helvetica-Bold para todo (impacto)
  // Minimalista → Helvetica (ligero)
  if (preference === 'moderna') {
    return bold ? 'Helvetica-Bold' : 'Helvetica-Bold';
  }
  return bold ? 'Helvetica-Bold' : 'Helvetica';
}

function getLetterSpacing(preference: FontPreference | null | undefined): number {
  if (preference === 'minimalista') return 0.6;
  if (preference === 'moderna') return 0;
  return 0.3;
}

function getLineHeight(preference: FontPreference | null | undefined): number {
  if (preference === 'minimalista') return 1.7;
  return 1.4;
}

// ── Estilos ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  pagina: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: BASE.texto,
    backgroundColor: BASE.blanco,
    paddingBottom: 80,
    lineHeight: 1.4,
  },

  // ── Header verde por página ──────────────────────────────────────────────
  headerBarra: {
    paddingHorizontal: 36,
    paddingVertical: 11,
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
    color: BASE.blanco,
    letterSpacing: 0.8,
  },
  headerSeparador: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  headerPlanLabel: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.3,
  },
  headerPaciente: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    color: BASE.blanco,
  },
  headerLogoImg: {
    height: 28,
    maxWidth: 100,
    objectFit: 'contain',
  },
  headerLogoClinica: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: BASE.blanco,
    letterSpacing: 0.8,
  },

  // ── Contenido interior ────────────────────────────────────────────────────
  cuerpo: {
    paddingHorizontal: 36,
  },

  // ── Portada hero ─────────────────────────────────────────────────────────
  portadaHero: {
    paddingHorizontal: 44,
    paddingTop: 56,
    paddingBottom: 48,
    alignItems: 'center',
  },
  portadaLogoTexto: {
    fontSize: 36,
    fontFamily: 'Helvetica-Bold',
    color: BASE.blanco,
    letterSpacing: 2,
    marginBottom: 6,
  },
  portadaClinicaTexto: {
    fontSize: 28,
    fontFamily: 'Helvetica-Bold',
    color: BASE.blanco,
    letterSpacing: 1.5,
    marginBottom: 6,
    textAlign: 'center',
  },
  portadaLogoImg: {
    height: 56,
    maxWidth: 180,
    objectFit: 'contain',
    marginBottom: 8,
  },
  portadaTagline: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.5,
  },

  // ── Portada cuerpo ────────────────────────────────────────────────────────
  portadaCuerpo: {
    flex: 1,
    paddingHorizontal: 44,
    paddingTop: 36,
    alignItems: 'center',
  },
  portadaSemana: {
    fontSize: 11,
    color: BASE.apagado,
    marginBottom: 24,
    letterSpacing: 0.3,
  },
  portadaTarjeta: {
    backgroundColor: BASE.fondo,
    borderRadius: 10,
    padding: 28,
    width: 360,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BASE.borde,
    borderStyle: 'solid',
  },
  portadaPaciente: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 6,
    textAlign: 'center',
    color: BASE.texto,
  },
  portadaNutri: {
    fontSize: 11,
    color: BASE.apagado,
    textAlign: 'center',
    marginBottom: 3,
  },
  portadaDivider: {
    width: 40,
    height: 2,
    marginVertical: 14,
  },
  portadaAviso: {
    fontSize: 8,
    color: BASE.apagadoClaro,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 1.6,
    maxWidth: 280,
  },

  // ── Targets en portada ────────────────────────────────────────────────────
  portadaTargets: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 24,
    width: 360,
  },
  portadaTargetCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BASE.borde,
    borderStyle: 'solid',
    backgroundColor: BASE.blanco,
  },
  portadaTargetValor: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
  },
  portadaTargetLabel: {
    fontSize: 7,
    color: BASE.apagadoClaro,
    textAlign: 'center',
  },

  // ── Mensaje de bienvenida (portada) ───────────────────────────────────────
  portadaMensaje: {
    marginTop: 18,
    width: 360,
    backgroundColor: BASE.blanco,
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: BASE.borde,
    borderStyle: 'solid',
  },
  portadaMensajeTexto: {
    fontSize: 9,
    color: BASE.apagado,
    lineHeight: 1.6,
    fontStyle: 'italic',
    textAlign: 'center',
  },

  // ── Portada — bloque firma profesional ───────────────────────────────────
  portadaFirmaBloque: {
    marginTop: 16,
    width: 360,
    alignItems: 'center',
  },
  portadaFirmaFoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
    objectFit: 'cover',
    marginBottom: 5,
  },
  portadaFirmaNombre: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    color: BASE.texto,
    textAlign: 'center',
  },
  portadaFirmaColegio: {
    fontSize: 7.5,
    color: BASE.apagadoClaro,
    textAlign: 'center',
    marginTop: 2,
  },

  // ── Título de sección ─────────────────────────────────────────────────────
  tituloSeccion: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 12,
    marginTop: 4,
    paddingBottom: 6,
    borderBottomWidth: 2,
    borderBottomStyle: 'solid',
  },

  // ── Tabla resumen semanal ─────────────────────────────────────────────────
  tablaResumen: {
    borderWidth: 1,
    borderColor: BASE.borde,
    borderStyle: 'solid',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 4,
  },
  tablaResumenFila: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: BASE.borde,
    borderBottomStyle: 'solid',
  },
  tablaResumenFilaUltima: {
    flexDirection: 'row',
  },
  tablaResumenHeader: {
    flexDirection: 'row',
  },
  tablaResumenCeldaHeader: {
    flex: 1,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  tablaResumenHeaderTexto: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: BASE.blanco,
    textAlign: 'center',
  },
  tablaResumenCelda: {
    flex: 1,
    paddingVertical: 7,
    paddingHorizontal: 10,
    textAlign: 'center',
  },
  tablaResumenCeldaDia: {
    flex: 1.4,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  tablaResumenTexto: {
    fontSize: 8.5,
    color: BASE.texto,
    textAlign: 'center',
  },
  tablaResumenTextoDia: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: BASE.texto,
  },

  // ── Cabecera de día (barra de color) ──────────────────────────────────────
  contenedorDia: {
    marginBottom: 18,
  },
  cabeceraDia: {
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
    color: BASE.blanco,
    letterSpacing: 0.3,
  },
  macrosDia: {
    fontSize: 8.5,
    color: 'rgba(255,255,255,0.8)',
  },

  // ── Comida ────────────────────────────────────────────────────────────────
  contenedorComida: {
    backgroundColor: BASE.blanco,
    borderWidth: 1,
    borderColor: BASE.borde,
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
    color: BASE.apagadoClaro,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 3,
  },
  nombreComida: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: BASE.texto,
    lineHeight: 1.3,
    maxWidth: 280,
  },
  horaComida: {
    fontSize: 8,
    color: BASE.apagadoClaro,
    marginTop: 2,
  },

  // ── Píldoras de macro ─────────────────────────────────────────────────────
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

  // ── Ingredientes ──────────────────────────────────────────────────────────
  etiquetaSeccionComida: {
    fontSize: 7.5,
    color: BASE.apagado,
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
    marginRight: 5,
    marginTop: 1,
  },
  nombreIngrediente: {
    fontSize: 8.5,
    color: BASE.texto,
    flex: 1,
  },
  cantidadIngrediente: {
    fontSize: 8,
    color: BASE.apagadoClaro,
    marginLeft: 3,
  },

  // ── Preparación ───────────────────────────────────────────────────────────
  contenedorPrep: {
    backgroundColor: BASE.fondoSutil,
    borderLeftWidth: 2,
    borderLeftStyle: 'solid',
    paddingLeft: 8,
    paddingVertical: 5,
    paddingRight: 6,
    borderRadius: 2,
  },
  textoPrep: {
    fontSize: 8.5,
    color: BASE.apagado,
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
    color: BASE.blanco,
  },
  listaCompraItems: {
    paddingLeft: 4,
  },
  itemCompra: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 3,
  },
  bulletCompra: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginRight: 7,
    marginTop: 3,
  },
  textoItemCompra: {
    fontSize: 9,
    color: BASE.texto,
    flex: 1,
    lineHeight: 1.4,
  },

  // ── Footer ────────────────────────────────────────────────────────────────
  piePagina: {
    position: 'absolute',
    bottom: 18,
    left: 36,
    right: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: BASE.borde,
    borderTopStyle: 'solid',
    paddingTop: 7,
  },
  footerIzquierda: {
    flexDirection: 'column',
    gap: 4,
  },
  signatureImg: {
    height: 32,
    maxWidth: 110,
    objectFit: 'contain',
    alignSelf: 'flex-start',
  },
  textoPie: {
    fontSize: 7.5,
    color: BASE.apagadoClaro,
  },
  textoPieDerecha: {
    fontSize: 7.5,
    color: BASE.apagadoClaro,
    fontStyle: 'italic',
  },

  // ── Disclaimer ────────────────────────────────────────────────────────────
  disclaimerContenedor: {
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: BASE.borde,
    borderTopStyle: 'solid',
    paddingTop: 10,
  },
  disclaimerTexto: {
    fontSize: 7,
    color: BASE.apagadoClaro,
    fontStyle: 'italic',
    lineHeight: 1.6,
    textAlign: 'center',
  },

  // ── Página profesional final ──────────────────────────────────────────────
  paginaFinalCuerpo: {
    paddingHorizontal: 44,
    paddingTop: 40,
    alignItems: 'center',
    flex: 1,
  },
  paginaFinalFoto: {
    width: 72,
    height: 72,
    borderRadius: 36,
    objectFit: 'cover',
    marginBottom: 12,
  },
  paginaFinalNombre: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: BASE.texto,
    textAlign: 'center',
    marginBottom: 4,
  },
  paginaFinalClinica: {
    fontSize: 11,
    color: BASE.apagado,
    textAlign: 'center',
    marginBottom: 4,
  },
  paginaFinalColegio: {
    fontSize: 10,
    color: BASE.apagadoClaro,
    textAlign: 'center',
    marginBottom: 4,
  },
  paginaFinalFecha: {
    fontSize: 9,
    color: BASE.apagadoClaro,
    textAlign: 'center',
    marginBottom: 20,
  },
  paginaFinalFirmaImg: {
    height: 52,
    maxWidth: 180,
    objectFit: 'contain',
    marginBottom: 4,
  },
  paginaFinalDivider: {
    width: 60,
    height: 1,
    backgroundColor: BASE.borde,
    marginVertical: 20,
  },
  paginaFinalDisclaimer: {
    maxWidth: 380,
    backgroundColor: BASE.fondo,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: BASE.borde,
    borderStyle: 'solid',
  },
  paginaFinalDisclaimerTexto: {
    fontSize: 8,
    color: BASE.apagado,
    lineHeight: 1.7,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

// ── Constantes ────────────────────────────────────────────────────────────────

const TIPOS_COMIDA: Record<string, string> = {
  desayuno: 'Desayuno',
  media_manana: 'Media mañana',
  almuerzo: 'Almuerzo',
  merienda: 'Merienda',
  cena: 'Cena',
};

const COLOR_COMIDA: Record<string, string> = {
  desayuno: BASE.mealDesayuno,
  media_manana: BASE.mealMediaManana,
  almuerzo: BASE.mealAlmuerzo,
  merienda: BASE.mealMerienda,
  cena: BASE.mealCena,
};

const CATEGORIAS_PLAN: Array<[keyof PlanContent['shopping_list'], string, string]> = [
  ['protein', 'Proteínas', BASE.catProteinas],
  ['produce', 'Frutas y verduras', BASE.catVerduras],
  ['dairy', 'Lácteos', BASE.catLacteos],
  ['grains', 'Cereales y pan', BASE.catCereales],
  ['pantry', 'Despensa', BASE.catDespensa],
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

type ItemListaCompra = { etiqueta: string; color: string; items: string[] };

function construirListaCompra(content: PlanContent): ItemListaCompra[] {
  const sl = content.shopping_list;

  const totalItems = CATEGORIAS_PLAN.reduce(
    (acc, [key]) => acc + (sl[key]?.length ?? 0),
    0
  );

  if (totalItems > 0) {
    return CATEGORIAS_PLAN
      .filter(([key]) => (sl[key]?.length ?? 0) > 0)
      .map(([key, etiqueta, color]) => ({ etiqueta, color, items: sl[key] ?? [] }));
  }

  // Fallback: agregar ingredientes únicos de todos los días
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

// ── Subcomponentes ─────────────────────────────────────────────────────────────

type HeaderProps = {
  nombrePaciente: string;
  logoUri: string | null;
  isPro: boolean;
  clinicName: string | null;
  primaryColor: string;
};

function HeaderPagina({ nombrePaciente, logoUri, isPro, clinicName, primaryColor }: HeaderProps) {
  return (
    <View style={[s.headerBarra, { backgroundColor: primaryColor }]} fixed>
      <View style={s.headerIzquierda}>
        {isPro && logoUri ? (
          // eslint-disable-next-line jsx-a11y/alt-text -- componente PDF, no HTML
          <Image src={logoUri} style={s.headerLogoImg} />
        ) : isPro && clinicName ? (
          <Text style={s.headerLogoClinica}>{clinicName}</Text>
        ) : (
          <>
            <Text style={s.headerLogo}>Dietly</Text>
            <Text style={s.headerSeparador}>·</Text>
            <Text style={s.headerPlanLabel}>Plan Nutricional</Text>
          </>
        )}
      </View>
      <Text style={s.headerPaciente}>{nombrePaciente}</Text>
    </View>
  );
}

type FooterProps = {
  nombreNutricionista: string;
  collegeNumber: string | null;
  approvedAt: string | null;
  signatureUri: string | null;
  logoUri: string | null;
  isPro: boolean;
};

function Footer({
  nombreNutricionista,
  collegeNumber,
  approvedAt,
  signatureUri,
  isPro,
}: FooterProps) {
  const partes: string[] = [`Elaborado por ${nombreNutricionista}`];
  if (collegeNumber) partes.push(`Nº colegiado ${collegeNumber}`);
  if (approvedAt) partes.push(`Aprobado el ${approvedAt}`);
  const textoFooter = partes.join(' · ');

  return (
    <View style={s.piePagina} fixed>
      <View style={s.footerIzquierda}>
        {isPro && signatureUri && (
          // eslint-disable-next-line jsx-a11y/alt-text -- componente PDF, no HTML
          <Image src={signatureUri} style={s.signatureImg} />
        )}
        <Text style={s.textoPie}>{textoFooter}</Text>
      </View>
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
      <PildoraMacro valor={calories} etiqueta="kcal" bg={BASE.kcalBg} color={BASE.kcalText} />
      <PildoraMacro valor={macros.protein_g} etiqueta="g P" bg={BASE.protBg} color={BASE.protText} />
      <PildoraMacro valor={macros.carbs_g} etiqueta="g C" bg={BASE.carbBg} color={BASE.carbText} />
      <PildoraMacro valor={macros.fat_g} etiqueta="g G" bg={BASE.fatBg} color={BASE.fatText} />
    </View>
  );
}

function TarjetaComida({
  meal,
  showMacros,
  primaryColor,
  fontPref,
}: {
  meal: PlanContent['days'][0]['meals'][0];
  showMacros: boolean;
  primaryColor: string;
  fontPref: FontPreference | null | undefined;
}) {
  const colorBorde = COLOR_COMIDA[meal.meal_type] ?? primaryColor;
  const puntoBg = colorBorde + '33'; // 20% opacity

  return (
    <View wrap={false} style={[s.contenedorComida, { borderLeftColor: colorBorde }]}>
      <View style={s.cabeceraComida}>
        <View style={s.infoComida}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={s.tipoComida}>
              {TIPOS_COMIDA[meal.meal_type] ?? meal.meal_type}
            </Text>
            <Text style={[s.nombreComida, {
              fontFamily: getFontFamily(fontPref, true),
              letterSpacing: getLetterSpacing(fontPref),
            }]}>
              {meal.meal_name}
            </Text>
            {meal.time_suggestion ? (
              <Text style={s.horaComida}>{meal.time_suggestion}</Text>
            ) : null}
          </View>
        </View>
        {showMacros && <FilaMacros calories={meal.calories} macros={meal.macros} />}
      </View>

      {meal.ingredients.length > 0 && (
        <>
          <Text style={s.etiquetaSeccionComida}>Ingredientes</Text>
          <View style={s.gridIngredientes}>
            {meal.ingredients.map((ing, i) => (
              <View key={i} style={s.celdaIngrediente}>
                <View style={[s.puntoIngrediente, { backgroundColor: puntoBg }]} />
                <Text style={s.nombreIngrediente}>{ing.name}</Text>
                <Text style={s.cantidadIngrediente}>
                  {ing.quantity} {ing.unit}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}

      {meal.preparation && (
        <>
          <Text style={s.etiquetaSeccionComida}>Preparación</Text>
          <View style={[s.contenedorPrep, { borderLeftColor: colorBorde + '66' }]}>
            <Text style={[s.textoPrep, { lineHeight: getLineHeight(fontPref) }]}>
              {meal.preparation}
            </Text>
          </View>
        </>
      )}
    </View>
  );
}

function SeccionDia({
  day,
  showMacros,
  primaryColor,
  fontPref,
}: {
  day: PlanContent['days'][0];
  showMacros: boolean;
  primaryColor: string;
  fontPref: FontPreference | null | undefined;
}) {
  return (
    <View style={s.contenedorDia}>
      <View minPresenceAhead={100} style={[s.cabeceraDia, { backgroundColor: primaryColor }]}>
        <Text style={[s.nombreDia, {
          fontFamily: getFontFamily(fontPref, true),
          letterSpacing: getLetterSpacing(fontPref),
        }]}>
          {day.day_name}
        </Text>
        {showMacros && (
          <Text style={s.macrosDia}>
            {day.total_calories} kcal · {day.total_macros.protein_g}g P ·{' '}
            {day.total_macros.carbs_g}g C · {day.total_macros.fat_g}g G
          </Text>
        )}
      </View>
      {day.meals.map((meal, i) => (
        <TarjetaComida
          key={i}
          meal={meal}
          showMacros={showMacros}
          primaryColor={primaryColor}
          fontPref={fontPref}
        />
      ))}
    </View>
  );
}

// ── Tabla de resumen semanal ───────────────────────────────────────────────────

function TablaResumenSemanal({
  content,
  showMacros,
  primaryColor,
  fontPref,
}: {
  content: PlanContent;
  showMacros: boolean;
  primaryColor: string;
  fontPref: FontPreference | null | undefined;
}) {
  const cols = showMacros
    ? ['Día', 'Kcal', 'Proteína', 'Carbos', 'Grasa']
    : ['Día'];

  return (
    <View style={s.tablaResumen}>
      {/* Header */}
      <View style={[s.tablaResumenHeader, { backgroundColor: primaryColor }]}>
        {cols.map((col, i) => (
          <View
            key={col}
            style={i === 0 ? s.tablaResumenCeldaHeader : s.tablaResumenCeldaHeader}
          >
            <Text style={s.tablaResumenHeaderTexto}>{col}</Text>
          </View>
        ))}
      </View>
      {/* Filas */}
      {content.days.map((day, idx) => (
        <View
          key={day.day_number}
          style={idx < content.days.length - 1 ? s.tablaResumenFila : s.tablaResumenFilaUltima}
        >
          <View style={s.tablaResumenCeldaDia}>
            <Text style={[s.tablaResumenTextoDia, {
              fontFamily: getFontFamily(fontPref, true),
            }]}>
              {day.day_name}
            </Text>
          </View>
          {showMacros && (
            <>
              <View style={s.tablaResumenCelda}>
                <Text style={s.tablaResumenTexto}>{day.total_calories}</Text>
              </View>
              <View style={s.tablaResumenCelda}>
                <Text style={s.tablaResumenTexto}>{day.total_macros.protein_g}g</Text>
              </View>
              <View style={s.tablaResumenCelda}>
                <Text style={s.tablaResumenTexto}>{day.total_macros.carbs_g}g</Text>
              </View>
              <View style={s.tablaResumenCelda}>
                <Text style={s.tablaResumenTexto}>{day.total_macros.fat_g}g</Text>
              </View>
            </>
          )}
        </View>
      ))}
    </View>
  );
}

// ── Lista de la compra ─────────────────────────────────────────────────────────

type ListaCompraPageProps = {
  content: PlanContent;
  nombrePaciente: string;
  logoUri: string | null;
  signatureUri: string | null;
  isPro: boolean;
  clinicName: string | null;
  nombreNutricionista: string;
  collegeNumber: string | null;
  approvedAt: string | null;
  primaryColor: string;
  fontPref: FontPreference | null | undefined;
};

function ListaCompraPage({
  content,
  nombrePaciente,
  logoUri,
  signatureUri,
  isPro,
  clinicName,
  nombreNutricionista,
  collegeNumber,
  approvedAt,
  primaryColor,
  fontPref,
}: ListaCompraPageProps) {
  const lista = construirListaCompra(content);

  return (
    <Page size="A4" style={s.pagina}>
      <HeaderPagina
        nombrePaciente={nombrePaciente}
        logoUri={logoUri}
        isPro={isPro}
        clinicName={clinicName}
        primaryColor={primaryColor}
      />
      <View style={s.cuerpo}>
        <Text style={[s.tituloSeccion, {
          color: primaryColor,
          borderBottomColor: primaryColor + '33',
          fontFamily: getFontFamily(fontPref, true),
        }]}>
          Lista de la compra
        </Text>

        {lista.length === 0 && (
          <Text style={{ fontSize: 9, color: BASE.apagado }}>
            Sin datos de lista de la compra.
          </Text>
        )}

        {lista.map(({ etiqueta, color, items }) => (
          <View key={etiqueta} style={s.seccionCompra}>
            <View style={[s.cabCompra, { backgroundColor: color }]}>
              <View style={[s.indicadorCat, { backgroundColor: 'rgba(255,255,255,0.3)' }]} />
              <Text style={s.tituloCatCompra}>{etiqueta}</Text>
            </View>
            <View style={s.listaCompraItems}>
              {items.map((item, i) => (
                <View key={i} style={s.itemCompra}>
                  <View style={[s.bulletCompra, { backgroundColor: color }]} />
                  <Text style={s.textoItemCompra}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}

        <View style={s.disclaimerContenedor}>
          <Text style={s.disclaimerTexto}>
            {`Los valores nutricionales son estimaciones calculadas mediante inteligencia artificial basadas en tablas de composición de alimentos de referencia. Este plan ha sido revisado y aprobado por ${nombreNutricionista}${collegeNumber ? `, colegiado nº ${collegeNumber}` : ''}. El profesional asume la responsabilidad clínica del plan entregado.`}
          </Text>
        </View>
      </View>
      <Footer
        nombreNutricionista={nombreNutricionista}
        collegeNumber={collegeNumber}
        approvedAt={approvedAt}
        signatureUri={signatureUri}
        logoUri={logoUri}
        isPro={isPro}
      />
    </Page>
  );
}

// ── Página profesional final ───────────────────────────────────────────────────

type PaginaFinalProps = {
  nombreNutricionista: string;
  clinicName: string | null;
  collegeNumber: string | null;
  approvedAt: string | null;
  signatureUri: string | null;
  profilePhotoUri: string | null;
  logoUri: string | null;
  isPro: boolean;
  primaryColor: string;
  fontPref: FontPreference | null | undefined;
};

function PaginaProfesional({
  nombreNutricionista,
  clinicName,
  collegeNumber,
  approvedAt,
  signatureUri,
  profilePhotoUri,
  logoUri,
  isPro,
  primaryColor,
  fontPref,
}: PaginaFinalProps) {
  return (
    <Page size="A4" style={s.pagina}>
      <HeaderPagina
        nombrePaciente=""
        logoUri={logoUri}
        isPro={isPro}
        clinicName={clinicName}
        primaryColor={primaryColor}
      />
      <View style={s.paginaFinalCuerpo}>
        {profilePhotoUri && (
          // eslint-disable-next-line jsx-a11y/alt-text -- componente PDF, no HTML
          <Image src={profilePhotoUri} style={s.paginaFinalFoto} />
        )}

        <Text style={[s.paginaFinalNombre, {
          fontFamily: getFontFamily(fontPref, true),
          color: primaryColor,
        }]}>
          {nombreNutricionista}
        </Text>

        {clinicName && (
          <Text style={s.paginaFinalClinica}>{clinicName}</Text>
        )}

        {collegeNumber && (
          <Text style={s.paginaFinalColegio}>Nº colegiado: {collegeNumber}</Text>
        )}

        {approvedAt && (
          <Text style={s.paginaFinalFecha}>Plan aprobado el {approvedAt}</Text>
        )}

        {isPro && signatureUri && (
          // eslint-disable-next-line jsx-a11y/alt-text -- componente PDF, no HTML
          <Image src={signatureUri} style={s.paginaFinalFirmaImg} />
        )}

        <View style={s.paginaFinalDivider} />

        <View style={s.paginaFinalDisclaimer}>
          <Text style={s.paginaFinalDisclaimerTexto}>
            Este plan nutricional ha sido elaborado y revisado por un profesional de la
            nutrición titulado. Está diseñado exclusivamente para el paciente indicado y
            no debe compartirse ni utilizarse como guía general. Ante cualquier duda,
            consulte a su nutricionista.
          </Text>
        </View>
      </View>
      <Footer
        nombreNutricionista={nombreNutricionista}
        collegeNumber={collegeNumber}
        approvedAt={approvedAt}
        signatureUri={signatureUri}
        logoUri={logoUri}
        isPro={isPro}
      />
    </Page>
  );
}

// ── Documento PDF principal ───────────────────────────────────────────────────

export function NutritionPlanPDF({
  plan,
  content,
  patient,
  profile,
  logo_uri,
  signature_uri,
  profile_photo_uri,
  is_pro,
  approved_at,
}: PropsPDF) {
  const fechaSemana = new Date(plan.week_start_date).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const nombreNutricionista = profile.full_name || 'Nutricionista';
  const collegeNumber = profile.college_number ?? null;
  const clinicName = profile.clinic_name ?? null;
  const primaryColor = profile.primary_color || '#1a7a45';
  const showMacros = profile.show_macros !== false;
  const showShoppingList = profile.show_shopping_list !== false;
  const welcomeMessage = profile.welcome_message ?? null;
  const fontPref = profile.font_preference ?? 'clasica';

  const { target_daily_calories, target_macros } = content.week_summary;

  const footerProps: FooterProps = {
    nombreNutricionista,
    collegeNumber,
    approvedAt: approved_at,
    signatureUri: signature_uri,
    logoUri: logo_uri,
    isPro: is_pro,
  };

  const headerProps: Omit<HeaderProps, 'nombrePaciente'> = {
    logoUri: logo_uri,
    isPro: is_pro,
    clinicName,
    primaryColor,
  };

  return (
    <Document
      title={`Plan nutricional - ${patient.name}`}
      author={nombreNutricionista}
      creator="Dietly"
    >
      {/* ── Portada ── */}
      <Page size="A4" style={s.pagina}>
        {/* Hero de color */}
        <View style={[s.portadaHero, { backgroundColor: primaryColor }]}>
          {is_pro && logo_uri ? (
            // eslint-disable-next-line jsx-a11y/alt-text -- componente PDF, no HTML
            <Image src={logo_uri} style={s.portadaLogoImg} />
          ) : is_pro && clinicName ? (
            <Text style={[s.portadaClinicaTexto, {
              fontFamily: getFontFamily(fontPref, true),
            }]}>
              {clinicName}
            </Text>
          ) : (
            <Text style={[s.portadaLogoTexto, {
              fontFamily: getFontFamily(fontPref, true),
            }]}>
              Dietly
            </Text>
          )}
          <Text style={s.portadaTagline}>Plan Nutricional Personalizado</Text>
        </View>

        {/* Cuerpo portada */}
        <View style={s.portadaCuerpo}>
          <Text style={s.portadaSemana}>Semana del {fechaSemana}</Text>

          {/* Tarjeta del paciente */}
          <View style={[s.portadaTarjeta, { borderLeftWidth: 4, borderLeftColor: primaryColor, borderLeftStyle: 'solid' }]}>
            <Text style={[s.portadaPaciente, {
              fontFamily: getFontFamily(fontPref, true),
            }]}>
              {patient.name}
            </Text>
            {clinicName && (
              <Text style={s.portadaNutri}>{clinicName}</Text>
            )}
            <Text style={s.portadaNutri}>{nombreNutricionista}</Text>
            <View style={[s.portadaDivider, { backgroundColor: primaryColor + '40' }]} />
            <Text style={s.portadaAviso}>
              Este plan ha sido generado con asistencia de IA y revisado por el
              nutricionista responsable. Cualquier modificación debe consultarse con
              el profesional.
            </Text>
          </View>

          {/* Targets nutricionales (solo si show_macros) */}
          {showMacros && (
            <View style={s.portadaTargets}>
              <View style={s.portadaTargetCard}>
                <Text style={[s.portadaTargetValor, { color: BASE.kcalText }]}>
                  {target_daily_calories}
                </Text>
                <Text style={s.portadaTargetLabel}>kcal/día</Text>
              </View>
              <View style={s.portadaTargetCard}>
                <Text style={[s.portadaTargetValor, { color: BASE.protText }]}>
                  {target_macros.protein_g}g
                </Text>
                <Text style={s.portadaTargetLabel}>Proteína</Text>
              </View>
              <View style={s.portadaTargetCard}>
                <Text style={[s.portadaTargetValor, { color: BASE.carbText }]}>
                  {target_macros.carbs_g}g
                </Text>
                <Text style={s.portadaTargetLabel}>Carbohidratos</Text>
              </View>
              <View style={s.portadaTargetCard}>
                <Text style={[s.portadaTargetValor, { color: BASE.fatText }]}>
                  {target_macros.fat_g}g
                </Text>
                <Text style={s.portadaTargetLabel}>Grasas</Text>
              </View>
            </View>
          )}

          {/* Mensaje de bienvenida */}
          {welcomeMessage && (
            <View style={s.portadaMensaje}>
              <Text style={s.portadaMensajeTexto}>{welcomeMessage}</Text>
            </View>
          )}

          {/* Bloque firma portada */}
          <View style={s.portadaFirmaBloque}>
            <Text style={s.portadaFirmaNombre}>{nombreNutricionista}</Text>
            {collegeNumber && (
              <Text style={s.portadaFirmaColegio}>Nº colegiado {collegeNumber}</Text>
            )}
          </View>
        </View>

        <Footer {...footerProps} />
      </Page>

      {/* ── Resumen semanal ── */}
      <Page size="A4" style={s.pagina}>
        <HeaderPagina nombrePaciente={patient.name} {...headerProps} />
        <View style={s.cuerpo}>
          <Text style={[s.tituloSeccion, {
            color: primaryColor,
            borderBottomColor: primaryColor + '33',
            fontFamily: getFontFamily(fontPref, true),
          }]}>
            Resumen semanal
          </Text>
          <TablaResumenSemanal
            content={content}
            showMacros={showMacros}
            primaryColor={primaryColor}
            fontPref={fontPref}
          />
        </View>
        <Footer {...footerProps} />
      </Page>

      {/* ── Un día por página ── */}
      {content.days.map((day) => (
        <Page key={day.day_number} size="A4" style={s.pagina}>
          <HeaderPagina nombrePaciente={patient.name} {...headerProps} />
          <View style={s.cuerpo}>
            <SeccionDia
              day={day}
              showMacros={showMacros}
              primaryColor={primaryColor}
              fontPref={fontPref}
            />
          </View>
          <Footer {...footerProps} />
        </Page>
      ))}

      {/* ── Lista de la compra ── */}
      {showShoppingList && (
        <ListaCompraPage
          content={content}
          nombrePaciente={patient.name}
          logoUri={logo_uri}
          signatureUri={signature_uri}
          isPro={is_pro}
          clinicName={clinicName}
          nombreNutricionista={nombreNutricionista}
          collegeNumber={collegeNumber}
          approvedAt={approved_at}
          primaryColor={primaryColor}
          fontPref={fontPref}
        />
      )}

      {/* ── Página profesional final ── */}
      <PaginaProfesional
        nombreNutricionista={nombreNutricionista}
        clinicName={clinicName}
        collegeNumber={collegeNumber}
        approvedAt={approved_at}
        signatureUri={signature_uri}
        profilePhotoUri={profile_photo_uri ?? null}
        logoUri={logo_uri}
        isPro={is_pro}
        primaryColor={primaryColor}
        fontPref={fontPref}
      />
    </Document>
  );
}
