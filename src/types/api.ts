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

export interface PositionHistory {
  Latitude: number
  Longitude: number
  Timestamp: string
  Speed: number
}

export interface Trip {
  AverageSpeed: number
  MaxSpeed: number
  StartTime: string
  FinishTime: string
  StartLatitude: number
  StartLongitude: number
  FinishLatitude: number
  FinishLongitude: number
  StartAddress: string
  FinishAddress: string
  Distance: number
  DriverName: string
  FuelConsumption: number
  TripCost: number
  Currency: string
  WaitingTime: number
}

export interface SensorReading {
  Name: string
  UnitType: string
  Values: {
    Timestamp: string
    Value: number
  }[]
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
