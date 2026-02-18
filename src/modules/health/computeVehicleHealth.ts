import type { Trip, Vehicle } from '@/types/api'
import dayjs from 'dayjs'

const n = (v: unknown): number => Number(v) || 0

interface TripWithVehicle extends Trip {
  vehicleName: string
  vehicleSPZ: string
}

export interface VehicleHealth {
  vehicleName: string
  vehicleSPZ: string
  vehicleCode: string
  isActive: boolean
  currentSpeed: number
  odometer: number
  lastSeen: string
  totalTrips: number
  totalDistance: number
  avgSpeed: number
  maxSpeedRecorded: number
  fuelEfficiency: number
  speedingEvents: number
  healthScore: number
  status: 'good' | 'warning' | 'critical'
}

export interface FleetHealthSummary {
  totalVehicles: number
  activeNow: number
  goodHealth: number
  warningHealth: number
  criticalHealth: number
  avgHealthScore: number
  totalOdometer: number
  avgOdometer: number
}

export function computeVehicleHealth(
  vehicles: Vehicle[],
  trips: TripWithVehicle[],
): VehicleHealth[] {
  const tripsByVehicle = new Map<string, TripWithVehicle[]>()
  for (const t of trips) {
    const key = t.vehicleName
    const existing = tripsByVehicle.get(key)
    if (existing) existing.push(t)
    else tripsByVehicle.set(key, [t])
  }

  return vehicles.map(v => {
    const vTrips = tripsByVehicle.get(v.Name) ?? []
    const totalDistance = vTrips.reduce((sum, t) => sum + n(t.TotalDistance), 0)
    const totalFuel = vTrips.reduce((sum, t) => sum + n(t.FuelConsumed?.Value), 0)
    const avgSpeed = vTrips.length > 0
      ? vTrips.reduce((sum, t) => sum + n(t.AverageSpeed), 0) / vTrips.length
      : 0
    const maxSpeedRecorded = Math.max(...vTrips.map(t => n(t.MaxSpeed)), 0)
    const speedingEvents = vTrips.filter(t => n(t.MaxSpeed) > 130).length
    const fuelEfficiency = totalDistance > 0 ? (totalFuel / totalDistance) * 100 : 0

    // Health score: starts at 100, penalize for issues
    let score = 100
    // Penalize for speeding events
    score -= speedingEvents * 3
    // Penalize for very high fuel inefficiency (>15 L/100km)
    if (fuelEfficiency > 15) score -= 10
    else if (fuelEfficiency > 12) score -= 5
    // Penalize for high odometer (>500k km)
    if (v.Odometer > 500000) score -= 10
    else if (v.Odometer > 300000) score -= 5
    // Penalize for inactivity (last seen > 24h ago)
    const hoursSinceLastSeen = dayjs().diff(dayjs(v.LastPositionTimestamp), 'hour')
    if (hoursSinceLastSeen > 48) score -= 15
    else if (hoursSinceLastSeen > 24) score -= 5

    score = Math.max(0, Math.min(100, score))

    const status: VehicleHealth['status'] =
      score >= 75 ? 'good' : score >= 50 ? 'warning' : 'critical'

    return {
      vehicleName: v.Name,
      vehicleSPZ: v.SPZ,
      vehicleCode: v.Code,
      isActive: v.IsActive,
      currentSpeed: v.Speed,
      odometer: v.Odometer,
      lastSeen: v.LastPositionTimestamp,
      totalTrips: vTrips.length,
      totalDistance,
      avgSpeed,
      maxSpeedRecorded,
      fuelEfficiency,
      speedingEvents,
      healthScore: score,
      status,
    }
  }).sort((a, b) => b.healthScore - a.healthScore)
}

export function computeFleetHealthSummary(healthData: VehicleHealth[]): FleetHealthSummary {
  const totalVehicles = healthData.length
  const activeNow = healthData.filter(v => v.currentSpeed > 0).length
  const goodHealth = healthData.filter(v => v.status === 'good').length
  const warningHealth = healthData.filter(v => v.status === 'warning').length
  const criticalHealth = healthData.filter(v => v.status === 'critical').length
  const avgHealthScore = totalVehicles > 0
    ? healthData.reduce((sum, v) => sum + v.healthScore, 0) / totalVehicles
    : 0
  const totalOdometer = healthData.reduce((sum, v) => sum + v.odometer, 0)

  return {
    totalVehicles,
    activeNow,
    goodHealth,
    warningHealth,
    criticalHealth,
    avgHealthScore,
    totalOdometer,
    avgOdometer: totalVehicles > 0 ? totalOdometer / totalVehicles : 0,
  }
}
