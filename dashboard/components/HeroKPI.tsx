import { ReponseBudget } from '@/lib/types'
import { fmt, statusColor } from '@/lib/budget'

interface Props {
  vue: ReponseBudget
}

export default function HeroKPI({ vue }: Props) {
  return (
    <div
      className="rounded-2xl p-10 text-white shadow-lg"
      style={{ backgroundColor: statusColor(vue.status) }}
    >
      <p className="font-inter font-black text-sm uppercase tracking-widest opacity-80 mb-2">
        Solde restant
      </p>
      <p className="font-playfair text-7xl font-bold leading-none">
        {fmt(vue.soldeRestant)}
      </p>
      <div className="mt-6 flex gap-8 flex-wrap">
        <div>
          <p className="font-inter text-xs uppercase tracking-widest opacity-70">Solde de départ</p>
          <p className="font-inter font-bold text-xl">{fmt(vue.soldeDepart)}</p>
        </div>
        <div>
          <p className="font-inter text-xs uppercase tracking-widest opacity-70">Total dépensé</p>
          <p className="font-inter font-bold text-xl">{fmt(vue.totalDepenses)}</p>
        </div>
        <div>
          <p className="font-inter text-xs uppercase tracking-widest opacity-70">Plafond / jour</p>
          <p className="font-inter font-bold text-xl">{fmt(vue.plafondJour)}</p>
        </div>
      </div>
    </div>
  )
}
