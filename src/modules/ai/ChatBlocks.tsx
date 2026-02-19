import { Card, Row, Col, Statistic, Tag, Button } from 'antd'
import { CarOutlined, ArrowRightOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import type { ChatBlock, VehicleCardData, StatCardData } from '@/types/chat'

function TextBlock({ content }: { content: string }) {
  return <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{content}</div>
}

function VehicleCard({ vehicle }: { vehicle: VehicleCardData }) {
  return (
    <Card size="small" styles={{ body: { padding: '12px 16px' } }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-500">
            <CarOutlined />
          </div>
          <div>
            <Link
              to={`/health/${vehicle.code}`}
              className="font-medium text-sm text-blue-600 hover:text-blue-800"
            >
              {vehicle.name}
            </Link>
            <div className="text-xs text-gray-400">{vehicle.spz}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">
            {(vehicle.odometer / 1000).toFixed(0)}k km
          </span>
          {vehicle.speed > 0 ? (
            <Tag color="green" className="m-0">{vehicle.speed} km/h</Tag>
          ) : (
            <Tag className="m-0">{vehicle.isActive ? 'Idle' : 'Inactive'}</Tag>
          )}
        </div>
      </div>
    </Card>
  )
}

function VehicleCardBlock({ vehicles }: { vehicles: VehicleCardData[] }) {
  return (
    <div className="flex flex-col gap-2">
      {vehicles.map((v, i) => (
        <VehicleCard key={`${v.code}-${i}`} vehicle={v} />
      ))}
    </div>
  )
}

function StatCardBlock({ stats }: { stats: StatCardData[] }) {
  return (
    <Row gutter={[12, 12]}>
      {stats.map((s, i) => (
        <Col xs={12} sm={8} key={i}>
          <Card size="small" styles={{ body: { padding: '12px 16px' } }}>
            <Statistic
              title={<span className="text-xs">{s.label}</span>}
              value={s.value}
              valueStyle={{ fontSize: '18px' }}
            />
            {s.description && (
              <div className="text-xs text-gray-400 mt-1">{s.description}</div>
            )}
          </Card>
        </Col>
      ))}
    </Row>
  )
}

function ActionBlock({ label, href }: { label: string; href: string }) {
  return (
    <Link to={href}>
      <Button type="default" size="small" icon={<ArrowRightOutlined />}>
        {label}
      </Button>
    </Link>
  )
}

export function ChatBlockRenderer({ block }: { block: ChatBlock }) {
  switch (block.type) {
    case 'text':
      return <TextBlock content={block.content} />
    case 'vehicleCard':
      return <VehicleCardBlock vehicles={block.vehicles} />
    case 'statCard':
      return <StatCardBlock stats={block.stats} />
    case 'action':
      return <ActionBlock label={block.label} href={block.href} />
    default:
      return null
  }
}
