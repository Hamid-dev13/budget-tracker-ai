/**
 * Logique métier du budget — source de vérité unique, importée par l'API et par le MCP.
 *
 * Modèle : cagnotte cumulée. Chaque jour crédite le plafond journalier, chaque dépense
 * le débite. Le budget du jour est la cagnotte si elle est positive ; la dette est
 * cette même cagnotte passée en négatif, exprimée en jours de plafond.
 *
 * Aucune I/O, aucune horloge implicite : le jour courant est toujours un paramètre.
 */

export interface Depense {
  date: string
  montant: number
  description: string
}

export interface BudgetData {
  solde_depart: number
  date_debut: string
  date_fin: string
  /** Présent dans le fichier pour compatibilité, mais toujours recalculé. */
  plafond_jour?: number
  depenses: Depense[]
}

export type Status = 'ok' | 'warn' | 'danger' | 'future'

export interface JourStat {
  date: string
  depense: number
  cagnotte: number
  status: Status
}

export interface VueBudget {
  plafondJour: number
  soldeDepart: number
  soldeRestant: number
  totalDepenses: number
  cagnotte: number
  budgetAujourdhui: number
  detteJours: number
  joursBloques: number
  dateReprise: string | null
  budgetJourReprise: number
  status: Status
  jours: JourStat[]
}

const MS_PAR_JOUR = 86_400_000

/** Parse une date ISO en UTC — jamais en heure locale, sinon les changements d'heure décalent les jours. */
function parseISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

function toISO(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function addDays(iso: string, n: number): string {
  return toISO(new Date(parseISO(iso).getTime() + n * MS_PAR_JOUR))
}

/** Nombre de jours entre deux dates ISO, bornes incluses. */
export function nbJoursPeriode(debut: string, fin: string): number {
  return Math.round((parseISO(fin).getTime() - parseISO(debut).getTime()) / MS_PAR_JOUR) + 1
}

/** Le plafond est toujours dérivé du solde et de la période — la valeur stockée est ignorée. */
export function calculPlafondJour(data: BudgetData): number {
  return data.solde_depart / nbJoursPeriode(data.date_debut, data.date_fin)
}

/** Somme des dépenses par date. */
function depensesParJour(depenses: Depense[]): Map<string, number> {
  const parJour = new Map<string, number>()
  for (const d of depenses) {
    parJour.set(d.date, (parJour.get(d.date) ?? 0) + d.montant)
  }
  return parJour
}

/**
 * Cagnotte accumulée à la fin du jour donné :
 * (jours écoulés depuis le début, celui-ci inclus) × plafond − dépenses de la même fenêtre.
 */
export function cagnotteAu(data: BudgetData, jour: string): number {
  const joursEcoules = nbJoursPeriode(data.date_debut, jour)
  if (joursEcoules <= 0) return 0

  const plafond = calculPlafondJour(data)
  const depenses = data.depenses
    .filter(d => d.date >= data.date_debut && d.date <= jour)
    .reduce((somme, d) => somme + d.montant, 0)

  return joursEcoules * plafond - depenses
}

/** Une cagnotte négative convertie en jours de plafond. */
export function detteJours(cagnotte: number, plafond: number): number {
  return cagnotte >= 0 ? 0 : -cagnotte / plafond
}

/** Jours à budget nul avant la reprise — le dernier est partiel. */
export function joursBloques(dette: number): number {
  return Math.ceil(dette)
}

/** Budget disponible le jour de la reprise : le reliquat de la fraction de dette. */
export function budgetJourReprise(dette: number, plafond: number): number {
  const fraction = dette - Math.floor(dette)
  return fraction === 0 ? plafond : (1 - fraction) * plafond
}

/** Statut d'une journée selon son dépassement du plafond. */
export function statusJour(depense: number, plafond: number): Status {
  if (depense === 0) return 'ok'
  const ratio = depense / plafond
  if (ratio <= 1) return 'ok'
  if (ratio <= 1.5) return 'warn'
  return 'danger'
}

export function computeBudget(data: BudgetData, today: string): VueBudget {
  const plafondJour = calculPlafondJour(data)
  const parJour = depensesParJour(data.depenses)

  const totalDepenses = data.depenses.reduce((somme, d) => somme + d.montant, 0)
  const cagnotte = cagnotteAu(data, today)
  const dette = detteJours(cagnotte, plafondJour)
  const bloques = joursBloques(dette)

  const nbJours = nbJoursPeriode(data.date_debut, data.date_fin)
  const jours: JourStat[] = []
  let cumul = 0

  for (let i = 0; i < nbJours; i++) {
    const date = addDays(data.date_debut, i)
    const depense = parJour.get(date) ?? 0
    cumul += plafondJour - depense

    jours.push({
      date,
      depense,
      cagnotte: cumul,
      status: date > today ? 'future' : statusJour(depense, plafondJour),
    })
  }

  const depenseAujourdhui = parJour.get(today) ?? 0
  const status: Status =
    dette > 0 ? 'danger' : depenseAujourdhui > plafondJour ? 'warn' : 'ok'

  return {
    plafondJour,
    soldeDepart: data.solde_depart,
    soldeRestant: data.solde_depart - totalDepenses,
    totalDepenses,
    cagnotte,
    budgetAujourdhui: Math.max(0, cagnotte),
    detteJours: dette,
    joursBloques: bloques,
    dateReprise: bloques > 0 ? addDays(today, bloques) : null,
    budgetJourReprise: budgetJourReprise(dette, plafondJour),
    status,
    jours,
  }
}
