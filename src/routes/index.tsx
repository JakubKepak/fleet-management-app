import { createBrowserRouter } from 'react-router-dom'
import AppLayout from '@/components/layout/AppLayout'
import DashboardPage from '@/modules/dashboard/DashboardPage'
import FleetPage from '@/modules/fleet/FleetPage'
import FuelPage from '@/modules/fuel/FuelPage'
import HealthPage from '@/modules/health/HealthPage'
import VehicleDetailPage from '@/modules/health/VehicleDetailPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'fleet', element: <FleetPage /> },
      { path: 'fuel', element: <FuelPage /> },
      { path: 'health', element: <HealthPage /> },
      { path: 'health/:vehicleCode', element: <VehicleDetailPage /> },
    ],
  },
])
