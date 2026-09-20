/**
 * Couche présentation du dashboard.
 *
 * Formatage, couleurs et agrégations d'affichage — rien d'autre.
 * Toute règle métier (plafond, cagnotte, dette, jours bloqués) vit dans
 * lib/budget-logic.ts et n'est calculée que côté serveur, pour que le
 * dashboard et Hermes ne puissent jamais annoncer deux chiffres différents.
 */
import type { Depense, JourStat, Status } from './budget-logic'

export function fmt(n: number): string {
  return n.toFixed(2).replace('.', ',') + ' €'
}

/**
 * Montant arrondi à l'euro, pour les cases du calendrier sur petit écran :
 * à 375 px une colonne fait ~45 px et « 110,70 € » n'y tient pas.
 */
export function fmtCourt(n: number): string {
  return Math.round(n) + ' €'
}

/** Jour/mois, sans passer par un Date local qui décalerait au changement d'heure. */
export function fmtDate(dateStr: string): string {
  const [, mois, jour] = dateStr.split('-')
  return `${jour}/${mois}`
}

/** Répartition par poste, du plus gros au plus petit. */
export function pieDataDe(depenses: Depense[]): { name: string; value: number }[] {
  const parPoste = new Map<string, number>()
  for (const d of depenses) {
    parPoste.set(d.description, (parPoste.get(d.description) ?? 0) + d.montant)
  }
  return Array.from(parPoste.entries())
    .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
    .sort((a, b) => b.value - a.value)
}

/** Évolution du solde restant, jusqu'au jour courant inclus. */
export function lineDataDe(
  jours: JourStat[],
  soldeDepart: number,
  today: string
): { date: string; solde: number }[] {
  const points: { date: string; solde: number }[] = []
  let solde = soldeDepart

  for (const jour of jours) {
    if (jour.date > today) break
    solde -= jour.depense
    points.push({ date: fmtDate(jour.date), solde: Math.round(solde * 100) / 100 })
  }

  return points
}

export function statusColor(s: Status): string {
  switch (s) {
    case 'ok': return '#22c55e'
    case 'warn': return '#f97316'
    case 'danger': return '#ef4444'
    case 'future': return '#d1d5db'
    default: return '#d1d5db'
  }
}

export function statusBg(s: Status): string {
  switch (s) {
    case 'ok': return 'bg-ok'
    case 'warn': return 'bg-warn'
    case 'danger': return 'bg-danger'
    case 'future': return 'bg-gray-200 dark:bg-gray-700'
    default: return 'bg-gray-200'
  }
}
