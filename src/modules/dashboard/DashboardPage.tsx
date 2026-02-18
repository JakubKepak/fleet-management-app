import { useState, useMemo } from 'react'
import { Alert, Button, Card, Row, Col } from 'antd'
import {
  BulbOutlined,
  CarOutlined,
  PauseCircleOutlined,
  ToolOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import { useIntl } from 'react-intl'
import { useGroups, useVehicles } from '@/api/hooks'
import DashboardSkeleton from '@/modules/dashboard/DashboardSkeleton'
import FleetMap from '@/modules/dashboard/FleetMap'
import RecentAlerts from '@/modules/dashboard/RecentAlerts'
import VehicleList from '@/modules/dashboard/VehicleList'
import InsightCards from '@/components/InsightCards'
import type { Vehicle } from '@/types/api'

function getFleetStats(vehicles: Vehicle[]) {
  const active = vehicles.filter(v => v.Speed > 0).length
  const idle = vehicles.filter(v => v.Speed === 0 && v.IsActive).length
  const inactive = vehicles.filter(v => !v.IsActive).length
  return { active, idle, inactive, total: vehicles.length }
}

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: number
  subtitle: string
  color: string
  bgColor: string
}

function StatCard({ icon, label, value, subtitle, color, bgColor }: StatCardProps) {
  return (
    <Card className="h-full" styles={{ body: { padding: '20px' } }}>
      <div className="flex items-start gap-3">
        <div
          className="flex items-center justify-center w-10 h-10 rounded-lg text-lg shrink-0"
          style={{ color, backgroundColor: bgColor }}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-gray-500 text-xs font-medium">{label}</div>
          <div className="text-2xl font-bold text-gray-900 leading-tight mt-0.5">{value}</div>
          <div className="text-gray-400 text-xs mt-0.5">{subtitle}</div>
        </div>
      </div>
    </Card>
  )
}

export default function DashboardPage() {
  const intl = useIntl()
  const [focusedVehicleCode, setFocusedVehicleCode] = useState<string | null>(null)
  const [showInsights, setShowInsights] = useState(false)
  const { data: groups, isLoading: groupsLoading } = useGroups()
  const groupCode = groups?.[0]?.Code ?? ''
  const { data: vehicles, isLoading: vehiclesLoading, error } = useVehicles(groupCode)

  const stats = getFleetStats(vehicles ?? [])
  const insightData = useMemo(() => ({
    active: stats.active,
    idle: stats.idle,
    inactive: stats.inactive,
    total: stats.total,
  }), [stats.active, stats.idle, stats.inactive, stats.total])

  if (groupsLoading || vehiclesLoading) {
    return <DashboardSkeleton />
  }

  if (error) {
    return (
      <Alert
        type="error"
        title={intl.formatMessage({ id: 'dashboard.loadError' })}
        description={String(error)}
      />
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)]">
      <div className="flex items-start justify-between flex-wrap gap-4 mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 m-0">
            {intl.formatMessage({ id: 'dashboard.title' })}
          </h1>
          <p className="text-gray-500 text-sm mt-1 mb-0">
            {intl.formatMessage({ id: 'dashboard.subtitle' })}
          </p>
        </div>
        <Button
          icon={<BulbOutlined />}
          onClick={() => setShowInsights(v => !v)}
          type={showInsights ? 'primary' : 'default'}
        >
          {intl.formatMessage({ id: 'insights.button' })}
        </Button>
      </div>

      <Row gutter={[16, 16]} className="shrink-0">
        <Col xs={12} sm={12} lg={6}>
          <StatCard
            icon={<CarOutlined />}
            label={intl.formatMessage({ id: 'dashboard.activeVehicles' })}
            value={stats.active}
            subtitle={intl.formatMessage({ id: 'dashboard.activeSubtitle' })}
            color="#22c55e"
            bgColor="#f0fdf4"
          />
        </Col>
        <Col xs={12} sm={12} lg={6}>
          <StatCard
            icon={<PauseCircleOutlined />}
            label={intl.formatMessage({ id: 'dashboard.idleVehicles' })}
            value={stats.idle}
            subtitle={intl.formatMessage({ id: 'dashboard.idleSubtitle' })}
            color="#f59e0b"
            bgColor="#fffbeb"
          />
        </Col>
        <Col xs={12} sm={12} lg={6}>
          <StatCard
            icon={<ToolOutlined />}
            label={intl.formatMessage({ id: 'dashboard.maintenance' })}
            value={stats.inactive}
            subtitle={intl.formatMessage({ id: 'dashboard.maintenanceSubtitle' })}
            color="#ef4444"
            bgColor="#fef2f2"
          />
        </Col>
        <Col xs={12} sm={12} lg={6}>
          <StatCard
            icon={<TeamOutlined />}
            label={intl.formatMessage({ id: 'dashboard.totalFleet' })}
            value={stats.total}
            subtitle={intl.formatMessage({ id: 'dashboard.totalSubtitle' })}
            color="#3b82f6"
            bgColor="#eff6ff"
          />
        </Col>
      </Row>

      {showInsights && (
        <div className="mt-6 shrink-0">
          <InsightCards module="dashboard" data={insightData} visible={showInsights} />
        </div>
      )}

      <Row gutter={[16, 16]} className="mt-6 flex-1 min-h-0">
        <Col xs={24} lg={16} className="h-full">
          <Card
            className="h-full"
            styles={{ body: { padding: 0, height: '100%', display: 'flex', flexDirection: 'column' } }}
          >
            <div className="px-4 pt-4 pb-2 shrink-0">
              <h2 className="text-base font-semibold text-gray-900 m-0">
                {intl.formatMessage({ id: 'dashboard.liveMap' })}
              </h2>
              <p className="text-gray-400 text-xs mt-0.5 mb-0">
                {intl.formatMessage({ id: 'dashboard.liveMapSubtitle' })}
              </p>
            </div>
            <div className="flex-1 min-h-0 px-4 pb-4">
              <FleetMap
                vehicles={vehicles ?? []}
                focusedVehicleCode={focusedVehicleCode}
                onFocusHandled={() => setFocusedVehicleCode(null)}
              />
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8} className="h-full">
          <div className="flex flex-col gap-4 h-full overflow-auto">
            <RecentAlerts vehicles={vehicles ?? []} />
            <VehicleList vehicles={vehicles ?? []} onLocate={setFocusedVehicleCode} />
          </div>
        </Col>
      </Row>
    </div>
  )
}
