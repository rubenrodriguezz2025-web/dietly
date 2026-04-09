'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { CONSENT_TEXT_VERSION } from '@/components/patients/ConsentForm';

import { createPatient } from '../dashboard/patients/new/actions';

import { markOnboardingComplete, saveBrandWizard, saveProfileWizard } from './onboarding-actions';

// ── Tipos ────────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3 | 4;

const SPECIALTIES = [
  { value: 'weight_loss', label: 'Pérdida de peso' },
  { value: 'sports', label: 'Deportiva' },
  { value: 'clinical', label: 'Clínica' },
  { value: 'general', label: 'General' },
] as const;

const GOALS = [
  { value: 'weight_loss', label: 'Perder peso' },
  { value: 'weight_gain', label: 'Ganar peso' },
  { value: 'maintenance', label: 'Mantenimiento' },
  { value: 'muscle_gain', label: 'Ganar músculo' },
  { value: 'health', label: 'Salud general' },
] as const;

const ACTIVITY_LEVELS = [
  { value: 'sedentary', label: 'Sedentario (poco o nada de ejercicio)' },
  { value: 'lightly_active', label: 'Ligero (ejercicio 1-3 días/semana)' },
  { value: 'moderately_active', label: 'Moderado (ejercicio 3-5 días/semana)' },
  { value: 'very_active', label: 'Activo (ejercicio 6-7 días/semana)' },
] as const;

// ── Colores predefinidos ──────────────────────────────────────────────────────

const PRESET_COLORS = [
  '#1a7a45',
  '#2563eb',
  '#7c3aed',
  '#dc2626',
  '#ea580c',
  '#0891b2',
  '#0f766e',
  '#4f46e5',
];

