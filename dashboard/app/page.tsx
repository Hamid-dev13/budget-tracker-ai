'use client'

import { useEffect, useState } from 'react'
import { ReponseBudget } from '@/lib/types'
import Sidebar from '@/components/Sidebar'
import HeroKPI from '@/components/HeroKPI'
import KPICard from '@/components/KPICard'
import CalendarGrid from '@/components/Calendar'
import BudgetPieChart from '@/components/PieChart'
import BudgetLineChart from '@/components/LineChart'
import TransactionList from '@/components/TransactionList'
import { fmt, fmtDate, pieDataDe, lineDataDe } from '@/lib/budget'

export default function Dashboard() {
  // La vue arrive calculée par le serveur : cette page n'applique aucune règle métier.
  const [vue, setVue] = useState<ReponseBudget | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchData = async () => {
    try {
      const res = await fetch('/api/budget')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erreur API')
      setVue(json)
      setLastUpdated(new Date())
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement des données')
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  if (error) return (
    <div className="flex h-screen items-center justify-center bg-[#faf7f0] dark:bg-[#111111] px-8">
      <p className="text-danger font-bold text-xl text-center">{error}</p>
    </div>
  )

  if (!vue) return (
    <div className="flex h-screen items-center justify-center bg-[#faf7f0] dark:bg-[#111111]">
      <p className="text-gray-500 animate-pulse font-inter text-lg">Chargement...</p>
    </div>
  )

  const depenseAujourdhui = vue.jours.find(j => j.date === vue.today)?.depense ?? 0

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
              {vue.dateDebut} → {vue.dateFin}
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
          <HeroKPI vue={vue} />
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KPICard
            title="Budget aujourd'hui"
            value={fmt(vue.budgetAujourdhui)}
            subtitle="cagnotte disponible"
            color={vue.budgetAujourdhui > 0 ? 'ok' : 'danger'}
          />
          <KPICard
            title="Jours bloqués"
            value={`${vue.joursBloques} j`}
            subtitle={vue.joursBloques > 0 ? `dette de ${vue.detteJours.toFixed(1).replace('.', ',')} j` : 'aucune dette'}
            color={vue.joursBloques > 0 ? 'danger' : 'ok'}
          />
          <KPICard
            title="Reprise"
            value={vue.dateReprise ? fmtDate(vue.dateReprise) : "Aujourd'hui"}
            subtitle={vue.dateReprise ? `avec ${fmt(vue.budgetJourReprise)}` : 'pas de blocage'}
            color={vue.dateReprise ? 'warn' : 'ok'}
          />
          <KPICard
            title="Dépense aujourd'hui"
            value={fmt(depenseAujourdhui)}
            subtitle={`plafond : ${fmt(vue.plafondJour)}`}
            color={depenseAujourdhui > vue.plafondJour * 1.5 ? 'danger' : depenseAujourdhui > vue.plafondJour ? 'warn' : 'ok'}
          />
        </div>

        {/* Calendar */}
        <div className="mb-8">
          <h2 className="font-inter font-black text-sm uppercase tracking-widest text-gray-600 dark:text-gray-400 mb-3">
            Calendrier du mois
          </h2>
          <CalendarGrid jours={vue.jours} dateDebut={vue.dateDebut} today={vue.today} />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-6 shadow-sm">
            <h2 className="font-inter font-black text-sm uppercase tracking-widest text-gray-600 dark:text-gray-400 mb-4">
              Répartition des dépenses
            </h2>
            <BudgetPieChart pieData={pieDataDe(vue.depenses)} />
          </div>
          <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-6 shadow-sm">
            <h2 className="font-inter font-black text-sm uppercase tracking-widest text-gray-600 dark:text-gray-400 mb-4">
              Évolution du solde
            </h2>
            <BudgetLineChart lineData={lineDataDe(vue.jours, vue.soldeDepart, vue.today)} />
          </div>
        </div>

        {/* Transaction list */}
        <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-6 shadow-sm">
          <h2 className="font-inter font-black text-sm uppercase tracking-widest text-gray-600 dark:text-gray-400 mb-4">
            Historique des transactions
          </h2>
          <TransactionList depenses={vue.depenses} />
        </div>
      </main>
    </div>
  )
}
