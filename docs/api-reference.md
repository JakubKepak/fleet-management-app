# GPS Dozor API Reference

**Base URL:** `https://a1.gpsguard.eu/api/v1`
**Auth:** Basic Authentication over HTTPS

## Endpoints

### Groups & Branches

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/groups` | List available groups |
| GET | `/groups/{groupCode}/branches` | List branches within a group |

### Vehicles

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/vehicles/group/{groupCode}` | List vehicles in group (position, speed, battery, odometer, refueling cards) |
| GET | `/vehicle/{vehicleCode}` | Single vehicle current status |
| PUT | `/vehicle/change-branch` | Change vehicle branch (body: `{VehicleCode, BranchId}`) |
| PUT | `/vehicle/change-branch-by-name` | Change vehicle branch by name (body: `{VehicleCode, BranchName}`) |
| PUT | `/vehicle/{vehicleCode}/update-vehicle-refueling-cards` | Update refueling card numbers |

### Position History

| Method | Endpoint | Params | Description |
|--------|----------|--------|-------------|
| GET | `/vehicles/history/{vehicleCodes}` | `from`, `to` | Position records (lat, lng, timestamp, speed). **Accepts comma-separated codes for batch.** |

### Trips (Logbook)

| Method | Endpoint | Params | Description |
|--------|----------|--------|-------------|
| GET | `/vehicle/{vehicleCode}/trips` | `from`, `to` | Trip records: avg/max speed, start/finish times+positions, addresses, duration, waiting time, distance, purpose, driver names, chip codes, odometer, **fuel consumed with cost** |
| POST | `/trip-purposes` | body: `{VehicleCode, Purpose}` | Set trip purpose for subsequent trips |

### Sensors

| Method | Endpoint | Params | Description |
|--------|----------|--------|-------------|
| GET | `/vehicle/{vehicleCode}/sensors/{sensorTypes}` | `from`, `to` | Time-series sensor data. Types: Temperature1-4, BatteryLevel, BatteryVoltage, Speed, Altitude, RPM, Odometer, Throttle, FuelLevel, FuelConsumed, Humidity1-4, EngineTemp, CoolingTemp, BinaryInputs, AnalogInputs |

### Eco-Driving

| Method | Endpoint | Params | Description |
|--------|----------|--------|-------------|
| GET | `/vehicle/{vehicleCode}/eco-driving-events` | `from`, `to` | Driving behavior events (cornering, acceleration, braking) with severity levels, position, speed |

### Engine Relay

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/vehicle/{vehicleCode}/getEngineRelayState` | Get relay state (0-5) |
| GET | `/vehicle/{vehicleCode}/setEngineRelayState/{on\|off}` | Set relay on/off |
| GET | `/vehicle/{vehicleCode}/resetEngineRelayState` | Reset relay to 0 |

## Data Availability Notes

- **Fuel data** is ONLY available via `/trips` endpoint (per-vehicle, per-trip). No aggregated fuel endpoint exists.
- **Sensor OBD data** (RPM, throttle, fuel level) — only available on vehicles with OBD hardware (~1/8 in demo fleet).
- **Eco-driving events** — only available on vehicles with eco-driving enabled (~1/8 in demo fleet).
- **Position history** is the only endpoint that supports batch vehicle codes in one call.
- **Fuel values can be NaN** — some vehicles report `NaN` for `FuelConsumed.Value` and `TripCost.Value`.
