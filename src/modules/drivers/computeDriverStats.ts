import type { Trip } from '@/types/api'
import type { DriverStats } from '@/modules/drivers/types'

interface TripWithVehicle extends Trip {
  vehicleName: string
  vehicleSPZ: string
}

function parseWaitingTime(tripWaitingTime: unknown): number {
  if (!tripWaitingTime) return 0
  const str = String(tripWaitingTime)
  const parts = str.split(':')
  if (parts.length < 2) return 0
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10)
}

function computeScore(speedingEvents: number, idleMinutes: number, fuelPerKm: number, fleetAvgFuelPerKm: number): number {
  let score = 100

  // Speeding: -3 per event with MaxSpeed > 130, -1 per event > 110
  // (speedingEvents already counts both, weighted in aggregation)
  score -= speedingEvents

  // Idling: -1 per 5 minutes
  score -= Math.floor(idleMinutes / 5)

  // Fuel inefficiency: -1 per 20% above fleet average
  if (fleetAvgFuelPerKm > 0 && fuelPerKm > fleetAvgFuelPerKm) {
    const excessPct = ((fuelPerKm - fleetAvgFuelPerKm) / fleetAvgFuelPerKm) * 100
    score -= Math.floor(excessPct / 20)
  }

  return Math.max(0, Math.min(100, score))
}

export function computeAllDriverStats(trips: TripWithVehicle[]): DriverStats[] {
  const driverMap = new Map<string, {
    vehicleName: string
    vehicleSPZ: string
    trips: number
    totalDistance: number
    speedSum: number
    maxSpeed: number
    speedingEvents: number
    idleMinutes: number
    totalFuel: number
    totalCost: number
  }>()

  for (const trip of trips) {
    const name = (trip.DriverName ?? '').trim()
    if (!name) continue

    const existing = driverMap.get(name)
    const waitMins = parseWaitingTime(trip.TripWaitingTime)
    let speedingPenalty = 0
    if (trip.MaxSpeed > 130) speedingPenalty = 3
    else if (trip.MaxSpeed > 110) speedingPenalty = 1

    if (existing) {
      existing.trips += 1
      existing.totalDistance += trip.TotalDistance
      existing.speedSum += trip.AverageSpeed
      existing.maxSpeed = Math.max(existing.maxSpeed, trip.MaxSpeed)
      existing.speedingEvents += speedingPenalty
      existing.idleMinutes += waitMins
      existing.totalFuel += trip.FuelConsumed.Value
      existing.totalCost += trip.TripCost.Value
    } else {
      driverMap.set(name, {
        vehicleName: trip.vehicleName,
        vehicleSPZ: trip.vehicleSPZ,
        trips: 1,
        totalDistance: trip.TotalDistance,
        speedSum: trip.AverageSpeed,
        maxSpeed: trip.MaxSpeed,
        speedingEvents: speedingPenalty,
        idleMinutes: waitMins,
        totalFuel: trip.FuelConsumed.Value,
        totalCost: trip.TripCost.Value,
      })
    }
  }

  // Compute fleet average fuel per km
  let fleetTotalFuel = 0
  let fleetTotalDist = 0
  for (const d of driverMap.values()) {
    fleetTotalFuel += d.totalFuel
    fleetTotalDist += d.totalDistance
  }
  const fleetAvgFuelPerKm = fleetTotalDist > 0 ? fleetTotalFuel / fleetTotalDist : 0

  const stats: DriverStats[] = []
  for (const [name, d] of driverMap) {
    const fuelPerKm = d.totalDistance > 0 ? d.totalFuel / d.totalDistance : 0
    stats.push({
      name,
      vehicleName: d.vehicleName,
      vehicleSPZ: d.vehicleSPZ,
      totalTrips: d.trips,
      totalDistance: d.totalDistance,
      avgSpeed: d.trips > 0 ? Math.round(d.speedSum / d.trips) : 0,
      maxSpeed: d.maxSpeed,
      speedingEvents: d.speedingEvents,
      idleMinutes: d.idleMinutes,
      fuelPerKm,
      totalFuel: d.totalFuel,
      totalCost: d.totalCost,
      score: computeScore(d.speedingEvents, d.idleMinutes, fuelPerKm, fleetAvgFuelPerKm),
    })
  }

  // Sort by score descending
  stats.sort((a, b) => b.score - a.score)
  return stats
}
