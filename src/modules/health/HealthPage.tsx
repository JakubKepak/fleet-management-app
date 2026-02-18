import { Typography } from 'antd'
import { useIntl } from 'react-intl'

export default function HealthPage() {
  const intl = useIntl()

  return (
    <div>
      <Typography.Title level={3}>{intl.formatMessage({ id: 'health.title' })}</Typography.Title>
      <Typography.Text type="secondary">
        {intl.formatMessage({ id: 'health.description' })}
      </Typography.Text>
    </div>
  )
}
