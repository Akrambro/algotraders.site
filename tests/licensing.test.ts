// All data, signing keys, HTTP servers and PostgreSQL databases are disposable.
// These tests never connect to Supabase, Render, a payment provider or a broker.
import assert from 'node:assert/strict';
import {after, before, beforeEach, test, mock} from 'node:test';
import crypto from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {spawn} from 'node:child_process';
import express from 'express';
import jwt from 'jsonwebtoken';
import {PGlite} from '@electric-sql/pglite';
import {LicenseService, LicenseError, createLicenseRouter, proofMessage, sha256,
  normalizeLicenseKey, LICENSE_ISSUER, LICENSE_AUDIENCE, type LicenseStore} from '../src/server/license-api.ts';
import {authService} from '../src/server/auth.ts';
import {db} from '../src/server/db.ts';
import type {LicenseRecord} from '../src/types.ts';
import {createApp} from '../server.ts';
import {mockAccountDatabase} from './account-database.ts';

const pg = new PGlite();
const signing = crypto.generateKeyPairSync('rsa', {modulusLength: 2048});
const admin = {id: 'test-admin', email: 'admin@example.invalid', role: 'admin'} as any;
const customer = {id: 'test-customer', email: 'customer@example.invalid', name: 'Test Customer', role: 'customer'} as any;
const rpcArguments: Record<string, string[]> = {
  qbot_register_user: ['p_email','p_password_hash','p_name'],
  qbot_approve_payment: ['p_payment_id','p_admin_id'],
  qbot_issue_license: ['p_user_id','p_key_hash','p_key_prefix','p_admin_id'],
  qbot_activate_license: ['p_key_hash','p_device_id','p_machine_hash','p_public_key','p_device_name','p_challenge_id','p_ip'],
  qbot_refresh_license: ['p_license_id','p_device_id','p_machine_hash','p_public_key','p_challenge_id','p_ip'],
  qbot_revoke_license: ['p_license_id','p_admin_id'],
  qbot_revoke_device: ['p_device_id','p_actor_id'],
  qbot_grant_promo: ['p_user_id','p_days','p_admin_id'],
};

const store: LicenseStore = {
  async rpc(name, args) {
    const names = rpcArguments[name];
    assert.ok(names, 'Only known test RPCs may be called');
    try {
      return await pg.transaction(async tx => {
        await tx.exec('SET LOCAL ROLE service_role');
        const result = await tx.query<{value: any}>(`SELECT public.${name}(${names.map((_,i)=>'$'+(i+1)).join(',')}) AS value`, names.map(n=>args[n]));
        return result.rows[0].value;
      });
    } catch (error: any) {
      if (error.code === 'P0001') throw new LicenseError(403, error.message);
      throw error;
    }
  },
  async challenge(deviceId) {
    const result = await pg.query('INSERT INTO qbot_license_challenges(device_id,nonce) VALUES($1,$2) RETURNING *', [deviceId,crypto.randomBytes(32).toString('base64url')]);
    return result.rows[0];
  },
  async getChallenge(id) {
    return (await pg.query('SELECT * FROM qbot_license_challenges WHERE id=$1',[id])).rows[0];
  },
  async list(userId) {
    return (await pg.query<LicenseRecord>(`SELECT l.id,l.user_id,l.subscription_id,l.key_prefix,l.status,l.expires_at,l.device_id,
      l.issued_at,l.activated_at,l.revoked_at,CASE WHEN d.id IS NULL THEN NULL ELSE jsonb_build_object('id',d.id,
      'device_name',d.device_name,'machine_hash',d.machine_hash,'status',d.status,'last_heartbeat_at',d.last_heartbeat_at) END device
      FROM qbot_licenses l LEFT JOIN qbot_devices d ON d.id=l.device_id
      WHERE ($1::text IS NULL OR l.user_id=$1) ORDER BY l.issued_at DESC`,[userId || null])).rows;
  }
};
const service = new LicenseService(store, ()=>signing.privateKey);
const scalar = async (sql: string, args: any[] = []) => Object.values((await pg.query(sql,args)).rows[0] as any)[0] as any;
const issue = () => service.issue(customer.id, admin.id);
const approve = () => store.rpc('qbot_approve_payment',{p_payment_id:'test-payment',p_admin_id:admin.id});
function device() {
  const keys = crypto.generateKeyPairSync('ed25519');
  return {id:crypto.randomUUID(),machine:sha256(crypto.randomBytes(32)),keys,
    publicKey:keys.publicKey.export({format:'der',type:'spki'}).toString('base64')};
}
async function signed(action: 'activate'|'refresh', reference: string, pc = device()) {
  const challenge = await service.createChallenge(pc.id);
  const body: any = {deviceId:pc.id,machineHash:pc.machine,publicKey:pc.publicKey,challengeId:challenge.id,deviceName:'Test PC'};
  if (action === 'activate') body.licenseKey=reference;
  else body.licenseId=reference;
  body.signature=crypto.sign(null,Buffer.from(proofMessage(action,challenge,body,action === 'activate' ? sha256(normalizeLicenseKey(reference)) : reference)),pc.keys.privateKey).toString('base64');
  return {body,pc};
}
async function activate(key: string, pc = device()) {
  const {body}=await signed('activate',key,pc);
  return {lease:await service.authorize('activate',body,'127.0.0.1'),pc,body};
}
async function refresh(id: string, pc: ReturnType<typeof device>) {
  const {body}=await signed('refresh',id,pc);
  return service.authorize('refresh',body,'127.0.0.1');
}

