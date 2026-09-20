/**
 * Couche présentation — formatage et agrégations d'affichage uniquement.
 * Aucune règle métier ici : elles vivent dans budget-logic, côté serveur.
 */
import { describe, it, expect } from 'vitest'
import { fmt, fmtCourt, fmtDate, statusColor, pieDataDe, lineDataDe } from '../../lib/budget'
import type { Depense, JourStat } from '../../lib/budget-logic'

describe('fmt', () => {
  it('formate en euros à la française', () => {
    expect(fmt(20.6666)).toBe('20,67 €')
    expect(fmt(0)).toBe('0,00 €')
    expect(fmt(-69.37)).toBe('-69,37 €')
  })
})

describe('fmtCourt', () => {
  it("arrondit à l'euro : sur mobile une colonne fait ~45 px", () => {
    expect(fmtCourt(110.7)).toBe('111 €')
    expect(fmtCourt(20.6666)).toBe('21 €')
    expect(fmtCourt(13.3)).toBe('13 €')
    expect(fmtCourt(0)).toBe('0 €')
  })

  it('reste plus court que le format long, qui ne tient pas dans la case', () => {
    for (const n of [0, 13.3, 20.6666, 110.7]) {
      expect(fmtCourt(n).length).toBeLessThan(fmt(n).length)
    }
  })
})

describe('fmtDate', () => {
  it('formate en jour/mois', () => {
    expect(fmtDate('2026-09-19')).toBe('19/09')
  })

  it('ne décale pas au passage à l\'heure d\'hiver', () => {
    expect(fmtDate('2026-10-25')).toBe('25/10')
  })
})

describe('statusColor', () => {
  it('donne une couleur distincte par statut', () => {
    const couleurs = ['ok', 'warn', 'danger', 'future'].map(s => statusColor(s as never))
    expect(new Set(couleurs).size).toBe(4)
  })
})

describe('pieDataDe', () => {
  const depenses: Depense[] = [
    { date: '2026-09-19', montant: 45.12, description: 'Courses' },
    { date: '2026-09-20', montant: 10.0, description: 'Courses' },
    { date: '2026-09-19', montant: 33.0, description: 'Boucherie' },
  ]

  it('agrège les montants par description', () => {
    expect(pieDataDe(depenses)).toEqual([
      { name: 'Courses', value: 55.12 },
      { name: 'Boucherie', value: 33.0 },
    ])
  })

  it('trie du plus gros poste au plus petit', () => {
    expect(pieDataDe(depenses)[0].name).toBe('Courses')
  })

  it('rend une liste vide sans dépense', () => {
    expect(pieDataDe([])).toEqual([])
  })
})

describe('lineDataDe', () => {
  const jours: JourStat[] = [
    { date: '2026-09-19', depense: 110.7, cagnotte: -90.03, budgetDuJour: 0, status: 'danger' },
    { date: '2026-09-20', depense: 0, cagnotte: -69.37, budgetDuJour: 0, status: 'danger' },
    { date: '2026-09-21', depense: 0, cagnotte: -48.7, budgetDuJour: 0, status: 'danger' },
  ]

  it('suit le solde restant jour après jour', () => {
    expect(lineDataDe(jours, 248, '2026-09-20')).toEqual([
      { date: '19/09', solde: 137.3 },
      { date: '20/09', solde: 137.3 },
    ])
  })

  it('s\'arrête au jour courant — on ne trace pas le futur', () => {
    expect(lineDataDe(jours, 248, '2026-09-19')).toHaveLength(1)
  })
})
