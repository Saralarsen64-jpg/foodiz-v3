import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../components/auth/AuthProvider';
import { GuardNotice } from '../components/ui/GuardNotice';

export function ProtectedRoute() {
  const { isSupabaseConfigured, loading, session } = useAuth();
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
    return <GuardNotice title="Chargement" description="Vérification de la session en cours." />;
  }

  if (!session) {
    return <Navigate replace state={{ from: location }} to="/auth" />;
  }

  return <Outlet />;
}
