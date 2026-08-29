import { Redirect } from 'expo-router';
import { useAuth } from '../src/store/AppContext';

// ─────────────────────────────────────────────────────────────
//  Root index — redirect based on auth state
// ─────────────────────────────────────────────────────────────

export default function Index() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated
    ? <Redirect href="/(app)/home" />
    : <Redirect href="/(auth)/splash" />;
}
