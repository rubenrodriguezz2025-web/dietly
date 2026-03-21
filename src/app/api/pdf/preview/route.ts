import React from 'react';

import type { FontPreference } from '@/components/pdf/NutritionPlanPDF';
import { NutritionPlanPDF } from '@/components/pdf/NutritionPlanPDF';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { renderToBuffer } from '@react-pdf/renderer';

// ── Datos ficticios hardcodeados — sin llamar a Claude API ────────────────────

const PREVIEW_PATIENT = {
  name: 'María García',
  email: 'maria@ejemplo.com',
};

const PREVIEW_PLAN = {
  week_start_date: new Date().toISOString(),
};

// 5 comidas × 7 días — datos realistas para validar conteo de páginas
const MAKE_DAY = (
  n: number,
  name: string,
  meals: Array<{ type: string; mealName: string; time: string; kcal: number; p: number; c: number; g: number; ingredients: Array<{ name: string; qty: number; unit: string }>; prep: string }>
) => ({
  day_number: n,
  day_name: name,
  total_calories: meals.reduce((s, m) => s + m.kcal, 0),
  total_macros: {
    protein_g: meals.reduce((s, m) => s + m.p, 0),
    carbs_g: meals.reduce((s, m) => s + m.c, 0),
    fat_g: meals.reduce((s, m) => s + m.g, 0),
  },
  meals: meals.map((m) => ({
    meal_type: m.type,
    meal_name: m.mealName,
    time_suggestion: m.time,
    calories: m.kcal,
    macros: { protein_g: m.p, carbs_g: m.c, fat_g: m.g },
    ingredients: m.ingredients.map((i) => ({ name: i.name, quantity: i.qty, unit: i.unit })),
    preparation: m.prep,
    notes: '',
  })),
});

