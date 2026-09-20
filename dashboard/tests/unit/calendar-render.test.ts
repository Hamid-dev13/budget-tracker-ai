import { describe, it, expect } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import CalendarGrid from '@/components/Calendar'
import { JourStat } from '@/lib/types'

// Septembre 2026 : 30 jours, le 1er tombe un mardi.
const DATE_DEBUT = '2026-09-01'
const TODAY = '2026-09-19'

// Le 19/09 est la journée de régression : 110,70 € sur un plafond de 20,67 €.
const jours: JourStat[] = Array.from({ length: 30 }, (_, i) => {
  const jour = i + 1
  const passe = jour <= 19
  return {
    date: `2026-09-${String(jour).padStart(2, '0')}`,
    depense: jour === 19 ? 110.7 : 0,
    cagnotte: 0,
    status: jour === 19 ? 'danger' : passe ? 'ok' : 'future',
  }
})

// Pas de JSX : le tsconfig de Next est en `jsx: preserve`, la config vitest reste intacte.
const html = () =>
  renderToStaticMarkup(
    createElement(CalendarGrid, { jours, dateDebut: DATE_DEBUT, today: TODAY }),
  )

describe('CalendarGrid — encombrement', () => {
  it("n'utilise pas aspect-square : la hauteur d'une cellule suivrait la largeur de la colonne", () => {
    expect(html()).not.toContain('aspect-square')
  })

  it('borne la hauteur des 30 cellules de jour', () => {
    const cellules = html().match(/class="[^"]*\bh-\d+\b[^"]*\brounded-lg\b[^"]*"/g) ?? []
    expect(cellules.length).toBe(30)
  })

  it('garde les 30 jours du mois et le marqueur du jour courant', () => {
    const markup = html()
    expect(markup).toContain('>30<')
    expect(markup).toContain('>19<')
    expect(markup).toContain('rounded-full')
  })

  it('affiche le montant dans la cellule, pas seulement en infobulle', () => {
    expect(html()).toContain('110,70 €')
  })
})
