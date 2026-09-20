import TransactionList from '@/components/TransactionList'
import { BudgetData } from '@/lib/types'
import { readFileSync } from 'fs'

async function getData(): Promise<BudgetData> {
  const path = process.env.BUDGET_PATH || '/app/data/budget.json'
  return JSON.parse(readFileSync(path, 'utf8'))
}

export default async function HistoriquePage() {
  const data = await getData()
  return (
    <div>
      <h1 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6">Historique complet</h1>
      <TransactionList depenses={data.depenses} />
    </div>
  )
}
