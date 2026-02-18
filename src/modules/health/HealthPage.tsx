import { useMemo, useState, useCallback, useEffect } from 'react'
import { Alert, Card, DatePicker, Row, Col, Progress } from 'antd'
import {
  HeartOutlined,
  CarOutlined,
  WarningOutlined,
  DashboardOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons'
import dayjs, { type Dayjs } from 'dayjs'
import { useIntl } from 'react-intl'
import { useSearchParams } from 'react-router-dom'
import { useGroups, useVehicles, useAllVehicleTrips } from '@/api/hooks'
import {
  computeVehicleHealth,
  computeFleetHealthSummary,
} from '@/modules/health/computeVehicleHealth'
import VehicleHealthTable from '@/modules/health/VehicleHealthTable'

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
  subtitle?: string
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
          {subtitle && <div className="text-gray-400 text-xs mt-0.5">{subtitle}</div>}
        </div>
      </div>
    </Card>
  )
}

interface StatusBadgeProps {
  count: number
  label: string
  icon: React.ReactNode
  color: string
  bgColor: string
}

function StatusBadge({ count, label, icon, color, bgColor }: StatusBadgeProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-3 rounded-lg" style={{ backgroundColor: bgColor }}>
      <span style={{ color }}>{icon}</span>
      <span className="text-2xl font-bold" style={{ color }}>{count}</span>
      <span className="text-sm text-gray-600">{label}</span>
    </div>
  )
}

export default function HealthPage() {
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

  const healthData = useMemo(
    () => computeVehicleHealth(vehicles ?? [], allTrips ?? []),
    [vehicles, allTrips],
  )
  const summary = useMemo(
    () => computeFleetHealthSummary(healthData),
    [healthData],
  )

  const isLoading = groupsLoading || vehiclesLoading || tripsLoading

  const scoreColor = summary.avgHealthScore >= 75 ? '#22c55e'
    : summary.avgHealthScore >= 50 ? '#f59e0b' : '#ef4444'

  if (error) {
    return (
      <Alert
        type="error"
        message={intl.formatMessage({ id: 'health.loadError' })}
        description={String(error)}
      />
    )
  }

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
        <Col xs={12} lg={6}>
          <StatCard
            icon={<HeartOutlined />}
            label={intl.formatMessage({ id: 'health.avgScore' })}
            value={summary.avgHealthScore.toFixed(0)}
            subtitle={intl.formatMessage({ id: 'health.avgScoreSub' })}
            color={scoreColor}
            bgColor={summary.avgHealthScore >= 75 ? '#f0fdf4' : summary.avgHealthScore >= 50 ? '#fffbeb' : '#fef2f2'}
          />
        </Col>
        <Col xs={12} lg={6}>
          <StatCard
            icon={<CarOutlined />}
            label={intl.formatMessage({ id: 'health.totalVehicles' })}
            value={String(summary.totalVehicles)}
            subtitle={intl.formatMessage({ id: 'health.activeNow' }, { count: summary.activeNow })}
            color="#3b82f6"
            bgColor="#eff6ff"
          />
        </Col>
        <Col xs={12} lg={6}>
          <StatCard
            icon={<DashboardOutlined />}
            label={intl.formatMessage({ id: 'health.avgOdometer' })}
            value={`${(summary.avgOdometer / 1000).toFixed(0)}k km`}
            subtitle={intl.formatMessage({ id: 'health.avgOdometerSub' })}
            color="#8b5cf6"
            bgColor="#f5f3ff"
          />
        </Col>
        <Col xs={12} lg={6}>
          <StatCard
            icon={<WarningOutlined />}
            label={intl.formatMessage({ id: 'health.issues' })}
            value={String(summary.warningHealth + summary.criticalHealth)}
            subtitle={intl.formatMessage({ id: 'health.issuesSub' })}
            color="#f59e0b"
            bgColor="#fffbeb"
          />
        </Col>
      </Row>

      <Card styles={{ body: { padding: '20px' } }}>
        <h3 className="text-sm font-semibold text-gray-900 m-0 mb-4">
          {intl.formatMessage({ id: 'health.fleetOverview' })}
        </h3>
        <div className="flex items-center gap-4 mb-4 flex-wrap">
          <StatusBadge
            count={summary.goodHealth}
            label={intl.formatMessage({ id: 'health.good' })}
            icon={<CheckCircleOutlined />}
            color="#22c55e"
            bgColor="#f0fdf4"
          />
          <StatusBadge
            count={summary.warningHealth}
            label={intl.formatMessage({ id: 'health.warning' })}
            icon={<ExclamationCircleOutlined />}
            color="#f59e0b"
            bgColor="#fffbeb"
          />
          <StatusBadge
            count={summary.criticalHealth}
            label={intl.formatMessage({ id: 'health.critical' })}
            icon={<CloseCircleOutlined />}
            color="#ef4444"
            bgColor="#fef2f2"
          />
        </div>
        <Progress
          percent={summary.totalVehicles > 0 ? Math.round((summary.goodHealth / summary.totalVehicles) * 100) : 0}
          strokeColor="#22c55e"
          trailColor="#fef2f2"
          showInfo={false}
        />
        <div className="text-xs text-gray-400 mt-1">
          {intl.formatMessage(
            { id: 'health.fleetHealthBar' },
            { good: summary.goodHealth, total: summary.totalVehicles },
          )}
        </div>
      </Card>

      <div>
        <h2 className="text-base font-semibold text-gray-900 m-0 mb-3">
          {intl.formatMessage({ id: 'health.vehicleDetails' })}
        </h2>
        <VehicleHealthTable data={healthData} loading={isLoading} />
      </div>
    </div>
  )
}
