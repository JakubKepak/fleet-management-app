import { useMemo } from 'react'
import { Card, Row, Col, Statistic, Skeleton, Table, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { EnvironmentOutlined, ClockCircleOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useIntl } from 'react-intl'
import { useTrips } from '@/api/hooks'
import type { Vehicle, Trip } from '@/types/api'
import { computeVehicleEconomics, computeDailyFuel } from '@/modules/health/computeVehicleEconomics'

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

function truncateAddress(addr: string, maxLen = 30): string {
  if (!addr) return '—'
  return addr.length > maxLen ? addr.slice(0, maxLen) + '...' : addr
}

interface Props {
  vehicle: Vehicle
  from: string
  to: string
}

export default function VehicleTripEconomics({ vehicle, from, to }: Props) {
  const intl = useIntl()
  const { data: trips, isLoading } = useTrips(vehicle.Code, from, to)

  const economics = useMemo(() => {
    if (!trips) return null
    return computeVehicleEconomics(vehicle, trips)
  }, [vehicle, trips])

  const dailyData = useMemo(() => {
    if (!trips) return []
    return computeDailyFuel(trips)
  }, [trips])

  const columns: ColumnsType<Trip & { key: number }> = useMemo(() => [
    {
      title: intl.formatMessage({ id: 'health.colTripDate' }),
      key: 'date',
      width: 140,
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
      title: intl.formatMessage({ id: 'health.colTripRoute' }),
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
      title: intl.formatMessage({ id: 'health.colTripDistance' }),
      key: 'distance',
      width: 90,
      sorter: (a, b) => n(a.TotalDistance) - n(b.TotalDistance),
      render: (_, record) => (
        <span className="text-sm font-medium text-gray-700">
          {n(record.TotalDistance).toFixed(1)} km
        </span>
      ),
    },
    {
      title: intl.formatMessage({ id: 'health.colTripDuration' }),
      key: 'duration',
      width: 80,
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
      title: intl.formatMessage({ id: 'health.colTripAvgSpeed' }),
      key: 'avgSpeed',
      width: 80,
      sorter: (a, b) => n(a.AverageSpeed) - n(b.AverageSpeed),
      render: (_, record) => (
        <span className="text-sm text-gray-600">{n(record.AverageSpeed).toFixed(0)} km/h</span>
      ),
    },
    {
      title: intl.formatMessage({ id: 'health.colTripMaxSpeed' }),
      key: 'maxSpeed',
      width: 80,
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
      title: intl.formatMessage({ id: 'health.colTripFuel' }),
      key: 'fuel',
      width: 70,
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
      title: intl.formatMessage({ id: 'health.colFuelEfficiency' }),
      key: 'efficiency',
      width: 90,
      sorter: (a, b) => {
        const ea = n(a.TotalDistance) > 0 && n(a.FuelConsumed?.Value) > 0 ? (n(a.FuelConsumed?.Value) / n(a.TotalDistance)) * 100 : 0
        const eb = n(b.TotalDistance) > 0 && n(b.FuelConsumed?.Value) > 0 ? (n(b.FuelConsumed?.Value) / n(b.TotalDistance)) * 100 : 0
        return ea - eb
      },
      render: (_, record) => {
        const fuel = n(record.FuelConsumed?.Value)
        const dist = n(record.TotalDistance)
        if (fuel <= 0 || dist <= 0) return <span className="text-xs text-gray-300">—</span>
        const eff = (fuel / dist) * 100
        const color = eff > 15 ? '#ef4444' : eff > 10 ? '#f59e0b' : '#22c55e'
        return <span className="text-sm font-medium" style={{ color }}>{eff.toFixed(1)} L/100</span>
      },
    },
    {
      title: intl.formatMessage({ id: 'health.colTripCost' }),
      key: 'cost',
      width: 80,
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
    {
      title: intl.formatMessage({ id: 'health.colTripDriver' }),
      key: 'driver',
      width: 100,
      render: (_, record) => {
        const name = (record.DriverName ?? '').trim()
        return name ? (
          <span className="text-sm text-gray-700">{name}</span>
        ) : (
          <span className="text-xs text-gray-300">—</span>
        )
      },
    },
  ], [intl])

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <h2 className="text-base font-semibold text-gray-900 m-0">
          {intl.formatMessage({ id: 'health.tripEconomics' })}
        </h2>
        <Row gutter={[16, 16]}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Col xs={12} sm={8} lg={4} key={i}>
              <Card styles={{ body: { padding: '16px' } }}>
                <Skeleton active paragraph={{ rows: 1 }} />
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    )
  }

  if (!economics || economics.totalTrips === 0) return null

  const tripDataSource = (trips ?? []).map(t => ({ ...t, key: t.Id }))

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-base font-semibold text-gray-900 m-0">
        {intl.formatMessage({ id: 'health.tripEconomics' })}
      </h2>

      <Row gutter={[16, 16]}>
        <Col xs={12} sm={8} lg={4}>
          <Card styles={{ body: { padding: '16px' } }}>
            <Statistic
              title={intl.formatMessage({ id: 'health.totalTrips' })}
              value={economics.totalTrips}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card styles={{ body: { padding: '16px' } }}>
            <Statistic
              title={intl.formatMessage({ id: 'health.colTotalDistance' })}
              value={economics.totalDistance.toFixed(0)}
              suffix="km"
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card styles={{ body: { padding: '16px' } }}>
            <Statistic
              title={intl.formatMessage({ id: 'health.totalFuelCard' })}
              value={economics.hasFuelData ? economics.totalFuel.toFixed(1) : '—'}
              suffix={economics.hasFuelData ? 'L' : undefined}
              valueStyle={!economics.hasFuelData ? { color: '#d1d5db' } : undefined}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card styles={{ body: { padding: '16px' } }}>
            <Statistic
              title={intl.formatMessage({ id: 'health.fuelEfficiencyCard' })}
              value={economics.hasFuelData ? economics.fuelPer100km.toFixed(1) : '—'}
              suffix={economics.hasFuelData ? 'L/100km' : undefined}
              valueStyle={
                !economics.hasFuelData
                  ? { color: '#d1d5db' }
                  : { color: economics.fuelPer100km > 15 ? '#ef4444' : economics.fuelPer100km > 10 ? '#f59e0b' : '#22c55e' }
              }
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card styles={{ body: { padding: '16px' } }}>
            <Statistic
              title={intl.formatMessage({ id: 'health.totalCostCard' })}
              value={economics.totalCost > 0 ? economics.totalCost.toFixed(0) : '—'}
              suffix={economics.totalCost > 0 ? 'CZK' : undefined}
              valueStyle={economics.totalCost === 0 ? { color: '#d1d5db' } : undefined}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card styles={{ body: { padding: '16px' } }}>
            <Statistic
              title={intl.formatMessage({ id: 'health.driversCard' })}
              value={economics.drivers.length > 0 ? economics.drivers.join(', ') : '—'}
              valueStyle={
                economics.drivers.length > 0
                  ? { fontSize: 16 }
                  : { color: '#d1d5db' }
              }
            />
          </Card>
        </Col>
      </Row>

      {dailyData.length > 1 && (
        <Row gutter={[16, 16]}>
          {economics.hasFuelData && (
            <Col xs={24} lg={12}>
              <Card styles={{ body: { padding: '20px' } }}>
                <h3 className="text-sm font-semibold text-gray-900 m-0 mb-4">
                  {intl.formatMessage({ id: 'health.fuelTrend' })}
                </h3>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v: string) => v.slice(5)} />
                    <YAxis tick={{ fontSize: 11 }} unit=" L/100" />
                    <Tooltip
                      formatter={(value) => [`${Number(value).toFixed(1)} L/100km`, intl.formatMessage({ id: 'health.fuelEfficiencyCard' })]}
                      labelFormatter={(label) => String(label)}
                    />
                    <Line
                      type="monotone"
                      dataKey="efficiency"
                      name={intl.formatMessage({ id: 'health.fuelEfficiencyCard' })}
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          )}
          <Col xs={24} lg={economics.hasFuelData ? 12 : 24}>
            <Card styles={{ body: { padding: '20px' } }}>
              <h3 className="text-sm font-semibold text-gray-900 m-0 mb-4">
                {intl.formatMessage({ id: 'health.distanceTrend' })}
              </h3>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v: string) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 11 }} unit=" km" />
                  <Tooltip
                    formatter={(value) => [`${Number(value).toFixed(1)} km`, intl.formatMessage({ id: 'health.colTotalDistance' })]}
                    labelFormatter={(label) => String(label)}
                  />
                  <Line
                    type="monotone"
                    dataKey="distance"
                    name={intl.formatMessage({ id: 'health.colTotalDistance' })}
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>
      )}

      <div>
        <h3 className="text-sm font-semibold text-gray-900 m-0 mb-3">
          {intl.formatMessage({ id: 'health.tripList' })}
        </h3>
        <Table
          columns={columns}
          dataSource={tripDataSource}
          pagination={{
            defaultPageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
            size: 'small',
          }}
          size="small"
          scroll={{ x: 900 }}
        />
      </div>
    </div>
  )
}
