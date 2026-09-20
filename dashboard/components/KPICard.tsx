import { statusColor } from '@/lib/budget'
import { Status } from '@/lib/types'

interface Props {
  title: string
  value: string
  subtitle?: string
  color: Status | 'ok' | 'warn' | 'danger' | 'info'
}

export default function KPICard({ title, value, subtitle, color }: Props) {
  const bg = statusColor(color as Status)

  return (
    <div
      className="rounded-[14px] p-6 text-white shadow-md"
      style={{ backgroundColor: bg }}
    >
      <p className="font-inter font-black text-xs uppercase tracking-widest opacity-80 mb-2">
        {title}
      </p>
      <p className="font-inter font-black text-3xl leading-none mb-2">
        {value}
      </p>
      {subtitle && (
        <p className="font-inter text-xs opacity-70 uppercase tracking-wide">
          {subtitle}
        </p>
      )}
    </div>
  )
}
