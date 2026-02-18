import type { VercelRequest, VercelResponse } from '@vercel/node'
import https from 'https'

const API_BASE = 'https://a1.gpsguard.eu/api/v1'

function proxyRequest(url: string, auth: string): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { Authorization: auth } }, (resp) => {
      const chunks: Buffer[] = []
      resp.on('data', (chunk: Buffer) => chunks.push(chunk))
      resp.on('end', () => {
        resolve({ status: resp.statusCode ?? 500, body: Buffer.concat(chunks).toString('utf-8') })
      })
      resp.on('error', reject)
    }).on('error', reject)
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

    const { status, body } = await proxyRequest(target, auth)

    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Cache-Control', 'no-store')
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.status(status).send(body)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(502).json({ error: message })
  }
}
