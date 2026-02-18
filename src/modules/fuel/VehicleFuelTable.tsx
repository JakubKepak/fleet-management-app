import { Table, Progress } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useIntl } from 'react-intl'
import type { VehicleFuelRow } from '@/modules/fuel/computeFuelStats'

interface VehicleFuelTableProps {
  rows: VehicleFuelRow[]
  loading?: boolean
}

const fmt = (v: unknown, decimals = 0) => Number(v || 0).toFixed(decimals)

export default function VehicleFuelTable({ rows, loading }: VehicleFuelTableProps) {
  const intl = useIntl()

  const maxFuel = Math.max(...rows.map(r => Number(r.fuel) || 0), 1)

  const columns: ColumnsType<VehicleFuelRow & { key: string }> = [
    {
      title: intl.formatMessage({ id: 'fuel.colVehicle' }),
      key: 'vehicle',
      render: (_, record) => (
        <div>
          <div className="font-medium text-gray-900">{record.vehicleName}</div>
          <div className="text-xs text-gray-400">{record.vehicleSPZ}</div>
        </div>
      ),
    },
    {
      title: intl.formatMessage({ id: 'fuel.colTrips' }),
      dataIndex: 'trips',
      key: 'trips',
      width: 90,
      sorter: (a, b) => a.trips - b.trips,
      render: (val: number) => <span className="font-medium">{val}</span>,
    },
    {
      title: intl.formatMessage({ id: 'fuel.colFuel' }),
      key: 'fuel',
      width: 200,
      sorter: (a, b) => a.fuel - b.fuel,
      render: (_, record) => (
        <div className="flex items-center gap-2">
          <Progress
            percent={Math.round(((Number(record.fuel) || 0) / maxFuel) * 100)}
            size="small"
            strokeColor="#3b82f6"
            showInfo={false}
            className="flex-1 m-0"
          />
          <span className="text-xs font-medium w-14 text-right">{fmt(record.fuel)} L</span>
        </div>
      ),
    },
    {
      title: intl.formatMessage({ id: 'fuel.colCost' }),
      dataIndex: 'cost',
      key: 'cost',
      width: 120,
      sorter: (a, b) => a.cost - b.cost,
      render: (val: number) => <span className="text-gray-700">{fmt(val)} CZK</span>,
    },
    {
      title: intl.formatMessage({ id: 'fuel.colDistance' }),
      dataIndex: 'distance',
      key: 'distance',
      width: 120,
      sorter: (a, b) => a.distance - b.distance,
      render: (val: number) => <span className="text-gray-600">{fmt(val)} km</span>,
    },
    {
      title: intl.formatMessage({ id: 'fuel.colEfficiency' }),
      key: 'per100km',
      width: 130,
      sorter: (a, b) => a.per100km - b.per100km,
      render: (_, record) => {
        const val = Number(record.per100km) || 0
        const color = val > 15 ? '#ef4444' : val > 10 ? '#f59e0b' : '#22c55e'
        return (
          <span className="font-medium" style={{ color }}>
            {fmt(val, 1)} L/100km
          </span>
        )
      },
    },
  ]

  const dataSource = rows.map(r => ({ ...r, key: r.vehicleName }))

  return (
    <div>
      <h2 className="text-base font-semibold text-gray-900 m-0 mb-3">
        {intl.formatMessage({ id: 'fuel.vehicleBreakdown' })}
      </h2>
      <Table
        columns={columns}
        dataSource={dataSource}
        loading={loading}
        pagination={false}
        size="middle"
        scroll={{ x: 700 }}
      />
    </div>
  )
}
