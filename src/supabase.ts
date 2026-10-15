import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface SupabaseConfig {
  url: string;
  key: string;
  isConfigured: boolean;
}

export const getSupabaseConfig = (): SupabaseConfig => {
  const metaEnv = (import.meta as any).env || {};
  const envUrl = metaEnv.VITE_SUPABASE_URL as string | undefined;
  const envKey = metaEnv.VITE_SUPABASE_ANON_KEY as string | undefined;
  const localUrl = localStorage.getItem('runplanner_supabase_url');
  const localKey = localStorage.getItem('runplanner_supabase_key');

  const url = (envUrl && envUrl.trim() !== '') ? envUrl.trim() : (localUrl || '').trim();
  const key = (envKey && envKey.trim() !== '') ? envKey.trim() : (localKey || '').trim();

  return {
    url,
    key,
    isConfigured: Boolean(url && key && url.startsWith('http'))
  };
};

export const saveSupabaseConfig = (url: string, key: string) => {
  if (url && key) {
    localStorage.setItem('runplanner_supabase_url', url.trim());
    localStorage.setItem('runplanner_supabase_key', key.trim());
  } else {
    localStorage.removeItem('runplanner_supabase_url');
    localStorage.removeItem('runplanner_supabase_key');
  }
};

let cachedClient: SupabaseClient | null = null;
let lastUrl = '';
let lastKey = '';

export const getSupabaseClient = (): SupabaseClient | null => {
  const { url, key, isConfigured } = getSupabaseConfig();
  if (!isConfigured) return null;

  if (cachedClient && lastUrl === url && lastKey === key) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, key, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
    lastUrl = url;
    lastKey = key;
    return cachedClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
};
