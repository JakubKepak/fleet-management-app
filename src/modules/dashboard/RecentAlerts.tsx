import { Card } from 'antd'
import { WarningOutlined } from '@ant-design/icons'
import type { Vehicle } from '@/types/api'

interface VehicleAlert {
  vehicleName: string
  message: string
  time: string
  severity: 'high' | 'medium' | 'low'
}

const severityColors: Record<string, string> = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#3b82f6',
}

function generateAlerts(vehicles: Vehicle[]): VehicleAlert[] {
  const alerts: VehicleAlert[] = []

  // TODO: as nice to have create a settings page where user can set alerts thresholds and types (e.g. geofence, maintenance due, etc.)
  for (const v of vehicles) {
    if (v.Speed > 120) {
      alerts.push({
        vehicleName: v.Name,
        message: `Speeding detected: ${v.Speed} km/h`,
        time: formatTimeSince(v.LastPositionTimestamp),
        severity: 'high',
      })
    }
    if (!v.IsActive) {
      alerts.push({
        vehicleName: v.Name,
        message: 'Vehicle offline — check connection',
        time: formatTimeSince(v.LastPositionTimestamp),
        severity: 'medium',
      })
    }
    if (v.Speed === 0 && v.IsActive) {
      const hours = hoursSince(v.LastPositionTimestamp)
      if (hours > 2) {
        alerts.push({
          vehicleName: v.Name,
          message: `Idle for ${Math.round(hours)}+ hours`,
          time: formatTimeSince(v.LastPositionTimestamp),
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

function formatTimeSince(timestamp: string): string {
  const mins = Math.floor((Date.now() - new Date(timestamp).getTime()) / (1000 * 60))
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

interface RecentAlertsProps {
  vehicles: Vehicle[]
}

export default function RecentAlerts({ vehicles }: RecentAlertsProps) {
  const alerts = generateAlerts(vehicles)

  if (alerts.length === 0) {
    return (
      <Card styles={{ body: { padding: '16px' } }}>
        <h3 className="text-sm font-semibold text-gray-900 m-0 mb-3">Recent Alerts</h3>
        <div className="text-center py-4 text-gray-400 text-sm">
          No active alerts
        </div>
      </Card>
    )
  }

  return (
    <Card styles={{ body: { padding: '16px' } }}>
      <h3 className="text-sm font-semibold text-gray-900 m-0 mb-3">Recent Alerts</h3>
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
              <div className="text-xs text-gray-500 mt-0.5">{alert.message}</div>
              <div className="text-xs text-gray-400 mt-0.5">{alert.time}</div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
