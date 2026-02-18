import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import https from 'https'

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

const MODULE_PROMPTS: Record<string, string> = {
  dashboard:
    'You are a fleet management analyst. Analyze the fleet status summary. Identify vehicles that need attention, predict potential issues based on activity patterns, and provide a fleet health summary.',
  fleet:
    'You are a fleet management analyst. Analyze trip data for unusual mileage patterns, route anomalies, and flag any outliers.',
  drivers:
    'You are a fleet management analyst. Analyze driver safety scores and behavior metrics. Identify at-risk drivers, predict which may cause incidents, and highlight top performers.',
  fuel:
    'You are a fleet management analyst. Analyze fuel consumption data. Forecast cost trends, identify vehicles with wasteful consumption, and suggest cost reduction opportunities.',
  health:
    'You are a fleet management analyst. Analyze vehicle health scores and metrics. Predict which vehicles may need maintenance soon, identify anomalies, and flag critical issues.',
}

const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    insights: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          title: { type: 'STRING' },
          description: { type: 'STRING' },
          severity: { type: 'STRING', enum: ['info', 'warning', 'critical', 'positive'] },
          recommendations: { type: 'ARRAY', items: { type: 'STRING' } },
        },
        required: ['title', 'description', 'severity', 'recommendations'],
      },
    },
  },
  required: ['insights'],
}

function callGemini(apiKey: string, body: string): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = https.request(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept-Encoding': 'identity' },
    }, (resp) => {
      const chunks: Buffer[] = []
      resp.on('data', (c: Buffer) => chunks.push(c))
      resp.on('end', () => resolve({ status: resp.statusCode ?? 500, body: Buffer.concat(chunks).toString('utf-8') }))
      resp.on('error', reject)
    })
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

function geminiDevProxy(): Plugin {
  let apiKey = ''

  return {
    name: 'gemini-dev-proxy',
    configResolved(config) {
      const env = loadEnv('development', config.root, '')
      apiKey = env.AI_API_KEY || ''
    },
    configureServer(server) {
      server.middlewares.use('/api/gemini', async (req, res, next) => {
        if (req.method !== 'POST') { next(); return }

        try {
          if (!apiKey) {
            res.writeHead(500, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'AI_API_KEY not set in .env' }))
            return
          }

          const chunks: Buffer[] = []
          for await (const chunk of req) chunks.push(chunk as Buffer)
          const { module, data, locale } = JSON.parse(Buffer.concat(chunks).toString())

          const systemPrompt = MODULE_PROMPTS[module]
          if (!systemPrompt) {
            res.writeHead(400, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: `Unknown module: ${module}` }))
            return
          }

          const lang = locale === 'cs' ? 'Czech' : 'English'
          const userPrompt = `${systemPrompt}\n\nRespond in ${lang}. Return exactly 2-4 insight cards. Keep each description under 2 sentences. Keep each recommendation under 1 sentence.\n\nHere is the fleet data to analyze:\n\n${JSON.stringify(data, null, 2)}`

          const geminiBody = JSON.stringify({
            contents: [{ parts: [{ text: userPrompt }] }],
            generationConfig: { responseMimeType: 'application/json', responseSchema: RESPONSE_SCHEMA },
          })

          const geminiResp = await callGemini(apiKey, geminiBody)

          if (geminiResp.status !== 200) {
            res.writeHead(502, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'Gemini API error', status: geminiResp.status }))
            return
          }

          const parsed = JSON.parse(geminiResp.body)
          const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text
          if (!text) {
            res.writeHead(502, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'Empty Gemini response' }))
            return
          }

          res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' })
          res.end(text)
        } catch (err) {
          res.writeHead(502, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }))
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), geminiDevProxy()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    proxy: {
      '/api/v1': {
        target: 'https://a1.gpsguard.eu',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
