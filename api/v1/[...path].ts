const API_BASE = 'https://a1.gpsguard.eu/api/v1'

export const config = { runtime: 'edge' }

export default async function handler(req: Request) {
  try {
    const url = new URL(req.url)
    const apiPath = url.pathname.replace(/^\/api\/v1\/?/, '')
    const target = `${API_BASE}/${apiPath}${url.search}`

    const username = process.env.API_USERNAME ?? ''
    const password = process.env.API_PASSWORD ?? ''
    const auth = 'Basic ' + btoa(`${username}:${password}`)

    const headers: Record<string, string> = {
      Authorization: auth,
      'Content-Type': 'application/json',
    }

    const init: RequestInit = {
      method: req.method,
      headers,
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      init.body = await req.text()
    }

    const response = await fetch(target, init)

    // Copy response headers but strip WWW-Authenticate to prevent browser auth dialog
    const responseHeaders = new Headers()
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() !== 'www-authenticate') {
        responseHeaders.set(key, value)
      }
    })
    responseHeaders.set('Access-Control-Allow-Origin', '*')

    // Read body as array buffer to avoid streaming issues
    const body = await response.arrayBuffer()

    return new Response(body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return new Response(JSON.stringify({ error: message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
