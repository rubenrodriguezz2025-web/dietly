import { z } from 'zod';

const ACTIVITY_LEVELS = [
  'sedentary',
  'lightly_active',
  'moderately_active',
  'very_active',
  'extra_active',
] as const;

const GOALS = [
  'weight_loss',
  'weight_gain',
  'maintenance',
  'muscle_gain',
  'health',
] as const;

const SEX_VALUES = ['male', 'female', 'other'] as const;

const COOKING_PREFERENCES = ['simple', 'medium', 'elaborate'] as const;

const TRAINING_TIMES = ['morning', 'afternoon', 'evening'] as const;

const emptyToNull = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((v) => (v === '' || v === undefined ? null : v), schema.nullable());

const dateOfBirth = z
  .string()
  .refine(
    (val) => {
      const date = new Date(val);
      if (Number.isNaN(date.getTime())) return false;
      const now = new Date();
      const min = new Date('1900-01-01');
      return date < now && date > min;
    },
    { message: 'Fecha de nacimiento no válida' },
  );

export const createPatientSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(200, 'El nombre no puede exceder 200 caracteres'),
  email: emptyToNull(z.string().email('Email no válido').max(320)),
  date_of_birth: emptyToNull(dateOfBirth),
  sex: emptyToNull(z.enum(SEX_VALUES)),
  weight_kg: emptyToNull(
    z.coerce
      .number({ invalid_type_error: 'Peso no válido' })
      .min(1, 'Peso mínimo 1 kg')
      .max(500, 'Peso máximo 500 kg'),
  ),
  height_cm: emptyToNull(
    z.coerce
      .number({ invalid_type_error: 'Altura no válida' })
      .min(30, 'Altura mínima 30 cm')
      .max(300, 'Altura máxima 300 cm'),
  ),
  activity_level: emptyToNull(z.enum(ACTIVITY_LEVELS)),
  goal: emptyToNull(z.enum(GOALS)),
  dietary_restrictions: z.array(z.string().max(100)).max(50).nullable(),
  allergies: emptyToNull(z.string().max(1000)),
  intolerances: emptyToNull(z.string().max(1000)),
  preferences: emptyToNull(z.string().max(2000)),
  medical_notes: emptyToNull(z.string().max(5000)),
  cooking_preference: emptyToNull(z.enum(COOKING_PREFERENCES)),
  sport_type: emptyToNull(z.string().max(100)),
  training_days_per_week: emptyToNull(
    z.coerce.number().int().min(1, 'Mínimo 1 día').max(7, 'Máximo 7 días'),
  ),
  training_time: emptyToNull(z.enum(TRAINING_TIMES)),
  training_schedule: emptyToNull(z.string().max(200)),
  supplementation: emptyToNull(z.string().max(2000)),
});

export type CreatePatientInput = z.infer<typeof createPatientSchema>;

// ── Field-level schemas para updatePatientField ─────────────────────────────
// Cada campo se valida por separado al editar inline. `null` = limpiar valor.

export const PATIENT_FIELD_SCHEMAS: Record<string, z.ZodType> = {
  name: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(200),
  email: z.union([z.literal(''), z.string().email('Email no válido').max(320), z.null()]),
  phone: z.union([z.literal(''), z.string().max(20), z.null()]),
  date_of_birth: z.union([z.literal(''), dateOfBirth, z.null()]),
  sex: z.union([z.literal(''), z.enum(SEX_VALUES), z.null()]),
  weight_kg: z.union([
    z.null(),
    z.coerce.number().min(1, 'Peso mínimo 1 kg').max(500, 'Peso máximo 500 kg'),
  ]),
  height_cm: z.union([
    z.null(),
    z.coerce.number().min(30, 'Altura mínima 30 cm').max(300, 'Altura máxima 300 cm'),
  ]),
  activity_level: z.union([z.literal(''), z.enum(ACTIVITY_LEVELS), z.null()]),
  goal: z.union([z.literal(''), z.enum(GOALS), z.null()]),
  // Llega como string CSV o null desde updatePatientField antes de splitear
  dietary_restrictions: z.union([z.string().max(5000), z.null()]),
  allergies: z.union([z.string().max(1000), z.null()]),
  intolerances: z.union([z.string().max(1000), z.null()]),
  preferences: z.union([z.string().max(2000), z.null()]),
  medical_notes: z.union([z.string().max(5000), z.null()]),
  cooking_preference: z.union([z.literal(''), z.enum(COOKING_PREFERENCES), z.null()]),
  sport_type: z.union([z.literal(''), z.string().max(100), z.null()]),
  training_days_per_week: z.union([
    z.null(),
    z.coerce.number().int().min(1, 'Mínimo 1 día').max(7, 'Máximo 7 días'),
  ]),
  training_time: z.union([z.literal(''), z.enum(TRAINING_TIMES), z.null()]),
  training_schedule: z.union([z.literal(''), z.string().max(200), z.null()]),
  supplementation: z.union([z.literal(''), z.string().max(2000), z.null()]),
  // Booleano llega desde el cliente como string 'true'/'false' o número
  allow_meal_swaps: z.union([z.boolean(), z.literal('true'), z.literal('false'), z.literal(0), z.literal(1)]),
};
