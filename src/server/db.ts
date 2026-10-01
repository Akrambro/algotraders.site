import crypto from 'node:crypto';
import { getSupabaseClient } from './supabase.ts';
import type { User, Subscription, Device, PaymentTransaction, AdminMetrics } from '../types.ts';
import {getSubscriptionStatus, hasActiveSubscription} from '../subscriptions.ts';

export class DatabaseError extends Error {
  constructor(message: string, public code?: string) { super(message); }
}

// Database errors never fall back to demo customers or active subscriptions.
export function database() {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase service-role credentials are required.');
  return client;
}
export async function result<T = any>(query: PromiseLike<{ data: T; error: null } | { data: null; error: {message: string; code?: string} }>): Promise<T> {
  const {data,error}=await query;
  if (error) throw new DatabaseError(error.message || 'Database operation failed', error.code);
  return data;
}
const camel = (row: any): any => row && Object.fromEntries(Object.entries(row).map(([key,value])=>[key.replace(/_([a-z])/g,(_,ch)=>ch.toUpperCase()),value]));
const snake = (row: any) => Object.fromEntries(Object.entries(row).filter(([,v])=>v!==undefined).map(([key,value])=>[key.replace(/[A-Z]/g,ch=>'_'+ch.toLowerCase()),value]));
const safeUser = (row: any) => { const {passwordHash,...user}=camel(row); return user; };
const list = async (table: string) => (await result<any[]>(database().from(table).select('*'))).map(camel);
const audit = (row: any) => ({...camel(row),timestamp:row.created_at});

