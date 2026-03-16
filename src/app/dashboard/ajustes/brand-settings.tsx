'use client';

import { useActionState, useEffect, useRef, useState, useTransition } from 'react';
import Image from 'next/image';

import {
  deleteProfilePhoto,
  markBrandSettingsVisited,
  updateFontPreference,
  updatePrimaryColor,
  updateShowMacros,
  updateShowShoppingList,
  updateWelcomeMessage,
  uploadProfilePhoto,
} from './brand-actions';

// ── Tipos ─────────────────────────────────────────────────────────────────────

type FontPref = 'clasica' | 'moderna' | 'minimalista';
type ActionResult = { error?: string; success?: boolean };
const initial: ActionResult = {};

// ── Props ─────────────────────────────────────────────────────────────────────

export type BrandSettingsProps = {
  primaryColor: string;
  showMacros: boolean;
  showShoppingList: boolean;
  welcomeMessage: string | null;
  fontPreference: FontPref;
  profilePhotoUrl: string | null;
  brandSettingsVisitedAt: string | null;
};

// ── Toggle accesible ──────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type='button'
      role='switch'
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className='relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-[#1a7a45] focus:ring-offset-2 focus:ring-offset-zinc-950 disabled:cursor-not-allowed disabled:opacity-40'
      style={{ backgroundColor: checked ? '#1a7a45' : '#3f3f46' }}
    >
      <span
        className='pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-out'
        style={{ transform: checked ? 'translateX(20px)' : 'translateX(0)' }}
      />
    </button>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

