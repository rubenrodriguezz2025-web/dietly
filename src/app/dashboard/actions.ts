'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

export async function markOnboardingComplete(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from('profiles')
    .update({ onboarding_completed_at: new Date().toISOString() })
    .eq('id', user.id);

  revalidatePath('/dashboard');
}

const DEMO_PLAN_CONTENT = {
  week_summary: {
    target_daily_calories: 1800,
    target_macros: { protein_g: 130, carbs_g: 200, fat_g: 65 },
    weekly_averages: { calories: 1795, protein_g: 128, carbs_g: 198, fat_g: 64 },
  },
  days: [
    {
      day_number: 1, day_name: 'Lunes', total_calories: 1790,
      total_macros: { protein_g: 129, carbs_g: 199, fat_g: 63 },
      meals: [
        { meal_type: 'desayuno', meal_name: 'Tostadas con aguacate y huevo pochado', time_suggestion: '08:00', calories: 420, macros: { protein_g: 22, carbs_g: 38, fat_g: 18 }, ingredients: [{ name: 'Pan de centeno', quantity: 60, unit: 'g' }, { name: 'Aguacate', quantity: 80, unit: 'g' }, { name: 'Huevo', quantity: 2, unit: 'uds' }], preparation: 'Tostar el pan, aplastar el aguacate con sal y limón, colocar los huevos pochados encima.', notes: '' },
        { meal_type: 'media_manana', meal_name: 'Yogur griego con nueces', time_suggestion: '11:00', calories: 200, macros: { protein_g: 12, carbs_g: 14, fat_g: 10 }, ingredients: [{ name: 'Yogur griego 0%', quantity: 150, unit: 'g' }, { name: 'Nueces', quantity: 15, unit: 'g' }], preparation: 'Servir el yogur con las nueces troceadas por encima.', notes: '' },
        { meal_type: 'almuerzo', meal_name: 'Pollo a la plancha con arroz integral y verduras', time_suggestion: '14:00', calories: 580, macros: { protein_g: 45, carbs_g: 62, fat_g: 14 }, ingredients: [{ name: 'Pechuga de pollo', quantity: 150, unit: 'g' }, { name: 'Arroz integral', quantity: 70, unit: 'g' }, { name: 'Brócoli', quantity: 100, unit: 'g' }, { name: 'Zanahoria', quantity: 60, unit: 'g' }, { name: 'Aceite de oliva', quantity: 10, unit: 'ml' }], preparation: 'Cocinar el arroz. Hacer el pollo a la plancha con un poco de aceite. Saltear las verduras al dente.', notes: '' },
        { meal_type: 'merienda', meal_name: 'Manzana con mantequilla de cacahuete', time_suggestion: '17:30', calories: 210, macros: { protein_g: 5, carbs_g: 30, fat_g: 9 }, ingredients: [{ name: 'Manzana', quantity: 1, unit: 'ud' }, { name: 'Mantequilla de cacahuete', quantity: 15, unit: 'g' }], preparation: 'Cortar la manzana en rodajas y untar con la mantequilla de cacahuete.', notes: '' },
        { meal_type: 'cena', meal_name: 'Salmón al horno con patata y espárragos', time_suggestion: '21:00', calories: 380, macros: { protein_g: 45, carbs_g: 55, fat_g: 12 }, ingredients: [{ name: 'Salmón fresco', quantity: 150, unit: 'g' }, { name: 'Patata', quantity: 150, unit: 'g' }, { name: 'Espárragos verdes', quantity: 100, unit: 'g' }, { name: 'Limón', quantity: 1, unit: 'ud' }], preparation: 'Precalentar horno a 200°C. Colocar el salmón con rodajas de limón, la patata cortada y los espárragos. Hornear 20 minutos.', notes: '' },
      ],
    },
    {
      day_number: 2, day_name: 'Martes', total_calories: 1810,
      total_macros: { protein_g: 132, carbs_g: 195, fat_g: 66 },
      meals: [
        { meal_type: 'desayuno', meal_name: 'Porridge de avena con frutos rojos', time_suggestion: '08:00', calories: 380, macros: { protein_g: 14, carbs_g: 58, fat_g: 10 }, ingredients: [{ name: 'Copos de avena', quantity: 60, unit: 'g' }, { name: 'Leche semidesnatada', quantity: 200, unit: 'ml' }, { name: 'Frutos rojos', quantity: 80, unit: 'g' }, { name: 'Miel', quantity: 10, unit: 'g' }], preparation: 'Calentar la leche con la avena a fuego medio 5 min. Servir con frutos rojos y miel.', notes: '' },
        { meal_type: 'media_manana', meal_name: 'Tostada integral con tomate y jamón', time_suggestion: '11:00', calories: 180, macros: { protein_g: 12, carbs_g: 20, fat_g: 5 }, ingredients: [{ name: 'Pan integral', quantity: 40, unit: 'g' }, { name: 'Tomate rallado', quantity: 50, unit: 'g' }, { name: 'Jamón serrano', quantity: 30, unit: 'g' }], preparation: 'Tostar el pan, untar el tomate rallado con un hilo de aceite y colocar el jamón.', notes: '' },
        { meal_type: 'almuerzo', meal_name: 'Lentejas estofadas con verduras', time_suggestion: '14:00', calories: 550, macros: { protein_g: 35, carbs_g: 68, fat_g: 12 }, ingredients: [{ name: 'Lentejas cocidas', quantity: 200, unit: 'g' }, { name: 'Pimiento rojo', quantity: 60, unit: 'g' }, { name: 'Cebolla', quantity: 50, unit: 'g' }, { name: 'Zanahoria', quantity: 60, unit: 'g' }, { name: 'Aceite de oliva', quantity: 10, unit: 'ml' }], preparation: 'Sofreír la cebolla, el pimiento y la zanahoria. Añadir las lentejas y cocinar 15 min a fuego lento.', notes: '' },
        { meal_type: 'merienda', meal_name: 'Batido de plátano y proteína', time_suggestion: '17:30', calories: 250, macros: { protein_g: 28, carbs_g: 28, fat_g: 4 }, ingredients: [{ name: 'Plátano', quantity: 1, unit: 'ud' }, { name: 'Proteína en polvo', quantity: 30, unit: 'g' }, { name: 'Leche semidesnatada', quantity: 200, unit: 'ml' }], preparation: 'Batir todos los ingredientes hasta obtener una textura suave.', notes: '' },
        { meal_type: 'cena', meal_name: 'Tortilla francesa con ensalada mixta', time_suggestion: '21:00', calories: 450, macros: { protein_g: 43, carbs_g: 21, fat_g: 35 }, ingredients: [{ name: 'Huevos', quantity: 3, unit: 'uds' }, { name: 'Lechuga', quantity: 80, unit: 'g' }, { name: 'Tomate cherry', quantity: 80, unit: 'g' }, { name: 'Aceite de oliva', quantity: 15, unit: 'ml' }, { name: 'Queso fresco', quantity: 40, unit: 'g' }], preparation: 'Batir los huevos y hacer la tortilla en sartén antiadherente. Preparar la ensalada con un aliño de aceite y vinagre.', notes: '' },
      ],
    },
    {
      day_number: 3, day_name: 'Miércoles', total_calories: 1780,
      total_macros: { protein_g: 125, carbs_g: 202, fat_g: 62 },
      meals: [
        { meal_type: 'desayuno', meal_name: 'Tostada integral con queso fresco y tomate', time_suggestion: '08:00', calories: 350, macros: { protein_g: 18, carbs_g: 40, fat_g: 12 }, ingredients: [{ name: 'Pan integral', quantity: 60, unit: 'g' }, { name: 'Queso fresco', quantity: 60, unit: 'g' }, { name: 'Tomate', quantity: 80, unit: 'g' }, { name: 'Aceite de oliva', quantity: 5, unit: 'ml' }], preparation: 'Tostar el pan, colocar el queso fresco y el tomate en rodajas. Aliñar con aceite y orégano.', notes: '' },
        { meal_type: 'media_manana', meal_name: 'Fruta de temporada', time_suggestion: '11:00', calories: 100, macros: { protein_g: 1, carbs_g: 24, fat_g: 0 }, ingredients: [{ name: 'Naranja', quantity: 1, unit: 'ud' }, { name: 'Kiwi', quantity: 1, unit: 'ud' }], preparation: 'Pelar y consumir la fruta fresca.', notes: '' },
        { meal_type: 'almuerzo', meal_name: 'Merluza al horno con patatas panaderas', time_suggestion: '14:00', calories: 520, macros: { protein_g: 42, carbs_g: 52, fat_g: 14 }, ingredients: [{ name: 'Merluza', quantity: 180, unit: 'g' }, { name: 'Patata', quantity: 150, unit: 'g' }, { name: 'Cebolla', quantity: 40, unit: 'g' }, { name: 'Aceite de oliva', quantity: 10, unit: 'ml' }, { name: 'Perejil', quantity: 5, unit: 'g' }], preparation: 'Laminar patatas y cebolla en la fuente del horno con aceite. Hornear 20 min a 190°C. Colocar la merluza encima y hornear 15 min más.', notes: '' },
        { meal_type: 'merienda', meal_name: 'Hummus con crudités de zanahoria', time_suggestion: '17:30', calories: 220, macros: { protein_g: 8, carbs_g: 26, fat_g: 10 }, ingredients: [{ name: 'Hummus', quantity: 80, unit: 'g' }, { name: 'Zanahoria', quantity: 120, unit: 'g' }], preparation: 'Cortar la zanahoria en bastones y servir con el hummus para dipear.', notes: '' },
        { meal_type: 'cena', meal_name: 'Ensalada de quinoa con pollo y aguacate', time_suggestion: '21:00', calories: 590, macros: { protein_g: 56, carbs_g: 60, fat_g: 26 }, ingredients: [{ name: 'Quinoa', quantity: 60, unit: 'g' }, { name: 'Pechuga de pollo', quantity: 120, unit: 'g' }, { name: 'Aguacate', quantity: 60, unit: 'g' }, { name: 'Tomate cherry', quantity: 60, unit: 'g' }, { name: 'Pepino', quantity: 60, unit: 'g' }], preparation: 'Cocinar la quinoa. Cortar el pollo en dados y hacer a la plancha. Mezclar todo con el aguacate, tomates y pepino.', notes: '' },
      ],
    },
    {
      day_number: 4, day_name: 'Jueves', total_calories: 1800,
      total_macros: { protein_g: 130, carbs_g: 198, fat_g: 65 },
      meals: [
        { meal_type: 'desayuno', meal_name: 'Smoothie bowl de açaí', time_suggestion: '08:00', calories: 400, macros: { protein_g: 10, carbs_g: 62, fat_g: 12 }, ingredients: [{ name: 'Pulpa de açaí', quantity: 100, unit: 'g' }, { name: 'Plátano', quantity: 1, unit: 'ud' }, { name: 'Granola', quantity: 30, unit: 'g' }, { name: 'Frutos rojos', quantity: 50, unit: 'g' }], preparation: 'Batir el açaí con el plátano congelado. Servir en bol con granola y frutos rojos por encima.', notes: '' },
        { meal_type: 'media_manana', meal_name: 'Requesón con miel', time_suggestion: '11:00', calories: 160, macros: { protein_g: 14, carbs_g: 16, fat_g: 4 }, ingredients: [{ name: 'Requesón', quantity: 120, unit: 'g' }, { name: 'Miel', quantity: 10, unit: 'g' }], preparation: 'Servir el requesón con un hilo de miel.', notes: '' },
        { meal_type: 'almuerzo', meal_name: 'Pasta integral con atún y tomate', time_suggestion: '14:00', calories: 560, macros: { protein_g: 38, carbs_g: 68, fat_g: 14 }, ingredients: [{ name: 'Pasta integral', quantity: 80, unit: 'g' }, { name: 'Atún al natural', quantity: 120, unit: 'g' }, { name: 'Tomate triturado', quantity: 100, unit: 'g' }, { name: 'Aceite de oliva', quantity: 10, unit: 'ml' }, { name: 'Ajo', quantity: 1, unit: 'diente' }], preparation: 'Cocinar la pasta al dente. Sofreír el ajo, añadir tomate triturado y el atún escurrido. Mezclar con la pasta.', notes: '' },
        { meal_type: 'merienda', meal_name: 'Mix de frutos secos', time_suggestion: '17:30', calories: 200, macros: { protein_g: 6, carbs_g: 10, fat_g: 16 }, ingredients: [{ name: 'Almendras', quantity: 15, unit: 'g' }, { name: 'Nueces', quantity: 10, unit: 'g' }, { name: 'Pasas', quantity: 10, unit: 'g' }], preparation: 'Mezclar y consumir como snack.', notes: '' },
        { meal_type: 'cena', meal_name: 'Revuelto de espárragos trigueros con gambas', time_suggestion: '21:00', calories: 480, macros: { protein_g: 62, carbs_g: 42, fat_g: 19 }, ingredients: [{ name: 'Gambas peladas', quantity: 150, unit: 'g' }, { name: 'Huevos', quantity: 2, unit: 'uds' }, { name: 'Espárragos trigueros', quantity: 120, unit: 'g' }, { name: 'Pan integral', quantity: 40, unit: 'g' }, { name: 'Aceite de oliva', quantity: 10, unit: 'ml' }], preparation: 'Saltear los espárragos troceados con las gambas. Añadir los huevos batidos y revolver hasta cuajar. Servir con pan.', notes: '' },
      ],
    },
    {
      day_number: 5, day_name: 'Viernes', total_calories: 1790,
      total_macros: { protein_g: 126, carbs_g: 200, fat_g: 63 },
      meals: [
        { meal_type: 'desayuno', meal_name: 'Tortitas de avena con plátano', time_suggestion: '08:00', calories: 410, macros: { protein_g: 16, carbs_g: 60, fat_g: 12 }, ingredients: [{ name: 'Copos de avena', quantity: 50, unit: 'g' }, { name: 'Huevo', quantity: 1, unit: 'ud' }, { name: 'Plátano', quantity: 1, unit: 'ud' }, { name: 'Canela', quantity: 2, unit: 'g' }], preparation: 'Batir el huevo con la avena y el plátano. Cocinar en sartén antiadherente como tortitas. Espolvorear canela.', notes: '' },
        { meal_type: 'media_manana', meal_name: 'Queso fresco con membrillo', time_suggestion: '11:00', calories: 180, macros: { protein_g: 10, carbs_g: 22, fat_g: 5 }, ingredients: [{ name: 'Queso fresco', quantity: 60, unit: 'g' }, { name: 'Membrillo', quantity: 25, unit: 'g' }], preparation: 'Servir el queso con el membrillo cortado en láminas finas.', notes: '' },
        { meal_type: 'almuerzo', meal_name: 'Poke bowl de salmón', time_suggestion: '14:00', calories: 580, macros: { protein_g: 42, carbs_g: 60, fat_g: 18 }, ingredients: [{ name: 'Arroz basmati', quantity: 70, unit: 'g' }, { name: 'Salmón fresco', quantity: 120, unit: 'g' }, { name: 'Edamame', quantity: 40, unit: 'g' }, { name: 'Aguacate', quantity: 50, unit: 'g' }, { name: 'Salsa de soja', quantity: 10, unit: 'ml' }], preparation: 'Cocinar el arroz. Cortar el salmón en dados. Montar el bol con arroz, salmón, edamame, aguacate y aliñar con soja.', notes: '' },
        { meal_type: 'merienda', meal_name: 'Yogur con semillas de chía', time_suggestion: '17:30', calories: 190, macros: { protein_g: 12, carbs_g: 18, fat_g: 8 }, ingredients: [{ name: 'Yogur natural', quantity: 150, unit: 'g' }, { name: 'Semillas de chía', quantity: 10, unit: 'g' }], preparation: 'Mezclar el yogur con las semillas de chía. Dejar reposar 5 min.', notes: '' },
        { meal_type: 'cena', meal_name: 'Crema de calabacín con huevo cocido', time_suggestion: '21:00', calories: 430, macros: { protein_g: 46, carbs_g: 40, fat_g: 20 }, ingredients: [{ name: 'Calabacín', quantity: 200, unit: 'g' }, { name: 'Patata', quantity: 80, unit: 'g' }, { name: 'Huevos cocidos', quantity: 2, unit: 'uds' }, { name: 'Quesitos light', quantity: 2, unit: 'uds' }, { name: 'Aceite de oliva', quantity: 10, unit: 'ml' }], preparation: 'Hervir calabacín y patata. Triturar con los quesitos y aceite. Servir con los huevos cocidos partidos por la mitad.', notes: '' },
      ],
    },
    {
      day_number: 6, day_name: 'Sábado', total_calories: 1820,
      total_macros: { protein_g: 128, carbs_g: 204, fat_g: 66 },
      meals: [
        { meal_type: 'desayuno', meal_name: 'Tostada de pan de pueblo con aceite y tomate', time_suggestion: '09:00', calories: 380, macros: { protein_g: 10, carbs_g: 48, fat_g: 16 }, ingredients: [{ name: 'Pan de pueblo', quantity: 80, unit: 'g' }, { name: 'Tomate rallado', quantity: 60, unit: 'g' }, { name: 'Aceite de oliva virgen extra', quantity: 15, unit: 'ml' }], preparation: 'Tostar el pan, untar con tomate y aliñar con aceite y una pizca de sal.', notes: '' },
        { meal_type: 'media_manana', meal_name: 'Batido verde', time_suggestion: '11:30', calories: 160, macros: { protein_g: 4, carbs_g: 30, fat_g: 3 }, ingredients: [{ name: 'Espinacas baby', quantity: 40, unit: 'g' }, { name: 'Plátano', quantity: 1, unit: 'ud' }, { name: 'Manzana', quantity: 1, unit: 'ud' }], preparation: 'Batir todos los ingredientes con un poco de agua hasta obtener una textura suave.', notes: '' },
        { meal_type: 'almuerzo', meal_name: 'Paella de verduras', time_suggestion: '14:30', calories: 580, macros: { protein_g: 18, carbs_g: 82, fat_g: 16 }, ingredients: [{ name: 'Arroz bomba', quantity: 80, unit: 'g' }, { name: 'Judías verdes', quantity: 60, unit: 'g' }, { name: 'Alcachofa', quantity: 60, unit: 'g' }, { name: 'Pimiento rojo', quantity: 40, unit: 'g' }, { name: 'Azafrán', quantity: 1, unit: 'pizca' }, { name: 'Aceite de oliva', quantity: 15, unit: 'ml' }], preparation: 'Sofreír las verduras troceadas con aceite. Añadir el arroz, el azafrán y el caldo caliente. Cocinar 18-20 min sin remover.', notes: '' },
        { meal_type: 'merienda', meal_name: 'Tosta de hummus y pepino', time_suggestion: '18:00', calories: 200, macros: { protein_g: 8, carbs_g: 24, fat_g: 8 }, ingredients: [{ name: 'Pan de centeno', quantity: 40, unit: 'g' }, { name: 'Hummus', quantity: 60, unit: 'g' }, { name: 'Pepino', quantity: 50, unit: 'g' }], preparation: 'Tostar el pan, untar con hummus y colocar rodajas de pepino por encima.', notes: '' },
        { meal_type: 'cena', meal_name: 'Pechuga de pavo con pisto', time_suggestion: '21:00', calories: 500, macros: { protein_g: 88, carbs_g: 20, fat_g: 23 }, ingredients: [{ name: 'Pechuga de pavo', quantity: 160, unit: 'g' }, { name: 'Calabacín', quantity: 80, unit: 'g' }, { name: 'Berenjena', quantity: 80, unit: 'g' }, { name: 'Tomate', quantity: 80, unit: 'g' }, { name: 'Aceite de oliva', quantity: 10, unit: 'ml' }], preparation: 'Hacer el pavo a la plancha. Sofreír el calabacín, berenjena y tomate troceados para el pisto. Servir juntos.', notes: '' },
      ],
    },
    {
      day_number: 7, day_name: 'Domingo', total_calories: 1780,
      total_macros: { protein_g: 125, carbs_g: 198, fat_g: 63 },
      meals: [
        { meal_type: 'desayuno', meal_name: 'Gachas de avena con canela y manzana', time_suggestion: '09:30', calories: 370, macros: { protein_g: 12, carbs_g: 58, fat_g: 10 }, ingredients: [{ name: 'Copos de avena', quantity: 60, unit: 'g' }, { name: 'Leche semidesnatada', quantity: 200, unit: 'ml' }, { name: 'Manzana', quantity: 1, unit: 'ud' }, { name: 'Canela', quantity: 2, unit: 'g' }], preparation: 'Cocinar la avena con la leche. Añadir la manzana cortada en dados y espolvorear canela.', notes: '' },
        { meal_type: 'media_manana', meal_name: 'Tosta con queso cottage y arándanos', time_suggestion: '12:00', calories: 190, macros: { protein_g: 14, carbs_g: 22, fat_g: 5 }, ingredients: [{ name: 'Pan integral', quantity: 40, unit: 'g' }, { name: 'Queso cottage', quantity: 60, unit: 'g' }, { name: 'Arándanos', quantity: 30, unit: 'g' }], preparation: 'Tostar el pan, untar el queso cottage y cubrir con arándanos frescos.', notes: '' },
        { meal_type: 'almuerzo', meal_name: 'Pollo asado con boniato y ensalada', time_suggestion: '14:30', calories: 560, macros: { protein_g: 44, carbs_g: 58, fat_g: 16 }, ingredients: [{ name: 'Muslo de pollo', quantity: 160, unit: 'g' }, { name: 'Boniato', quantity: 150, unit: 'g' }, { name: 'Lechuga', quantity: 60, unit: 'g' }, { name: 'Tomate', quantity: 60, unit: 'g' }, { name: 'Aceite de oliva', quantity: 10, unit: 'ml' }], preparation: 'Asar el pollo con el boniato cortado en cuñas a 200°C durante 35 min. Preparar la ensalada como acompañamiento.', notes: '' },
        { meal_type: 'merienda', meal_name: 'Pudding de chía', time_suggestion: '17:30', calories: 220, macros: { protein_g: 8, carbs_g: 26, fat_g: 10 }, ingredients: [{ name: 'Semillas de chía', quantity: 20, unit: 'g' }, { name: 'Bebida de avena', quantity: 150, unit: 'ml' }, { name: 'Mango', quantity: 60, unit: 'g' }], preparation: 'Mezclar chía con la bebida de avena. Refrigerar 2h mínimo. Servir con mango troceado.', notes: '' },
        { meal_type: 'cena', meal_name: 'Sopa de verduras con huevo escalfado', time_suggestion: '21:00', calories: 440, macros: { protein_g: 47, carbs_g: 34, fat_g: 22 }, ingredients: [{ name: 'Caldo de verduras', quantity: 300, unit: 'ml' }, { name: 'Zanahoria', quantity: 60, unit: 'g' }, { name: 'Puerro', quantity: 60, unit: 'g' }, { name: 'Huevos', quantity: 2, unit: 'uds' }, { name: 'Pan integral', quantity: 30, unit: 'g' }], preparation: 'Hervir las verduras cortadas en el caldo 15 min. Escalfar los huevos en la sopa. Servir con pan tostado.', notes: '' },
      ],
    },
  ],
  shopping_list: {
    produce: ['Aguacate x2', 'Tomates 500g', 'Brócoli 200g', 'Zanahoria 500g', 'Espárragos 300g', 'Calabacín 400g', 'Espinacas baby 100g', 'Lechuga 2 uds', 'Pepino 2 uds', 'Limón 2 uds', 'Manzana 3 uds', 'Plátano 4 uds', 'Naranja 1 ud', 'Kiwi 1 ud', 'Frutos rojos 200g', 'Arándanos 50g', 'Mango 1 ud', 'Boniato 200g'],
    protein: ['Pechuga de pollo 400g', 'Muslo de pollo 200g', 'Salmón fresco 300g', 'Merluza 200g', 'Atún al natural 2 latas', 'Gambas peladas 200g', 'Pechuga de pavo 200g', 'Huevos 2 docenas', 'Jamón serrano 100g'],
    dairy: ['Yogur griego 0% x4', 'Queso fresco 250g', 'Requesón 150g', 'Queso cottage 100g', 'Leche semidesnatada 1L', 'Quesitos light 1 caja'],
    grains: ['Pan de centeno 200g', 'Pan integral 300g', 'Pan de pueblo 100g', 'Copos de avena 300g', 'Arroz integral 200g', 'Arroz bomba 100g', 'Arroz basmati 100g', 'Pasta integral 100g', 'Quinoa 100g', 'Granola 50g'],
    pantry: ['Aceite de oliva virgen extra', 'Mantequilla de cacahuete', 'Hummus 200g', 'Miel', 'Lentejas cocidas 2 botes', 'Semillas de chía 50g', 'Almendras 50g', 'Nueces 50g', 'Edamame congelado', 'Azafrán', 'Bebida de avena 200ml', 'Proteína en polvo', 'Pulpa de açaí', 'Membrillo 50g'],
  },
};

