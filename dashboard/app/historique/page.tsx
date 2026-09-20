import TransactionList from '@/components/TransactionList'
import { getHistory } from '@/lib/budget-service'

export const dynamic = 'force-dynamic'

export default async function HistoriquePage() {
  // Server component : plus de lecture directe du fichier, on passe par le service.
  const depenses = getHistory()

  return (
    <div>
      <h1 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6">Historique complet</h1>
      <TransactionList depenses={depenses} />
    </div>
  )
}
