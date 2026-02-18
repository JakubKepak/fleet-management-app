import { Skeleton, Card, Row, Col } from 'antd'

export default function DashboardSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading dashboard">
      <Skeleton title={{ width: 200 }} paragraph={false} active />
      <Skeleton title={false} paragraph={{ rows: 1, width: 300 }} active className="mt-2" />

      <Row gutter={[16, 16]} className="mt-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Col xs={12} sm={6} key={i}>
            <Card>
              <Skeleton title={false} paragraph={{ rows: 2, width: ['40%', '60%'] }} active />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} className="mt-6">
        <Col xs={24} lg={16}>
          <Card>
            <Skeleton.Node active style={{ width: '100%', height: 300 }} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card>
            <Skeleton title={{ width: 120 }} paragraph={{ rows: 6 }} active />
          </Card>
        </Col>
      </Row>

      <Card className="mt-6">
        <Skeleton title={{ width: 120 }} active />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} avatar paragraph={{ rows: 1 }} active className="mt-4" />
        ))}
      </Card>
    </div>
  )
}
