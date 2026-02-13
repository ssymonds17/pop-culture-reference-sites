interface OverviewCardProps {
  title: string
  value: number | string
  subtitle?: string
  icon?: string
}

export default function OverviewCard({ title, value, subtitle, icon }: OverviewCardProps) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-gray-400 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
          {subtitle && <p className="text-gray-500 text-xs mt-1">{subtitle}</p>}
        </div>
        {icon && <div className="text-4xl ml-4">{icon}</div>}
      </div>
    </div>
  )
}
