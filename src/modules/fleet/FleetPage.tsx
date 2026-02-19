import { useMemo, useState, useCallback, useEffect } from 'react'
import { Alert, Card, DatePicker, Select, Row, Col } from 'antd'
import {
  CarOutlined,
  UserOutlined,
  DashboardOutlined,
  NodeIndexOutlined,
} from '@ant-design/icons'
import dayjs, { type Dayjs } from 'dayjs'
import { useIntl } from 'react-intl'
import { useSearchParams } from 'react-router-dom'
import { useGroups, useVehicles, useAllVehicleTrips } from '@/api/hooks'
import TripTable from '@/modules/fleet/TripTable'
import AIInsightsButton from '@/components/AIInsightsButton'
import InsightCards from '@/components/InsightCards'

const { RangePicker } = DatePicker

const MAX_RANGE_DAYS = 30
const DATE_FORMAT = 'YYYY-MM-DD'
const n = (v: unknown): number => Number(v) || 0

function parseDateRange(searchParams: URLSearchParams): [Dayjs, Dayjs] {
  const fromParam = searchParams.get('from')
  const toParam = searchParams.get('to')
  const from = fromParam ? dayjs(fromParam, DATE_FORMAT, true) : null
  const to = toParam ? dayjs(toParam, DATE_FORMAT, true) : null

  if (from?.isValid() && to?.isValid() && to.diff(from, 'day') <= MAX_RANGE_DAYS) {
    return [from, to]
  }
  return [dayjs().subtract(7, 'day'), dayjs()]
}

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string
  color: string
  bgColor: string
}

function StatCard({ icon, label, value, color, bgColor }: StatCardProps) {
  return (
    <Card className="h-full" styles={{ body: { padding: '16px' } }}>
      <div className="flex items-center gap-3">
        <div
          className="flex items-center justify-center w-9 h-9 rounded-lg text-base shrink-0"
          style={{ color, backgroundColor: bgColor }}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-gray-500 text-xs">{label}</div>
          <div className="text-lg font-bold text-gray-900 leading-tight">{value}</div>
        </div>
      </div>
    </Card>
  )
}

