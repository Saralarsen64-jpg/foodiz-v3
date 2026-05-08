import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../components/auth/AuthProvider';
import { GuardNotice } from '../components/ui/GuardNotice';

export function RoleGuard({ allowedRoles = [] }) {
  const { isSupabaseConfigured, loading, profile } = useAuth();

  if (!isSupabaseConfigured) {
    return (
      <>
        <GuardNotice
          title="RoleGuard prêt"
          description="Le contrôle de rôle est en place. Sans clés Supabase locales, l’interface reste navigable pour revue visuelle et structurelle."
        />
        <Outlet />
      </>
    );
  }

  if (loading) {
    return <GuardNotice title="Chargement" description="Lecture du rôle utilisateur en cours." />;
  }

  if (!profile?.role || !allowedRoles.includes(profile.role)) {
    return <Navigate replace to="/auth" />;
  }

  return <Outlet />;
}