export function BrandSettings({
  primaryColor: initialColor,
  showMacros: initialShowMacros,
  showShoppingList: initialShowShoppingList,
  welcomeMessage: initialWelcomeMessage,
  fontPreference: initialFont,
  profilePhotoUrl,
  brandSettingsVisitedAt,
}: BrandSettingsProps) {
  // Registrar primera visita a Mi marca
  useEffect(() => {
    if (!brandSettingsVisitedAt) {
      markBrandSettingsVisited();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Estado local
  const [color, setColor] = useState(initialColor || '#1a7a45');
  const [colorInput, setColorInput] = useState(initialColor || '#1a7a45');
  const [showMacros, setShowMacros] = useState(initialShowMacros);
  const [showShoppingList, setShowShoppingList] = useState(initialShowShoppingList);
  const [welcomeMessage, setWelcomeMessage] = useState(initialWelcomeMessage ?? '');
  const [fontPref, setFontPref] = useState<FontPref>(initialFont);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [colorSaved, setColorSaved] = useState(false);
  const [welcomeSaved, setWelcomeSaved] = useState(false);

  const [isPending, startTransition] = useTransition();
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Action states para foto de perfil
  const [uploadPhotoState, uploadPhotoAction, uploadPhotoPending] = useActionState(
    uploadProfilePhoto,
    initial
  );
  const [deletePhotoState, deletePhotoAction, deletePhotoPending] = useActionState(
    deleteProfilePhoto,
    initial
  );

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleColorChange(value: string) {
    setColor(value);
    setColorInput(value);
    setColorSaved(false);
  }

  function handleColorInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setColorInput(val);
    // Validar hex
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      setColor(val);
    }
    setColorSaved(false);
  }

  function handleSaveColor() {
    if (!/^#[0-9A-Fa-f]{6}$/.test(color)) return;
    startTransition(async () => {
      await updatePrimaryColor(color);
      setColorSaved(true);
    });
  }

  function handleToggleMacros(value: boolean) {
    setShowMacros(value);
    startTransition(async () => {
      await updateShowMacros(value);
    });
  }

  function handleToggleShopping(value: boolean) {
    setShowShoppingList(value);
    startTransition(async () => {
      await updateShowShoppingList(value);
    });
  }

  function handleFontChange(font: FontPref) {
    setFontPref(font);
    startTransition(async () => {
      await updateFontPreference(font);
    });
  }

  function handleSaveWelcome() {
    startTransition(async () => {
      await updateWelcomeMessage(welcomeMessage);
      setWelcomeSaved(true);
    });
  }

  function handlePhotoFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoPreview(URL.createObjectURL(file));
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const fontOptions: Array<{ id: FontPref; label: string; preview: string; desc: string }> = [
    {
      id: 'clasica',
      label: 'Clásica',
      preview: 'Plan nutricional',
      desc: 'Equilibrada y legible',
    },
    {
      id: 'moderna',
      label: 'Moderna',
      preview: 'Plan nutricional',
      desc: 'Impacto y energía',
    },
    {
      id: 'minimalista',
      label: 'Minimalista',
      preview: 'Plan nutricional',
      desc: 'Limpia y espaciada',
    },
  ];

  const hasPhoto = photoPreview ?? profilePhotoUrl;

  return (
    <div className='flex flex-col gap-8'>
      {/* ── Subsección 1: Identidad visual ── */}
      <section className='rounded-xl border border-zinc-800 bg-zinc-950 p-6'>
        <h2 className='mb-4 border-b border-zinc-800 pb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500'>
          Identidad visual
        </h2>

        <div className='flex flex-col gap-8'>
          {/* Foto de perfil */}
          <div>
            <p className='mb-3 text-sm font-medium text-zinc-300'>Foto de perfil</p>
            <p className='mb-4 text-xs text-zinc-500'>
              Aparece en la página final del PDF junto a tu nombre y firma.
            </p>

            {hasPhoto && (
              <div className='mb-4 flex items-center gap-4'>
                <div className='relative h-16 w-16 overflow-hidden rounded-full border border-zinc-700 bg-zinc-900'>
                  <Image
                    src={photoPreview ?? profilePhotoUrl!}
                    alt='Foto de perfil'
                    fill
                    className='object-cover'
                    unoptimized
                  />
                </div>
                <p className='text-xs text-zinc-500'>
                  {photoPreview ? 'Vista previa de la nueva foto' : 'Foto actual'}
                </p>
              </div>
            )}

            <form action={uploadPhotoAction} className='flex flex-col gap-3'>
              <div
                className='flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-zinc-700 px-6 py-6 transition-colors hover:border-zinc-500'
                onClick={() => photoInputRef.current?.click()}
                role='button'
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && photoInputRef.current?.click()}
              >
                <div className='text-center'>
                  <svg
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='1.5'
                    className='mx-auto mb-2 h-7 w-7 text-zinc-600'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      d='M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z'
                    />
                  </svg>
                  <p className='text-sm text-zinc-400'>
                    {photoPreview ? 'Cambiar foto' : 'Subir foto de perfil'}
                  </p>
                  <p className='mt-1 text-xs text-zinc-600'>PNG, JPG o WebP · máx. 512 KB</p>
                </div>
              </div>
              <input
                ref={photoInputRef}
                type='file'
                name='profile_photo'
                accept='image/png,image/jpeg,image/webp'
                className='hidden'
                onChange={handlePhotoFileChange}
              />
              {uploadPhotoState.error && (
                <p className='text-sm text-red-400'>{uploadPhotoState.error}</p>
              )}
              {uploadPhotoState.success && (
                <p className='text-sm text-green-400'>Foto actualizada correctamente.</p>
              )}
              <button
                type='submit'
                disabled={uploadPhotoPending || !photoPreview}
                className='self-start rounded-lg bg-[#1a7a45] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#22c55e] hover:text-black disabled:cursor-not-allowed disabled:opacity-40'
              >
                {uploadPhotoPending ? 'Subiendo...' : 'Guardar foto'}
              </button>
            </form>

            {profilePhotoUrl && !photoPreview && (
              <form action={deletePhotoAction} className='mt-2'>
                {deletePhotoState.error && (
                  <p className='mb-2 text-sm text-red-400'>{deletePhotoState.error}</p>
                )}
                <button
                  type='submit'
                  disabled={deletePhotoPending}
                  className='text-xs text-zinc-600 underline-offset-2 hover:text-red-400 hover:underline disabled:opacity-40'
                >
                  {deletePhotoPending ? 'Eliminando...' : 'Eliminar foto'}
                </button>
              </form>
            )}
          </div>

          {/* Color de marca */}
          <div>
            <p className='mb-1 text-sm font-medium text-zinc-300'>Color de marca</p>
            <p className='mb-4 text-xs text-zinc-500'>
              Se usa en cabeceras, portada y elementos destacados del PDF.
            </p>
            <div className='flex items-center gap-3'>
              <input
                type='color'
                value={color}
                onChange={(e) => handleColorChange(e.target.value)}
                className='h-10 w-14 cursor-pointer rounded-lg border border-zinc-700 bg-zinc-900 p-1'
              />
              <input
                type='text'
                value={colorInput}
                onChange={handleColorInputChange}
                maxLength={7}
                placeholder='#1a7a45'
                className='h-10 w-32 rounded-lg border border-zinc-800 bg-zinc-950 px-3 font-mono text-sm text-zinc-100 placeholder-zinc-600 focus:border-zinc-600 focus:outline-none'
              />
              <div
                className='h-10 w-10 rounded-lg border border-zinc-700'
                style={{ backgroundColor: color }}
              />
              <button
                type='button'
                onClick={handleSaveColor}
                disabled={isPending}
                className='rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-100 transition-colors hover:bg-zinc-700 disabled:opacity-40'
              >
                {colorSaved ? 'Guardado' : 'Guardar color'}
              </button>
            </div>
          </div>

          {/* Tipografía */}
          <div>
            <p className='mb-1 text-sm font-medium text-zinc-300'>Tipografía del PDF</p>
            <p className='mb-4 text-xs text-zinc-500'>
              Afecta al estilo de los títulos y textos en el PDF.
            </p>
            <div className='grid grid-cols-3 gap-3'>
              {fontOptions.map((opt) => (
                <button
                  key={opt.id}
                  type='button'
                  onClick={() => handleFontChange(opt.id)}
                  disabled={isPending}
                  className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-colors duration-150 disabled:opacity-50 ${
                    fontPref === opt.id
                      ? 'border-[#1a7a45] bg-[#1a7a45]/10'
                      : 'border-zinc-800 bg-zinc-950 hover:border-zinc-600'
                  }`}
                >
                  <span
                    className={`text-sm text-zinc-100 ${
                      opt.id === 'moderna' ? 'font-extrabold' : opt.id === 'minimalista' ? 'font-light tracking-widest' : 'font-medium'
                    }`}
                  >
                    {opt.preview}
                  </span>
                  <span className={`text-xs font-semibold ${
                    fontPref === opt.id ? 'text-[#22c55e]' : 'text-zinc-400'
                  }`}>
                    {opt.label}
                  </span>
                  <span className='text-[10px] text-zinc-600'>{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Subsección 2: Contenido del PDF ── */}
      <section className='rounded-xl border border-zinc-800 bg-zinc-950 p-6'>
        <h2 className='mb-4 border-b border-zinc-800 pb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500'>
          Contenido del PDF
        </h2>

        <div className='flex flex-col gap-6'>
          {/* Toggle: mostrar macros */}
          <div className='flex items-center justify-between gap-4'>
            <div>
              <p className='text-sm font-medium text-zinc-200'>
                Mostrar calorías y macros al paciente
              </p>
              <p className='mt-0.5 text-xs text-zinc-500'>
                Kcal, proteína, carbohidratos y grasa en cada comida y el resumen semanal.
              </p>
            </div>
            <Toggle
              checked={showMacros}
              onChange={handleToggleMacros}
              disabled={isPending}
            />
          </div>

          {/* Toggle: incluir lista de la compra */}
          <div className='flex items-center justify-between gap-4'>
            <div>
              <p className='text-sm font-medium text-zinc-200'>Incluir lista de la compra</p>
              <p className='mt-0.5 text-xs text-zinc-500'>
                Página final con todos los alimentos agrupados por categoría.
              </p>
            </div>
            <Toggle
              checked={showShoppingList}
              onChange={handleToggleShopping}
              disabled={isPending}
            />
          </div>

          {/* Mensaje de bienvenida */}
          <div>
            <label
              htmlFor='welcome_message'
              className='mb-1 block text-sm font-medium text-zinc-200'
            >
              Mensaje de bienvenida{' '}
              <span className='font-normal text-zinc-600'>(opcional)</span>
            </label>
            <p className='mb-3 text-xs text-zinc-500'>
              Aparece en la portada del PDF justo debajo de los objetivos nutricionales.
            </p>
            <textarea
              id='welcome_message'
              value={welcomeMessage}
              onChange={(e) => {
                if (e.target.value.length <= 300) {
                  setWelcomeMessage(e.target.value);
                  setWelcomeSaved(false);
                }
              }}
              rows={3}
              maxLength={300}
              placeholder='Hola [nombre], este plan está diseñado especialmente para ti...'
              className='w-full resize-none rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:border-zinc-600 focus:outline-none'
            />
            <div className='mt-1 flex items-center justify-between'>
              <button
                type='button'
                onClick={handleSaveWelcome}
                disabled={isPending}
                className='rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-100 transition-colors hover:bg-zinc-700 disabled:opacity-40'
              >
                {welcomeSaved ? 'Guardado' : 'Guardar mensaje'}
              </button>
              <span className='text-xs text-zinc-600'>
                {welcomeMessage.length}/300
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Subsección 3: Preview ── */}
      <section className='rounded-xl border border-zinc-800 bg-zinc-950 p-6'>
        <h2 className='mb-4 border-b border-zinc-800 pb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500'>
          Vista previa
        </h2>
        <p className='mb-4 text-sm text-zinc-400'>
          Genera un PDF de ejemplo con tus ajustes actuales de marca.
        </p>
        <a
          href='/api/pdf/preview'
          target='_blank'
          rel='noopener noreferrer'
          className='inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:border-zinc-600 hover:bg-zinc-700'
        >
          <svg
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
            className='h-4 w-4'
          >
            <path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' />
            <polyline points='14 2 14 8 20 8' />
            <line x1='16' y1='13' x2='8' y2='13' />
            <line x1='16' y1='17' x2='8' y2='17' />
            <polyline points='10 9 9 9 8 9' />
          </svg>
          Ver cómo queda mi PDF
        </a>
        <p className='mt-2 text-xs text-zinc-600'>
          Este es el aspecto que tendrán todos tus planes nutricionales.
        </p>
      </section>
    </div>
  );
}
