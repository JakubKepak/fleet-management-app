import { Typography, Alert } from 'antd'
import { useGroups, useVehicles } from '@/api/hooks'
import DashboardSkeleton from '@/modules/dashboard/DashboardSkeleton'

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

  const activeCount = vehicles?.filter(v => v.Speed > 0).length ?? 0
  const idleCount = vehicles?.filter(v => v.Speed === 0 && v.IsActive).length ?? 0
  const totalCount = vehicles?.length ?? 0

  return (
    <div>
      <Typography.Title level={3}>Fleet Dashboard</Typography.Title>
      <Typography.Text type="secondary">
        {totalCount} vehicles loaded — {activeCount} active, {idleCount} idle
      </Typography.Text>
      <ul className="mt-4">
        {vehicles?.map(v => (
          <li key={v.Code} className="py-1">
            {v.Name} ({v.SPZ}) — {v.Speed > 0 ? `${v.Speed} km/h` : 'Idle'} — {v.LastPosition.Latitude}, {v.LastPosition.Longitude}
          </li>
        ))}
      </ul>
    </div>
  )
}
