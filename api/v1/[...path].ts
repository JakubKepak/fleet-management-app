import type { VercelRequest, VercelResponse } from '@vercel/node'
import https from 'https'

const API_BASE = 'https://a1.gpsguard.eu/api/v1'

function proxyRequest(
  url: string,
  auth: string,
  method: string,
  body?: string
): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = https.request(url, {
      method,
      headers: {
        Authorization: auth,
        Accept: 'application/json',
        'Accept-Encoding': 'identity',
      },
    }, (resp) => {
      const chunks: Buffer[] = []
      resp.on('data', (chunk: Buffer) => chunks.push(chunk))
      resp.on('end', () => {
        resolve({
          status: resp.statusCode ?? 500,
          body: Buffer.concat(chunks).toString('utf-8'),
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
    // Extract path after /api/v1/ from the actual URL, ignoring Vercel's query params
    const urlPath = (req.url ?? '').split('?')[0]
    const apiPath = urlPath.replace(/^\/api\/v1\/?/, '')
    const target = apiPath ? `${API_BASE}/${apiPath}` : `${API_BASE}`

    // Forward only real query params (exclude Vercel's internal ...path param)
    const url = new URL(req.url ?? '/', `https://${req.headers.host}`)
    url.searchParams.delete('...path')
    const qs = url.searchParams.toString()
    const fullTarget = qs ? `${target}?${qs}` : target

    const username = process.env.API_USERNAME ?? ''
    const password = process.env.API_PASSWORD ?? ''
    const auth = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64')

    const reqBody = req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined
    const upstream = await proxyRequest(fullTarget, auth, req.method ?? 'GET', reqBody)

    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Cache-Control', 'no-store')
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.status(upstream.status).send(upstream.body)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(502).json({ error: message })
  }
}
