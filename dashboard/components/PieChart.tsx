'use client'

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const COLORS = ['#22c55e', '#f97316', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b']

interface Props {
  pieData: { name: string; value: number }[]
}

export default function BudgetPieChart({ pieData }: Props) {
  if (!pieData.length) return (
    <p className="text-gray-400 text-center py-8">Aucune donnée</p>
  )

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={pieData}
          cx="50%"
          cy="50%"
          outerRadius={100}
          dataKey="value"
          label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
          labelLine={false}
        >
          {pieData.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number) => [`${value.toFixed(2)} €`, '']}
        />
        <Legend
          formatter={(value) => (
            <span className="font-inter text-xs text-gray-600 dark:text-gray-300">{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
