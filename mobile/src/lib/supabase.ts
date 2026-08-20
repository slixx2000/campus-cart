import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from './constants';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    // auth-js defaults to 'implicit', which returns tokens in the URL *fragment*
    // (campuscart://auth/callback#access_token=...). The deep-link handler in
    // App.tsx reads `?code=`, and detectSessionInUrl is off, so nothing ever
    // consumed the fragment — Google sign-in silently did nothing. PKCE sends
    // ?code=, which is what that handler already expects.
    flowType: 'pkce',
  },
});
