import { supabase } from './supabase';
import { Linking } from 'react-native';

function mapAuthErrorMessage(message: string): string {
  if (/rate limit exceeded/i.test(message)) {
    return 'Too many requests. Please wait a minute before trying again.';
  }
  return message;
}

export async function signInWithPassword(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(mapAuthErrorMessage(error.message || 'Could not sign in.'));
}

export async function signUpWithEmail(email: string, password: string, fullName: string, phone?: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: 'campuscart://auth/callback',
      data: { full_name: fullName, phone: phone || null },
    },
  });

  if (error) throw new Error(mapAuthErrorMessage(error.message || 'Could not create account.'));
  return data;
}

export async function sendPasswordResetEmail(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw new Error(mapAuthErrorMessage(error.message || 'Could not send reset email.'));
}

export async function signInWithGoogle() {
  const redirectTo = 'campuscart://auth/callback';
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (error) throw new Error(mapAuthErrorMessage(error.message || 'Could not continue with Google.'));
  if (!data?.url) throw new Error('Could not start Google sign-in.');

  await Linking.openURL(data.url);
}
