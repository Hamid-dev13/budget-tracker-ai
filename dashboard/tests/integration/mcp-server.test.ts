/**
 * Serveur MCP — testé de bout en bout via un client MCP en mémoire,
 * donc à travers la vraie sérialisation du protocole.
 *
 * Les outils doivent répondre un RÉSULTAT lisible par Hermes (des jours de dette),
 * pas un JSON brut qu'il aurait à réinterpréter.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'

import { creerServeur } from '../../mcp/server'
import { writeBudget, readBudget } from '../../lib/budget-store'
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
let client: Client

async function connecter(today = '2026-09-20') {
  const [transportClient, transportServeur] = InMemoryTransport.createLinkedPair()
  const serveur = creerServeur(chemin, () => today)
  await serveur.connect(transportServeur)

  client = new Client({ name: 'test', version: '1.0.0' })
  await client.connect(transportClient)
  return client
}

/** Concatène le contenu texte d'une réponse d'outil. */
function texte(res: unknown): string {
  const blocs = ((res as { content?: unknown }).content ?? []) as { type: string; text?: string }[]
  return blocs.map(b => b.text ?? '').join('\n')
}

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'budget-mcp-'))
  chemin = join(dir, 'budget.json')
})

afterEach(async () => {
  await client?.close()
  rmSync(dir, { recursive: true, force: true })
})

describe('outils exposés', () => {
  it('expose exactement les quatre outils du produit', async () => {
    const c = await connecter()
    const noms = (await c.listTools()).tools.map(t => t.name).sort()
    expect(noms).toEqual(['add_expense', 'get_history', 'get_status', 'init_budget'])
  })

  it('décrit chaque outil pour que l\'agent sache quand l\'appeler', async () => {
    const c = await connecter()
    for (const outil of (await c.listTools()).tools) {
      expect(outil.description, `${outil.name} sans description`).toBeTruthy()
    }
  })
})

describe('init_budget', () => {
  it('initialise le budget et annonce le plafond journalier', async () => {
    const c = await connecter()
    const res = await c.callTool({
      name: 'init_budget',
      arguments: { solde: 248, date_fin: '2026-09-30', date_debut: '2026-09-19' },
    })

    expect(res.isError).toBeFalsy()
    expect(texte(res)).toMatch(/248/)
    expect(texte(res)).toMatch(/20,67/)
    expect(readBudget(chemin).solde_depart).toBe(248)
  })

  it('date le début du jour courant par défaut', async () => {
    const c = await connecter('2026-09-22')
    await c.callTool({ name: 'init_budget', arguments: { solde: 100, date_fin: '2026-09-30' } })
    expect(readBudget(chemin).date_debut).toBe('2026-09-22')
  })

  it('refuse un solde nul avec un message exploitable', async () => {
    const c = await connecter()
    const res = await c.callTool({ name: 'init_budget', arguments: { solde: 0, date_fin: '2026-09-30' } })

    expect(res.isError).toBe(true)
    expect(texte(res)).toMatch(/solde/i)
  })
})

