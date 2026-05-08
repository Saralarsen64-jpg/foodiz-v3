import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './components/auth/AuthProvider';
import { router } from './routes';

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