before(async () => {
  await pg.exec('CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS; GRANT USAGE ON SCHEMA public TO anon,authenticated,service_role;');
  await pg.exec(await readFile(new URL('../migrations/002_device_licensing.sql',import.meta.url),'utf8'));
  await pg.exec(await readFile(new URL('../migrations/003_license_admin_workflow.sql',import.meta.url),'utf8'));
});
beforeEach(async () => {
  await pg.exec('TRUNCATE qbot_users,qbot_license_challenges CASCADE');
  await pg.query("INSERT INTO qbot_users(id,email,role,name) VALUES($1,$2,'admin','Test Admin'),($3,$4,'customer',$5)",[admin.id,admin.email,customer.id,customer.email,customer.name]);
  await pg.query("INSERT INTO qbot_subscriptions(id,user_id,status,current_period_start,current_period_end) VALUES('test-subscription',$1,'active',now()-interval '1 day',now()+interval '30 days')",[customer.id]);
  await pg.query("INSERT INTO qbot_manual_payments(id,order_id,email,plan_id,amount,utr_number) VALUES('test-payment','test-order',$1,'monthly',4999,'test-unique-receipt')",[customer.email]);
});
after(async () => {mock.restoreAll(); await pg.close();});

test('new registrations are persistent and cannot self-grant paid access', async () => {
  const user=await store.rpc('qbot_register_user',{p_email:' NEW@EXAMPLE.INVALID ',p_password_hash:'test-only-hash',p_name:'New customer'});
  assert.equal(user.email,'new@example.invalid');
  const subscription=(await pg.query<any>('SELECT * FROM qbot_subscriptions WHERE user_id=$1',[user.id])).rows[0];
  assert.equal(subscription.status,'inactive');
  await assert.rejects(service.issue(user.id,admin.id),/Approve payment/);
  await assert.rejects(store.rpc('qbot_register_user',{p_email:user.email,p_password_hash:'another-hash',p_name:'Duplicate'}),/unique/i);
});

test('only an administrator can approve payment or issue a key', async () => {
  await assert.rejects(service.issue(customer.id,customer.id),/Administrator required/);
  await assert.rejects(store.rpc('qbot_approve_payment',{p_payment_id:'test-payment',p_admin_id:customer.id}),/Administrator required/);
  assert.equal(await scalar('SELECT count(*) FROM qbot_licenses'),0);
});

test('manual approval adds paid time exactly once and records its audit trail', async () => {
  const beforeEnd=await scalar('SELECT current_period_end FROM qbot_subscriptions');
  const first=await approve();
  const second=await approve();
  assert.equal(first.alreadyVerified,false);
  assert.equal(second.alreadyVerified,true);
  const afterEnd=await scalar('SELECT current_period_end FROM qbot_subscriptions');
  assert.equal(new Date(afterEnd).getTime()-new Date(beforeEnd).getTime(),30*86400000);
  assert.equal(await scalar('SELECT count(*) FROM qbot_payment_transactions'),1);
  assert.equal(await scalar("SELECT count(*) FROM qbot_audit_logs WHERE action='PAYMENT_APPROVED'"),1);
  assert.equal('password_hash' in first.user,false);
});

