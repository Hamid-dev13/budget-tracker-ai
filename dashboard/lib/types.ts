export type Status = 'ok' | 'warn' | 'danger' | 'future' | 'info'

export interface Depense {
  date: string
  montant: number
  description: string
}

export interface BudgetData {
  solde_depart: number
  date_debut: string
  date_fin: string
  plafond_jour: number
  depenses: Depense[]
}

export interface DayStats {
  date: string
  depense: number
  status: Status
  budgetCumul: number
  soldeFin: number
}

export interface ComputedBudget {
  data: BudgetData
  soldeRestant: number
  depenseAujourdhui: number
  budgetAujourdhui: number
  detteJours: number
  repriseDateStr: string
  status: Status
  totalDepenses: number
  dayStats: DayStats[]
  pieData: { name: string; value: number }[]
  lineData: { date: string; solde: number }[]
}
