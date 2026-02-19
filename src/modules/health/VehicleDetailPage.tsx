import { useMemo, useState, useCallback } from 'react'
import { Alert, Card, DatePicker, Row, Col, Statistic, Skeleton } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import dayjs, { type Dayjs } from 'dayjs'
import { useIntl } from 'react-intl'
import { useParams, Link } from 'react-router-dom'
import { useVehicle, useVehicleSensors } from '@/api/hooks'
import type { SensorItem } from '@/types/api'
import VehicleTripEconomics from '@/modules/health/VehicleTripEconomics'

const { RangePicker } = DatePicker

const MAX_RANGE_DAYS = 30
const SENSOR_TYPES = [
  'ExternalBatteryVoltage',
  'CoolingLiquidTemperature',
  'Rpm',
  'Speed',
  'FuelConsumedTotal',
]

const SENSOR_COLORS: Record<string, string> = {
  ExternalBatteryVoltage: '#3b82f6',
  CoolingLiquidTemperature: '#ef4444',
  Rpm: '#f59e0b',
  Speed: '#22c55e',
  FuelConsumedTotal: '#8b5cf6',
}

const SENSOR_UNITS: Record<string, string> = {
  ExternalBatteryVoltage: 'V',
  CoolingLiquidTemperature: '°C',
  Rpm: 'RPM',
  Speed: 'km/h',
  FuelConsumedTotal: 'L',
}

function getGaugeColor(sensorName: string, value: number): string {
  switch (sensorName) {
    case 'ExternalBatteryVoltage':
      if (value < 12) return '#ef4444'
      if (value < 12.5) return '#f59e0b'
      return '#22c55e'
    case 'CoolingLiquidTemperature':
      if (value > 110) return '#ef4444'
      if (value > 100) return '#f59e0b'
      return '#22c55e'
    case 'Rpm':
      if (value > 3500) return '#ef4444'
      if (value > 2500) return '#f59e0b'
      return '#22c55e'
    default:
      return '#3b82f6'
  }
}

function getLastReading(sensor: SensorItem | undefined): number | null {
  if (!sensor || sensor.data.length === 0) return null
  return sensor.data[sensor.data.length - 1].v
}

function SensorChart({ sensor, intl }: { sensor: SensorItem; intl: ReturnType<typeof useIntl> }) {
  const sensorKey = `health.sensor.${sensor.name}` as const
  const label = intl.formatMessage({ id: sensorKey })
  const unit = SENSOR_UNITS[sensor.name] ?? sensor.units
  const color = SENSOR_COLORS[sensor.name] ?? '#3b82f6'

  const chartData = useMemo(
    () => sensor.data.map(d => ({ time: d.t, value: d.v })),
    [sensor.data],
  )

  if (sensor.data.length === 0) {
    return (
      <Card styles={{ body: { padding: '20px' } }}>
        <h3 className="text-sm font-semibold text-gray-900 m-0 mb-4">{label}</h3>
        <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
          {intl.formatMessage({ id: 'health.noSensorData' })}
        </div>
      </Card>
    )
  }

  return (
    <Card styles={{ body: { padding: '20px' } }}>
      <h3 className="text-sm font-semibold text-gray-900 m-0 mb-4">{label}</h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 10 }}
            tickFormatter={(v: string) => dayjs(v).format('MM-DD HH:mm')}
          />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip
            formatter={(value) => [`${value} ${unit}`, label]}
            labelFormatter={(l) => dayjs(String(l)).format('YYYY-MM-DD HH:mm:ss')}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  )
}

