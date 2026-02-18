import type { VercelRequest, VercelResponse } from '@vercel/node'
import https from 'https'

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

const MODULE_PROMPTS: Record<string, string> = {
  dashboard:
    'You are a fleet management analyst. Analyze the fleet status summary. Identify vehicles that need attention, predict potential issues based on activity patterns, and provide a fleet health summary.',
  fleet:
    'You are a fleet management analyst. Analyze trip data for unusual mileage patterns, route anomalies (e.g., vehicles with significantly more or less distance than fleet average), and flag any outliers.',
  drivers:
    'You are a fleet management analyst. Analyze driver safety scores and behavior metrics. Identify at-risk drivers with declining scores, predict which drivers may cause incidents, and highlight top performers.',
  fuel:
    'You are a fleet management analyst. Analyze fuel consumption data. Forecast cost trends, identify vehicles with wasteful consumption (significantly above fleet average), and suggest cost reduction opportunities.',
  health:
    'You are a fleet management analyst. Analyze vehicle health scores and metrics. Predict which vehicles may need maintenance soon, identify anomalies, and flag critical issues.',
}

const RESPONSE_SCHEMA = {
  type: 'OBJECT' as const,
  properties: {
    insights: {
      type: 'ARRAY' as const,
      items: {
        type: 'OBJECT' as const,
        properties: {
          title: { type: 'STRING' as const },
          description: { type: 'STRING' as const },
          severity: {
            type: 'STRING' as const,
            enum: ['info', 'warning', 'critical', 'positive'],
          },
          recommendations: {
            type: 'ARRAY' as const,
            items: { type: 'STRING' as const },
          },
        },
        required: ['title', 'description', 'severity', 'recommendations'],
      },
    },
  },
  required: ['insights'],
}

function callGemini(apiKey: string, body: string): Promise<{ status: number; body: string }> {
  const url = `${GEMINI_URL}?key=${apiKey}`
  return new Promise((resolve, reject) => {
    const req = https.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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
    req.write(body)
    req.end()
  })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const apiKey = process.env.AI_API_KEY ?? ''
    if (!apiKey) {
      res.status(500).json({ error: 'AI_API_KEY not configured' })
      return
    }

    const { module, data, locale } = req.body as {
      module: string
      data: Record<string, unknown>
      locale: string
    }

    const systemPrompt = MODULE_PROMPTS[module]
    if (!systemPrompt) {
      res.status(400).json({ error: `Unknown module: ${module}` })
      return
    }

    const lang = locale === 'cs' ? 'Czech' : 'English'
    const userPrompt = `${systemPrompt}

Respond in ${lang}. Return exactly 2-4 insight cards. Keep each description under 2 sentences. Keep each recommendation under 1 sentence.

Here is the fleet data to analyze:

${JSON.stringify(data, null, 2)}`

    const geminiBody = JSON.stringify({
      contents: [{ parts: [{ text: userPrompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA,
      },
    })

    const geminiResp = await callGemini(apiKey, geminiBody)

    if (geminiResp.status !== 200) {
      res.status(502).json({ error: 'Gemini API error', status: geminiResp.status })
      return
    }

    const parsed = JSON.parse(geminiResp.body)
    const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) {
      res.status(502).json({ error: 'Empty Gemini response' })
      return
    }

    const insights = JSON.parse(text)

    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Cache-Control', 'no-store')
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.status(200).json(insights)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(502).json({ error: message })
  }
}
