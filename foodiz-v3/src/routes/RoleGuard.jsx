import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../components/auth/AuthProvider';
import { GuardNotice } from '../components/ui/GuardNotice';

export function RoleGuard({ allowedRoles = [] }) {
  const { isSupabaseConfigured, loading, profile, profilePending, getRoleHomePath } = useAuth();

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
    return <GuardNotice title="Chargement" description="Lecture du rôle utilisateur Foodiz en cours." />;
  }

  if (profilePending) {
    return (
      <GuardNotice
        title="Votre profil est en cours de préparation"
        description="Le routage par rôle sera activé automatiquement dès que votre profil Foodiz sera prêt."
      />
    );
  }

  if (!profile?.role) {
    return <Navigate replace to="/auth" />;
  }

  if (!allowedRoles.includes(profile.role)) {
    return <Navigate replace to={getRoleHomePath(profile.role)} />;
  }

  return <Outlet />;
}