// ── Componente principal ──────────────────────────────────────────────────────

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [visible, setVisible] = useState(true);
  const [slideDir, setSlideDir] = useState<'right' | 'left'>('right');
  const [isPending, startTransition] = useTransition();

  // Step 2 state
  const [fullName, setFullName] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [collegeNumber, setCollegeNumber] = useState('');
  const [declared, setDeclared] = useState(false);
  const [aiAcknowledged, setAiAcknowledged] = useState(false);
  const [aiExpanded, setAiExpanded] = useState(false);
  const [step2Error, setStep2Error] = useState('');

  // Step 3 state
  const [primaryColor, setPrimaryColor] = useState('#1a7a45');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [step3Error, setStep3Error] = useState('');
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Step 4 state
  const [patientName, setPatientName] = useState('');
  const [dob, setDob] = useState('');
  const [sex, setSex] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [goal, setGoal] = useState('');
  const [activityLevel, setActivityLevel] = useState('');
  const [consentChecked, setConsentChecked] = useState(false);
  const [step4Error, setStep4Error] = useState('');

  // ── Transición entre pasos ─────────────────────────────────────────────────

  function goTo(next: Step) {
    const forward = next > step;
    setSlideDir(forward ? 'right' : 'left');
    setVisible(false);
    setTimeout(() => {
      setStep(next);
      setVisible(true);
    }, 180);
  }

  // ── Step 2 submit ─────────────────────────────────────────────────────────

  async function handleStep2() {
    setStep2Error('');
    const fd = new FormData();
    fd.set('full_name', fullName);
    fd.set('clinic_name', clinicName);
    fd.set('specialty', specialty);
    fd.set('college_number', collegeNumber);
    if (aiAcknowledged) fd.set('ai_literacy', 'on');

    startTransition(async () => {
      const result = await saveProfileWizard(fd);
      if (result?.error) {
        setStep2Error(result.error);
      } else {
        goTo(3);
      }
    });
  }

  // ── Step 3 submit ─────────────────────────────────────────────────────────

  async function handleStep3() {
    setStep3Error('');
    const fd = new FormData();
    fd.set('primary_color', primaryColor);
    if (logoFile) fd.set('logo', logoFile);

    startTransition(async () => {
      const result = await saveBrandWizard(fd);
      if (result?.error) {
        setStep3Error(result.error);
      } else {
        goTo(4);
      }
    });
  }

  async function handleStep3Skip() {
    goTo(4);
  }

  // ── Logo drag&drop ────────────────────────────────────────────────────────

  function handleLogoFile(file: File) {
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) return;
    if (file.size > 512 * 1024) {
      setStep3Error('El archivo supera 512 KB.');
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    setStep3Error('');
  }

  // ── Step 4 submit ─────────────────────────────────────────────────────────

  async function handleStep4() {
    setStep4Error('');
    if (!consentChecked) {
      setStep4Error('Acepta el consentimiento para continuar.');
      return;
    }

    const fd = new FormData();
    fd.set('name', patientName);
    fd.set('date_of_birth', dob);
    fd.set('sex', sex);
    fd.set('weight_kg', weight);
    fd.set('height_cm', height);
    fd.set('goal', goal);
    fd.set('activity_level', activityLevel);
    fd.set('ai_consent', 'granted');
    fd.set('ai_consent_version', CONSENT_TEXT_VERSION);

    startTransition(async () => {
      // Marcar onboarding completo antes de crear paciente
      await markOnboardingComplete();
      const result = await createPatient({ error: undefined }, fd);
      if (result?.error) {
        setStep4Error(result.error);
      }
      // createPatient redirige internamente a /dashboard/patients/[id]
    });
  }

  async function handleStep4Skip() {
    startTransition(async () => {
      await markOnboardingComplete();
      router.push('/onboarding/plan');
    });
  }

  // ── Estilos comunes ───────────────────────────────────────────────────────

  const inputClass =
    'w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 disabled:opacity-50';

  const selectClass =
    'w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-100 outline-none transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 disabled:opacity-50';

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        fontFamily: 'var(--font-plus-jakarta-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        minHeight: '100vh',
        backgroundColor: '#050a05',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
      }}
    >
      {/* Barra de progreso */}
      {step > 1 && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            backgroundColor: 'rgba(255,255,255,0.08)',
            zIndex: 50,
          }}
        >
          <div
            style={{
              height: '100%',
              backgroundColor: '#1a7a45',
              width: `${((step - 1) / 3) * 100}%`,
              transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        </div>
      )}

      {/* Indicadores de pasos */}
      {step > 1 && (
        <div
          style={{
            display: 'flex',
            gap: 8,
            marginBottom: 32,
            alignItems: 'center',
          }}
        >
          {([2, 3, 4] as Step[]).map((s) => (
            <div
              key={s}
              style={{
                width: s === step ? 24 : 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: s === step ? '#1a7a45' : s < step ? '#1a7a4580' : '#27272a',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>
      )}

      {/* Contenedor de paso con animación */}
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          opacity: visible ? 1 : 0,
          transform: visible
            ? 'translateX(0)'
            : `translateX(${slideDir === 'right' ? '40px' : '-40px'})`,
          transition: 'opacity 0.18s ease, transform 0.18s ease',
        }}
      >
        {/* ── PASO 1: Bienvenida ────────────────────────────────────────── */}
        {step === 1 && (
          <div style={{ textAlign: 'center' }}>
            {/* Logo */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 72,
                height: 72,
                borderRadius: 20,
                backgroundColor: '#1a7a45',
                marginBottom: 32,
              }}
            >
              <svg width='36' height='36' viewBox='0 0 24 24' fill='none'>
                <path
                  d='M12 2L9 7H4l3.5 5L6 22l6-4 6 4-1.5-10L20 7h-5L12 2z'
                  fill='white'
                  opacity={0.95}
                />
              </svg>
            </div>

            <h1
              style={{
                fontSize: 32,
                fontWeight: 800,
                color: '#ffffff',
                margin: '0 0 12px',
                letterSpacing: '-0.5px',
              }}
            >
              Bienvenida a Dietly 👋
            </h1>

            <p
              style={{
                fontSize: 16,
                color: 'rgba(255,255,255,0.55)',
                margin: '0 0 40px',
                lineHeight: 1.6,
              }}
            >
              En 2 minutos tu perfil estará listo y podrás generar tu primer plan nutricional.
            </p>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                marginBottom: 40,
                textAlign: 'left',
              }}
            >
              {[
                { icon: '⚡', text: 'Plan nutricional completo en 2 minutos' },
                { icon: '🎨', text: 'PDF con tu logo y colores de marca' },
                { icon: '📱', text: 'El paciente lo recibe en su móvil' },
              ].map((item) => (
                <div
                  key={item.text}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '14px 16px',
                    borderRadius: 12,
                    backgroundColor: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.07)',
                  }}
                >
                  <span style={{ fontSize: 20 }}>{item.icon}</span>
                  <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>
                    {item.text}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => goTo(2)}
              style={{
                width: '100%',
                padding: '14px 24px',
                borderRadius: 12,
                backgroundColor: '#1a7a45',
                border: 'none',
                color: '#ffffff',
                fontSize: 16,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'opacity 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              Empezar →
            </button>
          </div>
        )}

        {/* ── PASO 2: Perfil profesional ────────────────────────────────── */}
        {step === 2 && (
          <div>
            <h2
              style={{
                fontSize: 26,
                fontWeight: 800,
                color: '#ffffff',
                margin: '0 0 6px',
                letterSpacing: '-0.3px',
              }}
            >
              Tu perfil profesional
            </h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', margin: '0 0 28px' }}>
              Esta información aparecerá en los planes que envíes a tus pacientes.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Nombre */}
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.4)' }}>
                  Nombre completo *
                </label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder='Ej: María García López'
                  disabled={isPending}
                  className={inputClass}
                />
              </div>

              {/* Clínica */}
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.4)' }}>
                  Nombre de la clínica <span style={{ fontWeight: 400, color: 'rgba(255,255,255,0.25)', textTransform: 'none', letterSpacing: 0 }}>(opcional)</span>
                </label>
                <input
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  placeholder='Ej: Nutrición Activa o tu nombre'
                  disabled={isPending}
                  className={inputClass}
                />
              </div>

              {/* Especialidad */}
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.4)' }}>
                  Especialidad *
                </label>
                <select
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  disabled={isPending}
                  className={selectClass}
                >
                  <option value=''>Selecciona tu especialidad</option>
                  {SPECIALTIES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Nº colegiado */}
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.4)' }}>
                  Nº colegiado <span style={{ fontWeight: 400, color: 'rgba(255,255,255,0.25)', textTransform: 'none', letterSpacing: 0 }}>(opcional, recomendado)</span>
                </label>
                <input
                  value={collegeNumber}
                  onChange={(e) => setCollegeNumber(e.target.value)}
                  placeholder='Puedes añadirlo después en Ajustes'
                  disabled={isPending}
                  className={inputClass}
                />
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
                  Aparece en el PDF — necesario antes de aprobar tu primer plan.
                </p>
              </div>

              {/* Separador */}
              <div style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.07)' }} />

              {/* Declaración profesional */}
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
                <input
                  type='checkbox'
                  checked={declared}
                  onChange={(e) => setDeclared(e.target.checked)}
                  disabled={isPending}
                  style={{ marginTop: 2, width: 16, height: 16, accentColor: '#1a7a45', flexShrink: 0 }}
                />
                <span style={{ fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,0.55)' }}>
                  Declaro ser dietista-nutricionista colegiado en España, habilitado legalmente
                  para prescribir planes nutricionales personalizados.
                </span>
              </label>

              {/* AI Literacy */}
              <div
                style={{
                  borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.1)',
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  overflow: 'hidden',
                }}
              >
                <div style={{ padding: '14px 16px' }}>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
                    <input
                      type='checkbox'
                      checked={aiAcknowledged}
                      onChange={(e) => setAiAcknowledged(e.target.checked)}
                      disabled={isPending}
                      style={{ marginTop: 2, width: 16, height: 16, accentColor: '#1a7a45', flexShrink: 0 }}
                    />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,0.65)', margin: 0 }}>
                        Entiendo que la IA genera{' '}
                        <strong style={{ color: 'rgba(255,255,255,0.85)' }}>borradores</strong>{' '}
                        que requieren mi revisión profesional. Los valores nutricionales son
                        estimaciones orientativas.
                      </p>
                      <button
                        type='button'
                        onClick={() => setAiExpanded(!aiExpanded)}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          marginTop: 6,
                          fontSize: 12,
                          color: 'rgba(255,255,255,0.3)',
                          textDecoration: 'underline',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                        }}
                      >
                        {aiExpanded ? 'Ocultar detalles' : 'Ver capacidades y limitaciones'}
                      </button>
                    </div>
                  </label>
                </div>

                {aiExpanded && (
                  <div
                    style={{
                      borderTop: '1px solid rgba(255,255,255,0.08)',
                      padding: '16px',
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {[
                        {
                          color: '#1a7a45',
                          bgColor: '#052012',
                          symbol: '✓',
                          title: 'Qué puede hacer',
                          items: [
                            'Generar borradores de plan semanal a partir de datos del paciente',
                            'Proponer comidas con ingredientes, cantidades y preparación',
                            'Calcular macros de referencia (Mifflin-St Jeor)',
                            'Generar lista de la compra por categorías',
                          ],
                        },
                        {
                          color: '#dc2626',
                          bgColor: '#1a0505',
                          symbol: '✗',
                          title: 'Qué NO puede hacer',
                          items: [
                            'Diagnosticar enfermedades ni condiciones clínicas',
                            'Sustituir tu juicio clínico — siempre requiere revisión',
                            'Adaptar a patologías complejas sin supervisión especializada',
                          ],
                        },
                        {
                          color: '#d97706',
                          bgColor: '#1a1005',
                          symbol: '!',
                          title: 'Limitaciones',
                          items: [
                            'Puede cometer errores con alergias — revisa siempre los ingredientes',
                            'Valores nutricionales son estimaciones, no mediciones exactas',
                          ],
                        },
                      ].map((section) => (
                        <div key={section.title}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              marginBottom: 8,
                            }}
                          >
                            <span
                              style={{
                                display: 'flex',
                                width: 18,
                                height: 18,
                                borderRadius: '50%',
                                backgroundColor: section.bgColor,
                                color: section.color,
                                fontSize: 10,
                                fontWeight: 700,
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                            >
                              {section.symbol}
                            </span>
                            <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
                              {section.title}
                            </span>
                          </div>
                          <ul style={{ margin: 0, paddingLeft: 26, display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {section.items.map((item) => (
                              <li key={item} style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {step2Error && (
                <p style={{ fontSize: 13, color: '#f87171', margin: 0 }}>{step2Error}</p>
              )}

              <button
                onClick={handleStep2}
                disabled={!fullName || !specialty || !declared || !aiAcknowledged || isPending}
                style={{
                  width: '100%',
                  padding: '14px 24px',
                  borderRadius: 12,
                  backgroundColor: '#1a7a45',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  opacity:
                    !fullName || !specialty || !declared || !aiAcknowledged || isPending ? 0.4 : 1,
                  transition: 'opacity 0.15s ease',
                }}
              >
                {isPending ? 'Guardando...' : 'Continuar →'}
              </button>
            </div>
          </div>
        )}

        {/* ── PASO 3: Marca ─────────────────────────────────────────────── */}
        {step === 3 && (
          <div>
            <h2
              style={{
                fontSize: 26,
                fontWeight: 800,
                color: '#ffffff',
                margin: '0 0 6px',
                letterSpacing: '-0.3px',
              }}
            >
              Tu imagen de marca
            </h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', margin: '0 0 28px' }}>
              Aparecerá en los PDFs y en la app de tus pacientes. Puedes cambiarlo en cualquier
              momento.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Logo upload */}
              <div>
                <label style={{ display: 'block', marginBottom: 10, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.4)' }}>
                  Logo
                </label>
                <input
                  ref={logoInputRef}
                  type='file'
                  accept='image/png,image/jpeg,image/webp'
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleLogoFile(f);
                  }}
                />
                <div
                  onClick={() => logoInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    const f = e.dataTransfer.files[0];
                    if (f) handleLogoFile(f);
                  }}
                  style={{
                    border: `2px dashed ${dragOver ? '#1a7a45' : 'rgba(255,255,255,0.15)'}`,
                    borderRadius: 12,
                    padding: '24px 20px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    backgroundColor: dragOver
                      ? 'rgba(26,122,69,0.08)'
                      : 'rgba(255,255,255,0.02)',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 16,
                    minHeight: 100,
                  }}
                >
                  {logoPreview ? (
                    <>
                      <img
                        src={logoPreview}
                        alt='Logo preview'
                        style={{
                          height: 56,
                          maxWidth: 140,
                          objectFit: 'contain',
                          borderRadius: 8,
                        }}
                      />
                      <div style={{ textAlign: 'left' }}>
                        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', margin: '0 0 2px', fontWeight: 500 }}>
                          {logoFile?.name}
                        </p>
                        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', margin: 0 }}>
                          Clic para cambiar
                        </p>
                      </div>
                    </>
                  ) : (
                    <div>
                      <div style={{ fontSize: 28, marginBottom: 8 }}>🖼️</div>
                      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: '0 0 4px' }}>
                        Arrastra tu logo aquí o haz clic
                      </p>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: 0 }}>
                        PNG, JPG o WebP · máx. 512 KB
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Color de marca */}
              <div>
                <label style={{ display: 'block', marginBottom: 10, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.4)' }}>
                  Color principal
                </label>

                {/* Preview */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 14px',
                    borderRadius: 12,
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    marginBottom: 14,
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      backgroundColor: primaryColor,
                      flexShrink: 0,
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                  />
                  <div>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', margin: '0 0 2px', fontWeight: 500 }}>
                      Así quedará tu PDF
                    </p>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: 0, fontFamily: 'monospace' }}>
                      {primaryColor}
                    </p>
                  </div>
                  <input
                    type='color'
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    style={{
                      marginLeft: 'auto',
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      border: 'none',
                      cursor: 'pointer',
                      backgroundColor: 'transparent',
                    }}
                  />
                </div>

                {/* Presets */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setPrimaryColor(color)}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        backgroundColor: color,
                        border:
                          primaryColor === color
                            ? '3px solid white'
                            : '2px solid rgba(255,255,255,0.1)',
                        cursor: 'pointer',
                        transition: 'transform 0.1s ease, border 0.1s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                    />
                  ))}
                </div>
              </div>

              {step3Error && (
                <p style={{ fontSize: 13, color: '#f87171', margin: 0 }}>{step3Error}</p>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button
                  onClick={handleStep3}
                  disabled={isPending}
                  style={{
                    width: '100%',
                    padding: '14px 24px',
                    borderRadius: 12,
                    backgroundColor: '#1a7a45',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: isPending ? 'default' : 'pointer',
                    fontFamily: 'inherit',
                    opacity: isPending ? 0.5 : 1,
                    transition: 'opacity 0.15s ease',
                  }}
                >
                  {isPending ? 'Guardando...' : 'Guardar y continuar →'}
                </button>
                <button
                  onClick={handleStep3Skip}
                  disabled={isPending}
                  style={{
                    width: '100%',
                    padding: '12px 24px',
                    borderRadius: 12,
                    backgroundColor: 'transparent',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: 'rgba(255,255,255,0.45)',
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: isPending ? 'default' : 'pointer',
                    fontFamily: 'inherit',
                    transition: 'border-color 0.15s ease, color 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
                    e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
                    e.currentTarget.style.color = 'rgba(255,255,255,0.45)';
                  }}
                >
                  Saltar por ahora
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── PASO 4: Primer paciente ───────────────────────────────────── */}
        {step === 4 && (
          <div>
            <h2
              style={{
                fontSize: 26,
                fontWeight: 800,
                color: '#ffffff',
                margin: '0 0 6px',
                letterSpacing: '-0.3px',
              }}
            >
              Tu primer paciente
            </h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', margin: '0 0 28px' }}>
              Opcional — puedes hacerlo ahora o después desde el dashboard.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Nombre */}
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.4)' }}>
                  Nombre *
                </label>
                <input
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder='Nombre del paciente'
                  disabled={isPending}
                  className={inputClass}
                />
              </div>

              {/* Fecha nacimiento + Sexo */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.4)' }}>
                    Fecha nacimiento *
                  </label>
                  <input
                    type='date'
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    disabled={isPending}
                    className={inputClass}
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.4)' }}>
                    Sexo *
                  </label>
                  <select
                    value={sex}
                    onChange={(e) => setSex(e.target.value)}
                    disabled={isPending}
                    className={selectClass}
                  >
                    <option value=''>—</option>
                    <option value='female'>Mujer</option>
                    <option value='male'>Hombre</option>
                    <option value='other'>Otro</option>
                  </select>
                </div>
              </div>

              {/* Peso + Altura */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.4)' }}>
                    Peso (kg) *
                  </label>
                  <input
                    type='number'
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder='70'
                    min='30'
                    max='300'
                    disabled={isPending}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.4)' }}>
                    Altura (cm) *
                  </label>
                  <input
                    type='number'
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    placeholder='165'
                    min='100'
                    max='250'
                    disabled={isPending}
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Objetivo */}
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.4)' }}>
                  Objetivo *
                </label>
                <select
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  disabled={isPending}
                  className={selectClass}
                >
                  <option value=''>Selecciona un objetivo</option>
                  {GOALS.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Nivel de actividad */}
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.4)' }}>
                  Nivel de actividad *
                </label>
                <select
                  value={activityLevel}
                  onChange={(e) => setActivityLevel(e.target.value)}
                  disabled={isPending}
                  className={selectClass}
                >
                  <option value=''>Selecciona nivel de actividad</option>
                  {ACTIVITY_LEVELS.map((a) => (
                    <option key={a.value} value={a.value}>
                      {a.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Consentimiento */}
              <div
                style={{
                  borderRadius: 12,
                  border: '1px solid rgba(255,180,0,0.2)',
                  backgroundColor: 'rgba(255,180,0,0.04)',
                  padding: '14px 16px',
                }}
              >
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
                  <input
                    type='checkbox'
                    checked={consentChecked}
                    onChange={(e) => setConsentChecked(e.target.checked)}
                    disabled={isPending}
                    style={{ marginTop: 2, width: 16, height: 16, accentColor: '#1a7a45', flexShrink: 0 }}
                  />
                  <span style={{ fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,0.6)' }}>
                    Confirmo que tengo el consentimiento del paciente para tratar sus datos de
                    salud con herramientas digitales de asistencia.{' '}
                    <span style={{ color: '#f87171' }}>*</span>
                  </span>
                </label>
              </div>

              {step4Error && (
                <p style={{ fontSize: 13, color: '#f87171', margin: 0 }}>{step4Error}</p>
              )}

              {/* Botones */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button
                  onClick={handleStep4}
                  disabled={
                    !patientName ||
                    !dob ||
                    !sex ||
                    !weight ||
                    !height ||
                    !goal ||
                    !activityLevel ||
                    !consentChecked ||
                    isPending
                  }
                  style={{
                    width: '100%',
                    padding: '14px 24px',
                    borderRadius: 12,
                    backgroundColor: '#1a7a45',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    opacity:
                      !patientName ||
                      !dob ||
                      !sex ||
                      !weight ||
                      !height ||
                      !goal ||
                      !activityLevel ||
                      !consentChecked ||
                      isPending
                        ? 0.4
                        : 1,
                    transition: 'opacity 0.15s ease',
                  }}
                >
                  {isPending ? 'Creando paciente...' : 'Crear paciente y generar plan →'}
                </button>
                <button
                  onClick={handleStep4Skip}
                  disabled={isPending}
                  style={{
                    width: '100%',
                    padding: '12px 24px',
                    borderRadius: 12,
                    backgroundColor: 'transparent',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: 'rgba(255,255,255,0.45)',
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: isPending ? 'default' : 'pointer',
                    fontFamily: 'inherit',
                    transition: 'border-color 0.15s ease, color 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
                    e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
                    e.currentTarget.style.color = 'rgba(255,255,255,0.45)';
                  }}
                >
                  {isPending ? 'Redirigiendo...' : 'Ir al dashboard directamente'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
