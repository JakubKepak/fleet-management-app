import { Card, Col, Row, Skeleton, Alert } from 'antd'
import {
  BulbOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'
import { useIntl } from 'react-intl'
import { useAIInsights } from '@/api/useAIInsights'
import type { InsightModule, InsightSeverity } from '@/types/insights'

const severityConfig: Record<InsightSeverity, { color: string; bgColor: string; icon: React.ReactNode }> = {
  info:     { color: '#3b82f6', bgColor: '#eff6ff',  icon: <BulbOutlined /> },
  warning:  { color: '#f59e0b', bgColor: '#fffbeb',  icon: <WarningOutlined /> },
  critical: { color: '#ef4444', bgColor: '#fef2f2',  icon: <CloseCircleOutlined /> },
  positive: { color: '#22c55e', bgColor: '#f0fdf4',  icon: <CheckCircleOutlined /> },
}

interface InsightCardsProps {
  module: InsightModule
  data: Record<string, unknown> | null
}

export default function InsightCards({ module, data }: InsightCardsProps) {
  const intl = useIntl()
  const { data: response, isLoading, error } = useAIInsights(module, data)

  if (!data) return null

  if (isLoading) {
    return (
      <Row gutter={[16, 16]} className="mb-6">
        {[0, 1].map(i => (
          <Col xs={24} lg={12} key={i}>
            <Card styles={{ body: { padding: '16px' } }}>
              <Skeleton active title={{ width: '40%' }} paragraph={{ rows: 3, width: ['100%', '80%', '60%'] }} />
            </Card>
          </Col>
        ))}
      </Row>
    )
  }

  if (error) {
    return (
      <div className="mb-6">
        <Alert
          type="info"
          message={intl.formatMessage({ id: 'insights.error' })}
          showIcon
          closable
        />
      </div>
    )
  }

  const insights = response?.insights
  if (!insights?.length) return null

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <BulbOutlined className="text-blue-500" />
        <span className="text-sm font-medium text-gray-500">
          {intl.formatMessage({ id: 'insights.title' })}
        </span>
      </div>
      <Row gutter={[16, 16]}>
        {insights.map((insight, i) => {
          const config = severityConfig[insight.severity] ?? severityConfig.info
          return (
            <Col xs={24} lg={12} key={i}>
              <Card
                className="h-full"
                styles={{ body: { padding: '16px', borderLeft: `3px solid ${config.color}` } }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="flex items-center justify-center w-8 h-8 rounded-lg text-sm shrink-0"
                    style={{ color: config.color, backgroundColor: config.bgColor }}
                  >
                    {config.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-gray-900">{insight.title}</div>
                    <div className="text-xs text-gray-600 mt-1">{insight.description}</div>
                    {insight.recommendations.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {insight.recommendations.map((rec, j) => (
                          <li key={j} className="text-xs text-gray-500 flex items-start gap-1.5">
                            <span className="shrink-0 mt-1 w-1 h-1 rounded-full bg-gray-400" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </Card>
            </Col>
          )
        })}
      </Row>
    </div>
  )
}
