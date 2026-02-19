import { useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { vehicleKeys, groupKeys } from '@/api/queryKeys'
import type { Vehicle, Group, Trip } from '@/types/api'

export function useFleetContext(): () => string {
  const queryClient = useQueryClient()

  return useCallback(() => {
    const groups = queryClient.getQueryData<Group[]>(groupKeys.all)
    const groupCode = groups?.[0]?.Code ?? ''
    const vehicles = queryClient.getQueryData<Vehicle[]>(vehicleKeys.byGroup(groupCode))

    if (!vehicles || vehicles.length === 0) {
      return 'No fleet data available yet.'
    }

    const active = vehicles.filter(v => v.Speed > 0)
    const inactive = vehicles.filter(v => !v.IsActive)

    const sections: string[] = [
      `Fleet: ${vehicles.length} vehicles, ${active.length} moving, ${inactive.length} inactive.`,
      '',
      'Vehicles:',
      ...vehicles.map(v =>
        `- ${v.Name} (SPZ: ${v.SPZ}, Code: ${v.Code}, Branch: ${v.BranchName}, Odometer: ${(v.Odometer / 1000).toFixed(0)}k km, Speed: ${v.Speed} km/h, Active: ${v.IsActive}, EcoDriving: ${v.IsEcoDrivingEnabled})`,
      ),
    ]

    // Scan cache for all trip data (loaded by Fleet, Drivers, or Fuel pages)
    const allTrips: (Trip & { vehicleName: string })[] = []
    const cache = queryClient.getQueryCache().getAll()
    for (const query of cache) {
      const key = query.queryKey
      if (Array.isArray(key) && key[0] === 'vehicles' && key[2] === 'trips' && query.state.data) {
        const vehicleCode = key[1] as string
        const vehicle = vehicles.find(v => v.Code === vehicleCode)
        const trips = query.state.data as Trip[]
        for (const trip of trips) {
          allTrips.push({ ...trip, vehicleName: vehicle?.Name ?? vehicleCode })
        }
      }
    }

    if (allTrips.length > 0) {
      // Driver summary from trips
      const driverMap = new Map<string, { trips: number; totalDist: number; maxSpeed: number; totalFuel: number }>()
      for (const trip of allTrips) {
        const name = trip.DriverName || 'Unknown'
        const existing = driverMap.get(name) ?? { trips: 0, totalDist: 0, maxSpeed: 0, totalFuel: 0 }
        existing.trips++
        existing.totalDist += trip.TotalDistance
        existing.maxSpeed = Math.max(existing.maxSpeed, trip.MaxSpeed)
        existing.totalFuel += trip.FuelConsumed?.Value ?? 0
        driverMap.set(name, existing)
      }

      sections.push(
        '',
        `Trips (${allTrips.length} total):`,
        ...Array.from(driverMap.entries()).map(([name, s]) =>
          `- Driver "${name}": ${s.trips} trips, ${(s.totalDist / 1000).toFixed(0)} km, max speed ${s.maxSpeed} km/h, fuel ${s.totalFuel.toFixed(1)} L`,
        ),
      )

      // Fuel summary
      const totalFuel = allTrips.reduce((sum, t) => sum + (t.FuelConsumed?.Value ?? 0), 0)
      const totalDist = allTrips.reduce((sum, t) => sum + t.TotalDistance, 0)
      const totalCost = allTrips.reduce((sum, t) => sum + (t.TripCost?.Value ?? 0), 0)
      if (totalFuel > 0) {
        sections.push(
          '',
          'Fuel summary:',
          `- Total consumption: ${totalFuel.toFixed(1)} L`,
          `- Total distance: ${(totalDist / 1000).toFixed(0)} km`,
          `- Average consumption: ${totalDist > 0 ? ((totalFuel / (totalDist / 1000)) * 100).toFixed(1) : '?'} L/100km`,
          `- Total cost: ${totalCost.toFixed(0)} CZK`,
        )
      }
    }

    return sections.join('\n')
  }, [queryClient])
}
