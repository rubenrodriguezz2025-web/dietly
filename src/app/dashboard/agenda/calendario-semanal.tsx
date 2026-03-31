'use client';

// ── Tipos ─────────────────────────────────────────────────────────────────────

type Appointment = {
  id: string;
  patient_id: string | null;
  date: string;
  time: string;
  type: 'presencial' | 'online';
  notes: string | null;
  status: 'scheduled' | 'completed' | 'cancelled';
  meeting_url: string | null;
  patients: { name: string; email: string | null } | null;
};

// ── Constantes ────────────────────────────────────────────────────────────────

const HORA_INICIO = 7;
const HORA_FIN = 21;
const DIAS_ES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

// Genera todos los slots de HH:MM desde HORA_INICIO hasta HORA_FIN (inclusive inicio, exclusivo fin)
const TIME_SLOTS: string[] = [];
for (let h = HORA_INICIO; h < HORA_FIN; h++) {
  TIME_SLOTS.push(`${String(h).padStart(2, '0')}:00`);
  TIME_SLOTS.push(`${String(h).padStart(2, '0')}:30`);
}

const STATUS_OPACITY: Record<string, string> = {
  scheduled: 'opacity-100',
  completed: 'opacity-60',
  cancelled: 'opacity-30 line-through',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function getMondayOf(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Dom, 1=Lun...
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getWeekDays(monday: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

// ── Componente principal ──────────────────────────────────────────────────────

export function CalendarioSemanal({
  citas,
  semanaInicioStr,
}: {
  citas: Appointment[];
  semanaInicioStr: string; // YYYY-MM-DD lunes
}) {
  const [y, m, d] = semanaInicioStr.split('-').map(Number);
  const monday = new Date(y, m - 1, d);
  monday.setHours(0, 0, 0, 0);
  const days = getWeekDays(monday);
  const hoyStr = toDateStr(new Date());

  // Índice rápido: date:HH:MM → citas
  const index = new Map<string, Appointment[]>();
  for (const cita of citas) {
    const slot = cita.time.substring(0, 5); // HH:MM
    const key = `${cita.date}:${slot}`;
    const arr = index.get(key) ?? [];
    arr.push(cita);
    index.set(key, arr);
  }

  return (
    <div className='overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950'>
      {/* Cabecera con los días */}
      <div
        className='grid border-b border-zinc-800'
        style={{ gridTemplateColumns: '3rem repeat(7, minmax(0, 1fr))' }}
      >
        <div className='border-r border-zinc-800' />
        {days.map((date, i) => {
          const dateStr = toDateStr(date);
          const isToday = dateStr === hoyStr;
          return (
            <div
              key={dateStr}
              className={`border-r border-zinc-800 py-2 text-center last:border-r-0 ${isToday ? 'bg-[#1a7a45]/8' : ''}`}
            >
              <div className={`text-[11px] font-medium uppercase tracking-wide ${isToday ? 'text-emerald-400' : 'text-zinc-500'}`}>
                {DIAS_ES[i]}
              </div>
              <div
                className={`mx-auto mt-1 flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${
                  isToday
                    ? 'bg-[#1a7a45] text-white'
                    : 'text-zinc-300'
                }`}
              >
                {date.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Cuadrícula de horas */}
      <div className='overflow-y-auto' style={{ maxHeight: '640px' }}>
        {TIME_SLOTS.map((slot, slotIdx) => {
          const isHour = slot.endsWith(':00');
          return (
            <div
              key={slot}
              className={`grid ${isHour ? 'border-t border-zinc-800/60' : ''}`}
              style={{ gridTemplateColumns: '3rem repeat(7, minmax(0, 1fr))', minHeight: '2rem' }}
            >
              {/* Etiqueta de hora */}
              <div className='flex items-start justify-center border-r border-zinc-800 pt-1'>
                {isHour && (
                  <span className='text-[10px] leading-none text-zinc-700'>{slot}</span>
                )}
              </div>

              {/* Celdas por día */}
              {days.map((date) => {
                const dateStr = toDateStr(date);
                const isToday = dateStr === hoyStr;
                const key = `${dateStr}:${slot}`;
                const citasSlot = index.get(key) ?? [];

                return (
                  <div
                    key={dateStr}
                    className={`relative border-r border-zinc-800/30 last:border-r-0 p-0.5 ${
                      isToday ? 'bg-[#1a7a45]/4' : ''
                    } ${isHour ? '' : 'border-t border-zinc-800/20'}`}
                  >
                    {citasSlot.map((cita) => (
                      <CitaBloque key={cita.id} cita={cita} />
                    ))}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Bloque de cita en el calendario ──────────────────────────────────────────

function CitaBloque({ cita }: { cita: Appointment }) {
  const isPres = cita.type === 'presencial';
  const isCancelled = cita.status === 'cancelled';

  return (
    <div
      className={`group relative mb-0.5 rounded px-1.5 py-1 text-[10px] leading-snug ${
        isPres
          ? 'border border-amber-700/40 bg-amber-900/50 text-amber-200'
          : 'border border-violet-700/40 bg-violet-900/50 text-violet-200'
      } ${STATUS_OPACITY[cita.status] ?? ''}`}
    >
      <div className={`truncate font-medium ${isCancelled ? 'line-through' : ''}`}>
        {cita.patients?.name ?? 'Sin paciente'}
      </div>
      <div className='text-[9px] opacity-70'>
        {cita.type === 'online' ? 'Online' : 'Presencial'}
        {cita.status === 'completed' && ' · ✓'}
        {cita.status === 'cancelled' && ' · Cancelada'}
      </div>

      {/* Tooltip al hacer hover */}
      <div className='pointer-events-none absolute left-full top-0 z-30 ml-2 hidden w-44 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 shadow-xl group-hover:block'>
        <p className='font-medium text-zinc-200'>{cita.time.substring(0, 5)} — {cita.patients?.name ?? 'Sin paciente'}</p>
        {cita.notes && (
          <p className='mt-1 text-[11px] text-zinc-500 leading-snug'>{cita.notes}</p>
        )}
        {cita.meeting_url && (
          <a
            href={cita.meeting_url}
            target='_blank'
            rel='noopener noreferrer'
            className='mt-1.5 block text-[11px] text-violet-400 underline pointer-events-auto'
          >
            Unirse a la videollamada
          </a>
        )}
      </div>
    </div>
  );
}

// ── Navegación de semana ──────────────────────────────────────────────────────

export function NavSemana({ semanaInicioStr }: { semanaInicioStr: string }) {
  const [y, m, d] = semanaInicioStr.split('-').map(Number);
  const monday = new Date(y, m - 1, d);

  const prevMonday = new Date(monday);
  prevMonday.setDate(monday.getDate() - 7);

  const nextMonday = new Date(monday);
  nextMonday.setDate(monday.getDate() + 7);

  const hoyMonday = getMondayOf(new Date());
  const isCurrentWeek = toDateStr(monday) === toDateStr(hoyMonday);

  const label = monday.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className='flex items-center gap-2'>
      {!isCurrentWeek && (
        <a
          href={`/dashboard/agenda?vista=semana&semana=${toDateStr(hoyMonday)}`}
          className='rounded-lg border border-[#1a7a45]/40 bg-[#1a7a45]/10 px-3 py-2 text-sm font-medium text-emerald-400 transition-colors hover:bg-[#1a7a45]/20'
        >
          Hoy
        </a>
      )}
      <a
        href={`/dashboard/agenda?vista=semana&semana=${toDateStr(prevMonday)}`}
        aria-label='Semana anterior'
        className='flex items-center gap-1.5 rounded-lg border border-zinc-800 px-3 py-2 text-sm text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200'
      >
        <svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
          <polyline points='15 18 9 12 15 6' />
        </svg>
        <span className='hidden sm:inline'>Anterior</span>
      </a>
      <span className='min-w-0 text-sm text-zinc-300 capitalize hidden sm:block'>{label}</span>
      <a
        href={`/dashboard/agenda?vista=semana&semana=${toDateStr(nextMonday)}`}
        aria-label='Semana siguiente'
        className='flex items-center gap-1.5 rounded-lg border border-zinc-800 px-3 py-2 text-sm text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200'
      >
        <span className='hidden sm:inline'>Siguiente</span>
        <svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
          <polyline points='9 18 15 12 9 6' />
        </svg>
      </a>
    </div>
  );
}
