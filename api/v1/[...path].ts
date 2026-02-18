import type { VercelRequest, VercelResponse } from '@vercel/node'

const API_BASE = 'https://a1.gpsguard.eu/api/v1'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { path } = req.query
    const apiPath = Array.isArray(path) ? path.join('/') : (path ?? '')
    const qs = req.url?.includes('?') ? '?' + req.url.split('?')[1] : ''
    const target = `${API_BASE}/${apiPath}${qs}`

    const username = process.env.API_USERNAME ?? ''
    const password = process.env.API_PASSWORD ?? ''
    const auth = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64')

    const response = await fetch(target, {
      method: req.method ?? 'GET',
      headers: {
        Authorization: auth,
        'Content-Type': 'application/json',
      },
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
    })

    const data = await response.text()

    // Strip WWW-Authenticate to prevent browser auth dialog
    const responseHeaders = Object.fromEntries(
      [...response.headers.entries()].filter(
        ([key]) => key.toLowerCase() !== 'www-authenticate'
      )
    )

    res.setHeader('Access-Control-Allow-Origin', '*')
    for (const [key, value] of Object.entries(responseHeaders)) {
      res.setHeader(key, value)
    }

    res.status(response.status).send(data)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(502).json({ error: message })
  }
}
