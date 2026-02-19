import { useMemo } from 'react'
import { Card, Row, Col, Statistic, Skeleton } from 'antd'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { useIntl } from 'react-intl'
import { useTrips } from '@/api/hooks'
import type { Vehicle } from '@/types/api'
import { computeVehicleEconomics, computeDailyFuel } from '@/modules/health/computeVehicleEconomics'

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

      {economics.hasFuelData && dailyData.length > 1 && (
        <Card styles={{ body: { padding: '20px' } }}>
          <h3 className="text-sm font-semibold text-gray-900 m-0 mb-4">
            {intl.formatMessage({ id: 'health.fuelTrend' })}
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(value) => [`${Number(value).toFixed(1)} L`, intl.formatMessage({ id: 'health.totalFuelCard' })]}
              />
              <Bar dataKey="fuel" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  )
}
