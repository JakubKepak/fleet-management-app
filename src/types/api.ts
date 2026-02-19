export interface Group {
  Code: string
  Name: string
}

export interface VehiclePosition {
  Latitude: string
  Longitude: string
}

export interface Vehicle {
  Code: string
  GroupCode: string
  BranchId: number
  BranchName: string
  Name: string
  SPZ: string
  BatteryPercentage: number
  Speed: number
  LastPosition: VehiclePosition
  DeviceImei: string
  IsActive: boolean
  LastPositionTimestamp: string
  IsEcoDrivingEnabled: boolean
  Odometer: number
  IsInvoiced: boolean
  RefuelingCards: string[]
}

export interface PositionHistoryResponse {
  Name: string
  VehicleCode: string
  From: string
  To: string
  Positions: PositionPoint[]
}

export interface PositionPoint {
  Lat: string
  Lng: string
  Time: string
  Speed: number
}

export interface Trip {
  Id: number
  AverageSpeed: number
  MaxSpeed: number
  TripType: boolean
  StartTime: string
  FinishTime: string
  StartPosition: { Latitude: string; Longitude: string }
  FinishPosition: { Latitude: string; Longitude: string }
  StartAddress: string
  FinishAddress: string
  TripLength: string
  TripWaitingTime: string
  TotalDistance: number
  DriverName: string
  DriverChipCode: string
  IsFinished: boolean
  Odometer: number
  FuelConsumed: { Value: number; VolumeUnit: number }
  TripCost: { Value: number; Currency: number }
}

export interface SensorDataPoint {
  t: string
  v: number
}

export interface SensorItem {
  name: string
  units: string
  data: SensorDataPoint[]
}

export interface SensorResponse {
  items: SensorItem[]
}

export interface EcoDrivingEvent {
  Type: string
  Severity: 'None' | 'Low' | 'Medium' | 'High'
  Timestamp: string
  Latitude: number
  Longitude: number
  Speed: number
  Value: number
}

export interface EngineRelayState {
  State: number
  LastEventTimestamp: string
}

export interface Branch {
  Id: number
  Name: string
}
