import { useQuery, useQueries } from '@tanstack/react-query'
import { apiGet } from '@/api/client'
import { groupKeys, vehicleKeys } from '@/api/queryKeys'
import type { Group, Vehicle, Trip, SensorResponse, PositionHistoryResponse } from '@/types/api'

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

export function useTrips(vehicleCode: string, from: string, to: string, refetchInterval?: number) {
  return useQuery({
    queryKey: vehicleKeys.trips(vehicleCode, from, to),
    queryFn: () => apiGet<Trip[]>(`/vehicle/${vehicleCode}/trips?from=${from}&to=${to}`),
    enabled: !!vehicleCode && !!from && !!to,
    refetchInterval,
  })
}

export function useVehicleSensors(
  vehicleCode: string,
  sensorTypes: string[],
  from: string,
  to: string,
) {
  return useQuery({
    queryKey: vehicleKeys.sensors(vehicleCode, sensorTypes, from, to),
    queryFn: () =>
      apiGet<SensorResponse>(
        `/vehicle/${vehicleCode}/sensors/${sensorTypes.join(',')}?from=${from}&to=${to}`,
      ),
    enabled: !!vehicleCode && sensorTypes.length > 0 && !!from && !!to,
  })
}

export function usePositionHistory(
  vehicleCodes: string[],
  from: string,
  to: string,
  refetchInterval?: number,
) {
  return useQuery({
    queryKey: vehicleKeys.positionHistory(vehicleCodes, from, to),
    queryFn: async () => {
      const res = await apiGet<PositionHistoryResponse[]>(
        `/vehicles/history/${vehicleCodes.join(',')}?from=${from}&to=${to}`,
      )
      return res.flatMap(r => r.Positions)
    },
    enabled: vehicleCodes.length > 0 && !!from && !!to,
    refetchInterval,
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
      const allTrips: (Trip & { vehicleCode: string; vehicleName: string; vehicleSPZ: string })[] = []
      results.forEach((result, i) => {
        if (result.data) {
          result.data.forEach(trip => {
            allTrips.push({ ...trip, vehicleCode: vehicles[i].Code, vehicleName: vehicles[i].Name, vehicleSPZ: vehicles[i].SPZ })
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
