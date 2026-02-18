import { Alert, Card, Row, Col } from 'antd'
import {
  CarOutlined,
  PauseCircleOutlined,
  ToolOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import { useGroups, useVehicles } from '@/api/hooks'
import DashboardSkeleton from '@/modules/dashboard/DashboardSkeleton'
import FleetMap from '@/modules/dashboard/FleetMap'
import RecentAlerts from '@/modules/dashboard/RecentAlerts'
import VehicleList from '@/modules/dashboard/VehicleList'
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
  const { data: groups, isLoading: groupsLoading } = useGroups()
  const groupCode = groups?.[0]?.Code ?? ''
  const { data: vehicles, isLoading: vehiclesLoading, error } = useVehicles(groupCode)

  if (groupsLoading || vehiclesLoading) {
    return <DashboardSkeleton />
  }

  if (error) {
    return <Alert type="error" message="Failed to load fleet data" description={String(error)} />
  }

  const stats = getFleetStats(vehicles ?? [])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 m-0">Fleet Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1 mb-0">Real-time vehicle tracking and fleet overview</p>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={12} sm={12} lg={6}>
          <StatCard
            icon={<CarOutlined />}
            label="Active Vehicles"
            value={stats.active}
            subtitle="Moving now"
            color="#22c55e"
            bgColor="#f0fdf4"
          />
        </Col>
        <Col xs={12} sm={12} lg={6}>
          <StatCard
            icon={<PauseCircleOutlined />}
            label="Idle Vehicles"
            value={stats.idle}
            subtitle="Parked"
            color="#f59e0b"
            bgColor="#fffbeb"
          />
        </Col>
        <Col xs={12} sm={12} lg={6}>
          <StatCard
            icon={<ToolOutlined />}
            label="Maintenance"
            value={stats.inactive}
            subtitle="Inactive / service"
            color="#ef4444"
            bgColor="#fef2f2"
          />
        </Col>
        <Col xs={12} sm={12} lg={6}>
          <StatCard
            icon={<TeamOutlined />}
            label="Total Fleet"
            value={stats.total}
            subtitle="All vehicles"
            color="#3b82f6"
            bgColor="#eff6ff"
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} className="mt-6">
        <Col xs={24} lg={16}>
          <div className="mb-3">
            <h2 className="text-base font-semibold text-gray-900 m-0">Live Map</h2>
            <p className="text-gray-400 text-xs mt-0.5 mb-0">Real-time vehicle positions</p>
          </div>
          <Card styles={{ body: { padding: 0, height: 400 } }}>
            <FleetMap vehicles={vehicles ?? []} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <div className="flex flex-col gap-4">
            <RecentAlerts vehicles={vehicles ?? []} />
            <VehicleList vehicles={vehicles ?? []} />
          </div>
        </Col>
      </Row>
    </div>
  )
}
