import { Card } from 'antd'
import { WarningOutlined } from '@ant-design/icons'
import { useIntl } from 'react-intl'
import type { Vehicle } from '@/types/api'
import { getEffectiveSpeed } from '@/utils/vehicle'

interface VehicleAlert {
  vehicleName: string
  messageId: string
  messageValues?: Record<string, string | number>
  timestamp: string
  severity: 'high' | 'medium' | 'low'
}

const severityColors: Record<string, string> = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#3b82f6',
}

function generateAlerts(vehicles: Vehicle[]): VehicleAlert[] {
  const alerts: VehicleAlert[] = []

  for (const v of vehicles) {
    const speed = getEffectiveSpeed(v)
    if (speed > 120) {
      alerts.push({
        vehicleName: v.Name,
        messageId: 'alerts.speeding',
        messageValues: { speed },
        timestamp: v.LastPositionTimestamp,
        severity: 'high',
      })
    }
    if (!v.IsActive) {
      alerts.push({
        vehicleName: v.Name,
        messageId: 'alerts.offline',
        timestamp: v.LastPositionTimestamp,
        severity: 'medium',
      })
    }
    if (speed === 0 && v.IsActive) {
      const hours = hoursSince(v.LastPositionTimestamp)
      if (hours > 2) {
        alerts.push({
          vehicleName: v.Name,
          messageId: 'alerts.idle',
          messageValues: { hours: Math.round(hours) },
          timestamp: v.LastPositionTimestamp,
          severity: 'low',
        })
      }
    }
  }

  return alerts.slice(0, 5)
}

function hoursSince(timestamp: string): number {
  return (Date.now() - new Date(timestamp).getTime()) / (1000 * 60 * 60)
}

function useFormatTimeSince() {
  const intl = useIntl()

  return (timestamp: string): string => {
    const mins = Math.floor((Date.now() - new Date(timestamp).getTime()) / (1000 * 60))
    if (mins < 60) return intl.formatMessage({ id: 'alerts.minutesAgo' }, { mins })
    const hours = Math.floor(mins / 60)
    if (hours < 24) return intl.formatMessage({ id: 'alerts.hoursAgo' }, { hours })
    return intl.formatMessage({ id: 'alerts.daysAgo' }, { days: Math.floor(hours / 24) })
  }
}

interface RecentAlertsProps {
  vehicles: Vehicle[]
}

export default function RecentAlerts({ vehicles }: RecentAlertsProps) {
  const intl = useIntl()
  const formatTimeSince = useFormatTimeSince()
  const alerts = generateAlerts(vehicles)

  if (alerts.length === 0) {
    return (
      <Card styles={{ body: { padding: '16px' } }}>
        <h3 className="text-sm font-semibold text-gray-900 m-0 mb-3">
          {intl.formatMessage({ id: 'alerts.title' })}
        </h3>
        <div className="text-center py-4 text-gray-400 text-sm">
          {intl.formatMessage({ id: 'alerts.empty' })}
        </div>
      </Card>
    )
  }

  return (
    <Card styles={{ body: { padding: '16px' } }}>
      <h3 className="text-sm font-semibold text-gray-900 m-0 mb-3">
        {intl.formatMessage({ id: 'alerts.title' })}
      </h3>
      <div className="flex flex-col gap-2">
        {alerts.map((alert, i) => (
          <div
            key={i}
            className="flex items-start gap-3 p-2.5 rounded-lg bg-gray-50"
            style={{ borderLeft: `3px solid ${severityColors[alert.severity]}` }}
          >
            <WarningOutlined
              className="text-sm mt-0.5 shrink-0"
              style={{ color: severityColors[alert.severity] }}
            />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-gray-900 truncate">{alert.vehicleName}</div>
              <div className="text-xs text-gray-500 mt-0.5">
                {intl.formatMessage({ id: alert.messageId }, alert.messageValues)}
              </div>
              <div className="text-xs text-gray-400 mt-0.5">{formatTimeSince(alert.timestamp)}</div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
