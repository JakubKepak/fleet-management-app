import { Typography } from 'antd'
import { useIntl } from 'react-intl'

export default function FleetPage() {
  const intl = useIntl()

  return (
    <div>
      <Typography.Title level={3}>{intl.formatMessage({ id: 'fleet.title' })}</Typography.Title>
      <Typography.Text type="secondary">
        {intl.formatMessage({ id: 'fleet.description' })}
      </Typography.Text>
    </div>
  )
}
