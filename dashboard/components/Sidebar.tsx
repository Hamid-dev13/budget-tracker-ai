'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

const NAV_ITEMS = [
  { label: 'Tableau de bord', icon: '◉' },
  { label: 'Calendrier', icon: '⬛' },
  { label: 'Graphiques', icon: '↗' },
  { label: 'Transactions', icon: '≡' },
]

export default function Sidebar() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  return (
    <aside className="fixed top-0 left-0 h-screen w-64 bg-[#f0ebe0] dark:bg-[#0d0d0d] border-r border-gray-200 dark:border-gray-800 flex flex-col z-50">
      {/* Logo */}
      <div className="px-6 py-8 border-b border-gray-200 dark:border-gray-800">
        <span className="font-playfair text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
          Budget<span className="text-warn">.</span>AI
        </span>
        <p className="font-inter text-xs uppercase tracking-widest text-gray-400 mt-1">
          Tracker Intelligent
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {NAV_ITEMS.map((item, i) => (
          <div
            key={item.label}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all ${
              i === 0
                ? 'border-l-4 border-warn bg-warn/10 text-warn'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-gray-100'
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span className="font-inter font-bold text-sm uppercase tracking-wide">
              {item.label}
            </span>
          </div>
        ))}
      </nav>

      {/* Dark mode toggle */}
      <div className="px-6 py-6 border-t border-gray-200 dark:border-gray-800">
        {mounted && (
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:opacity-80 transition-opacity"
          >
            <span className="font-inter font-bold text-sm uppercase tracking-wide">
              {theme === 'dark' ? 'Mode Clair' : 'Mode Sombre'}
            </span>
            <span className="text-xl">{theme === 'dark' ? '☀️' : '🌙'}</span>
          </button>
        )}
      </div>
    </aside>
  )
}
