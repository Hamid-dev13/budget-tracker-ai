'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts'

interface Props {
  lineData: { date: string; solde: number }[]
}

export default function BudgetLineChart({ lineData }: Props) {
  if (!lineData.length) return (
    <p className="text-gray-400 text-center py-8">Aucune donnée</p>
  )

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={lineData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="date"
          tick={{ fontFamily: 'Inter', fontSize: 11, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontFamily: 'Inter', fontSize: 11, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${v}€`}
        />
        <Tooltip
          formatter={(value: number) => [`${value.toFixed(2)} €`, 'Solde']}
          contentStyle={{
            fontFamily: 'Inter',
            fontSize: 12,
            borderRadius: 8,
            border: 'none',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          }}
        />
        <Line
          type="monotone"
          dataKey="solde"
          stroke="#22c55e"
          strokeWidth={2.5}
          dot={{ fill: '#22c55e', r: 4, strokeWidth: 0 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