export async function createDemoPatient(): Promise<{ error?: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const patientId = crypto.randomUUID();
  const planId = crypto.randomUUID();

  // Crear paciente demo
  const { error: patientError } = await supabase.from('patients').insert({
    id: patientId,
    nutritionist_id: user.id,
    name: 'María García (Demo)',
    email: null,
    date_of_birth: '1990-05-15',
    sex: 'female',
    weight_kg: 65,
    height_cm: 165,
    activity_level: 'moderately_active',
    goal: 'health',
    dietary_restrictions: null,
    allergies: null,
    intolerances: null,
    preferences: 'Dieta mediterránea, cocina variada',
    medical_notes: null,
    tmb: 1387,
    tdee: 2150,
  });

  if (patientError) {
    return { error: `Error al crear paciente demo: ${patientError.message}` };
  }

  // Crear consentimiento demo
  await supabase.from('patient_consents').insert({
    patient_id: patientId,
    nutritionist_id: user.id,
    consent_type: 'ai_processing',
    consent_text_version: 'demo-v1',
    ip_address: null,
  });

  // Crear plan completo
  const { error: planError } = await supabase.from('nutrition_plans').insert({
    id: planId,
    patient_id: patientId,
    nutritionist_id: user.id,
    status: 'draft',
    content: DEMO_PLAN_CONTENT,
    generated_at: new Date().toISOString(),
    ai_model: 'demo',
  });

  if (planError) {
    return { error: `Error al crear plan demo: ${planError.message}` };
  }

  revalidatePath('/dashboard');
  redirect(`/dashboard/patients/${patientId}`);
}
