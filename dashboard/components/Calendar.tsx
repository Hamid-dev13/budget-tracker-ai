import { JourStat } from '@/lib/types'
import { fmt, fmtCourt, statusColor } from '@/lib/budget'

interface Props {
  jours: JourStat[]
  dateDebut: string
  /** Jour courant décidé par le serveur — jamais l'horloge du navigateur. */
  today: string
}

const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

export default function CalendarGrid({ jours, dateDebut, today }: Props) {
  const debut = new Date(dateDebut + 'T00:00:00')
  // Get first day of month
  const firstOfMonth = new Date(debut.getFullYear(), debut.getMonth(), 1)
  // Day of week for first day (0=Sun → reorder to Mon=0)
  let startDow = firstOfMonth.getDay()
  startDow = startDow === 0 ? 6 : startDow - 1

  // Total days in month
  const daysInMonth = new Date(debut.getFullYear(), debut.getMonth() + 1, 0).getDate()

  // Build grid: empty cells + day cells
  const cells: Array<{ day: number | null; stat: JourStat | null }> = []
  for (let i = 0; i < startDow; i++) cells.push({ day: null, stat: null })
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${debut.getFullYear()}-${String(debut.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const stat = jours.find(j => j.date === dateStr) || null
    cells.push({ day: d, stat })
  }

  return (
    <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-3 sm:p-6 shadow-sm">
      {/* Month label */}
      <p className="font-inter font-black text-sm uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-4">
        {debut.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
      </p>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-2">
        {DAYS_FR.map(d => (
          <div key={d} className="text-center font-inter font-black text-[10px] sm:text-xs uppercase tracking-wide sm:tracking-widest text-gray-400">
            {/* « Lun » ne tient pas dans une colonne de 45 px. */}
            <span className="sm:hidden">{d[0]}</span>
            <span className="hidden sm:inline">{d}</span>
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
        {cells.map((cell, i) => {
          if (!cell.day) {
            return <div key={`empty-${i}`} />
          }

          const color = cell.stat ? statusColor(cell.stat.status) : '#e5e7eb'
          const dateStr = `${debut.getFullYear()}-${String(debut.getMonth() + 1).padStart(2, '0')}-${String(cell.day).padStart(2, '0')}`
          const isToday = dateStr === today

          const aVenir = cell.stat?.status === 'future'
          // Le rouge dit « bloqué ou dépassé » sans les distinguer : c'est le
          // montant qui tranche. Un jour vécu montre ce qu'on a dépensé, un jour
          // à venir ce qu'on pourra dépenser — 0,00 € s'il est bloqué.
          const valeur = !cell.stat
            ? null
            : cell.stat.depense > 0
              ? cell.stat.depense
              : cell.stat.date >= today
                ? cell.stat.budgetDuJour
                : null
          const montant = valeur === null ? null : fmt(valeur)
          const montantCourt = valeur === null ? null : fmtCourt(valeur)

          return (
            <div
              key={cell.day}
              // Hauteur bornée : avec `aspect-square`, une colonne large donnait une
              // cellule aussi haute et le mois débordait du viewport.
              className="h-14 sm:h-16 rounded-lg flex flex-col items-center justify-center gap-0.5 relative"
              style={{ backgroundColor: color }}
              title={
                cell.stat
                  ? cell.stat.depense > 0
                    ? `Dépensé : ${fmt(cell.stat.depense)}`
                    : `Budget du jour : ${fmt(cell.stat.budgetDuJour)}`
                  : ''
              }
            >
              <span
                className={`font-inter font-black text-xs sm:text-sm leading-none ${
                  aVenir ? 'text-gray-400' : 'text-white'
                }`}
              >
                {cell.day}
              </span>
              {montant && (
                <span
                  className={`font-inter text-[9px] sm:text-[10px] leading-none tabular-nums ${
                    aVenir ? 'text-gray-500' : 'text-white/90'
                  }`}
                >
                  <span className="sm:hidden">{montantCourt}</span>
                  <span className="hidden sm:inline">{montant}</span>
                </span>
              )}
              {isToday && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-white rounded-full opacity-90" />
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-2 sm:gap-4 mt-3 sm:mt-4 flex-wrap">
        {[
          { label: 'Dans les clous', color: '#22c55e' },
          { label: 'Partiel', color: '#f97316' },
          { label: 'Bloqué / dépassé', color: '#ef4444' },
          { label: 'À venir', color: '#d1d5db' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: l.color }} />
            <span className="font-inter text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
