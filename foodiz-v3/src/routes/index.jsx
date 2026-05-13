import { Navigate, createBrowserRouter } from 'react-router-dom';
import { AuthLayout } from '../components/layout/AuthLayout';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { ClientLayout } from '../components/client/ClientLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleGuard } from './RoleGuard';
import { AuthHomePage } from '../pages/auth/AuthHomePage';
import { ClientHomePage } from '../pages/client/ClientHomePage';
import { ClientRestaurantsPage } from '../pages/client/ClientRestaurantsPage';
import { ClientMarketPage } from '../pages/client/ClientMarketPage';
import { ClientCartPage } from '../pages/client/ClientCartPage';
import { ClientOrdersPage } from '../pages/client/ClientOrdersPage';
import { ClientAccountPage } from '../pages/client/ClientAccountPage';
import { ClientEstablishmentPage } from '../pages/client/ClientEstablishmentPage';
import { PartnerHomePage } from '../pages/partner/PartnerHomePage';
import { CourierHomePage } from '../pages/courier/CourierHomePage';
import { AdminHomePage } from '../pages/admin/AdminHomePage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate replace to="/auth" />,
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
            element: <ClientLayout />,
            children: [
              {
                index: true,
                element: <ClientHomePage />,
              },
              {
                path: 'restaurants',
                element: <ClientRestaurantsPage />,
              },
              {
                path: 'market',
                element: <ClientMarketPage />,
              },
              {
                path: 'cart',
                element: <ClientCartPage />,
              },
              {
                path: 'orders',
                element: <ClientOrdersPage />,
              },
              {
                path: 'account',
                element: <ClientAccountPage />,
              },
              {
                path: 'establishments/:partnerId',
                element: <ClientEstablishmentPage />,
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
