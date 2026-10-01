import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

let client: SupabaseClient | null = null;
export const getSupabaseConfig = () => ({url:process.env.SUPABASE_URL || '',key:process.env.SUPABASE_SERVICE_ROLE_KEY || ''});
export function getSupabaseClient(): SupabaseClient | null {
  const {url,key}=getSupabaseConfig();
  if (!url || !key) return null;
  if (!client) client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  return client;
}
export async function testSupabaseConnection() {
  const connection=getSupabaseClient();
  if (!connection) return {connected:false,message:'Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY on Render.'};
  const {error}=await connection.from('qbot_users').select('id').limit(1);
  return {connected:!error,message:error ? 'Run migrations/002_device_licensing.sql and verify the service-role credentials.' : 'Persistent licensing database connected.'};
}
export async function generateSupabaseSQL(): Promise<string> {
  const migrations = await Promise.all([
    '004_license_keys_plain_and_hash.sql',
    '002_device_licensing.sql',
    '003_license_admin_workflow.sql'
  ].map(file => readFile(path.join(process.cwd(), 'migrations', file), 'utf8')));
  return migrations.join('\n\n');
}
