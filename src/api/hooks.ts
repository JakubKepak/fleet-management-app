import { useQuery, useQueries } from '@tanstack/react-query'
import { apiGet } from '@/api/client'
import { groupKeys, vehicleKeys } from '@/api/queryKeys'
import type { Group, Vehicle, Trip } from '@/types/api'

export function useGroups() {
  return useQuery({
    queryKey: groupKeys.all,
    queryFn: () => apiGet<Group[]>('/groups'),
  })
}

export function useVehicles(groupCode: string) {
  return useQuery({
    queryKey: vehicleKeys.byGroup(groupCode),
    queryFn: () => apiGet<Vehicle[]>(`/vehicles/group/${groupCode}`),
    enabled: !!groupCode,
    refetchInterval: 30_000,
  })
}

export function useVehicle(vehicleCode: string) {
  return useQuery({
    queryKey: vehicleKeys.detail(vehicleCode),
    queryFn: () => apiGet<Vehicle>(`/vehicle/${vehicleCode}`),
    enabled: !!vehicleCode,
  })
}

export function useTrips(vehicleCode: string, from: string, to: string) {
  return useQuery({
    queryKey: vehicleKeys.trips(vehicleCode, from, to),
    queryFn: () => apiGet<Trip[]>(`/vehicle/${vehicleCode}/trips?from=${from}&to=${to}`),
    enabled: !!vehicleCode && !!from && !!to,
  })
}

export function useAllVehicleTrips(vehicles: Vehicle[], from: string, to: string) {
  return useQueries({
    queries: vehicles.map(v => ({
      queryKey: vehicleKeys.trips(v.Code, from, to),
      queryFn: () => apiGet<Trip[]>(`/vehicle/${v.Code}/trips?from=${from}&to=${to}`),
      enabled: !!from && !!to,
    })),
    combine: (results) => {
      const allTrips: (Trip & { vehicleName: string; vehicleSPZ: string })[] = []
      results.forEach((result, i) => {
        if (result.data) {
          result.data.forEach(trip => {
            allTrips.push({ ...trip, vehicleName: vehicles[i].Name, vehicleSPZ: vehicles[i].SPZ })
          })
        }
      })
      return {
        data: allTrips,
        isLoading: results.some(r => r.isLoading),
        error: results.find(r => r.error)?.error ?? null,
      }
    },
  })
}
