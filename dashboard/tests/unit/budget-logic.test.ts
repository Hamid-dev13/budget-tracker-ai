/**
 * Logique budget — source de vérité unique (API + MCP).
 * Modèle : cagnotte cumulée. On accumule le plafond chaque jour,
 * les dépenses se déduisent du cumul. La dette n'est que le cumul négatif.
 */
import { describe, it, expect } from 'vitest'
import {
  addDays,
  nbJoursPeriode,
  calculPlafondJour,
  cagnotteAu,
  detteJours,
  joursBloques,
  budgetJourReprise,
  computeBudget,
  type BudgetData,
} from '../../lib/budget-logic'

/** Données réelles rapatriées du home lab : 248 € sur 12 jours, tout cramé le 1er jour. */
const REEL: BudgetData = {
  solde_depart: 248.0,
  date_debut: '2026-09-19',
  date_fin: '2026-09-30',
  plafond_jour: 20.6667, // valeur stockée, volontairement ignorée
  depenses: [
    { date: '2026-09-19', montant: 45.12, description: 'Courses (hors boucherie)' },
    { date: '2026-09-19', montant: 33.0, description: 'Boucherie' },
    { date: '2026-09-19', montant: 9.9, description: 'Sagali' },
    { date: '2026-09-19', montant: 7.8, description: 'Afrawa Market' },
    { date: '2026-09-19', montant: 13.89, description: 'Gde Phcie Proven' },
    { date: '2026-09-19', montant: 0.99, description: 'Auchan' },
  ],
}

const PLAFOND_REEL = 248 / 12 // 20.6666…

describe('addDays', () => {
  it('avance d\'un jour', () => {
    expect(addDays('2026-09-19', 1)).toBe('2026-09-20')
  })

  // Le bug de la version Python : l'incrémentation repartait au 1er du même mois.
  it('franchit le 28 sans repartir au début du mois', () => {
    expect(addDays('2026-09-28', 1)).toBe('2026-09-29')
    expect(addDays('2026-09-30', 1)).toBe('2026-10-01')
    expect(addDays('2026-02-28', 1)).toBe('2026-03-01')
  })

  it('franchit une fin d\'année', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
  })

  it('reste stable au passage à l\'heure d\'hiver', () => {
    // 25/10/2026 : changement d'heure en France. Un calcul en heure locale saute un jour.
    expect(addDays('2026-10-24', 1)).toBe('2026-10-25')
    expect(addDays('2026-10-25', 1)).toBe('2026-10-26')
  })
})

describe('nbJoursPeriode', () => {
  it('compte les deux bornes incluses', () => {
    expect(nbJoursPeriode('2026-09-19', '2026-09-30')).toBe(12)
  })

  it('vaut 1 sur une période d\'un seul jour', () => {
    expect(nbJoursPeriode('2026-09-19', '2026-09-19')).toBe(1)
  })

  it('traverse un changement de mois', () => {
    expect(nbJoursPeriode('2026-09-28', '2026-10-02')).toBe(5)
  })
})

describe('calculPlafondJour', () => {
  it('dérive le plafond du solde et de la période', () => {
    expect(calculPlafondJour(REEL)).toBeCloseTo(20.6667, 4)
  })

  it('ignore la valeur plafond_jour stockée dans le fichier', () => {
    const menteur = { ...REEL, plafond_jour: 999 }
    expect(calculPlafondJour(menteur)).toBeCloseTo(20.6667, 4)
  })
})

describe('cagnotteAu', () => {
  it('accumule le plafond du premier jour et déduit les dépenses', () => {
    // 1 × 20,6667 − 110,70
    expect(cagnotteAu(REEL, '2026-09-19')).toBeCloseTo(-90.0333, 3)
  })

  it('recrédite un jour sans dépense', () => {
    // 2 × 20,6667 − 110,70
    expect(cagnotteAu(REEL, '2026-09-20')).toBeCloseTo(-69.3667, 3)
    expect(cagnotteAu(REEL, '2026-09-21')).toBeCloseTo(-48.7, 3)
  })

  it('repasse positive une fois la dette remboursée', () => {
    expect(cagnotteAu(REEL, '2026-09-23')).toBeLessThan(0)
    expect(cagnotteAu(REEL, '2026-09-24')).toBeCloseTo(13.3, 2)
  })

  it('reporte intégralement une période sans aucune dépense', () => {
    const vierge: BudgetData = { ...REEL, depenses: [] }
    expect(cagnotteAu(vierge, '2026-09-21')).toBeCloseTo(3 * PLAFOND_REEL, 4)
  })

  it('ne compte pas les dépenses postérieures au jour demandé', () => {
    const data: BudgetData = {
      ...REEL,
      depenses: [{ date: '2026-09-25', montant: 50, description: 'plus tard' }],
    }
    expect(cagnotteAu(data, '2026-09-20')).toBeCloseTo(2 * PLAFOND_REEL, 4)
  })

  it('termine sur une période qui franchit le 28 du mois', () => {
    // Régression directe de la boucle infinie de calcul_budget_aujourd_hui.
    const long: BudgetData = {
      solde_depart: 300,
      date_debut: '2026-09-19',
      date_fin: '2026-10-18',
      depenses: [],
    }
    expect(cagnotteAu(long, '2026-10-05')).toBeCloseTo(17 * (300 / 30), 4)
  })
})

