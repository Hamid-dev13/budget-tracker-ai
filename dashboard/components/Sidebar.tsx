'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, History, Calendar, Settings, Sun, Moon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

const NAV_ITEMS = [
  { label: 'Dashboard',  href: '/',           icon: LayoutDashboard },
  { label: 'Historique', href: '/historique', icon: History },
  { label: 'Calendrier', href: '/calendrier', icon: Calendar },
  { label: 'Paramètres', href: '/parametres', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    // Sous sm, la barre se réduit à un rail d'icônes : à 375 px, 224 px de
    // sidebar ne laisseraient que 150 px au contenu.
    <aside className="fixed top-0 left-0 h-screen w-14 sm:w-56 bg-[#0d0d0d] flex flex-col z-50">
      <div className="px-2 sm:px-6 py-6 sm:py-8 text-center sm:text-left">
        <span className="font-playfair text-2xl font-bold text-white">
          <span className="hidden sm:inline">Budget</span>
          <span className="sm:hidden">B</span>
          <span className="text-[#f97316]">.</span>
        </span>
      </div>

      <nav className="flex-1 px-1 sm:px-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={`w-full flex items-center justify-center sm:justify-start gap-0 sm:gap-3 px-0 sm:px-3 py-2.5 rounded-lg text-left transition-all ${
                active
                  ? 'border-l-[3px] border-[#f97316] text-white sm:pl-[9px]'
                  : 'text-[#555] hover:text-[#999] border-l-[3px] border-transparent'
              }`}
            >
              <Icon size={16} strokeWidth={active ? 2.5 : 1.5} />
              <span className="hidden sm:inline text-sm font-bold uppercase tracking-wide">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="px-1 sm:px-3 py-6">
        {mounted && (
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
            className="w-full flex items-center justify-center sm:justify-start gap-0 sm:gap-3 px-0 sm:px-3 py-2.5 text-[#555] hover:text-[#999] transition-all"
          >
            {theme === 'dark' ? <Sun size={16} strokeWidth={1.5} /> : <Moon size={16} strokeWidth={1.5} />}
            <span className="hidden sm:inline text-sm font-bold uppercase tracking-wide">
              {theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
            </span>
          </button>
        )}
      </div>
    </aside>
  )
}