test('annual renewal extends 365 days and failed approvals roll back completely', async () => {
  await pg.exec("UPDATE qbot_manual_payments SET plan_id='annual',amount=49999");
  const initial=await scalar('SELECT current_period_end FROM qbot_subscriptions');
  await approve();
  assert.equal(new Date(await scalar('SELECT current_period_end FROM qbot_subscriptions')).getTime()-new Date(initial).getTime(),365*86400000);
  await pg.exec("INSERT INTO qbot_manual_payments(order_id,email,plan_id,amount,utr_number) VALUES('unregistered-order','missing@example.invalid','monthly',4999,'unregistered-receipt')");
  const id=await scalar("SELECT id FROM qbot_manual_payments WHERE email='missing@example.invalid'");
  await assert.rejects(store.rpc('qbot_approve_payment',{p_payment_id:id,p_admin_id:admin.id}),/must register/);
  assert.equal(await scalar('SELECT status FROM qbot_manual_payments WHERE id=$1',[id]),'pending');
  assert.equal(await scalar('SELECT count(*) FROM qbot_payment_transactions'),1);
});

test('keys are random, shown once, and stored only as hashes', async () => {
  const first=await issue();
  const second=await issue();
  assert.match(first.licenseKey,/^QB2-(?:[A-F0-9]{8}-){5}[A-F0-9]{8}$/);
  assert.notEqual(first.licenseKey,second.licenseKey);
  assert.equal('key_hash' in first.license,false);
  const rows=(await pg.query<any>('SELECT * FROM qbot_licenses')).rows;
  assert.equal(rows.find(r=>r.id===first.license.id).status,'revoked');
  assert.equal(rows.find(r=>r.id===second.license.id).key_hash,sha256(second.licenseKey));
  const owner=(await pg.query<any>('SELECT u.id,u.name,u.email FROM qbot_licenses l JOIN qbot_users u ON u.id=l.user_id WHERE l.key_hash=$1',[sha256(second.licenseKey)])).rows[0];
  assert.deepEqual(owner,{id:customer.id,name:customer.name,email:customer.email});
  assert.ok(!JSON.stringify(rows).includes(second.licenseKey));
  assert.ok(!(await store.list()).some(r=>'key_hash' in r));
});

test('customers with the same name retain separate license hashes and ownership', async () => {
  const otherId='same-name-customer';
  await pg.query("INSERT INTO qbot_users(id,email,role,name) VALUES($1,'other@example.invalid','customer',$2)",[otherId,customer.name]);
  await pg.query("INSERT INTO qbot_subscriptions(user_id,status,current_period_start,current_period_end) VALUES($1,'active',now(),now()+interval '30 days')",[otherId]);
  const first=await issue();
  const other=await service.issue(otherId,admin.id);
  for (const [issued,ownerId] of [[first,customer.id],[other,otherId]] as const) {
    const owner=(await pg.query<any>('SELECT u.id,u.name,l.key_hash FROM qbot_licenses l JOIN qbot_users u ON u.id=l.user_id WHERE l.id=$1',[issued.license.id])).rows[0];
    assert.deepEqual(owner,{id:ownerId,name:customer.name,key_hash:sha256(issued.licenseKey)});
    assert.equal((await store.list(ownerId)).length,1);
  }
  assert.equal(await scalar("SELECT count(*) FROM qbot_licenses WHERE status='issued'"),2);
});

test('a failed hash insert rolls back replacement revocation and its audit event', async () => {
  const original=await issue();
  await assert.rejects(store.rpc('qbot_issue_license',{
    p_user_id:customer.id,p_key_hash:sha256(original.licenseKey),
    p_key_prefix:original.license.key_prefix,p_admin_id:admin.id
  }),/duplicate key/i);
  assert.equal(await scalar('SELECT count(*) FROM qbot_licenses'),1);
  assert.equal(await scalar('SELECT status FROM qbot_licenses'),'issued');
  assert.equal(await scalar("SELECT count(*) FROM qbot_audit_logs WHERE action='LICENSE_ISSUED'"),1);
  await activate(original.licenseKey);
});

