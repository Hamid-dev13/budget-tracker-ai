/**
 * GET  /api/expenses  — historique, du plus récent au plus ancien (?limit=N)
 * POST /api/expenses  — enregistre une dépense
 */
import { NextResponse } from 'next/server'
import { addExpense, getHistory } from '@/lib/budget-service'
import { cheminBudget } from '@/lib/budget-store'
import { statusDeLErreur, messageDeLErreur, DonneeInvalide } from '@/lib/errors'

export const dynamic = 'force-dynamic'

function erreur(err: unknown) {
  const status = statusDeLErreur(err)
  if (status === 500) console.error('[api/expenses]', err)
  return NextResponse.json({ error: messageDeLErreur(err) }, { status })
}

export async function GET(request: Request) {
  try {
    const brut = new URL(request.url).searchParams.get('limit')
    let limit: number | undefined

    if (brut !== null) {
      limit = Number(brut)
      if (!Number.isInteger(limit) || limit < 0) {
        throw new DonneeInvalide(`limit invalide : "${brut}" — entier positif attendu`)
      }
    }

    return NextResponse.json(getHistory(cheminBudget(), limit))
  } catch (err) {
    return erreur(err)
  }
}

export async function POST(request: Request) {
  let corps: { montant?: number; description?: string; date?: string }
  try {
    corps = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corps de requête JSON invalide' }, { status: 400 })
  }

  try {
    const depense = addExpense(
      cheminBudget(),
      corps.montant as number,
      (corps.description ?? '') as string,
      corps.date
    )
    return NextResponse.json(depense, { status: 201 })
  } catch (err) {
    return erreur(err)
  }
}
