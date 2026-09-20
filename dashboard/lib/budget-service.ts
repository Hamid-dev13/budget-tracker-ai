/**
 * Les quatre opérations métier du budget.
 * Couche partagée : l'API HTTP et le serveur MCP appellent exactement ces fonctions,
 * de sorte que le dashboard et Hermes ne peuvent pas diverger.
 */
import { readBudget, writeBudget, cheminBudget, FORMAT_DATE } from './budget-store'
import { DonneeInvalide } from './errors'
import {
  computeBudget,
  calculPlafondJour,
  nbJoursPeriode,
  type BudgetData,
  type Depense,
  type VueBudget,
} from './budget-logic'

/** Jour courant à Paris — jamais l'UTC, qui bascule deux heures trop tôt. */
export function todayISO(timeZone = 'Europe/Paris'): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

function validerDate(valeur: string, champ: string): string {
  if (!FORMAT_DATE.test(valeur)) {
    throw new DonneeInvalide(`${champ} invalide : "${valeur}" — format attendu AAAA-MM-JJ`)
  }
  return valeur
}

export function initBudget(
  chemin: string,
  solde: number,
  dateFin: string,
  dateDebut?: string,
  today: string = todayISO()
): BudgetData {
  if (!Number.isFinite(solde) || solde <= 0) {
    throw new DonneeInvalide(`solde invalide : ${solde} — doit être strictement positif`)
  }

  const debut = validerDate(dateDebut ?? today, 'date_debut')
  const fin = validerDate(dateFin, 'date_fin')

  if (fin < debut) {
    throw new DonneeInvalide(`date_fin (${fin}) antérieure à date_debut (${debut})`)
  }

  const data: BudgetData = {
    solde_depart: solde,
    date_debut: debut,
    date_fin: fin,
    // Écrit pour rester lisible à l'œil nu, mais toujours recalculé à la lecture.
    plafond_jour: solde / nbJoursPeriode(debut, fin),
    depenses: [],
  }

  writeBudget(chemin, data)
  return data
}

export function addExpense(
  chemin: string,
  montant: number,
  description: string,
  date?: string,
  today: string = todayISO()
): Depense {
  if (!Number.isFinite(montant) || montant <= 0) {
    throw new DonneeInvalide(`montant invalide : ${montant} — doit être strictement positif`)
  }
  if (description.trim() === '') {
    throw new DonneeInvalide('description vide — décris la dépense')
  }

  const depense: Depense = {
    date: validerDate(date ?? today, 'date'),
    montant,
    description: description.trim(),
  }

  const data = readBudget(chemin)
  data.depenses.push(depense)
  writeBudget(chemin, data)

  return depense
}

export function getStatus(chemin: string = cheminBudget(), today: string = todayISO()): VueBudget {
  return computeBudget(readBudget(chemin), validerDate(today, 'today'))
}

export function getHistory(chemin: string = cheminBudget(), limit?: number): Depense[] {
  const depenses = [...readBudget(chemin).depenses].sort((a, b) => b.date.localeCompare(a.date))
  return limit === undefined ? depenses : depenses.slice(0, limit)
}

export { calculPlafondJour }
