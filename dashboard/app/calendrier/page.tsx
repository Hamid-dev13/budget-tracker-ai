import CalendarGrid from '@/components/Calendar'
import { getStatus, todayISO } from '@/lib/budget-service'
import { readBudget } from '@/lib/budget-store'

export const dynamic = 'force-dynamic'

export default async function CalendrierPage() {
  // Server component : on appelle la même couche service que l'API et le MCP.
  const today = todayISO()
  const vue = getStatus(undefined, today)
  const { date_debut } = readBudget()

  return (
    <div>
      <h1 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4 sm:mb-6">Calendrier</h1>
      {/* CalendarGrid porte déjà sa carte : un wrapper à padding la doublerait,
          et à 375 px chaque pixel de marge se prend sur les 7 colonnes. */}
      <CalendarGrid jours={vue.jours} dateDebut={date_debut} today={today} />
    </div>
  )
}
