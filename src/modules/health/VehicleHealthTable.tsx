import { Table, Tag, Progress } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { useIntl } from 'react-intl'
import type { VehicleHealth } from '@/modules/health/computeVehicleHealth'

dayjs.extend(relativeTime)

interface VehicleHealthTableProps {
  data: VehicleHealth[]
  loading?: boolean
}

const statusColors = {
  good: { tag: 'green', stroke: '#22c55e' },
  warning: { tag: 'orange', stroke: '#f59e0b' },
  critical: { tag: 'red', stroke: '#ef4444' },
}

export default function VehicleHealthTable({ data, loading }: VehicleHealthTableProps) {
  const intl = useIntl()

  const columns: ColumnsType<VehicleHealth & { key: string }> = [
    {
      title: intl.formatMessage({ id: 'health.colVehicle' }),
      key: 'vehicle',
      width: 160,
      render: (_, record) => (
        <div>
          <div className="font-medium text-gray-900">{record.vehicleName}</div>
          <div className="text-xs text-gray-400">{record.vehicleSPZ}</div>
        </div>
      ),
    },
    {
      title: intl.formatMessage({ id: 'health.colStatus' }),
      key: 'status',
      width: 100,
      filters: [
        { text: intl.formatMessage({ id: 'health.good' }), value: 'good' },
        { text: intl.formatMessage({ id: 'health.warning' }), value: 'warning' },
        { text: intl.formatMessage({ id: 'health.critical' }), value: 'critical' },
      ],
      onFilter: (value, record) => record.status === value,
      render: (_, record) => (
        <Tag color={statusColors[record.status].tag} className="m-0">
          {intl.formatMessage({ id: `health.${record.status}` })}
        </Tag>
      ),
    },
    {
      title: intl.formatMessage({ id: 'health.colScore' }),
      key: 'score',
      width: 160,
      sorter: (a, b) => a.healthScore - b.healthScore,
      defaultSortOrder: 'descend',
      render: (_, record) => (
        <div className="flex items-center gap-2">
          <Progress
            percent={record.healthScore}
            size="small"
            strokeColor={statusColors[record.status].stroke}
            showInfo={false}
            className="flex-1 m-0"
          />
          <span className="text-sm font-medium w-8 text-right">{record.healthScore}</span>
        </div>
      ),
    },
    {
      title: intl.formatMessage({ id: 'health.colActivity' }),
      key: 'activity',
      width: 120,
      render: (_, record) => (
        <div className="text-sm">
          {record.currentSpeed > 0 ? (
            <span className="text-green-600 font-medium">{record.currentSpeed.toFixed(0)} km/h</span>
          ) : (
            <span className="text-gray-400">{intl.formatMessage({ id: 'health.parked' })}</span>
          )}
          <div className="text-xs text-gray-400">{dayjs(record.lastSeen).fromNow()}</div>
        </div>
      ),
    },
    {
      title: intl.formatMessage({ id: 'health.colOdometer' }),
      key: 'odometer',
      width: 120,
      sorter: (a, b) => a.odometer - b.odometer,
      render: (_, record) => {
        const km = record.odometer
        const color = km > 500000 ? '#ef4444' : km > 300000 ? '#f59e0b' : '#22c55e'
        return (
          <span className="text-sm" style={{ color }}>
            {(km / 1000).toFixed(0)}k km
          </span>
        )
      },
    },
    {
      title: intl.formatMessage({ id: 'health.colTrips' }),
      dataIndex: 'totalTrips',
      key: 'trips',
      width: 80,
      sorter: (a, b) => a.totalTrips - b.totalTrips,
      render: (val: number) => <span className="text-sm font-medium">{val}</span>,
    },
    {
      title: intl.formatMessage({ id: 'health.colEfficiency' }),
      key: 'efficiency',
      width: 120,
      sorter: (a, b) => a.fuelEfficiency - b.fuelEfficiency,
      render: (_, record) => {
        if (record.fuelEfficiency === 0) return <span className="text-xs text-gray-300">—</span>
        const color = record.fuelEfficiency > 15 ? '#ef4444' : record.fuelEfficiency > 10 ? '#f59e0b' : '#22c55e'
        return (
          <span className="text-sm font-medium" style={{ color }}>
            {record.fuelEfficiency.toFixed(1)} L/100km
          </span>
        )
      },
    },
    {
      title: intl.formatMessage({ id: 'health.colSpeeding' }),
      key: 'speeding',
      width: 100,
      sorter: (a, b) => a.speedingEvents - b.speedingEvents,
      render: (_, record) => (
        <span className={`text-sm font-medium ${record.speedingEvents > 5 ? 'text-red-500' : record.speedingEvents > 0 ? 'text-orange-500' : 'text-green-500'}`}>
          {record.speedingEvents}
        </span>
      ),
    },
  ]

  const dataSource = data.map(v => ({ ...v, key: v.vehicleCode }))

  return (
    <Table
      columns={columns}
      dataSource={dataSource}
      loading={loading}
      pagination={false}
      size="middle"
      scroll={{ x: 900 }}
    />
  )
}
