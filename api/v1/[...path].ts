const API_BASE = 'https://a1.gpsguard.eu/api/v1'

export const config = { runtime: 'edge' }

export default async function handler(req: Request) {
  const url = new URL(req.url)
  // Extract everything after /api/v1/
  const apiPath = url.pathname.replace(/^\/api\/v1\/?/, '')
  const target = `${API_BASE}/${apiPath}${url.search}`

  const username = process.env.API_USERNAME ?? ''
  const password = process.env.API_PASSWORD ?? ''
  const auth = 'Basic ' + btoa(`${username}:${password}`)

  const response = await fetch(target, {
    method: req.method,
    headers: {
      Authorization: auth,
      'Content-Type': 'application/json',
    },
    body: req.method !== 'GET' && req.method !== 'HEAD' ? await req.text() : undefined,
  })

  // Copy response headers but strip WWW-Authenticate to prevent browser auth dialog
  const headers = new Headers()
  response.headers.forEach((value, key) => {
    if (key.toLowerCase() !== 'www-authenticate') {
      headers.set(key, value)
    }
  })

  // Allow requests from any origin (same-origin in production, but safe fallback)
  headers.set('Access-Control-Allow-Origin', '*')

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}
