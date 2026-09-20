import type { Metadata } from 'next'
import { ThemeProvider } from 'next-themes'
import Sidebar from '@/components/Sidebar'
import './globals.css'

export const metadata: Metadata = {
  title: 'Budget Tracker',
  description: 'AI Budget Dashboard',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          {/* Shell persistant : la sidebar est montée une seule fois, seul `children` change. */}
          <div className="flex min-h-screen bg-[#faf7f0] dark:bg-[#111111]">
            <Sidebar />
            <main className="flex-1 ml-56 p-8">{children}</main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
