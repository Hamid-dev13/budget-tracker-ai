'use client'

import { useEffect, useState } from 'react'
import { BudgetData } from '@/lib/types'
import { computeBudget } from '@/lib/budget'
import Sidebar from '@/components/Sidebar'
import HeroKPI from '@/components/HeroKPI'
import KPICard from '@/components/KPICard'
import CalendarGrid from '@/components/Calendar'
import BudgetPieChart from '@/components/PieChart'
import BudgetLineChart from '@/components/LineChart'
import TransactionList from '@/components/TransactionList'
import { fmt, fmtDate } from '@/lib/budget'

export default function Dashboard() {
  const [data, setData] = useState<BudgetData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchData = async () => {
    try {
      const res = await fetch('/api/budget')
      if (!res.ok) throw new Error('API error')
      const json = await res.json()
      setData(json)
      setLastUpdated(new Date())
      setError(null)
    } catch (e) {
      setError('Erreur de chargement des données')
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  if (error) return (
    <div className="flex h-screen items-center justify-center bg-[#faf7f0] dark:bg-[#111111]">
      <p className="text-danger font-bold text-xl">{error}</p>
    </div>
  )

  if (!data) return (
    <div className="flex h-screen items-center justify-center bg-[#faf7f0] dark:bg-[#111111]">
      <p className="text-gray-500 animate-pulse font-inter text-lg">Chargement...</p>
    </div>
  )

  const computed = computeBudget(data)

  return (
    <div className="flex min-h-screen bg-[#faf7f0] dark:bg-[#111111]">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-inter font-black text-2xl uppercase tracking-widest text-gray-800 dark:text-gray-100">
              TABLEAU DE BORD
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {data.date_debut} → {data.date_fin}
              {lastUpdated && (
                <span className="ml-3 text-xs opacity-60">
                  Mis à jour {lastUpdated.toLocaleTimeString('fr-FR')}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Hero */}
        <div className="mb-8">
          <HeroKPI computed={computed} />
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KPICard
            title="Budget aujourd'hui"
            value={fmt(computed.budgetAujourdhui)}
            subtitle="cumul disponible"
            color="ok"
          />
          <KPICard
            title="Dette"
            value={`${computed.detteJours} j`}
            subtitle={computed.detteJours > 0 ? 'jours bloqués' : 'aucune dette'}
            color={computed.detteJours > 0 ? 'danger' : 'ok'}
          />
          <KPICard
            title="Reprise"
            value={computed.detteJours > 0 ? fmtDate(computed.repriseDateStr) : 'Aujourd\'hui'}
            subtitle="date de reprise"
            color={computed.detteJours > 0 ? 'warn' : 'ok'}
          />
          <KPICard
            title="Dépense aujourd'hui"
            value={fmt(computed.depenseAujourdhui)}
            subtitle={`plafond: ${fmt(data.plafond_jour)}`}
            color={computed.depenseAujourdhui > data.plafond_jour * 1.5 ? 'danger' : computed.depenseAujourdhui > data.plafond_jour ? 'warn' : 'ok'}
          />
        </div>

        {/* Calendar */}
        <div className="mb-8">
          <h2 className="font-inter font-black text-sm uppercase tracking-widest text-gray-600 dark:text-gray-400 mb-3">
            Calendrier du mois
          </h2>
          <CalendarGrid dayStats={computed.dayStats} dateDebut={data.date_debut} />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-6 shadow-sm">
            <h2 className="font-inter font-black text-sm uppercase tracking-widest text-gray-600 dark:text-gray-400 mb-4">
              Répartition des dépenses
            </h2>
            <BudgetPieChart pieData={computed.pieData} />
          </div>
          <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-6 shadow-sm">
            <h2 className="font-inter font-black text-sm uppercase tracking-widest text-gray-600 dark:text-gray-400 mb-4">
              Évolution du solde
            </h2>
            <BudgetLineChart lineData={computed.lineData} />
          </div>
        </div>

        {/* Transaction list */}
        <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-6 shadow-sm">
          <h2 className="font-inter font-black text-sm uppercase tracking-widest text-gray-600 dark:text-gray-400 mb-4">
            Historique des transactions
          </h2>
          <TransactionList depenses={data.depenses} />
        </div>
      </main>
    </div>
  )
}
