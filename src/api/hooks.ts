import { useQuery } from '@tanstack/react-query'
import { apiGet } from '@/api/client'
import { groupKeys, vehicleKeys } from '@/api/queryKeys'
import type { Group, Vehicle } from '@/types/api'

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
