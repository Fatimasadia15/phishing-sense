// ─────────────────────────────────────────────────────────────
//  Auth Context — Real Supabase Auth (email/password + OAuth)
//
//  Handles session persistence, token refresh, Google/Facebook
//  sign-in via expo-auth-session / expo-web-browser, and creates
//  a profiles row for every new user.
// ─────────────────────────────────────────────────────────────

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { makeRedirectUri } from 'expo-auth-session';
import { openAuthSessionAsync } from 'expo-web-browser';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';

// ── Types ────────────────────────────────────────────────────

export interface AuthUser {
  id:      string;
  name:    string;
  email:   string;
  avatar?: string | null;
}

interface AuthContextValue {
  user:            AuthUser | null;
  session:         Session | null;
  isAuthenticated: boolean;
  isLoading:       boolean;
  authError:       string | null;
  clearAuthError:  () => void;
  login:           (email: string, password: string) => Promise<void>;
  signup:          (name: string, email: string, password: string) => Promise<void>;
  logout:          () => Promise<void>;
  sendResetEmail:  (email: string) => Promise<void>;
  signInWithOAuth: (provider: 'google') => Promise<void>;
}

// ── Helpers ──────────────────────────────────────────────────

function mapUser(user: User | null): AuthUser | null {
  if (!user) return null;
  const meta = (user.user_metadata as Record<string, unknown>) || {};
  const name =
    (typeof meta.full_name === 'string' && meta.full_name) ||
    (typeof meta.name === 'string' && meta.name) ||
    user.email?.split('@')[0] ||
    'User';
  return {
    id:      user.id,
    email:   user.email || '',
    name,
    avatar:  (typeof meta.avatar_url === 'string' && meta.avatar_url) || null,
  };
}