export const db = {
  async findUserByEmail(email: string): Promise<(User & {passwordHash?: string}) | null> {
    return camel(await result(database().from('qbot_users').select('*').eq('email',email.trim().toLowerCase()).maybeSingle()));
  },
  async findUserById(id: string): Promise<(User & {passwordHash?: string}) | null> {
    return camel(await result(database().from('qbot_users').select('*').eq('id',id).maybeSingle()));
  },
  async createUser(data: {email: string; passwordHash: string; name?: string}) {
    return safeUser(await result(database().rpc('qbot_register_user',{p_email:data.email,p_password_hash:data.passwordHash,p_name:data.name || data.email.split('@')[0]})));
  },
  async updateUser(id: string,updates: any) {
    const allowed=Object.fromEntries(['name','passwordHash','isVerified','twoFactorEnabled'].filter(key=>updates[key]!==undefined).map(key=>[key,updates[key]]));
    return camel(await result(database().from('qbot_users').update({...snake(allowed),updated_at:new Date().toISOString()}).eq('id',id).select().maybeSingle()));
  },
  async deleteUser(id: string) { await result(database().from('qbot_users').delete().eq('id',id)); return true; },
  async getAllUsers(): Promise<User[]> { return (await result<any[]>(database().from('qbot_users').select('*').order('created_at',{ascending:false}))).map(safeUser); },
  async getSubscription(userId: string): Promise<Subscription | null> { return camel(await result(database().from('qbot_subscriptions').select('*').eq('user_id',userId).maybeSingle())); },
  async getAllSubscriptions(): Promise<Subscription[]> { return list('qbot_subscriptions'); },
  async findSubscriptionById(id: string): Promise<Subscription | null> {
    const found=await result(database().from('qbot_subscriptions').select('*').eq('id',id).maybeSingle());
    return found ? camel(found) : this.getSubscription(id);
  },
  async updateSubscription(userId: string,updates: Partial<Subscription>): Promise<Subscription> {
    const allowed=Object.fromEntries(['planId','status','currentPeriodStart','currentPeriodEnd','cancelAtPeriodEnd','maxDevices'].filter(key=>(updates as any)[key]!==undefined).map(key=>[key,(updates as any)[key]]));
    return camel(await result(database().from('qbot_subscriptions').update({...snake(allowed),updated_at:new Date().toISOString()}).eq('user_id',userId).select().single()));
  },
  async activateSubscription(id: string) {
    const sub=await this.findSubscriptionById(id);
    if (!sub) return null;
    if (!hasActiveSubscription({...sub,status:'active'})) throw new DatabaseError('Approve a renewal payment before activating an expired or future subscription.','P0001');
    return this.updateSubscription(sub.userId,{status:'active'});
  },
  async suspendSubscription(id: string) { const sub=await this.findSubscriptionById(id); return sub ? this.updateSubscription(sub.userId,{status:'suspended'}) : null; },
  async submitManualPayment(data: {orderId?: string; userId?: string; email: string; planId: string; amount: number; utrNumber: string; notes?: string}) {
    const customer=await this.findUserByEmail(data.email);
    return camel(await result(database().from('qbot_manual_payments').insert({order_id:data.orderId || crypto.randomUUID(),user_id:customer?.id || null,email:data.email.toLowerCase().trim(),plan_id:data.planId,amount:data.amount,utr_number:data.utrNumber.trim(),notes:data.notes?.slice(0,1000)}).select().single()));
  },
  async getAllManualPayments() { return (await result<any[]>(database().from('qbot_manual_payments').select('*').order('created_at',{ascending:false}))).map(camel); },
  async verifyManualPayment(paymentId: string,adminId: string) {
    const data=await result(database().rpc('qbot_approve_payment',{p_payment_id:paymentId,p_admin_id:adminId}));
    return {success:true,payment:camel(data.payment),user:camel(data.user),alreadyVerified:data.alreadyVerified};
  },
  async grantPromo(userId: string,days: number,adminId: string): Promise<Subscription> {
    return camel(await result(database().rpc('qbot_grant_promo',{p_user_id:userId,p_days:days,p_admin_id:adminId})));
  },
  async recordPaymentTransaction(data: Omit<PaymentTransaction,'id'|'createdAt'>) { return camel(await result(database().from('qbot_payment_transactions').insert(snake(data)).select().single())); },
  async getAllPaymentTransactions(): Promise<PaymentTransaction[]> { return list('qbot_payment_transactions'); },
  async getPaymentTransactionsByUser(userId: string): Promise<PaymentTransaction[]> { return (await result<any[]>(database().from('qbot_payment_transactions').select('*').eq('user_id',userId))).map(camel); },
  async getDevicesByUser(userId: string): Promise<Device[]> { return (await result<any[]>(database().from('qbot_devices').select('*').eq('user_id',userId).neq('status','revoked'))).map(row=>({...camel(row),hardwareFingerprint:row.machine_hash})); },
  async getAllActiveDevices(): Promise<Device[]> { return (await result<any[]>(database().from('qbot_devices').select('*').neq('status','revoked'))).map(row=>({...camel(row),hardwareFingerprint:row.machine_hash})); },
  async createPairingCode(_userId: string,_deviceType?: string): Promise<any> { throw new Error('Enter the seller-issued license key in the Windows bot. Website pairing codes have been retired.'); },
  async verifyAndConsumePairingCode(_code: string,_name: string,_fingerprint?: string,_ip?: string): Promise<Device | null> { throw new Error('Update QBot2 and activate using your license key.'); },
  async revokeDevice(deviceId: string,actorId: string) {
    return result<boolean>(database().rpc('qbot_revoke_device',{p_device_id:deviceId,p_actor_id:actorId}));
  },
  async isWebhookEventProcessed(eventId: string) { return Boolean(await result(database().from('qbot_webhook_events').select('id').eq('event_id',eventId).maybeSingle())); },
  async logWebhookEvent(eventId: string,eventType: string,status: string,summary: string,payload?: any) { return result(database().from('qbot_webhook_events').upsert({event_id:eventId,event_type:eventType,status,summary,payload},{onConflict:'event_id'})); },
  async getRecentWebhookEvents(limit=30) { return (await result<any[]>(database().from('qbot_webhook_events').select('*').order('processed_at',{ascending:false}).limit(limit))).map(camel); },
  async logAudit(userId: string|undefined,action: string,details: string,ipAddress?: string) { return audit(await result(database().from('qbot_audit_logs').insert({user_id:userId,action,details,ip_address:ipAddress}).select().single())); },
  async getAuditLogs(limit=50) { return (await result<any[]>(database().from('qbot_audit_logs').select('*').order('created_at',{ascending:false}).limit(limit))).map(audit); },
  async getSupportNotes(userId: string) { return (await result<any[]>(database().from('qbot_support_notes').select('*').eq('user_id',userId).order('created_at'))).map(camel); },
  async addSupportNote(userId: string,author: string,content: string) { return camel(await result(database().from('qbot_support_notes').insert({user_id:userId,author,content}).select().single())); },
  async getAdminMetrics(): Promise<AdminMetrics> {
    const [users,subs,devices,licenses]=await Promise.all([this.getAllUsers(),this.getAllSubscriptions(),this.getAllActiveDevices(),
      result<any[]>(database().from('qbot_licenses').select('id,user_id,device_id,expires_at').eq('status','active'))]);
    const now=Date.now();
    const customers=new Set(users.filter(u=>u.role==='customer').map(u=>u.id));
    const active=subs.filter(s=>customers.has(s.userId) && hasActiveSubscription(s,now));
    const entitled=new Set(active.map(s=>s.userId));
    const authorized=licenses.filter(l=>entitled.has(l.user_id) && Date.parse(l.expires_at)>now && devices.some(d=>d.id===l.device_id));
    const activeDeviceIds=new Set(authorized.map(l=>l.device_id));
    return {totalCustomers:customers.size,activeSubscriptions:active.length,
      trialUsers:subs.filter(s=>customers.has(s.userId) && ['pending','trialing'].includes(getSubscriptionStatus(s,now))).length,
      expiredSubscriptions:subs.filter(s=>customers.has(s.userId) && getSubscriptionStatus(s,now)==='expired').length,
      failedPayments:subs.filter(s=>customers.has(s.userId) && ['past_due','unpaid','halted'].includes(s.status)).length,
      mrr:active.reduce((sum,s)=>sum+(s.planId==='annual'?49999/12:4999),0),activeLicenses:authorized.length,
      activeDevicesCount:devices.filter(d=>activeDeviceIds.has(d.id) && d.lastHeartbeatAt && Date.parse(d.lastHeartbeatAt)>now-900000).length};
  },
  async getAllDatabaseTables() {
    const [users,subscriptions,devices,transactions,webhooks,auditLogs]=await Promise.all([this.getAllUsers(),this.getAllSubscriptions(),this.getAllActiveDevices(),this.getAllPaymentTransactions(),this.getRecentWebhookEvents(),this.getAuditLogs()]);
    return {status:{mode:'Supabase PostgreSQL',connected:true,totalUsers:users.length,totalSubscriptions:subscriptions.length,totalDevices:devices.length,totalTransactions:transactions.length,totalWebhooks:webhooks.length},tables:{users,subscriptions,devices,transactions,webhooks,auditLogs}};
  }
};
