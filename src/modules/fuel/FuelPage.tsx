import { useMemo, useState, useCallback, useEffect } from 'react'
import { Alert, Card, DatePicker, Row, Col } from 'antd'
import {
  ThunderboltOutlined,
  DollarOutlined,
  DashboardOutlined,
  CarOutlined,
} from '@ant-design/icons'
import dayjs, { type Dayjs } from 'dayjs'
import { useIntl } from 'react-intl'
import { useSearchParams } from 'react-router-dom'
import { useGroups, useVehicles, useAllVehicleTrips } from '@/api/hooks'
import {
  computeFuelSummary,
  computeVehicleFuelRows,
  computeDailyFuel,
} from '@/modules/fuel/computeFuelStats'
import FuelCharts from '@/modules/fuel/FuelCharts'
import VehicleFuelTable from '@/modules/fuel/VehicleFuelTable'

const { RangePicker } = DatePicker

const MAX_RANGE_DAYS = 30
const DATE_FORMAT = 'YYYY-MM-DD'

function parseDateRange(searchParams: URLSearchParams): [Dayjs, Dayjs] {
  const fromParam = searchParams.get('from')
  const toParam = searchParams.get('to')
  const from = fromParam ? dayjs(fromParam, DATE_FORMAT, true) : null
  const to = toParam ? dayjs(toParam, DATE_FORMAT, true) : null

  if (from?.isValid() && to?.isValid() && to.diff(from, 'day') <= MAX_RANGE_DAYS) {
    return [from, to]
  }
  return [dayjs().subtract(MAX_RANGE_DAYS, 'day'), dayjs()]
}

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string
  subtitle: string
  color: string
  bgColor: string
}

function StatCard({ icon, label, value, subtitle, color, bgColor }: StatCardProps) {
  return (
    <Card className="h-full" styles={{ body: { padding: '20px' } }}>
      <div className="flex items-start gap-3">
        <div
          className="flex items-center justify-center w-10 h-10 rounded-lg text-lg shrink-0"
          style={{ color, backgroundColor: bgColor }}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-gray-500 text-xs font-medium">{label}</div>
          <div className="text-2xl font-bold text-gray-900 leading-tight mt-0.5">{value}</div>
          <div className="text-gray-400 text-xs mt-0.5">{subtitle}</div>
        </div>
      </div>
    </Card>
  )
}

export default function FuelPage() {
  const intl = useIntl()
  const [searchParams, setSearchParams] = useSearchParams()
  const dateRange = parseDateRange(searchParams)

  const setDateRange = useCallback((range: [Dayjs, Dayjs]) => {
    setSearchParams({
      from: range[0].format(DATE_FORMAT),
      to: range[1].format(DATE_FORMAT),
    }, { replace: true })
  }, [setSearchParams])

  useEffect(() => {
    if (!searchParams.has('from') || !searchParams.has('to')) {
      setSearchParams({
        from: dateRange[0].format(DATE_FORMAT),
        to: dateRange[1].format(DATE_FORMAT),
      }, { replace: true })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const [pickerDates, setPickerDates] = useState<[Dayjs | null, Dayjs | null]>([null, null])

  const { data: groups, isLoading: groupsLoading } = useGroups()
  const groupCode = groups?.[0]?.Code ?? ''
  const { data: vehicles, isLoading: vehiclesLoading } = useVehicles(groupCode)

  const from = dateRange[0].format('YYYY-MM-DDTHH:mm:ss')
  const to = dateRange[1].format('YYYY-MM-DDTHH:mm:ss')

  const { data: allTrips, isLoading: tripsLoading, error } = useAllVehicleTrips(
    vehicles ?? [],
    from,
    to,
  )

  const trips = allTrips ?? []
  const summary = useMemo(() => computeFuelSummary(trips), [trips])
  const vehicleRows = useMemo(() => computeVehicleFuelRows(trips), [trips])
  const dailyFuel = useMemo(() => computeDailyFuel(trips), [trips])

  const isLoading = groupsLoading || vehiclesLoading || tripsLoading

  const fmt = (v: unknown, decimals = 0) => Number(v || 0).toFixed(decimals)

  if (error) {
    return (
      <Alert
        type="error"
        message={intl.formatMessage({ id: 'fuel.loadError' })}
        description={String(error)}
      />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 m-0">
            {intl.formatMessage({ id: 'fuel.title' })}
          </h1>
          <p className="text-gray-500 text-sm mt-1 mb-0">
            {intl.formatMessage({ id: 'fuel.subtitle' })}
          </p>
        </div>
        <RangePicker
          value={dateRange}
          onCalendarChange={(dates) => setPickerDates(dates ?? [null, null])}
          onChange={(dates) => {
            if (dates?.[0] && dates?.[1]) {
              setDateRange([dates[0], dates[1]])
            }
            setPickerDates([null, null])
          }}
          allowClear={false}
          disabledDate={(current) => {
            if (current.isAfter(dayjs())) return true
            const selected = pickerDates[0] ?? pickerDates[1]
            if (!selected) return false
            return Math.abs(current.diff(selected, 'day')) > MAX_RANGE_DAYS
          }}
        />
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={12} sm={12} lg={6}>
          <StatCard
            icon={<ThunderboltOutlined />}
            label={intl.formatMessage({ id: 'fuel.totalConsumption' })}
            value={`${fmt(summary.totalFuel)} L`}
            subtitle={intl.formatMessage({ id: 'fuel.totalConsumptionSub' })}
            color="#3b82f6"
            bgColor="#eff6ff"
          />
        </Col>
        <Col xs={12} sm={12} lg={6}>
          <StatCard
            icon={<DollarOutlined />}
            label={intl.formatMessage({ id: 'fuel.totalCost' })}
            value={`${fmt(summary.totalCost)} CZK`}
            subtitle={intl.formatMessage({ id: 'fuel.totalCostSub' })}
            color="#22c55e"
            bgColor="#f0fdf4"
          />
        </Col>
        <Col xs={12} sm={12} lg={6}>
          <StatCard
            icon={<DashboardOutlined />}
            label={intl.formatMessage({ id: 'fuel.avgConsumption' })}
            value={`${fmt(summary.avgPer100km, 1)} L/100km`}
            subtitle={intl.formatMessage({ id: 'fuel.avgConsumptionSub' })}
            color="#f59e0b"
            bgColor="#fffbeb"
          />
        </Col>
        <Col xs={12} sm={12} lg={6}>
          <StatCard
            icon={<CarOutlined />}
            label={intl.formatMessage({ id: 'fuel.totalDistance' })}
            value={`${fmt(summary.totalDistance)} km`}
            subtitle={intl.formatMessage({ id: 'fuel.totalDistanceSub' }, { count: Number(summary.totalTrips || 0) })}
            color="#8b5cf6"
            bgColor="#f5f3ff"
          />
        </Col>
      </Row>

      <FuelCharts dailyFuel={dailyFuel} vehicleRows={vehicleRows} loading={isLoading} />

      <VehicleFuelTable rows={vehicleRows} loading={isLoading} />
    </div>
  )
}
