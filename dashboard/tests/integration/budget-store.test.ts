/**
 * Store + service budget — I/O réelle sur des fichiers JSON temporaires.
 * C'est la seule couche autorisée à écrire dans budget.json.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync, readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { readBudget, writeBudget } from '../../lib/budget-store'
import { initBudget, addExpense, getStatus, getHistory } from '../../lib/budget-service'
import type { BudgetData } from '../../lib/budget-logic'

const REEL: BudgetData = {
  solde_depart: 248.0,
  date_debut: '2026-09-19',
  date_fin: '2026-09-30',
  depenses: [
    { date: '2026-09-19', montant: 45.12, description: 'Courses' },
    { date: '2026-09-19', montant: 65.58, description: 'Le reste' },
  ],
}

let dir: string
let chemin: string

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'budget-test-'))
  chemin = join(dir, 'budget.json')
})

afterEach(() => {
  rmSync(dir, { recursive: true, force: true })
})

describe('readBudget', () => {
  it('lit un fichier valide', () => {
    writeFileSync(chemin, JSON.stringify(REEL))
    expect(readBudget(chemin)).toEqual(REEL)
  })

  it('échoue avec un message explicite sur un fichier absent', () => {
    expect(() => readBudget(join(dir, 'nexistepas.json'))).toThrow(/introuvable/i)
  })

  it('échoue avec un message explicite sur un JSON malformé', () => {
    writeFileSync(chemin, '{ ceci nest pas du json')
    expect(() => readBudget(chemin)).toThrow(/illisible|json/i)
  })

  it('refuse un budget auquel il manque un champ requis', () => {
    writeFileSync(chemin, JSON.stringify({ solde_depart: 100, depenses: [] }))
    expect(() => readBudget(chemin)).toThrow(/date_debut/)
  })

  it('refuse un budget dont les dépenses sont mal formées', () => {
    writeFileSync(
      chemin,
      JSON.stringify({ ...REEL, depenses: [{ date: '2026-09-19', description: 'sans montant' }] })
    )
    expect(() => readBudget(chemin)).toThrow(/montant/)
  })
})

describe('writeBudget', () => {
  it('fait un aller-retour sans perte', () => {
    writeBudget(chemin, REEL)
    expect(readBudget(chemin)).toEqual(REEL)
  })

  it('ne laisse aucun fichier temporaire derrière lui', () => {
    writeBudget(chemin, REEL)
    expect(readdirSync(dir)).toEqual(['budget.json'])
  })

  it('écrit un JSON indenté et lisible à la main', () => {
    writeBudget(chemin, REEL)
    expect(readFileSync(chemin, 'utf-8')).toContain('\n  "solde_depart"')
  })

  it('préserve les accents sans les échapper', () => {
    writeBudget(chemin, { ...REEL, depenses: [{ date: '2026-09-19', montant: 5, description: 'Café' }] })
    expect(readFileSync(chemin, 'utf-8')).toContain('Café')
  })

  it('écrase un budget existant', () => {
    writeBudget(chemin, REEL)
    writeBudget(chemin, { ...REEL, solde_depart: 300 })
    expect(readBudget(chemin).solde_depart).toBe(300)
  })
})

describe('initBudget', () => {
  it('crée un budget avec le plafond dérivé de la période', () => {
    const data = initBudget(chemin, 248, '2026-09-30', '2026-09-19')

    expect(data.solde_depart).toBe(248)
    expect(data.date_debut).toBe('2026-09-19')
    expect(data.date_fin).toBe('2026-09-30')
    expect(data.plafond_jour).toBeCloseTo(20.6667, 4)
    expect(data.depenses).toEqual([])
  })

  it('persiste le budget sur le disque', () => {
    initBudget(chemin, 248, '2026-09-30', '2026-09-19')
    expect(readBudget(chemin).solde_depart).toBe(248)
  })

  it('refuse une date de fin antérieure à la date de début', () => {
    expect(() => initBudget(chemin, 248, '2026-09-10', '2026-09-19')).toThrow(/date_fin|antérieure/i)
  })

  it('refuse un solde négatif ou nul', () => {
    expect(() => initBudget(chemin, 0, '2026-09-30', '2026-09-19')).toThrow(/solde/i)
  })

  it('écrase un budget précédent — init repart de zéro', () => {
    writeBudget(chemin, REEL)
    const data = initBudget(chemin, 100, '2026-10-31', '2026-10-01')
    expect(data.depenses).toEqual([])
    expect(readBudget(chemin).depenses).toEqual([])
  })
})

describe('addExpense', () => {
  beforeEach(() => {
    initBudget(chemin, 248, '2026-09-30', '2026-09-19')
  })

  it('ajoute une dépense et la persiste', () => {
    const depense = addExpense(chemin, 45.12, 'Courses', '2026-09-19')

    expect(depense).toEqual({ date: '2026-09-19', montant: 45.12, description: 'Courses' })
    expect(readBudget(chemin).depenses).toHaveLength(1)
  })

  it('date la dépense du jour courant par défaut', () => {
    const depense = addExpense(chemin, 10, 'Café', undefined, '2026-09-22')
    expect(depense.date).toBe('2026-09-22')
  })

  it('accumule les dépenses successives', () => {
    addExpense(chemin, 45.12, 'Courses', '2026-09-19')
    addExpense(chemin, 33.0, 'Boucherie', '2026-09-19')
    expect(readBudget(chemin).depenses).toHaveLength(2)
  })

  it('refuse un montant nul ou négatif', () => {
    expect(() => addExpense(chemin, 0, 'Rien', '2026-09-19')).toThrow(/montant/i)
    expect(() => addExpense(chemin, -5, 'Remboursement', '2026-09-19')).toThrow(/montant/i)
  })

  it('refuse une description vide', () => {
    expect(() => addExpense(chemin, 10, '   ', '2026-09-19')).toThrow(/description/i)
  })

  it('refuse une date mal formée', () => {
    expect(() => addExpense(chemin, 10, 'Courses', '19/09/2026')).toThrow(/date/i)
  })

  it('échoue si le budget n\'a pas été initialisé', () => {
    expect(() => addExpense(join(dir, 'vide.json'), 10, 'Courses', '2026-09-19')).toThrow(/introuvable/i)
  })
})

describe('getStatus', () => {
  it('rend la vue calculée à la date demandée', () => {
    writeBudget(chemin, REEL)
    const vue = getStatus(chemin, '2026-09-20')

    expect(vue.plafondJour).toBeCloseTo(20.6667, 4)
    expect(vue.soldeRestant).toBeCloseTo(137.3, 2)
    expect(vue.budgetAujourdhui).toBe(0)
    expect(vue.joursBloques).toBe(4)
    expect(vue.dateReprise).toBe('2026-09-24')
  })

  it('ignore le plafond_jour stocké dans le fichier', () => {
    writeBudget(chemin, { ...REEL, plafond_jour: 999 })
    expect(getStatus(chemin, '2026-09-20').plafondJour).toBeCloseTo(20.6667, 4)
  })
})

describe('getHistory', () => {
  beforeEach(() => {
    writeBudget(chemin, {
      ...REEL,
      depenses: [
        { date: '2026-09-19', montant: 10, description: 'Premier' },
        { date: '2026-09-21', montant: 30, description: 'Dernier' },
        { date: '2026-09-20', montant: 20, description: 'Milieu' },
      ],
    })
  })

  it('rend les dépenses du plus récent au plus ancien', () => {
    expect(getHistory(chemin).map(d => d.description)).toEqual(['Dernier', 'Milieu', 'Premier'])
  })

  it('respecte la limite demandée', () => {
    expect(getHistory(chemin, 2).map(d => d.description)).toEqual(['Dernier', 'Milieu'])
  })

  it('rend tout l\'historique sans limite', () => {
    expect(getHistory(chemin)).toHaveLength(3)
  })

  it('rend une liste vide sur un budget sans dépense', () => {
    initBudget(chemin, 100, '2026-09-30', '2026-09-19')
    expect(getHistory(chemin)).toEqual([])
  })
})
