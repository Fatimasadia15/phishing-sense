import { Redirect } from 'expo-router';
import { useAuth } from '../src/store/AuthContext';

// ─────────────────────────────────────────────────────────────
//  Root index — redirect based on auth state
// ─────────────────────────────────────────────────────────────

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  return isAuthenticated
    ? <Redirect href="/(app)/home" />
    : <Redirect href="/(auth)/splash" />;
}
