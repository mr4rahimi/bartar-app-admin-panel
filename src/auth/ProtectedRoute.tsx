import type { ReactElement } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';

export default function ProtectedRoute({ children }: { children: ReactElement }) {
  const { token, initializing } = useAuth();
  if (initializing) return <div>در حال بارگذاری...</div>;
  if (!token) return <Navigate to="/login" replace />;
  return children;
}