test('activation JWT is RSA-signed and binds customer, subscription and hardware', async () => {
  const {licenseKey,license}=await issue();
  const {lease,pc,body}=await activate(licenseKey.toLowerCase());
  const claims=jwt.verify(lease.token,signing.publicKey,{algorithms:['RS256'],issuer:LICENSE_ISSUER,audience:LICENSE_AUDIENCE}) as jwt.JwtPayload;
  assert.equal(claims.sub,customer.id);
  assert.equal(claims.license_id,license.id);
  assert.equal(claims.subscription_id,'test-subscription');
  assert.equal(claims.device_id,pc.id);
  assert.equal(claims.machine_hash,pc.machine);
  assert.equal(claims.device_key_hash,sha256(Buffer.from(pc.publicKey,'base64')));
  assert.equal(claims.challenge_id,body.challengeId);
  assert.equal(claims.trading_allowed,true);
  assert.ok(claims.exp! <= claims.iat!+900);
  assert.ok(claims.exp! <= claims.subscription_expires_at);
  assert.equal(await scalar('SELECT status FROM qbot_licenses'),'active');
  await refresh(license.id,pc);
});

test('a stolen key cannot be activated on a second PC or with a copied device ID', async () => {
  const {licenseKey}=await issue();
  const original=await activate(licenseKey);
  await assert.rejects(activate(licenseKey),/another PC/);
  const imposter=device();
  imposter.id=original.pc.id;
  await assert.rejects(activate(licenseKey,imposter),/identity does not match/);
  await refresh(original.lease.licenseId,original.pc);
  assert.equal(await scalar('SELECT count(*) FROM qbot_devices'),1);
});

test('single-use challenges reject replay, expiration and mismatched devices', async () => {
  const {licenseKey}=await issue();
  const first=await activate(licenseKey);
  await assert.rejects(service.authorize('activate',first.body,'127.0.0.1'),/Challenge not found/);
  const pending=await signed('refresh',first.lease.licenseId,first.pc);
  await pg.query("UPDATE qbot_license_challenges SET expires_at=now()-interval '1 second' WHERE id=$1",[pending.body.challengeId]);
  await assert.rejects(service.authorize('refresh',pending.body,''),/expired or already used/);
  const wrong=await signed('refresh',first.lease.licenseId,first.pc);
  wrong.body.deviceId=crypto.randomUUID();
  await assert.rejects(service.authorize('refresh',wrong.body,''),/device does not match/);
});

test('forged signatures, malformed IDs and tampered machine hashes are rejected', async () => {
  const {licenseKey}=await issue();
  const request=await signed('activate',licenseKey);
  request.body.signature=crypto.randomBytes(64).toString('base64');
  await assert.rejects(service.authorize('activate',request.body,''),/signature could not be verified/);
  const tampered=await signed('activate',licenseKey);
  tampered.body.machineHash='0'.repeat(64);
  await assert.rejects(service.authorize('activate',tampered.body,''),/signature could not be verified/);
  await assert.rejects(service.createChallenge('-'.repeat(36)),/valid device ID/);
  await assert.rejects(service.authorize('activate',null,''),/request is required/);
  assert.equal(await scalar('SELECT count(*) FROM qbot_devices'),0);
});

test('renewal is opt-in: issuing a key does not interrupt the current PC', async () => {
  const old=await issue();
  const current=await activate(old.licenseKey);
  await approve();
  const renewal=await issue();
  const stillCurrent=await refresh(old.license.id,current.pc);
  assert.equal(new Date(stillCurrent.subscriptionExpiresAt).getTime(),new Date(old.license.expires_at).getTime());
  const renewed=await activate(renewal.licenseKey,current.pc);
  assert.ok(new Date(renewed.lease.subscriptionExpiresAt)>new Date(stillCurrent.subscriptionExpiresAt));
  await assert.rejects(refresh(old.license.id,current.pc),/revoked/);
  assert.equal(await scalar("SELECT count(*) FROM qbot_licenses WHERE status='active'"),1);
});

test('an owner-issued replacement can move the license to one new PC', async () => {
  const old=await issue();
  const original=await activate(old.licenseKey);
  const replacement=await issue();
  const newPc=await activate(replacement.licenseKey);
  await assert.rejects(refresh(old.license.id,original.pc),/revoked/);
  await refresh(replacement.license.id,newPc.pc);
  assert.equal(await scalar("SELECT count(*) FROM qbot_devices WHERE status<>'revoked'"),1);
});

test('revocation and subscription suspension override an otherwise valid activation', async () => {
  const key=await issue();
  const active=await activate(key.licenseKey);
  await pg.exec("UPDATE qbot_subscriptions SET status='suspended'");
  await assert.rejects(refresh(key.license.id,active.pc),/not active/);
  await pg.exec("UPDATE qbot_subscriptions SET status='active'");
  await store.rpc('qbot_revoke_license',{p_license_id:key.license.id,p_admin_id:admin.id});
  await assert.rejects(refresh(key.license.id,active.pc),/revoked/);
  assert.equal(await scalar('SELECT status FROM qbot_devices'),'revoked');
});

