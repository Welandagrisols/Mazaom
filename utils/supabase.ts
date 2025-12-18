import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// Try to get from multiple sources for flexibility
const getSupabaseUrl = (): string => {
  // First try process.env (works in Node/server context)
  if (process.env.SUPABASE_URL && !process.env.SUPABASE_URL.startsWith('$')) {
    return process.env.SUPABASE_URL;
  }
  // Then try app.json extra (works in Expo)
  if (Constants.expoConfig?.extra?.supabaseUrl && !Constants.expoConfig.extra.supabaseUrl.startsWith('$')) {
    return Constants.expoConfig.extra.supabaseUrl;
  }
  // Then try window global (for web)
  if (typeof window !== 'undefined' && (window as any).__SUPABASE_URL__) {
    return (window as any).__SUPABASE_URL__;
  }
  return '';
};

const getSupabaseKey = (): string => {
  // First try process.env (works in Node/server context)
  if (process.env.SUPABASE_ANON_KEY && !process.env.SUPABASE_ANON_KEY.startsWith('$')) {
    return process.env.SUPABASE_ANON_KEY;
  }
  // Then try app.json extra (works in Expo)
  if (Constants.expoConfig?.extra?.supabaseAnonKey && !Constants.expoConfig.extra.supabaseAnonKey.startsWith('$')) {
    return Constants.expoConfig.extra.supabaseAnonKey;
  }
  // Then try window global (for web)
  if (typeof window !== 'undefined' && (window as any).__SUPABASE_ANON_KEY__) {
    return (window as any).__SUPABASE_ANON_KEY__;
  }
  return '';
};

const supabaseUrl = getSupabaseUrl();
const supabaseAnonKey = getSupabaseKey();

let _supabase: SupabaseClient | null = null;

const isValidUrl = (url: string): boolean => {
  try {
    if (!url || url.startsWith('$')) return false;
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const isSupabaseConfigured = (): boolean => {
  return isValidUrl(supabaseUrl) && Boolean(supabaseAnonKey) && !supabaseAnonKey.startsWith('$');
};

export const getSupabase = (): SupabaseClient | null => {
  if (!isSupabaseConfigured()) {
    return null;
  }
  
  if (!_supabase) {
    _supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  
  return _supabase;
};

export const supabase = {
  from: (table: string) => {
    const client = getSupabase();
    if (!client) {
      return {
        select: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
        insert: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
        update: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
        upsert: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
        delete: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
      };
    }
    return client.from(table);
  },
  storage: {
    from: (bucket: string) => {
      const client = getSupabase();
      if (!client) {
        return {
          upload: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
          getPublicUrl: () => ({ data: { publicUrl: '' } }),
          remove: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
          list: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
        };
      }
      return client.storage.from(bucket);
    },
  },
};

export const getSupabaseConfigUrl = (): string => supabaseUrl;
