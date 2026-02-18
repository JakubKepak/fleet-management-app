import { Typography } from 'antd'
import { useIntl } from 'react-intl'

export default function FuelPage() {
  const intl = useIntl()

  return (
    <div>
      <Typography.Title level={3}>{intl.formatMessage({ id: 'fuel.title' })}</Typography.Title>
      <Typography.Text type="secondary">
        {intl.formatMessage({ id: 'fuel.description' })}
      </Typography.Text>
    </div>
  )
}
