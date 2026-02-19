import { createBrowserRouter } from 'react-router-dom'
import AppLayout from '@/components/layout/AppLayout'
import DashboardPage from '@/modules/dashboard/DashboardPage'
import FleetPage from '@/modules/fleet/FleetPage'
import HealthPage from '@/modules/health/HealthPage'
import VehicleDetailPage from '@/modules/health/VehicleDetailPage'
import LiveMapPage from '@/modules/map/LiveMapPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'fleet', element: <FleetPage /> },
      { path: 'map', element: <LiveMapPage /> },
      { path: 'health', element: <HealthPage /> },
      { path: 'health/:vehicleCode', element: <VehicleDetailPage /> },
    ],
  },
])
