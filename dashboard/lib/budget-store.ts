/**
 * Accès disque à budget.json — la seule couche autorisée à écrire.
 * L'écriture est atomique : une interruption ne peut pas laisser la source de vérité tronquée.
 */
import { readFileSync, writeFileSync, renameSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import type { BudgetData, Depense } from './budget-logic'
import { BudgetIntrouvable, BudgetCorrompu } from './errors'

const CHAMPS_REQUIS = ['solde_depart', 'date_debut', 'date_fin', 'depenses'] as const

export const FORMAT_DATE = /^\d{4}-\d{2}-\d{2}$/

export function cheminBudget(): string {
  return process.env.BUDGET_PATH ?? '/app/data/budget.json'
}

function valider(data: unknown, chemin: string): BudgetData {
  if (typeof data !== 'object' || data === null) {
    throw new BudgetCorrompu(`Budget illisible (${chemin}) : la racine doit être un objet`)
  }

  const brut = data as Record<string, unknown>
  for (const champ of CHAMPS_REQUIS) {
    if (brut[champ] === undefined) {
      throw new BudgetCorrompu(`Budget invalide (${chemin}) : champ "${champ}" manquant`)
    }
  }

  if (!Array.isArray(brut.depenses)) {
    throw new BudgetCorrompu(`Budget invalide (${chemin}) : "depenses" doit être une liste`)
  }

  brut.depenses.forEach((d: unknown, i: number) => {
    const dep = d as Record<string, unknown>
    if (typeof dep?.montant !== 'number') {
      throw new BudgetCorrompu(`Budget invalide (${chemin}) : dépense #${i}, "montant" absent ou non numérique`)
    }
    if (typeof dep?.date !== 'string') {
      throw new BudgetCorrompu(`Budget invalide (${chemin}) : dépense #${i}, "date" absente`)
    }
  })

  return brut as unknown as BudgetData
}

export function readBudget(chemin: string = cheminBudget()): BudgetData {
  let brut: string
  try {
    brut = readFileSync(chemin, 'utf-8')
  } catch {
    throw new BudgetIntrouvable(`Budget introuvable (${chemin}) — lancer init_budget d'abord`)
  }

  let parse: unknown
  try {
    parse = JSON.parse(brut)
  } catch {
    throw new BudgetCorrompu(`Budget illisible (${chemin}) : JSON malformé`)
  }

  return valider(parse, chemin)
}

export function writeBudget(chemin: string, data: BudgetData): void {
  const contenu = JSON.stringify(data, null, 2) + '\n'
  const temporaire = join(dirname(chemin), `.${process.pid}-${Date.now()}.budget.tmp`)

  try {
    writeFileSync(temporaire, contenu, 'utf-8')
    renameSync(temporaire, chemin)
  } catch (err) {
    rmSync(temporaire, { force: true })
    throw err
  }
}

export type { BudgetData, Depense }
