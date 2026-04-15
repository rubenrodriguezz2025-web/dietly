// Mockup SVG abstracto del editor de planes
export function DashboardMockup({ className = '' }: { className?: string }) {
  const days = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  return (
    <>
      <span className="sr-only">
        Captura del dashboard de Dietly mostrando un plan semanal con siete días, desayuno, comida y cena por día, con calorías y macronutrientes para cada comida, y botón de aprobación.
      </span>
      <svg
        viewBox="0 0 800 480"
        className={className}
        aria-hidden="true"
      >
      <defs>
        <linearGradient id="dmBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a0f0a" />
          <stop offset="100%" stopColor="#050a05" />
        </linearGradient>
      </defs>

      {/* Marco */}
      <rect x="0" y="0" width="800" height="480" rx="14" fill="url(#dmBg)" stroke="#27272a" />

      {/* Top bar */}
      <rect x="0" y="0" width="800" height="38" rx="14" fill="#0a0f0a" />
      <circle cx="20" cy="19" r="5" fill="#27272a" />
      <circle cx="38" cy="19" r="5" fill="#27272a" />
      <circle cx="56" cy="19" r="5" fill="#27272a" />
      <rect x="320" y="11" width="160" height="16" rx="4" fill="#18181b" />

      {/* Sidebar */}
      <rect x="0" y="38" width="180" height="442" fill="#0a0f0a" />
      <rect x="20" y="60" width="120" height="10" rx="2" fill="#3f3f46" />
      <rect x="20" y="82" width="80" height="8" rx="2" fill="#27272a" />

      {days.map((d, i) => (
        <g key={d}>
          <rect
            x="20"
            y={120 + i * 42}
            width="140"
            height="32"
            rx="6"
            fill={i === 2 ? '#1a7a45' : '#18181b'}
            stroke={i === 2 ? '#22c55e' : '#27272a'}
          />
          <text
            x="36"
            y={140 + i * 42}
            fontFamily="system-ui"
            fontSize="12"
            fill={i === 2 ? '#ffffff' : '#a1a1aa'}
          >
            {d} · Día {i + 1}
          </text>
        </g>
      ))}

      {/* Main panel header */}
      <rect x="200" y="60" width="220" height="14" rx="3" fill="#3f3f46" />
      <rect x="200" y="84" width="380" height="9" rx="2" fill="#27272a" />

      {/* Aprobado badge */}
      <g>
        <rect x="660" y="56" width="118" height="26" rx="13" fill="#052e16" stroke="#22c55e" />
        <circle cx="678" cy="69" r="3" fill="#22c55e" />
        <text x="690" y="73" fontFamily="system-ui" fontSize="11" fill="#22c55e">
          Aprobado
        </text>
      </g>

      {/* Meal cards */}
      {['Desayuno', 'Comida', 'Cena'].map((meal, i) => (
        <g key={meal}>
          <rect
            x="200"
            y={130 + i * 110}
            width="580"
            height="92"
            rx="10"
            fill="#0f140f"
            stroke="#27272a"
          />
          <rect x="220" y={150 + i * 110} width="90" height="10" rx="2" fill="#22c55e" />
          <text
            x="220"
            y={184 + i * 110}
            fontFamily="system-ui"
            fontSize="13"
            fill="#e4e4e7"
          >
            {meal}
          </text>
          <rect x="220" y={196 + i * 110} width="320" height="8" rx="2" fill="#27272a" />
          <rect x="640" y={158 + i * 110} width="118" height="38" rx="6" fill="#18181b" />
          <text
            x="654"
            y={182 + i * 110}
            fontFamily="system-ui"
            fontSize="11"
            fill="#a1a1aa"
          >
            kcal · macros
          </text>
        </g>
      ))}
      </svg>
    </>
  );
}
