import { useState, useEffect } from 'react'
import { APIProvider, Map, AdvancedMarker, InfoWindow, useMap } from '@vis.gl/react-google-maps'
import { EnvironmentOutlined } from '@ant-design/icons'
import { useIntl } from 'react-intl'
import type { Vehicle } from '@/types/api'
import { getEffectiveSpeed } from '@/utils/vehicle'

const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string

function getMarkerColor(vehicle: Vehicle): string {
  if (getEffectiveSpeed(vehicle) > 0) return '#22c55e'
  if (vehicle.IsActive) return '#f59e0b'
  return '#ef4444'
}

interface VehicleMarkerProps {
  vehicle: Vehicle
  isSelected: boolean
  onSelect: (code: string | null) => void
}

function VehicleMarker({ vehicle, isSelected, onSelect }: VehicleMarkerProps) {
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
            <div className="text-xs text-gray-400 mt-1">
              {vehicle.BranchName}
            </div>
          </div>
        </InfoWindow>
      )}
    </>
  )
}

function FitBounds({ vehicles }: { vehicles: Vehicle[] }) {
  const map = useMap()

  useEffect(() => {
    if (!map || vehicles.length === 0) return

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
    }
  }, [map, vehicles])

  return null
}

function MapLegend() {
  const intl = useIntl()

  return (
    <div className="absolute top-4 right-4 bg-white rounded-lg shadow-md px-3 py-2.5 text-xs">
      <div className="font-medium text-gray-700 mb-1.5">
        {intl.formatMessage({ id: 'map.legend' })}
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
          <span className="text-gray-600">{intl.formatMessage({ id: 'map.active' })}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span className="text-gray-600">{intl.formatMessage({ id: 'map.idleParked' })}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <span className="text-gray-600">{intl.formatMessage({ id: 'map.offline' })}</span>
        </div>
      </div>
    </div>
  )
}

function MapPlaceholder({ vehicles }: { vehicles: Vehicle[] }) {
  const intl = useIntl()
  const active = vehicles.filter(v => getEffectiveSpeed(v) > 0).length
  const idle = vehicles.filter(v => getEffectiveSpeed(v) === 0 && v.IsActive).length

  return (
    <div className="h-full bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex flex-col items-center justify-center text-center p-6">
      <EnvironmentOutlined className="text-4xl text-blue-300 mb-3" />
      <div className="text-gray-600 font-medium">
        {intl.formatMessage({ id: 'map.placeholder' })}
      </div>
      <div className="text-gray-400 text-sm mt-1">
        {intl.formatMessage({ id: 'map.placeholderHint' })}
      </div>
      <div className="flex gap-4 mt-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
          <span className="text-gray-500">
            {intl.formatMessage({ id: 'map.activeCount' }, { count: active })}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span className="text-gray-500">
            {intl.formatMessage({ id: 'map.idleCount' }, { count: idle })}
          </span>
        </div>
      </div>
    </div>
  )
}

function FocusVehicle({ vehicle, onHandled }: { vehicle: Vehicle | undefined; onHandled: () => void }) {
  const map = useMap()

  useEffect(() => {
    if (!map || !vehicle) return

    const lat = parseFloat(vehicle.LastPosition.Latitude)
    const lng = parseFloat(vehicle.LastPosition.Longitude)
    if (isNaN(lat) || isNaN(lng)) return

    map.panTo({ lat, lng })
    map.setZoom(14)
    onHandled()
  }, [map, vehicle, onHandled])

  return null
}

interface FleetMapProps {
  vehicles: Vehicle[]
  focusedVehicleCode?: string | null
  onFocusHandled?: () => void
}

export default function FleetMap({ vehicles, focusedVehicleCode, onFocusHandled }: FleetMapProps) {
  const [selectedCode, setSelectedCode] = useState<string | null>(null)

  const focusedVehicle = focusedVehicleCode
    ? vehicles.find(v => v.Code === focusedVehicleCode)
    : undefined

  // Auto-select the focused vehicle's info window
  useEffect(() => {
    if (focusedVehicleCode) {
      setSelectedCode(focusedVehicleCode)
    }
  }, [focusedVehicleCode])

  if (!MAPS_API_KEY) {
    return <MapPlaceholder vehicles={vehicles} />
  }

  return (
    <div className="h-full relative">
      <APIProvider apiKey={MAPS_API_KEY}>
        <Map
          defaultCenter={{ lat: 50.08, lng: 14.43 }}
          defaultZoom={6}
          mapId="fleet-map"
          style={{ width: '100%', height: '100%', borderRadius: '8px' }}
          gestureHandling="greedy"
          disableDefaultUI
          zoomControl
        >
          <FitBounds vehicles={vehicles} />
          <FocusVehicle vehicle={focusedVehicle} onHandled={onFocusHandled ?? (() => {})} />
          {vehicles.map(v => (
            <VehicleMarker
              key={v.Code}
              vehicle={v}
              isSelected={selectedCode === v.Code}
              onSelect={setSelectedCode}
            />
          ))}
        </Map>
      </APIProvider>
      <MapLegend />
    </div>
  )
}
