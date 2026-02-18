import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu } from 'antd'
import {
  DashboardOutlined,
  CarOutlined,
  UserOutlined,
  ThunderboltOutlined,
  ToolOutlined,
} from '@ant-design/icons'

const { Header, Sider, Content } = Layout

const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/fleet', icon: <CarOutlined />, label: 'Fleet' },
  { key: '/drivers', icon: <UserOutlined />, label: 'Drivers' },
  { key: '/fuel', icon: <ThunderboltOutlined />, label: 'Fuel & Costs' },
  { key: '/health', icon: <ToolOutlined />, label: 'Vehicle Health' },
]

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <Layout className="min-h-screen">
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="dark"
      >
        <div className="flex items-center justify-center h-16 text-white font-bold text-lg">
          {collapsed ? 'GD' : 'GPS Dozor'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header className="bg-white px-6 flex items-center shadow-sm">
          <h2 className="text-lg font-semibold m-0">Fleet Management</h2>
        </Header>
        <Content className="m-4 p-6 bg-white rounded-lg min-h-[280px]">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
