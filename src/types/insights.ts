export type InsightModule = 'dashboard' | 'fleet' | 'drivers' | 'fuel' | 'health'

export type InsightSeverity = 'info' | 'warning' | 'critical' | 'positive'

export interface InsightCard {
  title: string
  description: string
  severity: InsightSeverity
  recommendations: string[]
}

export interface InsightResponse {
  insights: InsightCard[]
}

export interface InsightRequestPayload {
  module: InsightModule
  data: Record<string, unknown>
  locale: string
}
