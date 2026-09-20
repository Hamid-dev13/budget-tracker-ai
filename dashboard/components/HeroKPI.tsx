import { ComputedBudget } from '@/lib/types'
import { fmt, statusColor } from '@/lib/budget'

interface Props {
  computed: ComputedBudget
}

export default function HeroKPI({ computed }: Props) {
  const color = statusColor(computed.status)

  return (
    <div
      className="rounded-2xl p-10 text-white shadow-lg"
      style={{ backgroundColor: color }}
    >
      <p className="font-inter font-black text-sm uppercase tracking-widest opacity-80 mb-2">
        Solde restant
      </p>
      <p className="font-playfair text-7xl font-bold leading-none">
        {fmt(computed.soldeRestant)}
      </p>
      <div className="mt-6 flex gap-8 flex-wrap">
        <div>
          <p className="font-inter text-xs uppercase tracking-widest opacity-70">Solde de départ</p>
          <p className="font-inter font-bold text-xl">{fmt(computed.data.solde_depart)}</p>
        </div>
        <div>
          <p className="font-inter text-xs uppercase tracking-widest opacity-70">Total dépensé</p>
          <p className="font-inter font-bold text-xl">{fmt(computed.totalDepenses)}</p>
        </div>
        <div>
          <p className="font-inter text-xs uppercase tracking-widest opacity-70">Plafond / jour</p>
          <p className="font-inter font-bold text-xl">{fmt(computed.data.plafond_jour)}</p>
        </div>
      </div>
    </div>
  )
}