describe('add_expense', () => {
  beforeEach(() => writeBudget(chemin, { ...REEL, depenses: [] }))

  it('enregistre la dépense et répond en jours de dette', async () => {
    const c = await connecter()
    const res = await c.callTool({
      name: 'add_expense',
      arguments: { montant: 110.7, description: 'Courses', date: '2026-09-19' },
    })

    expect(res.isError).toBeFalsy()
    const sortie = texte(res)
    expect(sortie).toMatch(/110,70/)
    expect(sortie).toMatch(/Courses/)
    // Le résultat qui intéresse Hermes : la conséquence, pas l'accusé de réception.
    expect(sortie).toMatch(/4 jours/)
    expect(sortie).toMatch(/2026-09-24/)
    expect(readBudget(chemin).depenses).toHaveLength(1)
  })

  it('date la dépense du jour courant par défaut', async () => {
    const c = await connecter('2026-09-22')
    await c.callTool({ name: 'add_expense', arguments: { montant: 10, description: 'Café' } })
    expect(readBudget(chemin).depenses[0].date).toBe('2026-09-22')
  })

  it('annonce le budget restant quand la dépense tient dans le plafond', async () => {
    const c = await connecter()
    const res = await c.callTool({
      name: 'add_expense',
      arguments: { montant: 5, description: 'Café', date: '2026-09-20' },
    })

    expect(texte(res)).toMatch(/reste/i)
    expect(texte(res)).not.toMatch(/bloqué/i)
  })

  it('refuse un montant négatif', async () => {
    const c = await connecter()
    const res = await c.callTool({
      name: 'add_expense',
      arguments: { montant: -5, description: 'Remboursement' },
    })

    expect(res.isError).toBe(true)
    expect(texte(res)).toMatch(/montant/i)
  })

  it('signale clairement un budget non initialisé', async () => {
    rmSync(chemin)
    const c = await connecter()
    const res = await c.callTool({ name: 'add_expense', arguments: { montant: 10, description: 'X' } })

    expect(res.isError).toBe(true)
    expect(texte(res)).toMatch(/introuvable|init_budget/i)
  })
})

describe('get_status', () => {
  it('répond le statut complet en jours de dette', async () => {
    writeBudget(chemin, REEL)
    const c = await connecter('2026-09-20')
    const res = await c.callTool({ name: 'get_status', arguments: {} })
    const sortie = texte(res)

    expect(res.isError).toBeFalsy()
    expect(sortie).toMatch(/137,30/)   // solde restant
    expect(sortie).toMatch(/4 jours/)  // jours bloqués
    expect(sortie).toMatch(/2026-09-24/) // reprise
    expect(sortie).toMatch(/13,30/)    // budget du jour de reprise
  })

  it('annonce un budget disponible quand il n\'y a pas de dette', async () => {
    writeBudget(chemin, { ...REEL, depenses: [] })
    const c = await connecter('2026-09-20')
    const sortie = texte(await c.callTool({ name: 'get_status', arguments: {} }))

    expect(sortie).toMatch(/41,33/)
    expect(sortie).not.toMatch(/bloqué/i)
  })

  it('accepte une date explicite', async () => {
    writeBudget(chemin, REEL)
    const c = await connecter('2026-09-20')
    const sortie = texte(await c.callTool({ name: 'get_status', arguments: { today: '2026-09-25' } }))

    expect(sortie).not.toMatch(/bloqué/i)
  })

  it('signale un budget non initialisé', async () => {
    const c = await connecter()
    const res = await c.callTool({ name: 'get_status', arguments: {} })

    expect(res.isError).toBe(true)
    expect(texte(res)).toMatch(/introuvable|init_budget/i)
  })
})

describe('get_history', () => {
  beforeEach(() =>
    writeBudget(chemin, {
      ...REEL,
      depenses: [
        { date: '2026-09-19', montant: 10, description: 'Premier' },
        { date: '2026-09-21', montant: 30, description: 'Dernier' },
        { date: '2026-09-20', montant: 20, description: 'Milieu' },
      ],
    })
  )

  it('liste les dépenses du plus récent au plus ancien', async () => {
    const c = await connecter()
    const sortie = texte(await c.callTool({ name: 'get_history', arguments: {} }))

    expect(sortie.indexOf('Dernier')).toBeLessThan(sortie.indexOf('Milieu'))
    expect(sortie.indexOf('Milieu')).toBeLessThan(sortie.indexOf('Premier'))
  })

  it('respecte la limite demandée', async () => {
    const c = await connecter()
    const sortie = texte(await c.callTool({ name: 'get_history', arguments: { limit: 1 } }))

    expect(sortie).toMatch(/Dernier/)
    expect(sortie).not.toMatch(/Premier/)
  })

  it('le dit quand il n\'y a aucune dépense', async () => {
    writeBudget(chemin, { ...REEL, depenses: [] })
    const c = await connecter()
    expect(texte(await c.callTool({ name: 'get_history', arguments: {} }))).toMatch(/aucune/i)
  })
})