export default function FleetPage() {
  const intl = useIntl()
  const [searchParams, setSearchParams] = useSearchParams()
  const dateRange = parseDateRange(searchParams)
  const [showInsights, setShowInsights] = useState(false)

  const { data: groups, isLoading: groupsLoading } = useGroups()
  const groupCode = groups?.[0]?.Code ?? ''
  const { data: vehicles, isLoading: vehiclesLoading } = useVehicles(groupCode)

  // Parse selected vehicle codes from URL; default to first vehicle
  const selectedCodes = useMemo(() => {
    const param = searchParams.get('vehicles')
    if (param) {
      const codes = param.split(',').filter(Boolean)
      if (codes.length > 0) return codes
    }
    // Default to first vehicle when no param or empty
    const first = vehicles?.[0]?.Code
    return first ? [first] : []
  }, [searchParams, vehicles])

  const setSelectedCodes = useCallback((codes: string[]) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      if (codes.length > 0) {
        next.set('vehicles', codes.join(','))
      } else {
        next.delete('vehicles')
      }
      return next
    }, { replace: true })
  }, [setSearchParams])

  const setDateRange = useCallback((range: [Dayjs, Dayjs]) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      next.set('from', range[0].format(DATE_FORMAT))
      next.set('to', range[1].format(DATE_FORMAT))
      return next
    }, { replace: true })
  }, [setSearchParams])

  useEffect(() => {
    if (!searchParams.has('from') || !searchParams.has('to')) {
      setSearchParams(prev => {
        const next = new URLSearchParams(prev)
        next.set('from', dateRange[0].format(DATE_FORMAT))
        next.set('to', dateRange[1].format(DATE_FORMAT))
        return next
      }, { replace: true })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const [pickerDates, setPickerDates] = useState<[Dayjs | null, Dayjs | null]>([null, null])

  // Only fetch trips for selected vehicles (not the full fleet)
  const selectedVehicles = useMemo(
    () => (vehicles ?? []).filter(v => selectedCodes.includes(v.Code)),
    [vehicles, selectedCodes],
  )

  const from = dateRange[0].format('YYYY-MM-DDTHH:mm:ss')
  const to = dateRange[1].format('YYYY-MM-DDTHH:mm:ss')

  const { data: trips, isLoading: tripsLoading, error } = useAllVehicleTrips(
    selectedVehicles,
    from,
    to,
  )

  const isLoading = groupsLoading || vehiclesLoading || tripsLoading

  const tripList = trips ?? []
  const totalDistance = useMemo(() => tripList.reduce((sum, t) => sum + n(t.TotalDistance), 0), [tripList])
  const uniqueDrivers = useMemo(
    () => new Set(tripList.map(t => (t.DriverName ?? '').trim()).filter(Boolean)).size,
    [tripList],
  )
  const uniqueVehicles = useMemo(
    () => new Set(tripList.map(t => t.vehicleCode)).size,
    [tripList],
  )

  if (error) {
    return (
      <Alert
        type="error"
        title={intl.formatMessage({ id: 'fleet.loadError' })}
        description={String(error)}
      />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 m-0">
            {intl.formatMessage({ id: 'fleet.title' })}
          </h1>
          <p className="text-gray-500 text-sm mt-1 mb-0">
            {intl.formatMessage({ id: 'fleet.subtitle' })}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <AIInsightsButton active={showInsights} onClick={() => setShowInsights(v => !v)} />
          <Select
            mode="multiple"
            value={selectedCodes}
            onChange={setSelectedCodes}
            style={{ minWidth: 220, maxWidth: 400 }}
            maxTagCount="responsive"
            placeholder={intl.formatMessage({ id: 'fleet.selectVehicles' })}
            options={(vehicles ?? []).map(v => ({ value: v.Code, label: `${v.Name} (${v.SPZ})` }))}
          />
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
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <StatCard
            icon={<NodeIndexOutlined />}
            label={intl.formatMessage({ id: 'fleet.statTrips' })}
            value={String(tripList.length)}
            color="#3b82f6"
            bgColor="#eff6ff"
          />
        </Col>
        <Col xs={12} sm={6}>
          <StatCard
            icon={<DashboardOutlined />}
            label={intl.formatMessage({ id: 'fleet.statDistance' })}
            value={`${totalDistance.toFixed(0)} km`}
            color="#22c55e"
            bgColor="#f0fdf4"
          />
        </Col>
        <Col xs={12} sm={6}>
          <StatCard
            icon={<CarOutlined />}
            label={intl.formatMessage({ id: 'fleet.statVehicles' })}
            value={String(uniqueVehicles)}
            color="#f59e0b"
            bgColor="#fffbeb"
          />
        </Col>
        <Col xs={12} sm={6}>
          <StatCard
            icon={<UserOutlined />}
            label={intl.formatMessage({ id: 'fleet.statDrivers' })}
            value={String(uniqueDrivers)}
            color="#8b5cf6"
            bgColor="#f5f3ff"
          />
        </Col>
      </Row>

      <InsightCards module="fleet" visible={showInsights} data={useMemo(() => ({
        trips: tripList.length,
        totalDistance: totalDistance,
        uniqueVehicles,
        uniqueDrivers,
        vehicles: selectedVehicles.map(v => {
          const vTrips = tripList.filter(t => t.vehicleCode === v.Code)
          return {
            name: v.Name,
            trips: vTrips.length,
            totalDistance: vTrips.reduce((s, t) => s + n(t.TotalDistance), 0),
            avgSpeed: vTrips.length > 0 ? vTrips.reduce((s, t) => s + n(t.AverageSpeed), 0) / vTrips.length : 0,
          }
        }),
      }), [tripList, totalDistance, uniqueVehicles, uniqueDrivers, selectedVehicles])} />

      <TripTable trips={tripList} loading={isLoading} />
    </div>
  )
}
