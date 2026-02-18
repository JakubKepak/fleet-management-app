import { Card, Tag } from 'antd'
import { CarOutlined, DashboardOutlined } from '@ant-design/icons'
import { useIntl } from 'react-intl'
import type { Vehicle } from '@/types/api'

function getStatusDotColor(vehicle: Vehicle): string {
  if (vehicle.Speed > 0) return '#22c55e'
  if (vehicle.IsActive) return '#f59e0b'
  return '#ef4444'
}

interface VehicleListProps {
  vehicles: Vehicle[]
}

export default function VehicleList({ vehicles }: VehicleListProps) {
  const intl = useIntl()

  function getStatusTag(vehicle: Vehicle) {
    if (vehicle.Speed > 0) return <Tag color="green">{intl.formatMessage({ id: 'vehicles.active' })}</Tag>
    if (vehicle.IsActive) return <Tag color="orange">{intl.formatMessage({ id: 'vehicles.idle' })}</Tag>
    return <Tag color="red">{intl.formatMessage({ id: 'vehicles.offline' })}</Tag>
  }

  return (
    <Card styles={{ body: { padding: '16px' } }}>
      <h3 className="text-sm font-semibold text-gray-900 m-0 mb-3">
        {intl.formatMessage({ id: 'vehicles.title' })}
      </h3>
      <div className="flex flex-col">
        {vehicles.map(v => (
          <div
            key={v.Code}
            className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-0"
          >
            <div
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: getStatusDotColor(v) }}
            />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-gray-900 truncate">{v.Name}</div>
              <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <CarOutlined />
                  {v.SPZ}
                </span>
                {v.Speed > 0 && (
                  <span className="flex items-center gap-1">
                    <DashboardOutlined />
                    {v.Speed} km/h
                  </span>
                )}
              </div>
            </div>
            {getStatusTag(v)}
          </div>
        ))}
      </div>
    </Card>
  )
}
