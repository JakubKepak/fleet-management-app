import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Badge, Select } from 'antd'
import {
  DashboardOutlined,
  CarOutlined,
  BarChartOutlined,
  ToolOutlined,
  GlobalOutlined,
  RobotOutlined,
  CloseOutlined,
} from '@ant-design/icons'
import { useIntl } from 'react-intl'
import { useLocale } from '@/i18n/LocaleContext'
import { useGroups, useVehicles } from '@/api/hooks'
import ChatPanel from '@/modules/ai/ChatPanel'

const { Sider, Content } = Layout

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { locale, changeLocale } = useLocale()
  const intl = useIntl()

  const { data: groups } = useGroups()
  const groupCode = groups?.[0]?.Code ?? ''
  const { data: vehicles } = useVehicles(groupCode)
  const activeCount = vehicles?.filter(v => v.Speed > 0).length ?? 0
  const totalCount = vehicles?.length ?? 0

  const menuItems = [
    { key: '/', icon: <DashboardOutlined />, label: intl.formatMessage({ id: 'nav.dashboard' }) },
    { key: '/fuel', icon: <BarChartOutlined />, label: intl.formatMessage({ id: 'nav.fuel' }) },
    { key: '/fleet', icon: <CarOutlined />, label: intl.formatMessage({ id: 'nav.fleet' }) },
    { key: '/health', icon: <ToolOutlined />, label: intl.formatMessage({ id: 'nav.health' }) },
  ]

  return (
    <Layout className="min-h-screen" style={{ flexDirection: 'row' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={220}
        collapsedWidth={64}
        style={{ background: '#0a1628', position: 'sticky', top: 0, height: '100vh', overflow: 'auto' }}
        trigger={null}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-3 px-4 h-16 border-b border-white/10">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500 text-white font-bold text-sm shrink-0">
              GD
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <div className="text-white font-semibold text-sm leading-tight">GPS Dozor</div>
                <div className="text-blue-300/60 text-xs leading-tight">
                  {intl.formatMessage({ id: 'app.subtitle' })}
                </div>
              </div>
            )}
          </div>

          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={({ key }) => navigate(key)}
            className="border-none mt-2 flex-1"
            style={{ background: 'transparent' }}
            theme="dark"
          />

          <div className="border-t border-white/10 p-3">
            {!collapsed ? (
              <div className="rounded-lg bg-white/5 p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-blue-300/80 text-xs font-medium">
                    {intl.formatMessage({ id: 'sidebar.fleetStatus' })}
                  </span>
                  <Badge status="processing" />
                </div>
                <div className="text-white text-sm">
                  {intl.formatMessage({ id: 'sidebar.activeVehicles' })}{' '}
                  <span className="font-semibold text-green-400">{activeCount}</span>
                  <span className="text-white/40">/{totalCount}</span>
                </div>
              </div>
            ) : (
              <div className="flex justify-center">
                <Badge count={activeCount} size="small" color="green" />
              </div>
            )}

            <div className={`flex items-center mt-2 ${collapsed ? 'justify-center' : 'gap-2 px-1'}`}>
              <GlobalOutlined className="text-white/50 text-xs" />
              {!collapsed && (
                <Select
                  value={locale}
                  onChange={changeLocale}
                  size="small"
                  variant="borderless"
                  options={[
                    { value: 'cs', label: 'CZ' },
                    { value: 'en', label: 'EN' },
                  ]}
                  className="w-16"
                  popupMatchSelectWidth={false}
                  style={{ color: 'rgba(255,255,255,0.6)' }}
                />
              )}
            </div>

            <button
              onClick={() => setCollapsed(!collapsed)}
              className="w-full mt-2 py-1.5 text-xs text-white/50 hover:text-white/80 transition-colors cursor-pointer bg-transparent border-0"
            >
              {collapsed ? '→' : intl.formatMessage({ id: 'sidebar.collapse' })}
            </button>
          </div>
        </div>
      </Sider>

      <Layout>
        <Content className="p-6 bg-gray-50 min-h-screen">
          <Outlet />
        </Content>
      </Layout>

      {/* Intercom-style chat bubble */}
      <button
        onClick={() => setChatOpen(o => !o)}
        className="fixed z-50 flex items-center justify-center w-14 h-14 rounded-full border-0 cursor-pointer shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
        style={{
          right: 24,
          bottom: 24,
          background: 'linear-gradient(135deg, #7c3aed, #2563eb)',
        }}
        aria-label={intl.formatMessage({ id: 'ai.title' })}
      >
        {chatOpen ? (
          <CloseOutlined className="text-white text-lg" />
        ) : (
          <RobotOutlined className="text-white text-xl" />
        )}
      </button>

      {/* Intercom-style popup chat */}
      {chatOpen && (
        <div
          className="fixed z-40 flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden"
          style={{
            right: 24,
            bottom: 96,
            width: 380,
            height: 520,
            border: '1px solid rgba(0,0,0,0.08)',
          }}
        >
          <div
            className="flex items-center gap-3 px-4 py-3 shrink-0"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20">
              <RobotOutlined className="text-white text-sm" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white font-semibold text-sm">
                {intl.formatMessage({ id: 'ai.title' })}
              </div>
              <div className="text-white/70 text-xs">
                {intl.formatMessage({ id: 'ai.subtitle' })}
              </div>
            </div>
          </div>

          <ChatPanel compact />
        </div>
      )}
    </Layout>
  )
}
