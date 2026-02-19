import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { APIProvider, Map, AdvancedMarker, InfoWindow, useMap } from '@vis.gl/react-google-maps'
import { EnvironmentOutlined, SearchOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons'
import { Input } from 'antd'
import dayjs from 'dayjs'
import { useIntl } from 'react-intl'
import { useGroups, useVehicles, useTrips, usePositionHistory } from '@/api/hooks'
import type { Vehicle, PositionPoint, Trip } from '@/types/api'
import { getEffectiveSpeed } from '@/utils/vehicle'

const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string

// ── Marker helpers ──────────────────────────────────────────────

function getMarkerColor(vehicle: Vehicle): string {
  if (getEffectiveSpeed(vehicle) > 0) return '#22c55e'
  if (vehicle.IsActive) return '#f59e0b'
  return '#ef4444'
}

function VehicleMarker({
  vehicle,
  isSelected,
  onSelect,
}: {
  vehicle: Vehicle
  isSelected: boolean
  onSelect: (code: string | null) => void
}) {
  const intl = useIntl()
  const lat = parseFloat(vehicle.LastPosition.Latitude)
  const lng = parseFloat(vehicle.LastPosition.Longitude)
  if (isNaN(lat) || isNaN(lng)) return null

  const color = getMarkerColor(vehicle)

  function getStatusLabel(): string {
    const speed = getEffectiveSpeed(vehicle)
    if (speed > 0) return `${speed} km/h`
    if (vehicle.IsActive) return intl.formatMessage({ id: 'vehicles.idle' })
    return intl.formatMessage({ id: 'vehicles.offline' })
  }

  return (
    <>
      <AdvancedMarker
        position={{ lat, lng }}
        title={vehicle.Name}
        onClick={() => onSelect(vehicle.Code)}
      >
        <div
          className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-white shadow-md text-white text-xs font-bold"
          style={{ backgroundColor: color }}
        >
          <EnvironmentOutlined />
        </div>
      </AdvancedMarker>

      {isSelected && (
        <InfoWindow
          position={{ lat, lng }}
          onCloseClick={() => onSelect(null)}
          pixelOffset={[0, -36]}
        >
          <div className="min-w-[160px]">
            <div className="font-semibold text-sm">{vehicle.Name}</div>
            <div className="text-xs text-gray-500 mt-0.5">{vehicle.SPZ}</div>
            <div className="flex items-center gap-1.5 mt-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-xs">{getStatusLabel()}</span>
            </div>
            <div className="text-xs text-gray-400 mt-1">{vehicle.BranchName}</div>
          </div>
        </InfoWindow>
      )}
    </>
  )
}

// ── Map helpers ─────────────────────────────────────────────────

function FitBounds({ vehicles }: { vehicles: Vehicle[] }) {
  const map = useMap()
  const hasFitted = useRef(false)

  useEffect(() => {
    if (!map || vehicles.length === 0 || hasFitted.current) return
    const bounds = new google.maps.LatLngBounds()
    let hasValid = false
    vehicles.forEach(v => {
      const lat = parseFloat(v.LastPosition.Latitude)
      const lng = parseFloat(v.LastPosition.Longitude)
      if (!isNaN(lat) && !isNaN(lng)) {
        bounds.extend({ lat, lng })
        hasValid = true
      }
    })
    if (hasValid) {
      map.fitBounds(bounds, 50)
      hasFitted.current = true
    }
  }, [map, vehicles])

  return null
}

function FocusVehicle({ vehicleCode, vehicles }: { vehicleCode: string | null; vehicles: Vehicle[] }) {
  const map = useMap()
  const prevCode = useRef<string | null>(null)

  useEffect(() => {
    if (!map || !vehicleCode || vehicleCode === prevCode.current) return
    prevCode.current = vehicleCode

    const vehicle = vehicles.find(v => v.Code === vehicleCode)
    if (!vehicle) return

    const lat = parseFloat(vehicle.LastPosition.Latitude)
    const lng = parseFloat(vehicle.LastPosition.Longitude)
    if (isNaN(lat) || isNaN(lng)) return

    map.panTo({ lat, lng })
    map.setZoom(14)
  }, [map, vehicleCode, vehicles])

  return null
}

// ── Trip polyline ───────────────────────────────────────────────

function TripPolyline({ positions }: { positions: PositionPoint[] }) {
  const map = useMap()
  const polylineRef = useRef<google.maps.Polyline | null>(null)

  useEffect(() => {
    if (!map) return

    if (polylineRef.current) {
      polylineRef.current.setMap(null)
    }

    if (positions.length === 0) {
      polylineRef.current = null
      return
    }

    const path = positions.map(p => ({ lat: Number(p.Lat), lng: Number(p.Lng) }))

    polylineRef.current = new google.maps.Polyline({
      path,
      geodesic: true,
      strokeColor: '#3b82f6',
      strokeOpacity: 0.8,
      strokeWeight: 4,
      map,
    })

    return () => {
      polylineRef.current?.setMap(null)
      polylineRef.current = null
    }
  }, [map, positions])

  return null
}

// ── Trip start marker ───────────────────────────────────────────

function TripStartMarker({ position, label }: { position: PositionPoint; label: string }) {
  const lat = Number(position.Lat)
  const lng = Number(position.Lng)
  if (isNaN(lat) || isNaN(lng)) return null

  return (
    <AdvancedMarker position={{ lat, lng }}>
      <div className="flex flex-col items-center">
        <div
          className="flex items-center gap-1 px-2 py-1 rounded-full text-white text-[10px] font-semibold shadow-md whitespace-nowrap"
          style={{ backgroundColor: '#3b82f6' }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
            <line x1="4" y1="22" x2="4" y2="15" />
          </svg>
          {label}
        </div>
        <div
          className="w-0 h-0"
          style={{ borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '5px solid #3b82f6' }}
        />
      </div>
    </AdvancedMarker>
  )
}

// ── Active trip hook ────────────────────────────────────────────

function useActiveTripRoute(vehicleCode: string | null) {
  // Stable time range — computed once to prevent query key churn on re-renders
  const [startOfDay, endOfDay] = useMemo(() => {
    const now = dayjs()
    return [
      now.startOf('day').format('YYYY-MM-DDTHH:mm:ss'),
      now.endOf('day').format('YYYY-MM-DDTHH:mm:ss'),
    ]
  }, [])

  const { data: trips } = useTrips(vehicleCode ?? '', startOfDay, endOfDay)

  // Pick unfinished trip, or the last trip in the array (most recent)
  const activeTrip = useMemo((): Trip | null => {
    if (!trips?.length) return null
    const unfinished = trips.find(t => !t.IsFinished)
    if (unfinished) return unfinished
    return trips[trips.length - 1]
  }, [trips])

  const { data: positions } = usePositionHistory(
    vehicleCode ? [vehicleCode] : [],
    activeTrip?.StartTime ?? '',
    endOfDay,
    activeTrip && !activeTrip.IsFinished ? 15_000 : undefined,
  )

  return { activeTrip, positions: positions ?? [] }
}

// ── Status-grouped vehicle panel ────────────────────────────────

interface StatusGroup {
  key: string
  labelId: string
  color: string
  vehicles: Vehicle[]
  defaultOpen: boolean
}

function VehicleListPanel({
  vehicles,
  selectedCode,
  onSelectVehicle,
  collapsed,
  onToggleCollapse,
}: {
  vehicles: Vehicle[]
  selectedCode: string | null
  onSelectVehicle: (code: string) => void
  collapsed: boolean
  onToggleCollapse: () => void
}) {
  const intl = useIntl()
  const [search, setSearch] = useState('')
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    driving: true,
    parked: false,
    offline: false,
  })

  const filtered = useMemo(() => {
    if (!search.trim()) return vehicles
    const q = search.toLowerCase()
    return vehicles.filter(
      v =>
        v.Name.toLowerCase().includes(q) ||
        v.SPZ.toLowerCase().includes(q),
    )
  }, [vehicles, search])

  const groups: StatusGroup[] = useMemo(() => [
    {
      key: 'driving',
      labelId: 'liveMap.driving',
      color: '#22c55e',
      vehicles: filtered.filter(v => getEffectiveSpeed(v) > 0),
      defaultOpen: true,
    },
    {
      key: 'parked',
      labelId: 'liveMap.parked',
      color: '#f59e0b',
      vehicles: filtered.filter(v => getEffectiveSpeed(v) === 0 && v.IsActive),
      defaultOpen: false,
    },
    {
      key: 'offline',
      labelId: 'liveMap.offline',
      color: '#ef4444',
      vehicles: filtered.filter(v => !v.IsActive),
      defaultOpen: false,
    },
  ], [filtered])

  const toggleGroup = useCallback((key: string) => {
    setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }))
  }, [])

  if (collapsed) {
    return (
      <button
        onClick={onToggleCollapse}
        className="absolute top-4 left-4 z-10 flex items-center justify-center w-10 h-10 bg-white rounded-lg shadow-lg border-0 cursor-pointer hover:bg-gray-50 transition-colors"
        aria-label={intl.formatMessage({ id: 'liveMap.expandPanel' })}
      >
        <RightOutlined className="text-gray-600 text-xs" />
      </button>
    )
  }

  return (
    <div
      className="absolute top-4 left-4 z-10 flex flex-col bg-white rounded-xl shadow-2xl overflow-hidden"
      style={{ width: 320, maxHeight: 'calc(100% - 32px)', border: '1px solid rgba(0,0,0,0.08)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100 shrink-0">
        <Input
          prefix={<SearchOutlined className="text-gray-400" />}
          placeholder={intl.formatMessage({ id: 'liveMap.searchPlaceholder' })}
          value={search}
          onChange={e => setSearch(e.target.value)}
          allowClear
          size="small"
          variant="borderless"
          className="flex-1"
        />
        <button
          onClick={onToggleCollapse}
          className="flex items-center justify-center w-7 h-7 rounded bg-transparent border-0 cursor-pointer hover:bg-gray-100 transition-colors shrink-0"
          aria-label={intl.formatMessage({ id: 'liveMap.collapsePanel' })}
        >
          <LeftOutlined className="text-gray-400 text-xs" />
        </button>
      </div>

      {/* Groups */}
      <div className="flex-1 overflow-y-auto">
        {groups.map(group => (
          <div key={group.key}>
            <button
              onClick={() => toggleGroup(group.key)}
              className="w-full flex items-center gap-2 px-3 py-2 bg-gray-50 border-0 border-b border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors text-left"
            >
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: group.color }} />
              <span className="text-xs font-semibold text-gray-700 flex-1">
                {intl.formatMessage({ id: group.labelId })}
              </span>
              <span className="text-xs font-semibold text-gray-400">{group.vehicles.length}</span>
              <span className="text-gray-400 text-[10px]">{openGroups[group.key] ? '▾' : '▸'}</span>
            </button>

            {openGroups[group.key] && group.vehicles.map(v => (
              <button
                key={v.Code}
                onClick={() => onSelectVehicle(v.Code)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 border-0 cursor-pointer transition-colors text-left ${
                  selectedCode === v.Code
                    ? 'bg-blue-50'
                    : 'bg-white hover:bg-gray-50'
                }`}
              >
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: group.color }} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{v.Name}</div>
                  <div className="text-xs text-gray-400">{v.SPZ}</div>
                </div>
                {getEffectiveSpeed(v) > 0 && (
                  <span className="text-xs font-medium text-green-600 shrink-0">{getEffectiveSpeed(v)} km/h</span>
                )}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Trip info bar ───────────────────────────────────────────────

function TripInfoBar({ trip }: { trip: Trip }) {
  const intl = useIntl()
  const isActive = !trip.IsFinished

  return (
    <div
      className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-white rounded-xl shadow-lg px-4 py-3 flex items-center gap-4 text-sm"
      style={{ maxWidth: 600, border: '1px solid rgba(0,0,0,0.08)' }}
    >
      <div className={`px-2 py-0.5 rounded text-xs font-semibold text-white shrink-0 ${isActive ? 'bg-green-500' : 'bg-gray-400'}`}>
        {intl.formatMessage({ id: isActive ? 'liveMap.activeTrip' : 'liveMap.lastTrip' })}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-xs text-gray-600 truncate">
          <EnvironmentOutlined className="text-green-500" />
          <span className="truncate">{trip.StartAddress || '—'}</span>
          <span className="text-gray-300 mx-1">→</span>
          <EnvironmentOutlined className="text-red-500" />
          <span className="truncate">{trip.FinishAddress || '—'}</span>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0 text-xs text-gray-500">
        <span>{(Number(trip.TotalDistance) || 0).toFixed(1)} km</span>
        {trip.DriverName?.trim() && (
          <span className="text-gray-400">{trip.DriverName.trim()}</span>
        )}
      </div>
    </div>
  )
}

// ── Map placeholder ─────────────────────────────────────────────

function MapPlaceholder() {
  const intl = useIntl()

  return (
    <div className="w-full h-full bg-gradient-to-br from-blue-50 to-blue-100 flex flex-col items-center justify-center text-center p-6">
      <EnvironmentOutlined className="text-4xl text-blue-300 mb-3" />
      <div className="text-gray-600 font-medium">
        {intl.formatMessage({ id: 'map.placeholder' })}
      </div>
      <div className="text-gray-400 text-sm mt-1">
        {intl.formatMessage({ id: 'map.placeholderHint' })}
      </div>
    </div>
  )
}

// ── Main page ───────────────────────────────────────────────────

export default function LiveMapPage() {
  const [selectedCode, setSelectedCode] = useState<string | null>(null)
  const [panelCollapsed, setPanelCollapsed] = useState(false)

  const { data: groups } = useGroups()
  const groupCode = groups?.[0]?.Code ?? ''
  const { data: vehicles } = useVehicles(groupCode)

  const { activeTrip, positions } = useActiveTripRoute(selectedCode)

  if (!MAPS_API_KEY) {
    return <MapPlaceholder />
  }

  return (
    <div className="relative w-full h-full">
      <APIProvider apiKey={MAPS_API_KEY}>
        <Map
          defaultCenter={{ lat: 50.08, lng: 14.43 }}
          defaultZoom={8}
          mapId="live-map"
          style={{ width: '100%', height: '100%' }}
          gestureHandling="greedy"
          disableDefaultUI
          zoomControl
        >
          <FitBounds vehicles={vehicles ?? []} />
          <FocusVehicle vehicleCode={selectedCode} vehicles={vehicles ?? []} />

          {(vehicles ?? []).map(v => (
            <VehicleMarker
              key={v.Code}
              vehicle={v}
              isSelected={selectedCode === v.Code}
              onSelect={setSelectedCode}
            />
          ))}

          {positions.length > 0 && (
            <>
              <TripPolyline positions={positions} />
              <TripStartMarker
                position={positions[0]}
                label={dayjs(activeTrip?.StartTime).format('HH:mm')}
              />
            </>
          )}
        </Map>
      </APIProvider>

      <VehicleListPanel
        vehicles={vehicles ?? []}
        selectedCode={selectedCode}
        onSelectVehicle={setSelectedCode}
        collapsed={panelCollapsed}
        onToggleCollapse={() => setPanelCollapsed(c => !c)}
      />

      {activeTrip && selectedCode && <TripInfoBar trip={activeTrip} />}
    </div>
  )
}
