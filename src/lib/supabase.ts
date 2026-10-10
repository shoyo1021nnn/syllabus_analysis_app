import { createClient } from '@supabase/supabase-js';

// URLの末尾の /rest/v1 や 余分なスラッシュを自動除去して正規化
const rawUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();

// URLが有効な形式かどうか判定
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseUrl.startsWith('http') &&
  supabaseAnonKey &&
  supabaseAnonKey.length > 10
);

// 未設定時でも createClient が例外をスローしてアプリ全体がクラッシュするのを防ぐフォールバック
export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://placeholder-project.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey : 'placeholder-anon-key'
);
