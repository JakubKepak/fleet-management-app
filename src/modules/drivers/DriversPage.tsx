import { Typography } from 'antd'
import { useIntl } from 'react-intl'

export default function DriversPage() {
  const intl = useIntl()

  return (
    <div>
      <Typography.Title level={3}>{intl.formatMessage({ id: 'drivers.title' })}</Typography.Title>
      <Typography.Text type="secondary">
        {intl.formatMessage({ id: 'drivers.description' })}
      </Typography.Text>
    </div>
  )
}
