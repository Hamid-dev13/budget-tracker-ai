/**
 * GET  /api/budget  — la vue calculée du budget (plus jamais le JSON brut)
 * POST /api/budget  — initialise le budget du mois
 */
import { NextResponse } from 'next/server'
import { getStatus, initBudget, todayISO } from '@/lib/budget-service'
import { cheminBudget, readBudget } from '@/lib/budget-store'
import { statusDeLErreur, messageDeLErreur } from '@/lib/errors'

export const dynamic = 'force-dynamic'

function erreur(err: unknown) {
  const status = statusDeLErreur(err)
  if (status === 500) console.error('[api/budget]', err)
  return NextResponse.json({ error: messageDeLErreur(err) }, { status })
}

export async function GET(request: Request) {
  try {
    const today = new URL(request.url).searchParams.get('today') ?? todayISO()
    const chemin = cheminBudget()
    const vue = getStatus(chemin, today)
    const data = readBudget(chemin)

    return NextResponse.json({
      ...vue,
      today,
      dateDebut: data.date_debut,
      dateFin: data.date_fin,
      depenses: data.depenses,
    })
  } catch (err) {
    return erreur(err)
  }
}

export async function POST(request: Request) {
  let corps: { solde?: number; date_fin?: string; date_debut?: string }
  try {
    corps = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corps de requête JSON invalide' }, { status: 400 })
  }

  try {
    const data = initBudget(cheminBudget(), corps.solde as number, corps.date_fin as string, corps.date_debut)
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    return erreur(err)
  }
}
