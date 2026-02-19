import type { Vehicle } from '@/types/api'

const STALE_THRESHOLD_MS = 5 * 60 * 1000 // 5 minutes

/** Speed is only trustworthy if the last position update is recent */
export function getEffectiveSpeed(vehicle: Vehicle): number {
  const age = Date.now() - new Date(vehicle.LastPositionTimestamp).getTime()
  if (age > STALE_THRESHOLD_MS) return 0
  return vehicle.Speed
}
