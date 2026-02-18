import { Table, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  EnvironmentOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { useIntl } from 'react-intl'
import type { Trip } from '@/types/api'

interface TripWithVehicle extends Trip {
  vehicleName: string
  vehicleSPZ: string
}

interface TripTableProps {
  trips: TripWithVehicle[]
  loading?: boolean
}

const n = (v: unknown): number => Number(v) || 0

function formatDuration(start: string, finish: string): string {
  if (!start || !finish) return '—'
  const mins = dayjs(finish).diff(dayjs(start), 'minute')
  if (mins < 0) return '—'
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function truncateAddress(addr: string, maxLen = 35): string {
  if (!addr) return '—'
  return addr.length > maxLen ? addr.slice(0, maxLen) + '...' : addr
}

export default function TripTable({ trips, loading }: TripTableProps) {
  const intl = useIntl()

  const columns: ColumnsType<TripWithVehicle & { key: number }> = [
    {
      title: intl.formatMessage({ id: 'fleet.colVehicle' }),
      key: 'vehicle',
      width: 150,
      filters: [...new Set(trips.map(t => t.vehicleName))].map(name => ({
        text: name,
        value: name,
      })),
      onFilter: (value, record) => record.vehicleName === value,
      render: (_, record) => (
        <div>
          <div className="font-medium text-gray-900 text-sm">{record.vehicleName}</div>
          <div className="text-xs text-gray-400">{record.vehicleSPZ}</div>
        </div>
      ),
    },
    {
      title: intl.formatMessage({ id: 'fleet.colDriver' }),
      key: 'driver',
      width: 120,
      filters: [...new Set(trips.map(t => (t.DriverName ?? '').trim()).filter(Boolean))].map(name => ({
        text: name,
        value: name,
      })),
      onFilter: (value, record) => (record.DriverName ?? '').trim() === value,
      render: (_, record) => {
        const name = (record.DriverName ?? '').trim()
        return name ? (
          <span className="text-sm text-gray-700">{name}</span>
        ) : (
          <span className="text-xs text-gray-300 italic">—</span>
        )
      },
    },
    {
      title: intl.formatMessage({ id: 'fleet.colDate' }),
      key: 'date',
      width: 150,
      sorter: (a, b) => dayjs(a.StartTime).unix() - dayjs(b.StartTime).unix(),
      defaultSortOrder: 'descend',
      render: (_, record) => (
        <div className="text-sm">
          <div className="text-gray-900">{dayjs(record.StartTime).format('DD.MM.YYYY')}</div>
          <div className="text-xs text-gray-400 flex items-center gap-1">
            <ClockCircleOutlined />
            {dayjs(record.StartTime).format('HH:mm')} – {dayjs(record.FinishTime).format('HH:mm')}
          </div>
        </div>
      ),
    },
    {
      title: intl.formatMessage({ id: 'fleet.colRoute' }),
      key: 'route',
      ellipsis: true,
      render: (_, record) => (
        <div className="text-sm space-y-0.5">
          <div className="flex items-center gap-1.5">
            <EnvironmentOutlined className="text-green-500 text-xs" />
            <span className="text-gray-700">{truncateAddress(record.StartAddress)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <EnvironmentOutlined className="text-red-500 text-xs" />
            <span className="text-gray-700">{truncateAddress(record.FinishAddress)}</span>
          </div>
        </div>
      ),
    },
    {
      title: intl.formatMessage({ id: 'fleet.colDistance' }),
      key: 'distance',
      width: 100,
      sorter: (a, b) => n(a.TotalDistance) - n(b.TotalDistance),
      render: (_, record) => (
        <span className="text-sm font-medium text-gray-700">
          {n(record.TotalDistance).toFixed(1)} km
        </span>
      ),
    },
    {
      title: intl.formatMessage({ id: 'fleet.colDuration' }),
      key: 'duration',
      width: 90,
      sorter: (a, b) =>
        dayjs(a.FinishTime).diff(dayjs(a.StartTime)) -
        dayjs(b.FinishTime).diff(dayjs(b.StartTime)),
      render: (_, record) => (
        <span className="text-sm text-gray-600">
          {formatDuration(record.StartTime, record.FinishTime)}
        </span>
      ),
    },
    {
      title: intl.formatMessage({ id: 'fleet.colAvgSpeed' }),
      key: 'avgSpeed',
      width: 90,
      sorter: (a, b) => n(a.AverageSpeed) - n(b.AverageSpeed),
      render: (_, record) => (
        <span className="text-sm text-gray-600">{n(record.AverageSpeed).toFixed(0)} km/h</span>
      ),
    },
    {
      title: intl.formatMessage({ id: 'fleet.colMaxSpeed' }),
      key: 'maxSpeed',
      width: 90,
      sorter: (a, b) => n(a.MaxSpeed) - n(b.MaxSpeed),
      render: (_, record) => {
        const speed = n(record.MaxSpeed)
        return (
          <Tag color={speed > 130 ? 'red' : speed > 100 ? 'orange' : 'default'} className="m-0">
            {speed.toFixed(0)} km/h
          </Tag>
        )
      },
    },
    {
      title: intl.formatMessage({ id: 'fleet.colFuel' }),
      key: 'fuel',
      width: 80,
      sorter: (a, b) => n(a.FuelConsumed?.Value) - n(b.FuelConsumed?.Value),
      render: (_, record) => {
        const fuel = n(record.FuelConsumed?.Value)
        return fuel > 0 ? (
          <span className="text-sm text-gray-700">{fuel.toFixed(1)} L</span>
        ) : (
          <span className="text-xs text-gray-300">—</span>
        )
      },
    },
    {
      title: intl.formatMessage({ id: 'fleet.colCost' }),
      key: 'cost',
      width: 90,
      sorter: (a, b) => n(a.TripCost?.Value) - n(b.TripCost?.Value),
      render: (_, record) => {
        const cost = n(record.TripCost?.Value)
        return cost > 0 ? (
          <span className="text-sm text-gray-700">{cost.toFixed(0)} CZK</span>
        ) : (
          <span className="text-xs text-gray-300">—</span>
        )
      },
    },
  ]

  const dataSource = trips.map(t => ({ ...t, key: t.Id }))

  return (
    <Table
      columns={columns}
      dataSource={dataSource}
      loading={loading}
      pagination={{
        pageSize: 20,
        showSizeChanger: true,
        pageSizeOptions: ['10', '20', '50'],
        showTotal: (total, range) =>
          intl.formatMessage({ id: 'fleet.pagination' }, { from: range[0], to: range[1], total }),
      }}
      size="middle"
      scroll={{ x: 1100 }}
    />
  )
}