test('leases cannot exceed license or subscription expiry and expire without a new key', async () => {
  const key=await issue();
  await pg.exec("UPDATE qbot_licenses SET expires_at=now()+interval '20 seconds'");
  const active=await activate(key.licenseKey);
  const claims=jwt.decode(active.lease.token) as jwt.JwtPayload;
  assert.ok(claims.exp!-claims.iat!<=20);
  await pg.exec("UPDATE qbot_licenses SET expires_at=now()-interval '1 second'");
  await assert.rejects(refresh(key.license.id,active.pc),/expired/);
  await pg.exec("UPDATE qbot_subscriptions SET current_period_end=now()-interval '1 second'");
  await assert.rejects(issue(),/Approve payment/);
});

test('device revocation checks ownership and revokes its bound key permanently', async () => {
  const key=await issue();
  const active=await activate(key.licenseKey);
  assert.equal(await store.rpc('qbot_revoke_device',{p_device_id:active.pc.id,p_actor_id:'different-customer'}),false);
  await refresh(key.license.id,active.pc);
  assert.equal(await store.rpc('qbot_revoke_device',{p_device_id:active.pc.id,p_actor_id:customer.id}),true);
  assert.equal(await scalar('SELECT status FROM qbot_licenses'),'revoked');
  assert.equal(await scalar('SELECT status FROM qbot_devices'),'revoked');
  await assert.rejects(refresh(key.license.id,active.pc),/revoked/);
  await assert.rejects(activate(key.licenseKey,active.pc),/revoked/);
  const replacement=await issue();
  await activate(replacement.licenseKey,active.pc);
  assert.equal(await store.rpc('qbot_revoke_device',{p_device_id:active.pc.id,p_actor_id:admin.id}),true);
  await assert.rejects(refresh(replacement.license.id,active.pc),/revoked/);
});

test('promotional time requires an administrator and leaves current keys at their original expiry', async () => {
  const key=await issue();
  const before=await scalar('SELECT current_period_end FROM qbot_subscriptions');
  const grant=(days: number,actor=admin.id)=>store.rpc('qbot_grant_promo',{p_user_id:customer.id,p_days:days,p_admin_id:actor});
  await assert.rejects(grant(30,customer.id),/Administrator required/);
  for (const days of [0,-1,366]) await assert.rejects(grant(days),/between 1 and 365/);
  await grant(30);
  assert.equal(new Date(await scalar('SELECT current_period_end FROM qbot_subscriptions')).getTime()-new Date(before).getTime(),30*86400000);
  assert.equal(new Date(await scalar('SELECT expires_at FROM qbot_licenses')).getTime(),new Date(key.license.expires_at).getTime());
  assert.equal(await scalar("SELECT count(*) FROM qbot_audit_logs WHERE action='PROMO_GRANTED'"),1);
  for (const role of ['anon','authenticated']) {
    assert.equal(await scalar("SELECT has_function_privilege($1,'qbot_revoke_device(text,text)','EXECUTE')",[role]),false);
    assert.equal(await scalar("SELECT has_function_privilege($1,'qbot_grant_promo(text,integer,text)','EXECUTE')",[role]),false);
  }
});

test('repeated issuance and approval preserve one issued key and one payment credit', async () => {
  await Promise.all([approve(),approve(),approve()]);
  await Promise.all([issue(),issue(),issue()]);
  assert.equal(await scalar('SELECT count(*) FROM qbot_payment_transactions'),1);
  assert.equal(await scalar("SELECT count(*) FROM qbot_licenses WHERE status='issued'"),1);
});

test('anonymous and authenticated Supabase roles cannot read tables or execute RPCs', async () => {
  for (const role of ['anon','authenticated']) {
    for (const table of ['qbot_users','qbot_subscriptions','qbot_licenses','qbot_devices','qbot_license_challenges','qbot_manual_payments']) {
      assert.equal(await scalar('SELECT has_table_privilege($1,$2,\'SELECT\')',[role,table]),false);
      assert.equal(await scalar('SELECT relrowsecurity FROM pg_class WHERE oid=$1::regclass',[table]),true);
    }
    assert.equal(await scalar("SELECT has_function_privilege($1,'qbot_issue_license(text,text,text,text)','EXECUTE')",[role]),false);
    await pg.exec(`SET ROLE ${role}`);
    try { await assert.rejects(pg.query('SELECT * FROM public.qbot_licenses'),/permission denied/); }
    finally { await pg.exec('RESET ROLE'); }
  }
  assert.equal(await scalar("SELECT has_function_privilege('service_role','qbot_issue_license(text,text,text,text)','EXECUTE')"),true);
});

