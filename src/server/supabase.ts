import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

let client: SupabaseClient | null = null;
export const getSupabaseConfig = () => ({
  url: process.env.SUPABASE_URL || '',
  key: process.env.SUPABASE_SERVICE_ROLE_KEY || ''
});

export function getSupabaseClient(): SupabaseClient | null {
  const { url, key } = getSupabaseConfig();
  if (!url || !key) return null;
  if (!client) client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}

export async function testSupabaseConnection() {
  const connection = getSupabaseClient();
  if (!connection) return { connected: false, message: 'Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY on Render or in .env.' };
  const { error } = await connection.from('users').select('id').limit(1);
  return {
    connected: !error,
    message: error ? 'Run the cleanup migration SQL in Supabase SQL Editor.' : 'Persistent database connected.'
  };
}

export async function generateSupabaseSQL(): Promise<string> {
  const file = await readFile(path.join(process.cwd(), 'migrations', '005_unified_schema_and_cleanup.sql'), 'utf8');
  return file;
}
