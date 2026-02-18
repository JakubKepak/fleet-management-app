export const groupKeys = {
  all: ['groups'] as const,
  detail: (code: string) => ['groups', code] as const,
  branches: (code: string) => ['groups', code, 'branches'] as const,
}

export const vehicleKeys = {
  all: ['vehicles'] as const,
  byGroup: (groupCode: string) => ['vehicles', 'group', groupCode] as const,
  detail: (code: string) => ['vehicles', code] as const,
  trips: (code: string, from: string, to: string) =>
    ['vehicles', code, 'trips', { from, to }] as const,
  positionHistory: (codes: string[], from: string, to: string) =>
    ['vehicles', 'history', codes, { from, to }] as const,
  sensors: (code: string, sensorTypes: string[], from: string, to: string) =>
    ['vehicles', code, 'sensors', sensorTypes, { from, to }] as const,
  ecoDriving: (code: string, from: string, to: string) =>
    ['vehicles', code, 'eco-driving', { from, to }] as const,
  engineRelay: (code: string) => ['vehicles', code, 'engine-relay'] as const,
}

export const insightKeys = {
  all: ['insights'] as const,
  byModule: (module: string, dataHash: string) =>
    ['insights', module, dataHash] as const,
}
