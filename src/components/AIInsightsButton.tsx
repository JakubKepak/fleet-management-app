import { Button } from 'antd'
import { BulbOutlined } from '@ant-design/icons'
import { useIntl } from 'react-intl'

interface AIInsightsButtonProps {
  active: boolean
  onClick: () => void
}

const baseStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
  borderColor: 'transparent',
  color: '#fff',
  fontWeight: 500,
}

const activeStyle: React.CSSProperties = {
  ...baseStyle,
  background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
  boxShadow: '0 0 0 2px rgba(139, 92, 246, 0.3)',
}

export default function AIInsightsButton({ active, onClick }: AIInsightsButtonProps) {
  const intl = useIntl()

  return (
    <Button
      icon={<BulbOutlined />}
      onClick={onClick}
      style={active ? activeStyle : baseStyle}
    >
      {intl.formatMessage({ id: 'insights.button' })}
    </Button>
  )
}
