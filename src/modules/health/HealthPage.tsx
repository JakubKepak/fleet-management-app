import { useMemo, useState } from 'react'
import { Alert, Input, Table, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { CheckOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { useIntl } from 'react-intl'
import { Link } from 'react-router-dom'
import { useGroups, useVehicles } from '@/api/hooks'
import AIInsightsButton from '@/components/AIInsightsButton'
import InsightCards from '@/components/InsightCards'
import type { Vehicle } from '@/types/api'

dayjs.extend(relativeTime)

export default function HealthPage() {
  const intl = useIntl()
  const [search, setSearch] = useState('')
  const [showInsights, setShowInsights] = useState(false)

  const { data: groups, isLoading: groupsLoading } = useGroups()
  const groupCode = groups?.[0]?.Code ?? ''
  const { data: vehicles, isLoading: vehiclesLoading, error } = useVehicles(groupCode)

  const filteredVehicles = useMemo(() => {
    const list = vehicles ?? []
    if (!search.trim()) return list
    const q = search.toLowerCase()
    return list.filter(
      v =>
        v.Name.toLowerCase().includes(q) ||
        v.SPZ.toLowerCase().includes(q) ||
        v.BranchName.toLowerCase().includes(q),
    )
  }, [vehicles, search])

  const branches = useMemo(
    () => [...new Set((vehicles ?? []).map(v => v.BranchName))].map(b => ({ text: b, value: b })),
    [vehicles],
  )

  const isLoading = groupsLoading || vehiclesLoading

  const insightData = useMemo(() => ({
    vehicles: (vehicles ?? []).map(v => ({
      name: v.Name,
      spz: v.SPZ,
      branch: v.BranchName,
      odometer: v.Odometer,
      speed: v.Speed,
      isActive: v.IsActive,
      ecoDriving: v.IsEcoDrivingEnabled,
    })),
  }), [vehicles])

  const columns: ColumnsType<Vehicle & { key: string }> = [
    {
      title: intl.formatMessage({ id: 'health.colVehicle' }),
      key: 'vehicle',
      width: 180,
      sorter: (a, b) => a.Name.localeCompare(b.Name),
      render: (_, record) => (
        <Link to={`/health/${record.Code}`} className="font-medium text-blue-600 hover:text-blue-800">
          {record.Name}
        </Link>
      ),
    },
    {
      title: intl.formatMessage({ id: 'health.colSPZ' }),
      dataIndex: 'SPZ',
      key: 'spz',
      width: 120,
    },
    {
      title: intl.formatMessage({ id: 'health.colBranch' }),
      dataIndex: 'BranchName',
      key: 'branch',
      width: 180,
      filters: branches,
      onFilter: (value, record) => record.BranchName === value,
    },
    {
      title: intl.formatMessage({ id: 'health.colOdometer' }),
      key: 'odometer',
      width: 120,
      sorter: (a, b) => a.Odometer - b.Odometer,
      render: (_, record) => (
        <span className="text-sm">{(record.Odometer / 1000).toFixed(0)}k km</span>
      ),
    },
    {
      title: intl.formatMessage({ id: 'health.colActivity' }),
      key: 'activity',
      width: 140,
      sorter: (a, b) => a.Speed - b.Speed,
      render: (_, record) => (
        <div className="text-sm">
          {record.Speed > 0 ? (
            <span className="text-green-600 font-medium">{record.Speed} km/h</span>
          ) : (
            <span className="text-gray-400">{intl.formatMessage({ id: 'health.parked' })}</span>
          )}
          <div className="text-xs text-gray-400">{dayjs(record.LastPositionTimestamp).fromNow()}</div>
        </div>
      ),
    },
    {
      title: intl.formatMessage({ id: 'health.colStatus' }),
      key: 'status',
      width: 100,
      filters: [
        { text: intl.formatMessage({ id: 'health.active' }), value: 'true' },
        { text: intl.formatMessage({ id: 'health.inactive' }), value: 'false' },
      ],
      onFilter: (value, record) => String(record.IsActive) === value,
      render: (_, record) => (
        <Tag color={record.IsActive ? 'green' : 'red'} className="m-0">
          {intl.formatMessage({ id: record.IsActive ? 'health.active' : 'health.inactive' })}
        </Tag>
      ),
    },
    {
      title: intl.formatMessage({ id: 'health.colEcoDriving' }),
      key: 'ecoDriving',
      width: 100,
      align: 'center',
      render: (_, record) =>
        record.IsEcoDrivingEnabled ? (
          <CheckOutlined className="text-green-500" />
        ) : (
          <span className="text-gray-300">—</span>
        ),
    },
  ]

  if (error) {
    return (
      <Alert
        type="error"
        title={intl.formatMessage({ id: 'health.loadError' })}
        description={String(error)}
      />
    )
  }

  const dataSource = filteredVehicles.map(v => ({ ...v, key: v.Code }))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 m-0">
            {intl.formatMessage({ id: 'health.title' })}
          </h1>
          <p className="text-gray-500 text-sm mt-1 mb-0">
            {intl.formatMessage({ id: 'health.subtitle' })}
          </p>
        </div>
        <AIInsightsButton active={showInsights} onClick={() => setShowInsights(v => !v)} />
      </div>

      <InsightCards module="health" visible={showInsights} data={insightData} />

      <div>
        <Input.Search
          placeholder={intl.formatMessage({ id: 'health.searchPlaceholder' })}
          allowClear
          onChange={e => setSearch(e.target.value)}
          className="mb-4"
          style={{ maxWidth: 400 }}
        />
        <Table
          columns={columns}
          dataSource={dataSource}
          loading={isLoading}
          pagination={false}
          size="middle"
          scroll={{ x: 900 }}
        />
      </div>
    </div>
  )
}