async function ensureProfile(user: User) {
  const mapped = mapUser(user);
  if (!mapped) return;

  const { error } = await supabase.from('profiles').upsert(
    {
      id:         user.id,
      name:       mapped.name,
      avatar_url: mapped.avatar,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );

  if (error) {
    console.warn('[auth] Could not ensure profile:', error.message);
  }
}

// ── Context ──────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]         = useState<AuthUser | null>(null);
  const [session, setSession]   = useState<Session | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const clearAuthError = useCallback(() => setAuthError(null), []);
  const processedCodesRef = useRef<Set<string>>(new Set());

  const handleAuthUrl = useCallback(async (rawUrl: string) => {
    if (!rawUrl) return;

    const hasCode = rawUrl.includes('code=');
    const hasAccessToken = rawUrl.includes('access_token=');
    const hasError = rawUrl.includes('error=');

    if (!hasCode && !hasAccessToken && !hasError) return;

    setLoading(true);
    setAuthError(null);

    try {
      if (hasError) {
        let errorMsg = 'Authentication was cancelled or failed.';
        try {
          const parsed = Linking.parse(rawUrl);
          errorMsg = (parsed.queryParams?.error_description as string) ||
                     (parsed.queryParams?.error as string) ||
                     errorMsg;
        } catch {}
        setAuthError(errorMsg);
        return;
      }

      if (hasCode) {
        let code: string | undefined;
        try {
          const parsed = Linking.parse(rawUrl);
          code = parsed.queryParams?.code as string | undefined;
        } catch {}

        if (!code) {
          const match = rawUrl.match(/[?&]code=([^&#]+)/);
          if (match) code = decodeURIComponent(match[1]);
        }

        if (code) {
          if (processedCodesRef.current.has(code)) {
            return;
          }
          processedCodesRef.current.add(code);

          const { data: exchangeData, error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) throw exchangeError;

          if (exchangeData?.session) {
            if (exchangeData.user) {
              ensureProfile(exchangeData.user).catch(() => {});
            }
            setSession(exchangeData.session);
            setUser(mapUser(exchangeData.user));
            router.replace('/(app)/home');
            return;
          }
        }
      }

      if (hasAccessToken) {
        let hash = '';
        if (rawUrl.includes('#')) {
          hash = rawUrl.split('#')[1];
        } else if (rawUrl.includes('?')) {
          hash = rawUrl.split('?')[1];
        }

        const params = new URLSearchParams(hash);
        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');

        if (access_token && refresh_token) {
          const tokenKey = access_token.slice(0, 10);
          if (processedCodesRef.current.has(tokenKey)) return;
          processedCodesRef.current.add(tokenKey);

          const { data: sessionData, error: sessionError } =
            await supabase.auth.setSession({ access_token, refresh_token });

          if (sessionError) throw sessionError;

          if (sessionData?.session) {
            if (sessionData.user) {
              ensureProfile(sessionData.user).catch(() => {});
            }
            setSession(sessionData.session);
            setUser(mapUser(sessionData.user));
            router.replace('/(app)/home');
            return;
          }
        }
      }
    } catch (err: any) {
      console.warn('[auth] Failed to process auth URL:', err);
      setAuthError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Rehydrate session on launch and handle deep links / OAuth redirects.
  useEffect(() => {
    let mounted = true;

    const hasOAuthParams = Platform.OS === 'web' &&
      typeof window !== 'undefined' &&
      (window.location.search.includes('code=') || window.location.hash.includes('access_token='));

    // 1. Initial session restore
    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;
      if (error) {
        console.warn('[auth] Session restore failed:', error.message);
      }
      if (data.session) {
        setSession(data.session);
        setUser(mapUser(data.session?.user ?? null));
        setLoading(false);
      } else if (!hasOAuthParams) {
        setLoading(false);
      }
    });

    // 2. Cold launch deep link
    Linking.getInitialURL().then((initialUrl) => {
      if (!mounted || !initialUrl) return;
      handleAuthUrl(initialUrl);
    });

    // 3. Web URL check on initial load
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (window.location.search.includes('code=') || window.location.hash.includes('access_token=')) {
        handleAuthUrl(window.location.href);
      }
    }

    // 4. Warm launch deep link listener (Android/iOS foregrounded via custom scheme)
    const urlSub = Linking.addEventListener('url', (event) => {
      if (!mounted || !event.url) return;
      handleAuthUrl(event.url);
    });

    // 5. Supabase Auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        if (!mounted) return;
        setSession(newSession);
        setUser(mapUser(newSession?.user ?? null));
        if (newSession?.user) {
          ensureProfile(newSession.user).catch(() => {});
        }
        setLoading(false);
        if (event === 'SIGNED_IN' && newSession) {
          router.replace('/(app)/home');
        }
      }
    );

    return () => {
      mounted = false;
      urlSub.remove();
      authListener.subscription.unsubscribe();
    };
  }, [handleAuthUrl]);

  const login = useCallback(async (email: string, password: string) => {
    setAuthError(null);
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      setSession(data.session);
      setUser(mapUser(data.user));
    } catch (err: any) {
      setAuthError(err.message || 'Sign in failed. Please check your credentials.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string) => {
    setAuthError(null);
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { full_name: name.trim() },
        },
      });
      if (error) throw error;

      if (data.user) {
        // Merge the name we just sent into the metadata so mapUser works.
        const userWithMeta = {
          ...data.user,
          user_metadata: { ...data.user.user_metadata, full_name: name.trim() },
        };
        await ensureProfile(userWithMeta as User);
      }

      if (!data.session) {
        setAuthError('Please check your email and confirm your account before signing in.');
      } else {
        setSession(data.session);
        setUser(mapUser(data.user));
      }
    } catch (err: any) {
      setAuthError(err.message || 'Could not create account. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setAuthError(null);
    setLoading(true);
    try {
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const sendResetEmail = useCallback(async (email: string) => {
    setAuthError(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: 'phishingsense://reset-password',
      });
      if (error) throw error;
    } catch (err: any) {
      setAuthError(err.message || 'Could not send reset email. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const signInWithOAuth = useCallback(async (provider: 'google') => {
    setAuthError(null);
    setLoading(true);
    try {
      if (Platform.OS === 'web') {
        const redirectTo = typeof window !== 'undefined' ? window.location.origin : undefined;
        const { error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo,
            queryParams: { prompt: 'select_account' },
          },
        });
        if (error) throw error;
        return;
      }

      const redirectTo = makeRedirectUri({ scheme: 'phishingsense' });
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          skipBrowserRedirect: true,
          queryParams: { prompt: 'select_account' },
        },
      });
      if (error) throw error;
      if (!data?.url) throw new Error('No OAuth URL returned from Supabase.');

      const result = await openAuthSessionAsync(data.url, redirectTo);

      if (result.type === 'success' && result.url) {
        await handleAuthUrl(result.url);
      }
    } catch (err: any) {
      setAuthError(err.message || `${provider} sign in failed. Please try again.`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleAuthUrl]);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAuthenticated: !!user,
        isLoading,
        authError,
        clearAuthError,
        login,
        signup,
        logout,
        sendResetEmail,
        signInWithOAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
