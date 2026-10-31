import { createClient } from '@supabase/supabase-js';
import config from '../data/auth-config.json';
import { isPublicAuthKey } from './auth-policy.mjs';

let client;
export function getAuthClient() {
  if (!config.url || !isPublicAuthKey(config.publishableKey)) return null;
  if (!client) client = createClient(config.url, config.publishableKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      storageKey: 'sherlynda-admin-auth',
    },
  });
  return client;
}
