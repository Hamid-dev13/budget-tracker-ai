/**
 * Types partagés côté dashboard.
 * La forme de la vérité est définie une seule fois, dans budget-logic.
 */
import type { Depense, JourStat, Status, VueBudget, BudgetData } from './budget-logic'

export type { Depense, JourStat, Status, VueBudget, BudgetData }

/** Ce que renvoie GET /api/budget : la vue calculée, plus ce dont l'UI a besoin pour l'afficher. */
export interface ReponseBudget extends VueBudget {
  today: string
  dateDebut: string
  dateFin: string
  depenses: Depense[]
}
