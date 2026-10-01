// HTTP tests use the real PostgreSQL functions with a disposable PGlite database.
// Only the Supabase transport is replaced; no deployed accounts are touched.
import {mock} from 'node:test';
import type {PGlite} from '@electric-sql/pglite';
import {db, DatabaseError} from '../src/server/db.ts';
import {LicenseError, type LicenseStore} from '../src/server/license-api.ts';

export function mockAccountDatabase(pg: PGlite, store: LicenseStore) {
  const camel=(row: any): any=>row && Object.fromEntries(Object.entries(row).map(([key,value])=>[key.replace(/_([a-z])/g,(_,ch)=>ch.toUpperCase()),value]));
  const safe=(row: any)=>{const {passwordHash,...user}=camel(row);return user;};
  const rows=async (sql: string,args: any[]=[])=>{
    try {return (await pg.query<any>(sql,args)).rows;}
    catch(error: any) {throw new DatabaseError(error.message,error.code);}
  };
  const one=async (sql: string,args: any[]=[])=>camel((await rows(sql,args))[0] || null);
  const rpc=async (name: string,args: Record<string,unknown>)=>{
    try {return await store.rpc(name,args);}
    catch(error: any) {throw new DatabaseError(error.message,error instanceof LicenseError?'P0001':error.code);}
  };
  const mocks=[
    mock.method(db,'findUserById',async (id: string)=>one('SELECT * FROM qbot_users WHERE id=$1',[id])),
    mock.method(db,'findUserByEmail',async (email: string)=>one('SELECT * FROM qbot_users WHERE email=$1',[email.trim().toLowerCase()])),
    mock.method(db,'getAllUsers',async ()=> (await rows('SELECT * FROM qbot_users')).map(safe)),
    mock.method(db,'createUser',async (data: any)=>safe(await rpc('qbot_register_user',{p_email:data.email,p_password_hash:data.passwordHash,p_name:data.name || 'Test user'}))),
    mock.method(db,'getSubscription',async (id: string)=>one('SELECT * FROM qbot_subscriptions WHERE user_id=$1',[id])),
    mock.method(db,'findSubscriptionById',async (id: string)=>one('SELECT * FROM qbot_subscriptions WHERE id=$1 OR user_id=$1',[id])),
    mock.method(db,'updateSubscription',async (id: string,updates: any)=>{
      const allowed: Record<string,string>={status:'status',currentPeriodEnd:'current_period_end',currentPeriodStart:'current_period_start',cancelAtPeriodEnd:'cancel_at_period_end',planId:'plan_id'};
      const entries=Object.entries(updates).filter(([key])=>allowed[key]);
      return one(`UPDATE qbot_subscriptions SET ${entries.map(([key],i)=>allowed[key]+'=$'+(i+2)).join(',')} WHERE user_id=$1 RETURNING *`,[id,...entries.map(([,value])=>value)]);
    }),
    mock.method(db,'getDevicesByUser',async (id: string)=>(await rows("SELECT * FROM qbot_devices WHERE user_id=$1 AND status<>'revoked'",[id])).map(camel)),
    mock.method(db,'submitManualPayment',async (data: any)=>one(`INSERT INTO qbot_manual_payments(order_id,user_id,email,plan_id,amount,utr_number,notes)
      VALUES($1,(SELECT id FROM qbot_users WHERE email=$2),$2,$3,$4,$5,$6) RETURNING *`,
      [data.orderId || 'http-order',data.email.trim().toLowerCase(),data.planId,data.amount,data.utrNumber,data.notes || null])),
    mock.method(db,'verifyManualPayment',async (id: string,admin: string)=>{
      const data=await rpc('qbot_approve_payment',{p_payment_id:id,p_admin_id:admin});
      return {success:true,payment:camel(data.payment),user:camel(data.user),alreadyVerified:data.alreadyVerified};
    }),
    mock.method(db,'grantPromo',async (id: string,days: number,admin: string)=>camel(await rpc('qbot_grant_promo',{p_user_id:id,p_days:days,p_admin_id:admin}))),
    mock.method(db,'revokeDevice',async (id: string,actor: string)=>rpc('qbot_revoke_device',{p_device_id:id,p_actor_id:actor})),
    mock.method(db,'logAudit',async (id: string|undefined,action: string,details: string)=>one('INSERT INTO qbot_audit_logs(user_id,action,details) VALUES($1,$2,$3) RETURNING *',[id,action,details])),
    mock.method(db,'getAuditLogs',async ()=>(await rows('SELECT *,created_at timestamp FROM qbot_audit_logs ORDER BY created_at DESC')).map(camel)),
    mock.method(db,'getSupportNotes',async (id: string)=>(await rows('SELECT * FROM qbot_support_notes WHERE user_id=$1',[id])).map(camel)),
    mock.method(db,'addSupportNote',async (id: string,author: string,content: string)=>one('INSERT INTO qbot_support_notes(user_id,author,content) VALUES($1,$2,$3) RETURNING *',[id,author,content]))
  ];
  return ()=>mocks.forEach(method=>method.mock.restore());
}
