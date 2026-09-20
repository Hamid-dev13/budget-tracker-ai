import CalendarGrid from '@/components/Calendar'
import { BudgetData } from '@/lib/types'
import { computeBudget } from '@/lib/budget'
import { readFileSync } from 'fs'

async function getData(): Promise<BudgetData> {
  const path = process.env.BUDGET_PATH || '/app/data/budget.json'
  return JSON.parse(readFileSync(path, 'utf8'))
}

export default async function CalendrierPage() {
  const data = await getData()
  const budget = computeBudget(data)
  return (
    <div>
      <h1 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6">Calendrier</h1>
      <div className="bg-white dark:bg-[#1c1c1c] rounded-2xl border-2 border-[#e8e0d0] dark:border-[#2a2a2a] p-6">
        <CalendarGrid dayStats={budget.dayStats} dateDebut={data.date_debut} />
      </div>
    </div>
  )
}