test('migration is repeatable and preserves old user/subscription data without importing demo access', async () => {
  await pg.exec("CREATE TABLE users(id text,email text,password_hash text,role text); CREATE TABLE subscriptions(id text,user_id text,plan_id text,status text,current_period_end timestamptz); INSERT INTO users VALUES('legacy-id','Legacy@Example.Invalid','legacy-hash','customer'); INSERT INTO subscriptions VALUES('legacy-sub','legacy-id','monthly','active',now()+interval '3 days'); GRANT SELECT ON users TO anon;");
  try {
    const migration=await readFile(new URL('../migrations/002_device_licensing.sql',import.meta.url),'utf8');
    await pg.exec(migration);
    await pg.exec(migration);
    assert.equal(await scalar("SELECT email FROM qbot_users WHERE id='legacy-id'"),'legacy@example.invalid');
    assert.equal(await scalar("SELECT count(*) FROM qbot_subscriptions WHERE user_id='legacy-id'"),1);
    assert.equal(await scalar('SELECT count(*) FROM users'),1);
    assert.equal(await scalar("SELECT has_table_privilege('anon','users','SELECT')"),false);
    assert.equal(await scalar('SELECT count(*) FROM qbot_licenses'),0);
  } finally { await pg.exec('DROP TABLE users,subscriptions'); }
});

async function withHttp(run: (url: string)=>Promise<void>, fixtures=false, fullApp=false) {
  const app=fullApp?createApp({licenseService:service}):express();
  if (!fullApp) {
    app.use(express.json({limit:'8kb'}));
    app.use('/api',createLicenseRouter({service}));
  }
  // This handler only exists in this test module, never in the production app.
  if (fixtures) app.post('/test-only/renew',async (_req,res)=>{
    await approve();
    res.json(await issue());
  });
  const server=app.listen(0,'127.0.0.1');
  await new Promise<void>((resolve,reject)=>{server.once('listening',resolve);server.once('error',reject);});
  const address=server.address();
  assert.ok(address && typeof address==='object');
  try {await run(`http://127.0.0.1:${address.port}`);}
  finally {server.closeAllConnections(); await new Promise<void>((resolve,reject)=>server.close(e=>e?reject(e):resolve()));}
}

test('HTTP issuance releases no key when Supabase cannot save its hash', async () => {
  const lookup=mock.method(db,'findUserById',async ()=>admin);
  let attemptedHash='';
  const failure=mock.method(store,'rpc',async (name: string,args: Record<string,unknown>)=>{
    assert.equal(name,'qbot_issue_license');
    attemptedHash=String(args.p_key_hash);
    throw new LicenseError(503,'Licensing database unavailable. Please try again shortly.');
  });
  try {
    await withHttp(async url=>{
      const response=await fetch(url+'/api/admin/licenses',{method:'POST',
        headers:{'Content-Type':'application/json',Authorization:'Bearer '+authService.generateToken(admin)},
        body:JSON.stringify({userId:customer.id})});
      assert.equal(response.status,503);
      assert.equal(response.headers.get('cache-control'),'no-store');
      const body=await response.json();
      assert.deepEqual(body,{error:'Licensing database unavailable. Please try again shortly.',tradingAllowed:false});
      assert.match(attemptedHash,/^[a-f0-9]{64}$/);
      assert.ok(!JSON.stringify(body).includes(attemptedHash));
      assert.equal(await scalar('SELECT count(*) FROM qbot_licenses'),0);
    });
  } finally {failure.mock.restore();lookup.mock.restore();}
});

