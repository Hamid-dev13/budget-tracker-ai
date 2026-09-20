import { Depense } from '@/lib/types'
import { fmt } from '@/lib/budget'

interface Props {
  depenses: Depense[]
}

export default function TransactionList({ depenses }: Props) {
  const sorted = [...depenses].sort((a, b) => {
    if (b.date !== a.date) return b.date.localeCompare(a.date)
    return b.montant - a.montant
  })

  if (!sorted.length) {
    return <p className="text-gray-400 text-center py-8">Aucune transaction</p>
  }

  return (
    <div className="space-y-2">
      {sorted.map((dep, i) => (
        <div
          key={i}
          className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#faf7f0] dark:bg-[#111111] hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="w-2 h-2 rounded-full bg-warn" />
            <div>
              <p className="font-inter font-bold text-sm text-gray-800 dark:text-gray-100">
                {dep.description}
              </p>
              <p className="font-inter text-xs text-gray-400">
                {new Date(dep.date + 'T00:00:00').toLocaleDateString('fr-FR', {
                  weekday: 'short',
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>
          <span className="font-inter font-black text-base text-danger">
            -{fmt(dep.montant)}
          </span>
        </div>
      ))}
    </div>
  )
}
