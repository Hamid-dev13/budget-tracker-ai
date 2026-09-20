import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ok: '#22c55e',
        warn: '#f97316',
        danger: '#ef4444',
        info: '#3b82f6',
        'bg-light': '#faf7f0',
        'bg-dark': '#111111',
        'sidebar-light': '#f0ebe0',
        'sidebar-dark': '#0d0d0d',
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
        playfair: ['"Playfair Display"', 'serif'],
      },
      borderRadius: {
        kpi: '14px',
      },
    },
  },
  plugins: [],
}
export default config
