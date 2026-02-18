import { Table, Progress, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useIntl } from 'react-intl'
import type { DriverStats } from '@/modules/drivers/types'

function getScoreColor(score: number): string {
  if (score >= 80) return '#22c55e'
  if (score >= 50) return '#f59e0b'
  return '#ef4444'
}

function getScoreTag(score: number, intl: ReturnType<typeof useIntl>) {
  if (score >= 80) return <Tag color="green">{intl.formatMessage({ id: 'drivers.scoreGood' })}</Tag>
  if (score >= 50) return <Tag color="orange">{intl.formatMessage({ id: 'drivers.scoreFair' })}</Tag>
  return <Tag color="red">{intl.formatMessage({ id: 'drivers.scorePoor' })}</Tag>
}

interface DriverRankingTableProps {
  drivers: DriverStats[]
  loading?: boolean
}

export default function DriverRankingTable({ drivers, loading }: DriverRankingTableProps) {
  const intl = useIntl()

  const columns: ColumnsType<DriverStats & { rank: number }> = [
    {
      title: intl.formatMessage({ id: 'drivers.colRank' }),
      dataIndex: 'rank',
      key: 'rank',
      width: 60,
      render: (rank: number) => (
        <span className="font-semibold text-gray-500">#{rank}</span>
      ),
    },
    {
      title: intl.formatMessage({ id: 'drivers.colDriver' }),
      key: 'driver',
      render: (_, record) => (
        <div>
          <div className="font-medium text-gray-900">{record.name}</div>
          <div className="text-xs text-gray-400">{record.vehicleName} · {record.vehicleSPZ}</div>
        </div>
      ),
    },
    {
      title: intl.formatMessage({ id: 'drivers.colScore' }),
      dataIndex: 'score',
      key: 'score',
      width: 180,
      sorter: (a, b) => a.score - b.score,
      render: (score: number) => (
        <div className="flex items-center gap-2">
          <Progress
            percent={score}
            size="small"
            strokeColor={getScoreColor(score)}
            showInfo={false}
            className="flex-1 m-0"
          />
          <span className="text-xs font-semibold w-8 text-right" style={{ color: getScoreColor(score) }}>
            {score}
          </span>
        </div>
      ),
    },
    {
      title: intl.formatMessage({ id: 'drivers.colStatus' }),
      key: 'status',
      width: 100,
      render: (_, record) => getScoreTag(record.score, intl),
    },
    {
      title: intl.formatMessage({ id: 'drivers.colTrips' }),
      dataIndex: 'totalTrips',
      key: 'totalTrips',
      width: 100,
      sorter: (a, b) => a.totalTrips - b.totalTrips,
      render: (val: number) => <span className="font-medium">{val}</span>,
    },
    {
      title: intl.formatMessage({ id: 'drivers.colSpeeding' }),
      dataIndex: 'speedingEvents',
      key: 'speedingEvents',
      width: 110,
      sorter: (a, b) => a.speedingEvents - b.speedingEvents,
      render: (val: number) => (
        <span className={val > 0 ? 'text-red-500 font-medium' : 'text-green-500'}>
          {val > 0 ? val : '0'}
        </span>
      ),
    },
    {
      title: intl.formatMessage({ id: 'drivers.colIdling' }),
      dataIndex: 'idleMinutes',
      key: 'idleMinutes',
      width: 110,
      sorter: (a, b) => a.idleMinutes - b.idleMinutes,
      render: (val: number) => (
        <span className={val > 30 ? 'text-amber-500 font-medium' : 'text-gray-600'}>
          {val} min
        </span>
      ),
    },
    {
      title: intl.formatMessage({ id: 'drivers.colFuelEff' }),
      key: 'fuelPerKm',
      width: 120,
      sorter: (a, b) => a.fuelPerKm - b.fuelPerKm,
      render: (_, record) => (
        <span className="text-gray-600">
          {record.fuelPerKm > 0 ? `${(record.fuelPerKm * 100).toFixed(1)} L/100km` : '—'}
        </span>
      ),
    },
  ]

  const dataSource = drivers.map((d, i) => ({ ...d, rank: i + 1, key: d.name }))

  return (
    <Table
      columns={columns}
      dataSource={dataSource}
      loading={loading}
      pagination={false}
      size="middle"
      scroll={{ x: 800 }}
    />
  )
}
