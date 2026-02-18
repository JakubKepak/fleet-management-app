const RAW_BASE = import.meta.env.VITE_API_BASE_URL ?? 'https://a1.gpsguard.eu'
const API_BASE_URL = RAW_BASE.replace(/\/+$/, '') + '/api/v1'
const API_USERNAME = import.meta.env.VITE_API_USERNAME ?? ''
const API_PASSWORD = import.meta.env.VITE_API_PASSWORD ?? ''

function getAuthHeader(): string {
  return 'Basic ' + btoa(`${API_USERNAME}:${API_PASSWORD}`)
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      Authorization: getAuthHeader(),
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

export async function apiPut<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'PUT',
    headers: {
      Authorization: getAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      Authorization: getAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}