test('HTTP administration requires real signed login tokens and current database admin role', async () => {
  const lookup=mock.method(db,'findUserById',async (id: string)=>id===admin.id?admin:id===customer.id?customer:null);
  try {
    await withHttp(async url => {
      const request=(token?: string)=>fetch(url+'/api/admin/licenses',{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify({userId:customer.id})});
      assert.equal((await request()).status,401);
      assert.equal((await request(authService.generateToken(customer))).status,403);
      assert.equal((await request('forged-token')).status,401);
      const response=await request(authService.generateToken(admin));
      assert.equal(response.status,201);
      assert.equal(response.headers.get('cache-control'),'no-store');
      const data=await response.json();
      assert.match(data.licenseKey,/^QB2-/);
      assert.equal(await scalar('SELECT key_hash FROM qbot_licenses WHERE id=$1',[data.license.id]),sha256(data.licenseKey));
      assert.equal(data.license.user_id,customer.id);
      const listed=await fetch(url+'/api/admin/licenses',{headers:{Authorization:'Bearer '+authService.generateToken(admin)}});
      assert.ok(!JSON.stringify(await listed.json()).includes(data.licenseKey));
      // A token's old role must not outlive a demotion in the database.
      const oldToken=authService.generateToken(admin);
      lookup.mock.mockImplementation(async ()=>({...admin,role:'customer'}));
      assert.equal((await request(oldToken)).status,403);
    });
  } finally {lookup.mock.restore();}
});

test('real Python client activates, restarts without a key, rejects copying, and renews over HTTP', async () => {
  const issued=await issue();
  await withHttp(async url=>{
    const script=process.env.QBOT_TEST_CLIENT_ROOT
      ? path.resolve(process.env.QBOT_TEST_CLIENT_ROOT,'tests/licensing_interop.py')
      : fileURLToPath(new URL('../../tests/licensing_interop.py',import.meta.url));
    const child=spawn(process.env.QBOT_TEST_PYTHON || 'python',[script,url,Buffer.from(signing.publicKey.export({format:'pem',type:'spki'})).toString('base64'),issued.licenseKey],{windowsHide:true,stdio:['ignore','pipe','pipe']});
    let stdout='',stderr='';
    child.stdout.on('data',chunk=>stdout+=chunk);
    child.stderr.on('data',chunk=>stderr+=chunk);
    const timeout=setTimeout(()=>child.kill(),30000);
    try {
      const code=await new Promise<number|null>((resolve,reject)=>{child.once('error',reject);child.once('exit',resolve);});
      assert.equal(code,0,stderr || stdout);
      assert.match(stdout,/interop passed/);
    } finally {clearTimeout(timeout);}
  },true);
});

test('full website API registers, approves payment once, issues a key and reports only the owning PC', async () => {
  const restore=mockAccountDatabase(pg,store);
  try {
    await pg.exec("UPDATE qbot_subscriptions SET status='inactive',current_period_end=now()");
    await withHttp(async url=>{
      const request=(path: string,method='GET',body?: any,token?: string)=>fetch(url+path,{method,
        headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:body===undefined?undefined:JSON.stringify(body)});
      const adminToken=authService.generateToken(admin),customerToken=authService.generateToken(customer);
      const signup=await request('/api/auth/register','POST',{email:'other@example.invalid',password:'test-password-123',name:'Other',role:'admin'});
      assert.equal(signup.status,201);
      const other=await signup.json();
      assert.equal(other.user.role,'customer');
      assert.equal(other.subscription.status,'inactive');
      assert.equal('passwordHash' in other.user,false);
      assert.equal((await request('/api/auth/login','POST',{email:other.user.email,password:'wrong-password'})).status,401);
      assert.equal((await request('/api/auth/login','POST',{email:other.user.email,password:'test-password-123'})).status,200);
      assert.equal((await request('/api/admin/licenses','POST',{userId:customer.id},customerToken)).status,403);
      assert.equal((await request('/api/admin/licenses','POST',{userId:customer.id},adminToken)).status,403);

      const submitted=await request('/api/billing/submit-manual-payment','POST',{
        orderId:'http-annual-order',email:customer.email.toUpperCase(),utrNumber:'987654321012',planId:'annual',amount:1,userId:admin.id
      },customerToken);
      assert.equal(submitted.status,200);
      const payment=(await submitted.json()).payment;
      assert.equal(Number(payment.amount),49999);
      assert.equal(payment.userId,customer.id);
      assert.equal((await request('/api/admin/verify-manual-payment','POST',{paymentId:payment.id},customerToken)).status,403);
      const approved=await request('/api/admin/verify-manual-payment','POST',{paymentId:payment.id},adminToken);
      assert.equal(approved.status,200);
      const approval=await approved.json();
      assert.equal(approval.user.id,customer.id);
      assert.equal(approval.alreadyVerified,false);
      assert.equal('licenseKey' in approval,false);
      const paidEnd=await scalar('SELECT current_period_end FROM qbot_subscriptions WHERE user_id=$1',[customer.id]);
      const again=await request('/api/admin/verify-manual-payment','POST',{paymentId:payment.id},adminToken);
      assert.equal((await again.json()).alreadyVerified,true);
      assert.deepEqual(await scalar('SELECT current_period_end FROM qbot_subscriptions WHERE user_id=$1',[customer.id]),paidEnd);

      const issued=await request('/api/admin/licenses','POST',{userId:customer.id},adminToken);
      assert.equal(issued.status,201);
      const key=await issued.json();
      const active=await activate(key.licenseKey);
      const me=await request('/api/auth/me','GET',undefined,customerToken);
      assert.equal(me.status,200);
      const account=await me.json();
      assert.equal(account.licenses.length,1);
      assert.equal(account.licenses[0].device.machine_hash,active.pc.machine);
      assert.equal(account.devices.length,1);
      assert.equal(account.maxDevices,1);
      assert.ok(!JSON.stringify(account).includes(key.licenseKey));
      assert.ok(!JSON.stringify(account).includes('key_hash'));
      const otherAccount=await request('/api/auth/me','GET',undefined,other.token);
      assert.equal((await otherAccount.json()).licenses.length,0);
      assert.equal((await request('/api/downloads','GET',undefined,customerToken)).status,200);

      assert.equal((await request('/api/devices/'+active.pc.id,'DELETE',undefined,other.token)).status,404);
      assert.equal((await request('/api/devices/'+active.pc.id,'DELETE',undefined,customerToken)).status,200);
      await assert.rejects(refresh(key.license.id,active.pc),/revoked/);
      const revoked=await (await request('/api/auth/me','GET',undefined,customerToken)).json();
      assert.equal(revoked.licenses[0].status,'revoked');
      assert.equal(revoked.devices.length,0);
    },false,true);
  } finally {restore();}
});

