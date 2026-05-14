import { Navigate, createBrowserRouter } from 'react-router-dom';
import { AuthLayout } from '../components/layout/AuthLayout';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { ClientLayout } from '../components/client/ClientLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleGuard } from './RoleGuard';
import { AuthHomePage } from '../pages/auth/AuthHomePage';
import { ProSignupPage } from '../pages/auth/ProSignupPage';
import { ResetPasswordPage } from '../pages/auth/ResetPasswordPage';
import { ClientHomePage } from '../pages/client/ClientHomePage';
import { ClientRestaurantsPage } from '../pages/client/ClientRestaurantsPage';
import { ClientMarketPage } from '../pages/client/ClientMarketPage';
import { ClientCartPage } from '../pages/client/ClientCartPage';
import { ClientOrdersPage } from '../pages/client/ClientOrdersPage';
import { ClientAccountPage } from '../pages/client/ClientAccountPage';
import { ClientEstablishmentPage } from '../pages/client/ClientEstablishmentPage';
import { PartnerHomePage } from '../pages/partner/PartnerHomePage';
import { PartnerOnboardingPage } from '../pages/partner/PartnerOnboardingPage';
import { CourierHomePage } from '../pages/courier/CourierHomePage';
import { CourierOnboardingPage } from '../pages/courier/CourierOnboardingPage';
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
      { index: true, element: <AuthHomePage /> },
      // Public role-specific signup screens. They do NOT live behind
      // ProtectedRoute because the user is signing up — they obviously have
      // no session yet. The role prop is passed explicitly so ProSignupPage
      // can resolve its config even though the path segment is not a :param.
      { path: 'partner', element: <ProSignupPage role="partner" /> },
      { path: 'courier', element: <ProSignupPage role="courier" /> },
      // Password recovery landing. This route handles its own session/recovery
      // logic (Supabase emits PASSWORD_RECOVERY before any redirect happens),
      // so it stays outside ProtectedRoute as well.
      { path: 'reset-password', element: <ResetPasswordPage /> },
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
              { index: true, element: <ClientHomePage /> },
              { path: 'restaurants', element: <ClientRestaurantsPage /> },
              { path: 'market', element: <ClientMarketPage /> },
              { path: 'cart', element: <ClientCartPage /> },
              { path: 'orders', element: <ClientOrdersPage /> },
              { path: 'account', element: <ClientAccountPage /> },
              { path: 'establishments/:partnerId', element: <ClientEstablishmentPage /> },
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
              { index: true, element: <PartnerHomePage /> },
              // Onboarding sits inside the role guard so only authenticated
              // partner profiles can reach it; the home page itself decides
              // whether to redirect a brand-new partner here.
              { path: 'onboarding', element: <PartnerOnboardingPage /> },
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
              { index: true, element: <CourierHomePage /> },
              { path: 'onboarding', element: <CourierOnboardingPage /> },
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
              { index: true, element: <AdminHomePage /> },
            ],
          },
        ],
      },
    ],
  },
]);
