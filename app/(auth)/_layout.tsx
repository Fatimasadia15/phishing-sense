import { Stack, Redirect } from 'expo-router';
import { useAuth } from '../../src/store/AuthContext';

export default function AuthLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (!isLoading && isAuthenticated) {
    return <Redirect href="/(app)/home" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown:     false,
        animation:       'fade',
        gestureEnabled:  false,
      }}
    />
  );
}
