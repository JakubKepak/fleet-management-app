import { Card, Collapse } from 'antd'
import { InfoCircleOutlined } from '@ant-design/icons'
import { useIntl } from 'react-intl'

const penalties = [
  { key: 'speeding', icon: '🚨', points: '-3' },
  { key: 'speedingMild', icon: '⚠️', points: '-1' },
  { key: 'idling', icon: '⏱️', points: '-1' },
  { key: 'fuel', icon: '⛽', points: '-1' },
] as const

export default function ScoringMethodology() {
  const intl = useIntl()

  return (
    <Collapse
      ghost
      items={[
        {
          key: 'methodology',
          label: (
            <div className="flex items-center gap-2">
              <InfoCircleOutlined className="text-blue-500" />
              <span className="font-semibold text-gray-700">
                {intl.formatMessage({ id: 'drivers.methodologyTitle' })}
              </span>
            </div>
          ),
          children: (
            <Card styles={{ body: { padding: '16px' } }}>
              <p className="text-sm text-gray-600 m-0 mb-3">
                {intl.formatMessage({ id: 'drivers.methodologyDesc' })}
              </p>
              <div className="flex flex-col gap-2">
                {penalties.map(p => (
                  <div key={p.key} className="flex items-center gap-3 text-sm">
                    <span>{p.icon}</span>
                    <span className="text-gray-700 flex-1">
                      {intl.formatMessage({ id: `drivers.penalty.${p.key}` })}
                    </span>
                    <span className="font-mono text-red-500 font-medium text-xs">
                      {p.points} pts
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          ),
        },
      ]}
    />
  )
}