export default function VehicleDetailPage() {
  const intl = useIntl()
  const { vehicleCode } = useParams<{ vehicleCode: string }>()

  const defaultRange: [Dayjs, Dayjs] = [dayjs().subtract(7, 'day'), dayjs()]
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>(defaultRange)
  const [pickerDates, setPickerDates] = useState<[Dayjs | null, Dayjs | null]>([null, null])

  const { data: vehicle, isLoading: vehicleLoading, error: vehicleError } = useVehicle(vehicleCode ?? '')

  const from = dateRange[0].format('YYYY-MM-DDTHH:mm:ss')
  const to = dateRange[1].format('YYYY-MM-DDTHH:mm:ss')

  const { data: sensorResponse, isLoading: sensorsLoading } = useVehicleSensors(
    vehicleCode ?? '',
    SENSOR_TYPES,
    from,
    to,
  )

  const sensors = sensorResponse?.items ?? []

  const getSensor = useCallback(
    (name: string) => sensors.find(s => s.name === name),
    [sensors],
  )

  const gaugeCards = useMemo(() => {
    const items: { name: string; value: number | null; unit: string }[] = []
    for (const name of SENSOR_TYPES) {
      const sensor = getSensor(name)
      items.push({
        name,
        value: getLastReading(sensor),
        unit: SENSOR_UNITS[name] ?? '',
      })
    }
    return items
  }, [getSensor])

  const handleDateChange = useCallback((dates: [Dayjs | null, Dayjs | null] | null) => {
    if (dates?.[0] && dates?.[1]) {
      setDateRange([dates[0], dates[1]])
    }
    setPickerDates([null, null])
  }, [])

  if (vehicleError) {
    return (
      <Alert
        type="error"
        title={intl.formatMessage({ id: 'health.loadError' })}
        description={String(vehicleError)}
      />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link to="/health" className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1 mb-3">
          <ArrowLeftOutlined className="text-xs" />
          {intl.formatMessage({ id: 'health.backToList' })}
        </Link>
        {vehicleLoading ? (
          <Skeleton active paragraph={{ rows: 1 }} />
        ) : vehicle ? (
          <div>
            <h1 className="text-2xl font-bold text-gray-900 m-0">{vehicle.Name}</h1>
            <p className="text-gray-500 text-sm mt-1 mb-0">
              {vehicle.SPZ} · {vehicle.BranchName}
            </p>
          </div>
        ) : null}
      </div>

      <Row gutter={[16, 16]}>
        {vehicleLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Col xs={12} sm={8} lg={4} key={i}>
              <Card styles={{ body: { padding: '16px' } }}>
                <Skeleton active paragraph={{ rows: 1 }} />
              </Card>
            </Col>
          ))
        ) : (
          <>
            <Col xs={12} sm={8} lg={4}>
              <Card styles={{ body: { padding: '16px' } }}>
                <Statistic
                  title={intl.formatMessage({ id: 'health.colOdometer' })}
                  value={vehicle ? (vehicle.Odometer / 1000).toFixed(0) : 0}
                  suffix="k km"
                />
              </Card>
            </Col>
            <Col xs={12} sm={8} lg={4}>
              <Card styles={{ body: { padding: '16px' } }}>
                <Statistic
                  title={intl.formatMessage({ id: 'health.sensor.Speed' })}
                  value={vehicle?.Speed ?? 0}
                  suffix="km/h"
                  valueStyle={{ color: vehicle && vehicle.Speed > 0 ? '#22c55e' : undefined }}
                />
              </Card>
            </Col>
            {gaugeCards.map(g => (
              <Col xs={12} sm={8} lg={4} key={g.name}>
                <Card styles={{ body: { padding: '16px' } }}>
                  {sensorsLoading ? (
                    <Skeleton active paragraph={{ rows: 1 }} />
                  ) : (
                    <Statistic
                      title={intl.formatMessage({ id: `health.sensor.${g.name}` })}
                      value={g.value ?? '—'}
                      suffix={g.value !== null ? g.unit : undefined}
                      valueStyle={
                        g.value !== null ? { color: getGaugeColor(g.name, g.value) } : { color: '#d1d5db' }
                      }
                    />
                  )}
                </Card>
              </Col>
            ))}
          </>
        )}
      </Row>

      {vehicle && (
        <VehicleTripEconomics vehicle={vehicle} from={from} to={to} />
      )}

      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-base font-semibold text-gray-900 m-0">
          {intl.formatMessage({ id: 'health.sensorHistory' })}
        </h2>
        <RangePicker
          value={dateRange}
          onCalendarChange={(dates) => setPickerDates(dates ?? [null, null])}
          onChange={handleDateChange}
          allowClear={false}
          disabledDate={(current) => {
            if (current.isAfter(dayjs())) return true
            const selected = pickerDates[0] ?? pickerDates[1]
            if (!selected) return false
            return Math.abs(current.diff(selected, 'day')) > MAX_RANGE_DAYS
          }}
        />
      </div>

      {sensorsLoading ? (
        <Row gutter={[16, 16]}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Col xs={24} lg={12} key={i}>
              <Card styles={{ body: { padding: '20px' } }}>
                <div className="h-4 bg-gray-200 rounded w-40 mb-4 animate-pulse" />
                <div className="h-48 bg-gray-100 rounded animate-pulse" />
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <Row gutter={[16, 16]}>
          {SENSOR_TYPES.map(name => {
            const sensor = getSensor(name)
            if (!sensor) {
              return (
                <Col xs={24} lg={12} key={name}>
                  <Card styles={{ body: { padding: '20px' } }}>
                    <h3 className="text-sm font-semibold text-gray-900 m-0 mb-4">
                      {intl.formatMessage({ id: `health.sensor.${name}` })}
                    </h3>
                    <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
                      {intl.formatMessage({ id: 'health.noSensorData' })}
                    </div>
                  </Card>
                </Col>
              )
            }
            return (
              <Col xs={24} lg={12} key={name}>
                <SensorChart sensor={sensor} intl={intl} />
              </Col>
            )
          })}
        </Row>
      )}
    </div>
  )
}
