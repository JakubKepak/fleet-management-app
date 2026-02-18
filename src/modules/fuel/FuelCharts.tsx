import { Card, Row, Col } from 'antd'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { useIntl } from 'react-intl'
import type { DailyFuelPoint, VehicleFuelRow } from '@/modules/fuel/computeFuelStats'

interface FuelChartsProps {
  dailyFuel: DailyFuelPoint[]
  vehicleRows: VehicleFuelRow[]
  loading?: boolean
}

export default function FuelCharts({ dailyFuel, vehicleRows, loading }: FuelChartsProps) {
  const intl = useIntl()

  if (loading) {
    return (
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card styles={{ body: { padding: '20px' } }}>
            <div className="h-4 bg-gray-200 rounded w-40 mb-4 animate-pulse" />
            <div className="h-64 bg-gray-100 rounded animate-pulse" />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card styles={{ body: { padding: '20px' } }}>
            <div className="h-4 bg-gray-200 rounded w-40 mb-4 animate-pulse" />
            <div className="h-64 bg-gray-100 rounded animate-pulse" />
          </Card>
        </Col>
      </Row>
    )
  }

  const vehicleChartData = vehicleRows.slice(0, 8).map(r => ({
    name: r.vehicleName.length > 12 ? r.vehicleName.slice(0, 12) + '...' : r.vehicleName,
    fuel: Math.round(r.fuel),
    cost: Math.round(r.cost),
  }))

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={12}>
        <Card styles={{ body: { padding: '20px' } }}>
          <h3 className="text-sm font-semibold text-gray-900 m-0 mb-4">
            {intl.formatMessage({ id: 'fuel.trendTitle' })}
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={dailyFuel}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                tickFormatter={(v: string) => v.slice(5)}
              />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(value) => [`${value} L`, intl.formatMessage({ id: 'fuel.consumption' })]}
                labelFormatter={(label) => String(label)}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="fuel"
                name={intl.formatMessage({ id: 'fuel.consumption' })}
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </Col>
      <Col xs={24} lg={12}>
        <Card styles={{ body: { padding: '20px' } }}>
          <h3 className="text-sm font-semibold text-gray-900 m-0 mb-4">
            {intl.formatMessage({ id: 'fuel.costByVehicle' })}
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={vehicleChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="fuel"
                name={intl.formatMessage({ id: 'fuel.fuelL' })}
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="cost"
                name={intl.formatMessage({ id: 'fuel.costCZK' })}
                fill="#22c55e"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </Col>
    </Row>
  )
}
