import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../components/auth/AuthProvider';
import { GuardNotice } from '../components/ui/GuardNotice';

export function ProtectedRoute() {
  const { isSupabaseConfigured, loading, session, profilePending } = useAuth();
  const location = useLocation();

  if (!isSupabaseConfigured) {
    return (
      <>
        <GuardNotice
          title="Accès protégé prêt"
          description="Supabase n’est pas encore configuré localement. Les routes protégées restent visibles pour vérifier la structure frontend Foodiz."
        />
        <Outlet />
      </>
    );
  }

  if (loading) {
    return <GuardNotice title="Chargement" description="Vérification sécurisée de la session Foodiz en cours." />;
  }

  if (!session) {
    return <Navigate replace state={{ from: location }} to="/auth" />;
  }

  if (profilePending) {
    return (
      <GuardNotice
        title="Votre profil est en cours de préparation"
        description="Votre compte existe bien, mais votre profil applicatif Foodiz n’est pas encore disponible. Réessayez dans quelques instants."
      />
    );
  }

  return <Outlet />;
}
