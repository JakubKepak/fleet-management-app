import { Card } from 'antd'
import { TrophyOutlined } from '@ant-design/icons'
import { useIntl } from 'react-intl'
import type { DriverStats } from '@/modules/drivers/types'

const podiumStyles = [
  { bg: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', trophy: '#d97706', border: '#fbbf24' },
  { bg: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)', trophy: '#64748b', border: '#94a3b8' },
  { bg: 'linear-gradient(135deg, #fed7aa 0%, #fdba74 100%)', trophy: '#c2410c', border: '#f97316' },
]

interface TopDriversProps {
  drivers: DriverStats[]
  loading?: boolean
}

export default function TopDrivers({ drivers, loading }: TopDriversProps) {
  const intl = useIntl()
  const top3 = drivers.slice(0, 3)

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[0, 1, 2].map(i => (
          <Card key={i} styles={{ body: { padding: '20px' } }}>
            <div className="animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gray-200" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-1" />
                  <div className="h-3 bg-gray-100 rounded w-16" />
                </div>
              </div>
              <div className="h-8 bg-gray-200 rounded w-16" />
              <div className="h-3 bg-gray-100 rounded w-20 mt-1" />
            </div>
          </Card>
        ))}
      </div>
    )
  }

  if (top3.length === 0) return null

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {top3.map((driver, i) => {
        const style = podiumStyles[i]
        return (
          <Card
            key={driver.name}
            className="overflow-hidden"
            styles={{
              body: {
                padding: '20px',
                background: style.bg,
                borderTop: `3px solid ${style.border}`,
              },
            }}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/60 flex items-center justify-center text-sm font-bold text-gray-700">
                  {driver.name.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">{driver.name}</div>
                  <div className="text-xs text-gray-500">{driver.vehicleName}</div>
                </div>
              </div>
              <TrophyOutlined className="text-lg" style={{ color: style.trophy }} />
            </div>
            <div className="flex items-end justify-between mt-4">
              <div>
                <div className="text-3xl font-bold text-gray-900">{driver.score}</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {intl.formatMessage({ id: 'drivers.safetyScore' })}
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-gray-700">{driver.totalTrips}</div>
                <div className="text-xs text-gray-500">
                  {intl.formatMessage({ id: 'drivers.totalTrips' })}
                </div>
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
