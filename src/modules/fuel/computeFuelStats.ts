import type { Trip } from '@/types/api'

const n = (v: unknown): number => Number(v) || 0

interface TripWithVehicle extends Trip {
  vehicleName: string
  vehicleSPZ: string
}

export interface FuelSummary {
  totalFuel: number
  totalCost: number
  totalDistance: number
  avgPer100km: number
  totalTrips: number
}

export interface VehicleFuelRow {
  vehicleName: string
  vehicleSPZ: string
  trips: number
  fuel: number
  cost: number
  distance: number
  per100km: number
}

export interface DailyFuelPoint {
  date: string
  fuel: number
  cost: number
}

export function computeFuelSummary(trips: TripWithVehicle[]): FuelSummary {
  let totalFuel = 0
  let totalCost = 0
  let totalDistance = 0

  for (const t of trips) {
    totalFuel += n(t.FuelConsumed?.Value)
    totalCost += n(t.TripCost?.Value)
    totalDistance += n(t.TotalDistance)
  }

  return {
    totalFuel,
    totalCost,
    totalDistance,
    avgPer100km: totalDistance > 0 ? (totalFuel / totalDistance) * 100 : 0,
    totalTrips: trips.length,
  }
}

export function computeVehicleFuelRows(trips: TripWithVehicle[]): VehicleFuelRow[] {
  const map = new Map<string, VehicleFuelRow>()

  for (const t of trips) {
    const key = t.vehicleName
    const existing = map.get(key)
    const fuel = n(t.FuelConsumed?.Value)
    const cost = n(t.TripCost?.Value)
    const dist = n(t.TotalDistance)

    if (existing) {
      existing.trips += 1
      existing.fuel += fuel
      existing.cost += cost
      existing.distance += dist
    } else {
      map.set(key, {
        vehicleName: t.vehicleName,
        vehicleSPZ: t.vehicleSPZ,
        trips: 1,
        fuel,
        cost,
        distance: dist,
        per100km: 0,
      })
    }
  }

  const rows = Array.from(map.values())
  for (const r of rows) {
    r.per100km = r.distance > 0 ? (r.fuel / r.distance) * 100 : 0
  }

  rows.sort((a, b) => b.fuel - a.fuel)
  return rows
}

export function computeDailyFuel(trips: TripWithVehicle[]): DailyFuelPoint[] {
  const map = new Map<string, { fuel: number; cost: number }>()

  for (const t of trips) {
    const date = t.StartTime?.slice(0, 10) ?? ''
    if (!date) continue
    const existing = map.get(date)
    const fuel = n(t.FuelConsumed?.Value)
    const cost = n(t.TripCost?.Value)

    if (existing) {
      existing.fuel += fuel
      existing.cost += cost
    } else {
      map.set(date, { fuel, cost })
    }
  }

  return Array.from(map.entries())
    .map(([date, v]) => ({ date, fuel: Math.round(v.fuel * 10) / 10, cost: Math.round(v.cost) }))
    .sort((a, b) => a.date.localeCompare(b.date))
}
