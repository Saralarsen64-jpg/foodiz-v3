import { createBrowserRouter } from 'react-router-dom';
import { AuthLayout } from '../components/layout/AuthLayout';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleGuard } from './RoleGuard';
import { HomePage } from '../pages/home/HomePage';
import { AuthHomePage } from '../pages/auth/AuthHomePage';
import { ClientHomePage } from '../pages/client/ClientHomePage';
import { PartnerHomePage } from '../pages/partner/PartnerHomePage';
import { CourierHomePage } from '../pages/courier/CourierHomePage';
import { AdminHomePage } from '../pages/admin/AdminHomePage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [
      {
        index: true,
        element: <AuthHomePage />,
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <RoleGuard allowedRoles={['client']} />,
        children: [
          {
            path: '/client',
            element: <DashboardLayout role="client" />,
            children: [
              {
                index: true,
                element: <ClientHomePage />,
              },
            ],
          },
        ],
      },
      {
        element: <RoleGuard allowedRoles={['partner']} />,
        children: [
          {
            path: '/partner',
            element: <DashboardLayout role="partner" />,
            children: [
              {
                index: true,
                element: <PartnerHomePage />,
              },
            ],
          },
        ],
      },
      {
        element: <RoleGuard allowedRoles={['courier']} />,
        children: [
          {
            path: '/courier',
            element: <DashboardLayout role="courier" />,
            children: [
              {
                index: true,
                element: <CourierHomePage />,
              },
            ],
          },
        ],
      },
      {
        element: <RoleGuard allowedRoles={['admin']} />,
        children: [
          {
            path: '/admin',
            element: <DashboardLayout role="admin" />,
            children: [
              {
                index: true,
                element: <AdminHomePage />,
              },
            ],
          },
        ],
      },
    ],
  },
]);
