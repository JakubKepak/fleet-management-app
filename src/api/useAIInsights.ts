import { useQuery } from '@tanstack/react-query'
import { useLocale } from '@/i18n/LocaleContext'
import { insightKeys } from '@/api/queryKeys'
import type { InsightModule, InsightResponse } from '@/types/insights'

function hashData(data: Record<string, unknown>): string {
  const str = JSON.stringify(data)
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return hash.toString(36)
}

async function fetchInsights(
  module: InsightModule,
  data: Record<string, unknown>,
  locale: string,
): Promise<InsightResponse> {
  const response = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ module, data, locale }),
  })
  if (!response.ok) {
    throw new Error(`AI insight error: ${response.status}`)
  }
  return response.json()
}

export function useAIInsights(module: InsightModule, data: Record<string, unknown> | null, enabled = true) {
  const { locale } = useLocale()
  const dataHash = data ? hashData(data) : ''

  return useQuery({
    queryKey: insightKeys.byModule(module, dataHash),
    queryFn: () => fetchInsights(module, data!, locale),
    enabled: enabled && !!data && Object.keys(data).length > 0,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    retry: 1,
    refetchOnWindowFocus: false,
  })
}
