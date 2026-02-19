import type { Trip, Vehicle } from '@/types/api'

export interface VehicleEconomics {
  vehicleCode: string
  vehicleName: string
  vehicleSPZ: string
  branchName: string
  totalTrips: number
  totalDistance: number
  totalFuel: number
  totalCost: number
  fuelPer100km: number
  costPerKm: number
  avgSpeed: number
  maxSpeed: number
  drivers: string[]
  hasFuelData: boolean
}

/** Safely convert unknown API values (NaN, "NaN", null, strings) to a finite number */
function safeNum(value: unknown): number {
  if (value === null || value === undefined) return 0
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

export function computeVehicleEconomics(vehicle: Vehicle, trips: Trip[]): VehicleEconomics {
  let totalDistance = 0
  let totalFuel = 0
  let totalCost = 0
  let speedSum = 0
  let maxSpeed = 0
  let fuelDataPoints = 0
  const driverSet = new Set<string>()

  for (const trip of trips) {
    totalDistance += safeNum(trip.TotalDistance)

    const fuel = safeNum(trip.FuelConsumed?.Value)
    totalFuel += fuel
    if (fuel > 0) fuelDataPoints++

    totalCost += safeNum(trip.TripCost?.Value)
    speedSum += safeNum(trip.AverageSpeed)
    maxSpeed = Math.max(maxSpeed, safeNum(trip.MaxSpeed))

    const name = (trip.DriverName ?? '').trim()
    if (name) driverSet.add(name)
  }

  const hasFuelData = fuelDataPoints > 0
  const fuelPer100km =
    totalDistance > 0 && hasFuelData ? (totalFuel / totalDistance) * 100 : 0
  const costPerKm = totalDistance > 0 ? totalCost / totalDistance : 0

  return {
    vehicleCode: vehicle.Code,
    vehicleName: vehicle.Name,
    vehicleSPZ: vehicle.SPZ,
    branchName: vehicle.BranchName,
    totalTrips: trips.length,
    totalDistance,
    totalFuel,
    totalCost,
    fuelPer100km,
    costPerKm,
    avgSpeed: trips.length > 0 ? Math.round(speedSum / trips.length) : 0,
    maxSpeed,
    drivers: Array.from(driverSet),
    hasFuelData,
  }
}

export interface DailyFuelPoint {
  date: string
  fuel: number
  distance: number
  trips: number
}

export function computeDailyFuel(trips: Trip[]): DailyFuelPoint[] {
  const dayMap = new Map<string, { fuel: number; distance: number; trips: number }>()

  for (const trip of trips) {
    const date = trip.StartTime?.slice(0, 10) ?? ''
    if (!date) continue

    const existing = dayMap.get(date)
    const fuel = safeNum(trip.FuelConsumed?.Value)
    const dist = safeNum(trip.TotalDistance)

    if (existing) {
      existing.fuel += fuel
      existing.distance += dist
      existing.trips += 1
    } else {
      dayMap.set(date, { fuel, distance: dist, trips: 1 })
    }
  }

  return Array.from(dayMap.entries())
    .map(([date, v]) => ({ date, ...v }))
    .sort((a, b) => a.date.localeCompare(b.date))
}