const PREVIEW_CONTENT = {
  week_summary: {
    target_daily_calories: 1800,
    target_macros: { protein_g: 130, carbs_g: 195, fat_g: 60 },
    weekly_averages: { calories: 1792, protein_g: 128, carbs_g: 192, fat_g: 61 },
    protein_per_kg: 1.8,
    carbs_pct: 0.55,
    fat_pct: 0.45,
    goal: 'lose_weight',
  },
  days: [
    MAKE_DAY(1, 'Lunes', [
      { type: 'desayuno', mealName: 'Tostadas de centeno con aguacate y huevo', time: '08:00', kcal: 390, p: 22, c: 36, g: 16, ingredients: [{ name: 'Pan de centeno', qty: 60, unit: 'g' }, { name: 'Aguacate', qty: 70, unit: 'g' }, { name: 'Huevo L', qty: 2, unit: 'ud.' }, { name: 'Tomate', qty: 50, unit: 'g' }], prep: 'Tostar el pan. Aplastar el aguacate con sal y limón. Pochar los huevos 3 min. Montar encima del pan.' },
      { type: 'media_manana', mealName: 'Yogur griego con frutos secos', time: '11:00', kcal: 220, p: 14, c: 18, g: 9, ingredients: [{ name: 'Yogur griego 0%', qty: 200, unit: 'g' }, { name: 'Nueces', qty: 20, unit: 'g' }, { name: 'Miel', qty: 10, unit: 'g' }], prep: 'Servir el yogur frío. Añadir las nueces y la miel por encima.' },
      { type: 'almuerzo', mealName: 'Pollo al limón con arroz integral y brócoli', time: '14:00', kcal: 580, p: 52, c: 64, g: 14, ingredients: [{ name: 'Pechuga de pollo', qty: 200, unit: 'g' }, { name: 'Arroz integral', qty: 80, unit: 'g' }, { name: 'Brócoli', qty: 180, unit: 'g' }, { name: 'Aceite de oliva', qty: 10, unit: 'ml' }, { name: 'Limón', qty: 0.5, unit: 'ud.' }], prep: 'Cocer el arroz 20 min. Saltear el pollo con aceite y zumo de limón 8 min. Cocer el brócoli al vapor 5 min.' },
      { type: 'merienda', mealName: 'Manzana con mantequilla de almendra', time: '17:30', kcal: 185, p: 5, c: 24, g: 8, ingredients: [{ name: 'Manzana', qty: 150, unit: 'g' }, { name: 'Mantequilla de almendra', qty: 20, unit: 'g' }], prep: 'Cortar la manzana en gajos y servir con la mantequilla de almendra como dip.' },
      { type: 'cena', mealName: 'Merluza al horno con patata y pisto', time: '21:00', kcal: 420, p: 42, c: 38, g: 12, ingredients: [{ name: 'Merluza', qty: 200, unit: 'g' }, { name: 'Patata', qty: 120, unit: 'g' }, { name: 'Calabacín', qty: 100, unit: 'g' }, { name: 'Pimiento rojo', qty: 80, unit: 'g' }], prep: 'Hornear la merluza a 180 °C 15 min. Asar las verduras con un chorrito de aceite 20 min.' },
    ]),
    MAKE_DAY(2, 'Martes', [
      { type: 'desayuno', mealName: 'Porridge de avena con plátano y canela', time: '08:00', kcal: 370, p: 14, c: 62, g: 8, ingredients: [{ name: 'Copos de avena', qty: 70, unit: 'g' }, { name: 'Leche semidesnatada', qty: 200, unit: 'ml' }, { name: 'Plátano', qty: 100, unit: 'g' }, { name: 'Canela', qty: 1, unit: 'g' }], prep: 'Cocer la avena en la leche a fuego medio 5 min removiendo. Añadir el plátano troceado y la canela.' },
      { type: 'media_manana', mealName: 'Queso fresco con fresas', time: '11:00', kcal: 150, p: 12, c: 14, g: 4, ingredients: [{ name: 'Queso fresco batido', qty: 150, unit: 'g' }, { name: 'Fresas', qty: 100, unit: 'g' }], prep: 'Servir el queso fresco con las fresas laminadas por encima. Endulzar con sacarina si se desea.' },
      { type: 'almuerzo', mealName: 'Lentejas estofadas con verduras', time: '14:00', kcal: 540, p: 28, c: 72, g: 10, ingredients: [{ name: 'Lentejas cocidas', qty: 200, unit: 'g' }, { name: 'Zanahoria', qty: 80, unit: 'g' }, { name: 'Cebolla', qty: 70, unit: 'g' }, { name: 'Tomate triturado', qty: 100, unit: 'g' }, { name: 'Aceite de oliva', qty: 10, unit: 'ml' }], prep: 'Sofreír la cebolla y zanahoria 8 min. Añadir el tomate y las lentejas. Cocer 15 min a fuego suave.' },
      { type: 'merienda', mealName: 'Batido de proteínas con leche', time: '17:30', kcal: 210, p: 30, c: 16, g: 3, ingredients: [{ name: 'Proteína de suero', qty: 30, unit: 'g' }, { name: 'Leche desnatada', qty: 200, unit: 'ml' }], prep: 'Mezclar la proteína con la leche fría en la coctelera o batidora hasta disolver bien.' },
      { type: 'cena', mealName: 'Tortilla de verduras con ensalada', time: '21:00', kcal: 380, p: 26, c: 22, g: 18, ingredients: [{ name: 'Huevo L', qty: 3, unit: 'ud.' }, { name: 'Pimiento verde', qty: 80, unit: 'g' }, { name: 'Champiñones', qty: 100, unit: 'g' }, { name: 'Lechuga', qty: 60, unit: 'g' }, { name: 'Tomate', qty: 80, unit: 'g' }], prep: 'Saltear las verduras 5 min. Batir los huevos y mezclar. Cuajar la tortilla 3 min por lado. Servir con ensalada.' },
    ]),
    MAKE_DAY(3, 'Miércoles', [
      { type: 'desayuno', mealName: 'Tazón de frutas con granola y yogur', time: '08:00', kcal: 360, p: 12, c: 58, g: 9, ingredients: [{ name: 'Yogur natural', qty: 150, unit: 'g' }, { name: 'Granola sin azúcar', qty: 40, unit: 'g' }, { name: 'Frutos del bosque', qty: 100, unit: 'g' }, { name: 'Kiwi', qty: 80, unit: 'g' }], prep: 'Disponer el yogur en un bol. Añadir la granola, el kiwi troceado y los frutos del bosque.' },
      { type: 'media_manana', mealName: 'Tostada con pavo y tomate', time: '11:00', kcal: 190, p: 16, c: 22, g: 4, ingredients: [{ name: 'Pan integral', qty: 40, unit: 'g' }, { name: 'Pavo en lonchas', qty: 60, unit: 'g' }, { name: 'Tomate', qty: 50, unit: 'g' }], prep: 'Tostar el pan. Añadir el tomate en rodajas y el pavo encima.' },
      { type: 'almuerzo', mealName: 'Salmón con quinoa y espinacas salteadas', time: '14:00', kcal: 590, p: 48, c: 52, g: 20, ingredients: [{ name: 'Salmón fresco', qty: 180, unit: 'g' }, { name: 'Quinoa', qty: 70, unit: 'g' }, { name: 'Espinacas', qty: 120, unit: 'g' }, { name: 'Ajo', qty: 2, unit: 'dientes' }, { name: 'Aceite de oliva', qty: 12, unit: 'ml' }], prep: 'Cocer la quinoa 15 min. Saltear el salmón a la plancha 4 min por lado. Sofreír las espinacas con ajo 3 min.' },
      { type: 'merienda', mealName: 'Naranja y puñado de almendras', time: '17:30', kcal: 170, p: 6, c: 20, g: 8, ingredients: [{ name: 'Naranja', qty: 200, unit: 'g' }, { name: 'Almendras crudas', qty: 20, unit: 'g' }], prep: 'Pelar y consumir la naranja. Tomar las almendras como complemento.' },
      { type: 'cena', mealName: 'Crema de calabaza con pollo a la plancha', time: '21:00', kcal: 390, p: 38, c: 30, g: 12, ingredients: [{ name: 'Calabaza', qty: 300, unit: 'g' }, { name: 'Pechuga de pollo', qty: 150, unit: 'g' }, { name: 'Cebolla', qty: 60, unit: 'g' }, { name: 'Caldo de verduras', qty: 200, unit: 'ml' }], prep: 'Cocer la calabaza con cebolla y caldo 20 min. Triturar hasta obtener crema. Hacer el pollo a la plancha 6 min.' },
    ]),
    MAKE_DAY(4, 'Jueves', [
      { type: 'desayuno', mealName: 'Revuelto de huevos con espinacas y queso', time: '08:00', kcal: 350, p: 28, c: 8, g: 22, ingredients: [{ name: 'Huevos L', qty: 3, unit: 'ud.' }, { name: 'Espinacas baby', qty: 80, unit: 'g' }, { name: 'Queso feta', qty: 30, unit: 'g' }, { name: 'Aceite de oliva', qty: 8, unit: 'ml' }], prep: 'Saltear las espinacas 2 min. Añadir los huevos batidos y remover a fuego bajo. Añadir el queso al final.' },
      { type: 'media_manana', mealName: 'Café con leche y fruta', time: '11:00', kcal: 130, p: 6, c: 18, g: 3, ingredients: [{ name: 'Leche semidesnatada', qty: 150, unit: 'ml' }, { name: 'Café', qty: 1, unit: 'taza' }, { name: 'Pera', qty: 150, unit: 'g' }], prep: 'Preparar el café con leche caliente. Consumir con la pera como acompañamiento.' },
      { type: 'almuerzo', mealName: 'Pasta integral con atún y tomate cherry', time: '14:00', kcal: 570, p: 36, c: 74, g: 12, ingredients: [{ name: 'Pasta integral', qty: 90, unit: 'g' }, { name: 'Atún en agua', qty: 150, unit: 'g' }, { name: 'Tomate cherry', qty: 120, unit: 'g' }, { name: 'Ajo', qty: 2, unit: 'dientes' }, { name: 'Aceite de oliva', qty: 10, unit: 'ml' }], prep: 'Cocer la pasta al dente 9 min. Saltear el ajo con tomates 5 min. Mezclar con el atún y la pasta.' },
      { type: 'merienda', mealName: 'Requesón con arándanos', time: '17:30', kcal: 160, p: 14, c: 16, g: 4, ingredients: [{ name: 'Requesón', qty: 150, unit: 'g' }, { name: 'Arándanos', qty: 80, unit: 'g' }], prep: 'Servir el requesón frío con los arándanos encima.' },
      { type: 'cena', mealName: 'Dorada al horno con verduras asadas', time: '21:00', kcal: 410, p: 40, c: 28, g: 14, ingredients: [{ name: 'Dorada', qty: 250, unit: 'g' }, { name: 'Patata', qty: 100, unit: 'g' }, { name: 'Pimiento rojo', qty: 80, unit: 'g' }, { name: 'Cebolla roja', qty: 70, unit: 'g' }], prep: 'Hornear la dorada con las verduras a 200 °C durante 20 min. Aliñar con aceite y sal antes de servir.' },
    ]),
    MAKE_DAY(5, 'Viernes', [
      { type: 'desayuno', mealName: 'Pancakes de avena y plátano', time: '08:30', kcal: 400, p: 18, c: 60, g: 10, ingredients: [{ name: 'Copos de avena molida', qty: 80, unit: 'g' }, { name: 'Plátano maduro', qty: 100, unit: 'g' }, { name: 'Huevo L', qty: 2, unit: 'ud.' }, { name: 'Leche', qty: 60, unit: 'ml' }], prep: 'Triturar todos los ingredientes. Cocinar en sartén antiadherente 2 min por lado a fuego medio.' },
      { type: 'media_manana', mealName: 'Batido verde de espinacas y manzana', time: '11:00', kcal: 140, p: 4, c: 28, g: 2, ingredients: [{ name: 'Espinacas', qty: 60, unit: 'g' }, { name: 'Manzana', qty: 150, unit: 'g' }, { name: 'Agua', qty: 150, unit: 'ml' }], prep: 'Triturar todos los ingredientes juntos en la batidora hasta obtener una textura homogénea.' },
      { type: 'almuerzo', mealName: 'Ternera salteada con garbanzos y col kale', time: '14:00', kcal: 560, p: 48, c: 44, g: 18, ingredients: [{ name: 'Ternera magra', qty: 180, unit: 'g' }, { name: 'Garbanzos cocidos', qty: 120, unit: 'g' }, { name: 'Col kale', qty: 100, unit: 'g' }, { name: 'Ajo', qty: 2, unit: 'dientes' }, { name: 'Aceite de oliva', qty: 12, unit: 'ml' }], prep: 'Saltear la ternera troceada a fuego alto 5 min. Añadir los garbanzos y la kale. Cocer 5 min más.' },
      { type: 'merienda', mealName: 'Palitos de zanahoria con hummus', time: '17:30', kcal: 175, p: 6, c: 22, g: 7, ingredients: [{ name: 'Zanahoria', qty: 150, unit: 'g' }, { name: 'Hummus', qty: 60, unit: 'g' }], prep: 'Cortar la zanahoria en palitos finos. Servir con el hummus para mojar.' },
      { type: 'cena', mealName: 'Sopa de verduras con huevo escalfado', time: '21:00', kcal: 310, p: 22, c: 30, g: 10, ingredients: [{ name: 'Caldo de pollo casero', qty: 400, unit: 'ml' }, { name: 'Zanahoria', qty: 80, unit: 'g' }, { name: 'Apio', qty: 60, unit: 'g' }, { name: 'Huevo L', qty: 2, unit: 'ud.' }], prep: 'Cocer las verduras en el caldo 15 min. Escalfar los huevos 3 min en agua con vinagre. Servir en el caldo.' },
    ]),
    MAKE_DAY(6, 'Sábado', [
      { type: 'desayuno', mealName: 'Tostadas con tomate y jamón ibérico', time: '09:00', kcal: 360, p: 22, c: 38, g: 12, ingredients: [{ name: 'Pan de masa madre', qty: 70, unit: 'g' }, { name: 'Tomate maduro', qty: 100, unit: 'g' }, { name: 'Jamón ibérico', qty: 40, unit: 'g' }, { name: 'Aceite de oliva', qty: 8, unit: 'ml' }], prep: 'Frotar el pan tostado con el tomate partido. Aliñar con aceite y sal. Colocar el jamón encima.' },
      { type: 'media_manana', mealName: 'Frutas de temporada variadas', time: '11:30', kcal: 140, p: 2, c: 32, g: 1, ingredients: [{ name: 'Melocotón', qty: 150, unit: 'g' }, { name: 'Uvas', qty: 80, unit: 'g' }], prep: 'Lavar y consumir la fruta fresca.' },
      { type: 'almuerzo', mealName: 'Paella de marisco ligera', time: '14:30', kcal: 600, p: 40, c: 72, g: 14, ingredients: [{ name: 'Arroz redondo', qty: 90, unit: 'g' }, { name: 'Gambas', qty: 150, unit: 'g' }, { name: 'Mejillones', qty: 100, unit: 'g' }, { name: 'Pimiento rojo', qty: 80, unit: 'g' }, { name: 'Azafrán', qty: 0.5, unit: 'g' }], prep: 'Sofreír el pimiento. Añadir el marisco 2 min. Incorporar el arroz, el caldo y el azafrán. Cocer 18 min sin remover.' },
      { type: 'merienda', mealName: 'Horchata de chufa natural', time: '17:30', kcal: 160, p: 2, c: 28, g: 5, ingredients: [{ name: 'Horchata natural', qty: 250, unit: 'ml' }], prep: 'Servir bien fría. Sin azúcar añadido.' },
      { type: 'cena', mealName: 'Ensalada de pollo, aguacate y mango', time: '21:00', kcal: 380, p: 34, c: 26, g: 14, ingredients: [{ name: 'Pechuga de pollo', qty: 150, unit: 'g' }, { name: 'Aguacate', qty: 80, unit: 'g' }, { name: 'Mango', qty: 100, unit: 'g' }, { name: 'Rúcula', qty: 60, unit: 'g' }, { name: 'Vinagreta de lima', qty: 15, unit: 'ml' }], prep: 'Hacer el pollo a la plancha y dejar templar. Cortar todos los ingredientes y mezclar con la vinagreta.' },
    ]),
    MAKE_DAY(7, 'Domingo', [
      { type: 'desayuno', mealName: 'Huevos Benedict con salmón ahumado', time: '09:30', kcal: 420, p: 30, c: 28, g: 20, ingredients: [{ name: 'Huevo L', qty: 2, unit: 'ud.' }, { name: 'Salmón ahumado', qty: 60, unit: 'g' }, { name: 'Pan inglés integral', qty: 60, unit: 'g' }, { name: 'Espinacas baby', qty: 40, unit: 'g' }], prep: 'Tostar el pan. Escalfar los huevos 3 min. Montar con espinacas y salmón. Terminar con pimienta negra.' },
      { type: 'media_manana', mealName: 'Smoothie bowl de mango y coco', time: '12:00', kcal: 230, p: 6, c: 42, g: 6, ingredients: [{ name: 'Mango congelado', qty: 150, unit: 'g' }, { name: 'Leche de coco', qty: 80, unit: 'ml' }, { name: 'Coco rallado', qty: 10, unit: 'g' }, { name: 'Semillas de chía', qty: 10, unit: 'g' }], prep: 'Triturar el mango con la leche de coco hasta obtener una crema espesa. Decorar con coco y chía.' },
      { type: 'almuerzo', mealName: 'Cocido de garbanzos con verduras y ternera', time: '14:30', kcal: 580, p: 46, c: 54, g: 18, ingredients: [{ name: 'Garbanzos cocidos', qty: 200, unit: 'g' }, { name: 'Ternera magra', qty: 150, unit: 'g' }, { name: 'Patata', qty: 100, unit: 'g' }, { name: 'Zanahoria', qty: 80, unit: 'g' }, { name: 'Repollo', qty: 80, unit: 'g' }], prep: 'Cocer todos los ingredientes juntos en abundante agua con sal durante 40 min. Servir caliente con un chorrito de aceite.' },
      { type: 'merienda', mealName: 'Queso de cabra con membrillo', time: '17:30', kcal: 180, p: 8, c: 18, g: 9, ingredients: [{ name: 'Queso de cabra fresco', qty: 60, unit: 'g' }, { name: 'Membrillo', qty: 40, unit: 'g' }], prep: 'Servir el queso de cabra con el membrillo en rodajas. Acompañar con unas nueces si se desea.' },
      { type: 'cena', mealName: 'Bacalao al pil-pil con judías verdes', time: '21:00', kcal: 390, p: 44, c: 24, g: 12, ingredients: [{ name: 'Lomo de bacalao', qty: 200, unit: 'g' }, { name: 'Judías verdes', qty: 200, unit: 'g' }, { name: 'Ajo', qty: 3, unit: 'dientes' }, { name: 'Aceite de oliva', qty: 20, unit: 'ml' }], prep: 'Confitar el bacalao con ajo en aceite tibio 15 min. Cocer las judías al vapor 8 min. Emulsionar el pil-pil moviendo en círculos.' },
    ]),
  ],
  shopping_list: {
    protein: ['Pechuga de pollo 500g', 'Salmón fresco 360g', 'Salmón ahumado 60g', 'Merluza 200g', 'Dorada 250g', 'Atún en agua 150g', 'Gambas 150g', 'Mejillones 100g', 'Bacalao lomo 200g', 'Ternera magra 330g', 'Jamón ibérico 40g', 'Pavo lonchas 60g', 'Huevos L (docena)'],
    produce: ['Aguacate ×3', 'Brócoli 180g', 'Espinacas baby 400g', 'Tomate cherry 200g', 'Tomate maduro 300g', 'Calabacín 100g', 'Pimiento rojo ×3', 'Pimiento verde 80g', 'Calabaza 300g', 'Zanahoria 500g', 'Cebolla roja 70g', 'Col kale 100g', 'Repollo 80g', 'Judías verdes 200g', 'Fresas 100g', 'Arándanos 80g', 'Frutos del bosque 100g', 'Kiwi ×2', 'Manzana ×2', 'Pera 150g', 'Naranja 200g', 'Plátano ×3', 'Mango ×2', 'Melocotón 150g', 'Uvas 80g', 'Limón ×2'],
    dairy: ['Yogur griego 0% ×4', 'Yogur natural 150g', 'Leche semidesnatada 1L', 'Leche desnatada 500ml', 'Queso feta 30g', 'Queso fresco batido 150g', 'Requesón 150g', 'Queso de cabra 60g', 'Leche de coco 80ml'],
    grains: ['Pan de centeno 60g', 'Pan integral 80g', 'Pan de masa madre 70g', 'Pan inglés integral 60g', 'Copos de avena 140g', 'Arroz integral 80g', 'Arroz redondo 90g', 'Quinoa 70g', 'Pasta integral 90g', 'Granola sin azúcar 40g'],
    pantry: ['Aceite de oliva virgen extra', 'Garbanzos cocidos bote 440g', 'Lentejas cocidas bote 200g', 'Tomate triturado 100g', 'Caldo de verduras 200ml', 'Caldo de pollo 400ml', 'Nueces 20g', 'Almendras crudas 20g', 'Mantequilla de almendra 20g', 'Hummus 60g', 'Semillas de chía 10g', 'Coco rallado 10g', 'Membrillo 40g', 'Miel 10g', 'Azafrán 0.5g', 'Canela molida', 'Vinagreta de lima'],
  },
};

