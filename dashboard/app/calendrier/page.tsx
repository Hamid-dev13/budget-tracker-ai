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
      <h1 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6">Calendrier</h1>
      <div className="bg-white dark:bg-[#1c1c1c] rounded-2xl border-2 border-[#e8e0d0] dark:border-[#2a2a2a] p-6">
        <CalendarGrid jours={vue.jours} dateDebut={date_debut} today={today} />
      </div>
    </div>
  )
}
