import { BudgetData, ComputedBudget, DayStats, Status } from './types'

export function fmt(n: number): string {
  return n.toFixed(2).replace('.', ',') + ' €'
}

export function fmtDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

export function calcStatus(depense: number, plafond: number): Status {
  if (depense === 0) return 'ok'
  const ratio = depense / plafond
  if (ratio <= 1) return 'ok'
  if (ratio <= 1.5) return 'warn'
  return 'danger'
}

export function computeBudget(data: BudgetData): ComputedBudget {
  const { solde_depart, date_debut, date_fin, depenses } = data

  const debut = new Date(date_debut + 'T00:00:00')
  const fin = new Date(date_fin + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Total days in budget period
  const nbJoursPeriode = Math.round((fin.getTime() - debut.getTime()) / 86400000) + 1
  const plafond_jour = solde_depart / nbJoursPeriode

  // Group depenses by date
  const depenseByDate: Record<string, number> = {}
  for (const d of depenses) {
    depenseByDate[d.date] = (depenseByDate[d.date] || 0) + d.montant
  }

  // Total all depenses
  const totalDepenses = depenses.reduce((s, d) => s + d.montant, 0)
  const soldeRestant = solde_depart - totalDepenses

  // Compute day stats for each day in period
  const dayStats: DayStats[] = []
  let budgetCumul = 0
  let soldeCourant = solde_depart

  for (let i = 0; i < nbJoursPeriode; i++) {
    const dateStr = addDays(date_debut, i)
    const dayDate = new Date(dateStr + 'T00:00:00')
    const depenseJour = depenseByDate[dateStr] || 0

    budgetCumul += plafond_jour
    soldeCourant -= depenseJour

    let status: Status
    if (dayDate > today) {
      status = 'future'
    } else {
      status = calcStatus(depenseJour, plafond_jour)
    }

    dayStats.push({
      date: dateStr,
      depense: depenseJour,
      status,
      budgetCumul,
      soldeFin: soldeCourant,
    })
  }

  // Today stats
  const todayStr = today.toISOString().slice(0, 10)
  const depenseAujourdhui = depenseByDate[todayStr] || 0
  const todayStat = dayStats.find(d => d.date === todayStr)

  // Budget aujourd'hui: cumulative unspent + today's allowance
  // = sum of (plafond - depense) for all past days + plafond for today
  let budgetAujourdhui = 0
  let dette = 0

  for (const stat of dayStats) {
    const dayDate = new Date(stat.date + 'T00:00:00')
    if (dayDate > today) break
    const dJour = depenseByDate[stat.date] || 0
    budgetAujourdhui += plafond_jour - dJour
  }
  // budgetAujourdhui is remaining budget from start to today
  // If negative, it means we're in debt
  if (budgetAujourdhui < 0) {
    dette = Math.abs(budgetAujourdhui) / plafond_jour
  }

  // Reprise date: today + floor(dette) + 1 days
  const joursBlockes = Math.floor(dette)
  const repriseDateStr = joursBlockes > 0
    ? addDays(todayStr, joursBlockes + 1)
    : todayStr

  // Determine overall status
  const overallStatus: Status = soldeRestant < 0
    ? 'danger'
    : depenseAujourdhui > plafond_jour * 1.5
      ? 'danger'
      : depenseAujourdhui > plafond_jour
        ? 'warn'
        : 'ok'

  // Pie data: group by description
  const pieMap: Record<string, number> = {}
  for (const d of depenses) {
    pieMap[d.description] = (pieMap[d.description] || 0) + d.montant
  }
  const pieData = Object.entries(pieMap).map(([name, value]) => ({ name, value }))

  // Line data: solde evolution
  const lineData: { date: string; solde: number }[] = []
  let soldeLine = solde_depart
  for (const stat of dayStats) {
    const dayDate = new Date(stat.date + 'T00:00:00')
    if (dayDate > today) break
    soldeLine -= (depenseByDate[stat.date] || 0)
    lineData.push({ date: fmtDate(stat.date), solde: Math.round(soldeLine * 100) / 100 })
  }

  return {
    data,
    soldeRestant,
    depenseAujourdhui,
    budgetAujourdhui: Math.max(0, budgetAujourdhui),
    detteJours: joursBlockes,
    repriseDateStr,
    status: overallStatus,
    totalDepenses,
    dayStats,
    pieData,
    lineData,
  }
}

export function statusColor(s: Status): string {
  switch (s) {
    case 'ok': return '#22c55e'
    case 'warn': return '#f97316'
    case 'danger': return '#ef4444'
    case 'info': return '#3b82f6'
    case 'future': return '#d1d5db'
    default: return '#d1d5db'
  }
}

export function statusBg(s: Status): string {
  switch (s) {
    case 'ok': return 'bg-ok'
    case 'warn': return 'bg-warn'
    case 'danger': return 'bg-danger'
    case 'info': return 'bg-info'
    case 'future': return 'bg-gray-200 dark:bg-gray-700'
    default: return 'bg-gray-200'
  }
}