describe('detteJours', () => {
  it('vaut 0 quand la cagnotte est positive', () => {
    expect(detteJours(13.3, PLAFOND_REEL)).toBe(0)
  })

  it('vaut 0 quand la cagnotte est exactement à zéro', () => {
    expect(detteJours(0, PLAFOND_REEL)).toBe(0)
  })

  it('convertit une cagnotte négative en jours', () => {
    expect(detteJours(-69.3667, PLAFOND_REEL)).toBeCloseTo(3.3565, 3)
  })
})

describe('joursBloques', () => {
  it('arrondit la dette au jour supérieur', () => {
    expect(joursBloques(3.3565)).toBe(4)
  })

  it('ne bloque rien sans dette', () => {
    expect(joursBloques(0)).toBe(0)
  })

  it('ne bloque pas un jour de plus sur une dette entière', () => {
    expect(joursBloques(3)).toBe(3)
  })
})

describe('budgetJourReprise', () => {
  it('rend le reliquat du dernier jour partiel', () => {
    // (1 − 0,3565) × 20,6667
    expect(budgetJourReprise(3.3565, PLAFOND_REEL)).toBeCloseTo(13.3, 1)
  })

  it('rend un plafond plein quand la dette tombe juste', () => {
    expect(budgetJourReprise(3, PLAFOND_REEL)).toBeCloseTo(PLAFOND_REEL, 4)
  })

  it('rend un plafond plein sans dette', () => {
    expect(budgetJourReprise(0, PLAFOND_REEL)).toBeCloseTo(PLAFOND_REEL, 4)
  })
})

describe('computeBudget', () => {
  it('rend la vue complète au 20/09 (cas réel)', () => {
    const vue = computeBudget(REEL, '2026-09-20')

    expect(vue.plafondJour).toBeCloseTo(20.6667, 4)
    expect(vue.totalDepenses).toBeCloseTo(110.7, 2)
    expect(vue.soldeRestant).toBeCloseTo(137.3, 2)
    expect(vue.cagnotte).toBeCloseTo(-69.3667, 3)
    expect(vue.budgetAujourdhui).toBe(0)
    expect(vue.detteJours).toBeCloseTo(3.3565, 3)
    expect(vue.joursBloques).toBe(4)
    expect(vue.dateReprise).toBe('2026-09-24')
    expect(vue.budgetJourReprise).toBeCloseTo(13.3, 1)
    expect(vue.status).toBe('danger')
  })

  it('n\'annonce aucune reprise quand il n\'y a pas de dette', () => {
    const vierge: BudgetData = { ...REEL, depenses: [] }
    const vue = computeBudget(vierge, '2026-09-20')

    expect(vue.detteJours).toBe(0)
    expect(vue.joursBloques).toBe(0)
    expect(vue.dateReprise).toBeNull()
    expect(vue.budgetAujourdhui).toBeCloseTo(2 * PLAFOND_REEL, 4)
    expect(vue.status).toBe('ok')
  })

  it('produit un jour par date de la période', () => {
    const vue = computeBudget(REEL, '2026-09-20')
    expect(vue.jours).toHaveLength(12)
    expect(vue.jours[0].date).toBe('2026-09-19')
    expect(vue.jours[11].date).toBe('2026-09-30')
  })

  it('marque les jours à venir comme futurs et agrège les dépenses du jour', () => {
    const vue = computeBudget(REEL, '2026-09-20')

    expect(vue.jours[0].depense).toBeCloseTo(110.7, 2)
    expect(vue.jours[0].status).toBe('danger')
    expect(vue.jours[1].status).toBe('ok') // aujourd'hui, rien dépensé
    expect(vue.jours[2].status).toBe('future')
  })

  it('classe un jour en warn entre 100 % et 150 % du plafond', () => {
    const data: BudgetData = {
      ...REEL,
      depenses: [{ date: '2026-09-19', montant: 25, description: 'léger dépassement' }],
    }
    const vue = computeBudget(data, '2026-09-20')
    expect(vue.jours[0].status).toBe('warn')
  })

  it('ne dépend pas de l\'horloge de la machine', () => {
    // Le jour courant est un paramètre : deux appels identiques donnent le même résultat.
    expect(computeBudget(REEL, '2026-09-22')).toEqual(computeBudget(REEL, '2026-09-22'))
    expect(computeBudget(REEL, '2026-09-22').joursBloques).toBe(2)
  })

  it('reste cohérent le dernier jour de la période', () => {
    const vue = computeBudget(REEL, '2026-09-30')
    expect(vue.cagnotte).toBeCloseTo(248 - 110.7, 2)
    expect(vue.detteJours).toBe(0)
    expect(vue.jours.every(j => j.status !== 'future')).toBe(true)
  })
})
