import { useMemo, useState, useCallback, useEffect } from 'react'
import { Alert, DatePicker } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { useIntl } from 'react-intl'
import { useSearchParams } from 'react-router-dom'
import { useGroups, useVehicles, useAllVehicleTrips } from '@/api/hooks'
import { computeAllDriverStats } from '@/modules/drivers/computeDriverStats'
import TopDrivers from '@/modules/drivers/TopDrivers'
import DriverRankingTable from '@/modules/drivers/DriverRankingTable'
import ScoringMethodology from '@/modules/drivers/ScoringMethodology'
import InsightCards from '@/components/InsightCards'

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

export default function DriversPage() {
  const intl = useIntl()
  const [searchParams, setSearchParams] = useSearchParams()
  const dateRange = parseDateRange(searchParams)

  const setDateRange = useCallback((range: [Dayjs, Dayjs]) => {
    setSearchParams({
      from: range[0].format(DATE_FORMAT),
      to: range[1].format(DATE_FORMAT),
    }, { replace: true })
  }, [setSearchParams])

  // Write defaults to URL if missing
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

  const driverStats = useMemo(() => computeAllDriverStats(allTrips), [allTrips])

  const isLoading = groupsLoading || vehiclesLoading || tripsLoading

  if (error) {
    return (
      <Alert
        type="error"
        message={intl.formatMessage({ id: 'drivers.loadError' })}
        description={String(error)}
      />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 m-0">
            {intl.formatMessage({ id: 'drivers.title' })}
          </h1>
          <p className="text-gray-500 text-sm mt-1 mb-0">
            {intl.formatMessage({ id: 'drivers.subtitle' })}
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

      <TopDrivers drivers={driverStats} loading={isLoading} />

      <InsightCards module="drivers" data={useMemo(() => ({
        drivers: driverStats.map(d => ({
          name: d.name,
          score: d.score,
          trips: d.totalTrips,
          speedingEvents: d.speedingEvents,
          idleMinutes: d.idleMinutes,
          fuelPerKm: d.fuelPerKm,
          totalDistance: d.totalDistance,
        })),
      }), [driverStats])} />

      <div>
        <h2 className="text-base font-semibold text-gray-900 m-0 mb-3">
          {intl.formatMessage({ id: 'drivers.rankingTitle' })}
        </h2>
        <DriverRankingTable drivers={driverStats} loading={isLoading} />
      </div>

      <ScoringMethodology />
    </div>
  )
}
