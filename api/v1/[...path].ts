import type { VercelRequest, VercelResponse } from '@vercel/node'
import https from 'https'

const API_BASE = 'https://a1.gpsguard.eu/api/v1'

function proxyRequest(
  url: string,
  auth: string,
  method: string,
  body?: string
): Promise<{ status: number; headers: Record<string, string>; body: string; bodyLength: number }> {
  return new Promise((resolve, reject) => {
    const options: https.RequestOptions = {
      method,
      headers: {
        Authorization: auth,
        Accept: 'application/json',
        'Accept-Encoding': 'identity',
      },
    }

    const req = https.request(url, options, (resp) => {
      const chunks: Buffer[] = []
      resp.on('data', (chunk: Buffer) => chunks.push(chunk))
      resp.on('end', () => {
        const buf = Buffer.concat(chunks)
        const respHeaders: Record<string, string> = {}
        for (const [key, val] of Object.entries(resp.headers)) {
          if (typeof val === 'string') respHeaders[key] = val
        }
        resolve({
          status: resp.statusCode ?? 500,
          headers: respHeaders,
          body: buf.toString('utf-8'),
          bodyLength: buf.length,
        })
      })
      resp.on('error', reject)
    })

    req.on('error', reject)
    if (body) req.write(body)
    req.end()
  })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { path } = req.query
    const apiPath = Array.isArray(path) ? path.join('/') : (path ?? '')
    const qs = req.url?.includes('?') ? '?' + req.url.split('?')[1] : ''
    const target = `${API_BASE}/${apiPath}${qs}`

    const username = process.env.API_USERNAME ?? ''
    const password = process.env.API_PASSWORD ?? ''
    const auth = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64')

    // Debug mode: add ?debug=1 to see diagnostics
    if (req.query.debug === '1') {
      res.status(200).json({
        target,
        hasUsername: username.length > 0,
        hasPassword: password.length > 0,
        authHeader: auth.substring(0, 15) + '...',
      })
      return
    }

    const reqBody = req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined
    const upstream = await proxyRequest(target, auth, req.method ?? 'GET', reqBody)

    // Debug mode: add ?debug=2 to see upstream response info
    if (req.query.debug === '2') {
      res.status(200).json({
        target,
        upstreamStatus: upstream.status,
        upstreamHeaders: upstream.headers,
        upstreamBodyLength: upstream.bodyLength,
        upstreamBodyPreview: upstream.body.substring(0, 200),
      })
      return
    }

    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Cache-Control', 'no-store')
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.status(upstream.status).send(upstream.body)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(502).json({ error: message, stack: err instanceof Error ? err.stack : undefined })
  }
}