test('full website API reports rejected actions, validates promo time and survives database failures', async () => {
  const restore=mockAccountDatabase(pg,store);
  try {
    await withHttp(async url=>{
      const token=authService.generateToken(admin);
      const request=(path: string,body: any={})=>fetch(url+path,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify(body)});
      assert.equal((await request('/api/admin/verify-manual-payment',{})).status,400);
      await pg.exec("UPDATE qbot_manual_payments SET email='unregistered@example.invalid'");
      const rejected=await request('/api/admin/verify-manual-payment',{paymentId:'test-payment'});
      assert.equal(rejected.status,409);
      assert.match((await rejected.json()).error,/must register/);
      assert.equal(await scalar('SELECT status FROM qbot_manual_payments'),'pending');

      await pg.exec("UPDATE qbot_subscriptions SET status='suspended',current_period_end=now()-interval '1 day'");
      assert.equal((await request('/api/admin/users/'+customer.id+'/reactivate')).status,409);
      assert.equal(await scalar('SELECT status FROM qbot_subscriptions'),'suspended');
      for (const days of [0,-1,1.5,366,'30']) assert.equal((await request('/api/admin/users/'+customer.id+'/grant-promo',{days})).status,400);
      const granted=await request('/api/admin/users/'+customer.id+'/grant-promo',{days:30});
      assert.equal(granted.status,200);
      assert.equal((await granted.json()).subscription.status,'active');

      assert.equal((await request('/api/admin/support-notes',{userId:customer.id,note:'wrong field'})).status,400);
      const note=await request('/api/admin/support-notes',{userId:customer.id,content:'Payment checked; send renewal key.'});
      assert.equal(note.status,200);
      assert.equal((await note.json()).content,'Payment checked; send renewal key.');
      assert.equal((await request('/api/auth/reset-password',{token:'anything',newPassword:'test-password'})).status,501);
      assert.equal((await request('/api/verify-payment')).status,410);
      const missing=await fetch(url+'/api/not-a-route');
      assert.equal(missing.status,404);
      assert.match(missing.headers.get('content-type') || '',/json/);

      const unavailable=mock.method(db,'getSubscription',async ()=>{throw new Error('Disposable test database outage');});
      try {
        const response=await fetch(url+'/api/auth/me',{headers:{Authorization:'Bearer '+authService.generateToken(customer)}});
        assert.equal(response.status,503);
        assert.match((await response.json()).error,/temporarily unavailable/);
        assert.equal((await fetch(url+'/api/health')).status,200);
      } finally {unavailable.mock.restore();}
    },false,true);
  } finally {restore();}
});
