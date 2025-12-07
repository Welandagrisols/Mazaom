import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const supabaseUrl = process.env.SUPABASE_URL || Constants.expoConfig?.extra?.supabaseUrl || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || Constants.expoConfig?.extra?.supabaseAnonKey || '';

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
};