// ── Helper: descarga imagen de Storage como data URI base64 ───────────────────

async function downloadAsDataUri(
  supabase: Awaited<ReturnType<typeof import('@/libs/supabase/supabase-server-client').createSupabaseServerClient>>,
  bucket: string,
  path: string
): Promise<string | null> {
  try {
    const { data: blob } = await supabase.storage.from(bucket).download(path);
    if (!blob) return null;
    const buf = await blob.arrayBuffer();
    const b64 = Buffer.from(buf).toString('base64');
    return `data:${(blob as Blob).type || 'image/png'};base64,${b64}`;
  } catch {
    return null;
  }
}

// ── Handler compartido ────────────────────────────────────────────────────────

async function handlePreview() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { data: profileData } = await (supabase as any)
    .from('profiles')
    .select(
      'full_name, clinic_name, logo_url, signature_url, college_number, primary_color, show_macros, show_shopping_list, welcome_message, font_preference, profile_photo_url'
    )
    .eq('id', user.id)
    .single();

  // Determinar si tiene suscripción Pro (para logo/firma)
  const { data: subscription } = await (supabase as any)
    .from('subscriptions')
    .select('status, prices(products(name))')
    .in('status', ['trialing', 'active'])
    .maybeSingle();

  const productName: string = (subscription as any)?.prices?.products?.name ?? '';
  const is_pro =
    subscription != null &&
    (productName.toLowerCase().includes('pro') ||
      productName.toLowerCase().includes('profesional') ||
      productName === '');

  let logo_uri: string | null = null;
  let signature_uri: string | null = null;
  let profile_photo_uri: string | null = null;

  if (is_pro && profileData?.logo_url) {
    logo_uri = await downloadAsDataUri(supabase, 'nutritionist-logos', profileData.logo_url as string);
  }
  if (is_pro && profileData?.signature_url) {
    signature_uri = await downloadAsDataUri(supabase, 'nutritionist-signatures', profileData.signature_url as string);
  }
  if (profileData?.profile_photo_url) {
    profile_photo_uri = await downloadAsDataUri(supabase, 'nutritionist-photos', profileData.profile_photo_url as string);
  }

  const profile = {
    full_name: (profileData?.full_name as string) || 'Nutricionista Demo',
    clinic_name: (profileData?.clinic_name as string | null) ?? null,
    college_number: (profileData?.college_number as string | null) ?? null,
    primary_color: (profileData?.primary_color as string | null) ?? '#1a7a45',
    show_macros: (profileData?.show_macros as boolean | null) ?? true,
    show_shopping_list: (profileData?.show_shopping_list as boolean | null) ?? true,
    welcome_message: (profileData?.welcome_message as string | null) ?? null,
    font_preference: ((profileData?.font_preference as string | null) ?? 'clasica') as FontPreference,
    profile_photo_url: (profileData?.profile_photo_url as string | null) ?? null,
  };

  try {
    const elemento = React.createElement(NutritionPlanPDF, {
      plan: PREVIEW_PLAN,
      content: PREVIEW_CONTENT,
      patient: PREVIEW_PATIENT,
      profile,
      logo_uri,
      signature_uri,
      profile_photo_uri,
      is_pro,
      approved_at: new Date().toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }),
    });

    const buffer = await renderToBuffer(elemento as React.ReactElement);

    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="preview-mi-marca.pdf"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('[pdf/preview] Error generando PDF:', err);
    return Response.json(
      { error: 'Error al generar el PDF. Inténtalo de nuevo.' },
      { status: 500 }
    );
  }
}

export const GET = handlePreview;
export const POST = handlePreview;
