import type { VercelRequest, VercelResponse } from '@vercel/node'
import https from 'https'

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

const SYSTEM_PROMPT = `You are a fleet management AI assistant for GPS Dozor. You help fleet managers understand their vehicle data, identify issues, and make decisions.

You have access to the fleet data provided below. Use it to answer questions accurately.

IMPORTANT RULES:
- Always respond with structured JSON in the format: { "blocks": [...] }
- Each block has a "type" field: "text", "vehicleCard", "statCard", or "action"
- Use "text" blocks for explanations and analysis
- Use "vehicleCard" blocks when listing specific vehicles — include name, spz, code, odometer, speed, isActive
- Use "statCard" blocks for summary statistics — include label, value, and optional description
- Use "action" blocks for navigation suggestions — include label and href (use app paths like /health/VEHICLECODE, /fleet, /drivers, /fuel)
- Keep responses concise and actionable
- If asked about something not in the data, say so honestly`

const RESPONSE_SCHEMA = {
  type: 'OBJECT' as const,
  properties: {
    blocks: {
      type: 'ARRAY' as const,
      items: {
        type: 'OBJECT' as const,
        properties: {
          type: {
            type: 'STRING' as const,
            enum: ['text', 'vehicleCard', 'statCard', 'action'],
          },
          content: { type: 'STRING' as const },
          vehicles: {
            type: 'ARRAY' as const,
            items: {
              type: 'OBJECT' as const,
              properties: {
                name: { type: 'STRING' as const },
                spz: { type: 'STRING' as const },
                code: { type: 'STRING' as const },
                odometer: { type: 'NUMBER' as const },
                speed: { type: 'NUMBER' as const },
                isActive: { type: 'BOOLEAN' as const },
              },
              required: ['name', 'spz', 'code', 'odometer', 'speed', 'isActive'],
            },
          },
          stats: {
            type: 'ARRAY' as const,
            items: {
              type: 'OBJECT' as const,
              properties: {
                label: { type: 'STRING' as const },
                value: { type: 'STRING' as const },
                description: { type: 'STRING' as const },
              },
              required: ['label', 'value'],
            },
          },
          label: { type: 'STRING' as const },
          href: { type: 'STRING' as const },
        },
        required: ['type'],
      },
    },
  },
  required: ['blocks'],
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

    const { messages, fleetContext, locale } = req.body as {
      messages: { role: string; content: string }[]
      fleetContext: string
      locale: string
    }

    const lang = locale === 'cs' ? 'Czech' : 'English'

    const geminiContents = [
      {
        role: 'user',
        parts: [{
          text: `${SYSTEM_PROMPT}\n\nRespond in ${lang}.\n\nFleet data:\n${fleetContext}`,
        }],
      },
      {
        role: 'model',
        parts: [{
          text: JSON.stringify({
            blocks: [{ type: 'text', content: lang === 'Czech'
              ? 'Jsem váš AI asistent pro správu flotily. Jak vám mohu pomoci?'
              : 'I\'m your fleet management AI assistant. How can I help you?' }],
          }),
        }],
      },
      ...messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      })),
    ]

    const geminiBody = JSON.stringify({
      contents: geminiContents,
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

    const response = JSON.parse(text)

    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Cache-Control', 'no-store')
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.status(200).json(response)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(502).json({ error: message })
  }
}
