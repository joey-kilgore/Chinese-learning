import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { Session, User } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import { supabase } from '../services/supabase';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Supabase can redirect with tokens in query string (?code=) or fragment (#access_token=)
// depending on whether PKCE or implicit flow is used. Parse both.
function parseUrlParams(url: string): Record<string, string> {
  const [, rest] = url.split(/[?#]/);
  if (!rest) return {};
  return Object.fromEntries(new URLSearchParams(rest).entries());
}

async function handleAuthCallback(url: string) {
  const params = parseUrlParams(url);

  const code = params.code;
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) Alert.alert('Sign-in error', error.message);
    return;
  }

  const access_token = params.access_token;
  const refresh_token = params.refresh_token;
  if (access_token) {
    const { error } = await supabase.auth.setSession({ access_token, refresh_token: refresh_token ?? '' });
    if (error) Alert.alert('Sign-in error', error.message);
    return;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    // Primary: catch redirect when openAuthSessionAsync misses it (Android fragment flow)
    const linkingSub = Linking.addEventListener('url', ({ url }) => {
      if (url.includes('auth/callback') || url.includes('access_token=') || url.includes('code=')) {
        WebBrowser.dismissBrowser();
        handleAuthCallback(url);
      }
    });

    // Fallback: handle redirect if app was cold-started via deep link
    Linking.getInitialURL().then((url) => {
      if (url && (url.includes('auth/callback') || url.includes('code='))) {
        handleAuthCallback(url);
      }
    });

    return () => {
      subscription.unsubscribe();
      linkingSub.remove();
    };
  }, []);

  async function signInWithEmail(email: string, password: string) {
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (!signInError) return;

    // If credentials are wrong (not "user not found"), surface the error
    if (!signInError.message.toLowerCase().includes('invalid login credentials')) {
      Alert.alert('Sign-in error', signInError.message);
      return;
    }

    // First time — create the account automatically
    const { error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError) Alert.alert('Sign-up error', signUpError.message);
  }

  async function signInWithGoogle() {
    const redirectUrl = Platform.OS === 'web'
      // On web (Vercel), redirect back to the live site's origin.
      // Supabase will detect the ?code= automatically via detectSessionInUrl: true.
      ? `${window.location.origin}/auth/callback`
      // On native, use a deep link (Expo Go or production scheme).
      : Linking.createURL('auth/callback');

    if (Platform.OS === 'web') {
      // Use skipBrowserRedirect so Supabase gives us the URL without opening anything.
      // We then redirect the current tab ourselves — this prevents Supabase from opening
      // a new window/tab on some versions of the JS client.
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: redirectUrl, skipBrowserRedirect: true },
      });
      if (error) { Alert.alert('Sign-in error', error.message); return; }
      if (!data.url) { Alert.alert('Sign-in error', 'No OAuth URL returned from Supabase.'); return; }
      window.location.href = data.url; // same-tab redirect — no popup
      return;
    }

    // Native: open an in-app browser session and handle the deep-link callback.
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: redirectUrl, skipBrowserRedirect: true },
    });

    if (error) { Alert.alert('Sign-in error', error.message); return; }
    if (!data.url) { Alert.alert('Sign-in error', 'No OAuth URL returned from Supabase.'); return; }

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

    // If openAuthSessionAsync caught the redirect directly, handle it here.
    // Otherwise the Linking listener above will handle it.
    if (result.type === 'success') {
      await handleAuthCallback(result.url);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{ user: session?.user ?? null, session, loading, signInWithEmail, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
