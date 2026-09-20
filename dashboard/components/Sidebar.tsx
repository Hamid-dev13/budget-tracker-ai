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
    <aside className="fixed top-0 left-0 h-screen w-56 bg-[#0d0d0d] flex flex-col z-50">
      <div className="px-6 py-8">
        <span className="font-playfair text-2xl font-bold text-white">
          Budget<span className="text-[#f97316]">.</span>
        </span>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                active
                  ? 'border-l-[3px] border-[#f97316] text-white pl-[9px]'
                  : 'text-[#555] hover:text-[#999] border-l-[3px] border-transparent'
              }`}
            >
              <Icon size={16} strokeWidth={active ? 2.5 : 1.5} />
              <span className="text-sm font-bold uppercase tracking-wide">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-6">
        {mounted && (
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-[#555] hover:text-[#999] transition-all"
          >
            {theme === 'dark' ? <Sun size={16} strokeWidth={1.5} /> : <Moon size={16} strokeWidth={1.5} />}
            <span className="text-sm font-bold uppercase tracking-wide">
              {theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
            </span>
          </button>
        )}
      </div>
    </aside>
  )
}
