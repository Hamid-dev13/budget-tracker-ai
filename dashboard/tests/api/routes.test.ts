/**
 * Routes HTTP — on appelle les handlers Next directement, sur un budget temporaire.
 * La recette au curl (tests/api/recette.sh) rejoue les mêmes cas sur le serveur réel.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { GET as getBudget, POST as postInit } from '../../app/api/budget/route'
import { GET as getHistorique, POST as postDepense } from '../../app/api/expenses/route'
import { writeBudget } from '../../lib/budget-store'
import { readBudget } from '../../lib/budget-store'
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
  dir = mkdtempSync(join(tmpdir(), 'budget-api-'))
  chemin = join(dir, 'budget.json')
  process.env.BUDGET_PATH = chemin
})

afterEach(() => {
  rmSync(dir, { recursive: true, force: true })
  delete process.env.BUDGET_PATH
})

const req = (url: string, init?: RequestInit) => new Request(`http://localhost${url}`, init)
const post = (url: string, body: unknown) =>
  req(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })

describe('GET /api/budget', () => {
  it('rend la vue calculée, pas le JSON brut', async () => {
    writeBudget(chemin, REEL)
    const res = await getBudget(req('/api/budget?today=2026-09-20'))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.plafondJour).toBeCloseTo(20.6667, 4)
    expect(json.soldeRestant).toBeCloseTo(137.3, 2)
    expect(json.budgetAujourdhui).toBe(0)
    expect(json.joursBloques).toBe(4)
    expect(json.dateReprise).toBe('2026-09-24')
    expect(json.status).toBe('danger')
  })

  it('expose les dépenses et les bornes de période dont l\'UI a besoin', async () => {
    writeBudget(chemin, REEL)
    const json = await (await getBudget(req('/api/budget?today=2026-09-20'))).json()

    expect(json.depenses).toHaveLength(2)
    expect(json.dateDebut).toBe('2026-09-19')
    expect(json.dateFin).toBe('2026-09-30')
    expect(json.jours).toHaveLength(12)
  })

  it('répond 404 quand le budget n\'est pas initialisé', async () => {
    const res = await getBudget(req('/api/budget'))
    expect(res.status).toBe(404)
    expect((await res.json()).error).toMatch(/introuvable/i)
  })

  it('répond 400 sur un today mal formé', async () => {
    writeBudget(chemin, REEL)
    const res = await getBudget(req('/api/budget?today=20-09-2026'))
    expect(res.status).toBe(400)
  })

  it('répond 500 sur un budget corrompu', async () => {
    writeBudget(chemin, { solde_depart: 100 } as unknown as BudgetData)
    const res = await getBudget(req('/api/budget'))
    expect(res.status).toBe(500)
  })
})

describe('POST /api/budget (init)', () => {
  it('initialise un budget', async () => {
    const res = await postInit(
      post('/api/budget', { solde: 248, date_fin: '2026-09-30', date_debut: '2026-09-19' })
    )

    expect(res.status).toBe(201)
    expect((await res.json()).solde_depart).toBe(248)
    expect(readBudget(chemin).depenses).toEqual([])
  })

  it('refuse un solde invalide', async () => {
    const res = await postInit(post('/api/budget', { solde: 0, date_fin: '2026-09-30' }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/solde/i)
  })

  it('refuse une période inversée', async () => {
    const res = await postInit(
      post('/api/budget', { solde: 100, date_fin: '2026-09-10', date_debut: '2026-09-19' })
    )
    expect(res.status).toBe(400)
  })

  it('refuse un corps qui n\'est pas du JSON', async () => {
    const res = await postInit(
      req('/api/budget', { method: 'POST', headers: { 'content-type': 'application/json' }, body: 'pas du json' })
    )
    expect(res.status).toBe(400)
  })
})

describe('POST /api/expenses', () => {
  beforeEach(() => {
    writeBudget(chemin, { ...REEL, depenses: [] })
  })

  it('enregistre une dépense', async () => {
    const res = await postDepense(
      post('/api/expenses', { montant: 45.12, description: 'Courses', date: '2026-09-19' })
    )

    expect(res.status).toBe(201)
    expect(await res.json()).toEqual({ date: '2026-09-19', montant: 45.12, description: 'Courses' })
    expect(readBudget(chemin).depenses).toHaveLength(1)
  })

  it('refuse un montant négatif', async () => {
    const res = await postDepense(post('/api/expenses', { montant: -5, description: 'Remboursement' }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/montant/i)
  })

  it('refuse une description vide', async () => {
    const res = await postDepense(post('/api/expenses', { montant: 10, description: '  ' }))
    expect(res.status).toBe(400)
  })

  it('refuse une date mal formée', async () => {
    const res = await postDepense(
      post('/api/expenses', { montant: 10, description: 'Courses', date: '19/09/2026' })
    )
    expect(res.status).toBe(400)
  })

  it('répond 404 si le budget n\'existe pas', async () => {
    rmSync(chemin)
    const res = await postDepense(post('/api/expenses', { montant: 10, description: 'Courses' }))
    expect(res.status).toBe(404)
  })
})

describe('GET /api/expenses (historique)', () => {
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

  it('rend l\'historique du plus récent au plus ancien', async () => {
    const json = await (await getHistorique(req('/api/expenses'))).json()
    expect(json.map((d: { description: string }) => d.description)).toEqual(['Dernier', 'Milieu', 'Premier'])
  })

  it('respecte le paramètre limit', async () => {
    const json = await (await getHistorique(req('/api/expenses?limit=2'))).json()
    expect(json).toHaveLength(2)
  })

  it('refuse un limit non numérique', async () => {
    const res = await getHistorique(req('/api/expenses?limit=beaucoup'))
    expect(res.status).toBe(400)
  })
})
