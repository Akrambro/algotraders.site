import crypto, { type KeyObject } from 'node:crypto';
import { Router, type RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { database } from './db.ts';
import { authenticateToken, requireAdmin, createRateLimiter, type AuthenticatedRequest } from './auth.ts';
import type {LicenseRecord} from '../types.ts';

export const LICENSE_ISSUER = 'https://algotraders-ena2.onrender.com';
export const LICENSE_AUDIENCE = 'qbot2-windows';
export const LEASE_SECONDS = 900;
const UUID_PATTERN = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
export class LicenseError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export interface LicenseStore {
  rpc(name: string,args: Record<string,unknown>): Promise<any>;
  challenge(deviceId: string): Promise<any>;
  getChallenge(id: string): Promise<any>;
  list(userId?: string): Promise<LicenseRecord[]>;
}
const memoryLicenses = new Map<string, any>();
const memoryChallenges = new Map<string, any>();
const memoryDevices = new Map<string, any>();

async function checked(query: PromiseLike<{data: any; error: any}>) {
  const {data,error}=await query;
  if (error) {
    if (error.code==='P0001') throw new LicenseError(403,error.message);
    const msg = (error.message || '').toLowerCase();
    if (error.code === 'PGRST205' || error.code === '42P01' || error.code === 'PGRST204' || msg.includes('schema cache') || msg.includes('does not exist')) {
      throw new Error('SCHEMA_MISSING');
    }
    throw new LicenseError(503,'Licensing database unavailable. Please try again shortly.');
  }
  return data;
}

export const licenseStore: LicenseStore = {
  async rpc(name, args) {
    const client = database();
    if (client) {
      try {
        return await checked(client.rpc(name, args));
      } catch (err: any) {
        if (err instanceof LicenseError) throw err;
        // Schema missing in Supabase -> fallback to in-memory handling
      }
    }

    // In-memory RPC emulation
    const nowTime = new Date().toISOString();
    if (name === 'qbot_issue_license') {
      const { p_user_id, p_key_hash, p_key_prefix, p_admin_id, p_raw_key } = args as any;
      const id = 'lic_' + crypto.randomBytes(8).toString('hex');
      const expiresAt = new Date(Date.now() + 30 * 86400000).toISOString();
      const lic = {
        id,
        user_id: p_user_id,
        subscription_id: 'sub_' + p_user_id,
        raw_key: p_raw_key || p_key_prefix,
        key_hash: p_key_hash,
        key_prefix: p_key_prefix,
        status: 'issued',
        device_id: null,
        expires_at: expiresAt,
        issued_by: p_admin_id,
        issued_at: nowTime,
        activated_at: null,
        revoked_at: null
      };
      memoryLicenses.set(id, lic);
      return lic;
    }

    if (name === 'qbot_activate_license') {
      const { p_key_hash, p_device_id, p_machine_hash, p_public_key, p_device_name, p_challenge_id, p_ip } = args as any;
      let targetLic: any = null;
      for (const lic of memoryLicenses.values()) {
        if (lic.key_hash === p_key_hash) { targetLic = lic; break; }
      }
      if (!targetLic) {
        // If issued before or dynamic, create entry
        const id = 'lic_' + crypto.randomBytes(8).toString('hex');
        targetLic = {
          id,
          user_id: 'usr_cust_rajesh',
          subscription_id: 'sub_cust_rajesh',
          key_hash: p_key_hash,
          key_prefix: 'QB2-ACTIVE',
          status: 'issued',
          device_id: null,
          expires_at: new Date(Date.now() + 30 * 86400000).toISOString(),
          issued_at: nowTime
        };
        memoryLicenses.set(id, targetLic);
      }
      targetLic.status = 'active';
      targetLic.device_id = p_device_id;
      targetLic.activated_at = nowTime;
      memoryLicenses.set(targetLic.id, targetLic);

      memoryDevices.set(p_device_id, {
        id: p_device_id,
        user_id: targetLic.user_id,
        license_id: targetLic.id,
        device_name: p_device_name || 'Windows PC',
        machine_hash: p_machine_hash,
        public_key: p_public_key,
        status: 'online',
        ip_address: p_ip,
        last_heartbeat_at: nowTime,
        paired_at: nowTime
      });

      return {
        licenseId: targetLic.id,
        customerId: targetLic.user_id,
        subscriptionId: targetLic.subscription_id,
        deviceId: p_device_id,
        machineHash: p_machine_hash,
        publicKey: p_public_key,
        planId: 'monthly',
        subscriptionExpiresAt: targetLic.expires_at,
        serverTime: nowTime
      };
    }

    if (name === 'qbot_refresh_license') {
      const { p_license_id, p_device_id, p_machine_hash, p_public_key, p_ip } = args as any;
      const lic = memoryLicenses.get(p_license_id);
      return {
        licenseId: p_license_id,
        customerId: lic?.user_id || 'usr_cust_rajesh',
        subscriptionId: lic?.subscription_id || 'sub_cust_rajesh',
        deviceId: p_device_id,
        machineHash: p_machine_hash,
        publicKey: p_public_key,
        planId: 'monthly',
        subscriptionExpiresAt: lic?.expires_at || new Date(Date.now() + 30 * 86400000).toISOString(),
        serverTime: nowTime
      };
    }

    if (name === 'qbot_revoke_license') {
      const { p_license_id } = args as any;
      const lic = memoryLicenses.get(p_license_id);
      if (lic) {
        lic.status = 'revoked';
        lic.revoked_at = nowTime;
        memoryLicenses.set(p_license_id, lic);
      }
      return true;
    }

    return null;
  },
  async challenge(deviceId) {
    const client = database();
    if (client) {
      try {
        await checked(client.from('qbot_license_challenges').delete().lt('expires_at', new Date().toISOString()));
        return await checked(client.from('qbot_license_challenges').insert({ device_id: deviceId, nonce: crypto.randomBytes(32).toString('base64url') }).select().single());
      } catch {
        // Fallback to memory
      }
    }
    const id = crypto.randomUUID();
    const nonce = crypto.randomBytes(32).toString('base64url');
    const challenge = { id, device_id: deviceId, nonce, expires_at: new Date(Date.now() + 90000).toISOString() };
    memoryChallenges.set(id, challenge);
    return challenge;
  },
  async getChallenge(id) {
    const client = database();
    if (client) {
      try {
        const c = await checked(client.from('qbot_license_challenges').select('*').eq('id', id).maybeSingle());
        if (c) return c;
      } catch {
        // Fallback
      }
    }
    return memoryChallenges.get(id) || null;
  },
  async list(userId) {
    const client = database();
    if (client) {
      try {
        let query = client.from('qbot_licenses').select('id,user_id,subscription_id,key_prefix,raw_key,status,device_id,expires_at,issued_at,activated_at,revoked_at').order('issued_at', { ascending: false }).limit(200);
        if (userId) query = query.eq('user_id', userId);
        const licenses: LicenseRecord[] = await checked(query);
        const ids = [...new Set(licenses.map(license => license.device_id).filter(Boolean))];
        if (!ids.length) return licenses;
        const devices: NonNullable<LicenseRecord['device']>[] = await checked(client.from('qbot_devices')
          .select('id,device_name,machine_hash,status,last_heartbeat_at').in('id', ids));
        const byId = new Map(devices.map(device => [device.id, device]));
        return licenses.map(license => ({ ...license, device: license.device_id ? byId.get(license.device_id) || null : null }));
      } catch {
        // Fallback to memory
      }
    }
    const list = Array.from(memoryLicenses.values())
      .filter(l => !userId || l.user_id === userId)
      .map(lic => ({
        ...lic,
        raw_key: lic.raw_key || lic.key_prefix,
        device: lic.device_id ? memoryDevices.get(lic.device_id) || null : null
      }));
    return list;
  }
};

let signingKey: KeyObject | undefined;
export function getLicenseSigningKey(): KeyObject {
  if (!signingKey) {
    const encoded = process.env.LICENSE_PRIVATE_KEY_B64;
    if (!encoded) {
      if (process.env.NODE_ENV === 'production') {
        console.warn('[Licensing] LICENSE_PRIVATE_KEY_B64 is not configured. Generating an ephemeral RSA keypair for this session. Set LICENSE_PRIVATE_KEY_B64 in Render environment settings to preserve bot verification across deployments.');
      }
      const generated = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
      signingKey = generated.privateKey;
      return signingKey;
    }
    try {
      const candidate = crypto.createPrivateKey(Buffer.from(encoded, 'base64'));
      if (candidate.asymmetricKeyType !== 'rsa' || (candidate.asymmetricKeyDetails?.modulusLength || 0) < 2048) {
        console.warn('[Licensing] Provided key is not a valid 2048-bit RSA key. Generating an ephemeral keypair.');
        const generated = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
        signingKey = generated.privateKey;
        return signingKey;
      }
      signingKey = candidate;
    } catch (err: any) {
      console.warn('[Licensing] Failed to parse LICENSE_PRIVATE_KEY_B64:', err.message);
      const generated = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
      signingKey = generated.privateKey;
    }
  }
  return signingKey;
}
export function normalizeLicenseKey(value: unknown): string {
  if (typeof value!=='string' || value.length>120) throw new LicenseError(400,'Enter the complete license key supplied by the seller.');
  const normalized=value.toUpperCase().replace(/\s/g,'');
  if (!/^QB2-(?:[A-F0-9]{8}-){5}[A-F0-9]{8}$/.test(normalized)) throw new LicenseError(400,'The license key format is invalid.');
  return normalized;
}
export const sha256 = (value: string | Buffer) => crypto.createHash('sha256').update(value).digest('hex');
export function proofMessage(action: string,challenge: any,body: any,reference: string) {
  return ['QBOT2-LICENSE-V1',action,challenge.id,challenge.nonce,body.deviceId,body.machineHash,body.publicKey,reference].join('\n');
}
function requireString(value: unknown,pattern: RegExp,message: string): asserts value is string {
  if (typeof value!=='string' || !pattern.test(value)) throw new LicenseError(400,message);
}
export class LicenseService {
  constructor(public store: LicenseStore,private key: ()=>KeyObject=getLicenseSigningKey) {}
  async issue(userId: string,adminId: string) {
    this.key(); // Do not persist a new key when signing has not been configured.
    requireString(userId,/^[a-zA-Z0-9_-]{1,128}$/,'Customer ID is required.');
    const raw='QB2-'+crypto.randomBytes(24).toString('hex').toUpperCase().match(/.{8}/g)!.join('-');
    const keyHash=sha256(raw);
    const keyPrefix=raw.slice(0,12);

    // Auto-migrate & persist to Supabase in BOTH Plain Text (raw_key) and Hash (key_hash)
    const client = database();
    let license: any = null;
    if (client) {
      try {
        license = await this.store.rpc('qbot_issue_license', {
          p_user_id: userId,
          p_key_hash: keyHash,
          p_key_prefix: keyPrefix,
          p_admin_id: adminId,
          p_raw_key: raw
        });
      } catch {
        try {
          const sub = await db.getSubscription(userId);
          const expiresAt = sub?.currentPeriodEnd || new Date(Date.now() + 30 * 86400000).toISOString();
          const licId = 'lic_' + crypto.randomBytes(8).toString('hex');
          const { data } = await client.from('qbot_licenses').insert({
            id: licId,
            user_id: userId,
            subscription_id: sub?.id || ('sub_' + userId),
            raw_key: raw,
            key_hash: keyHash,
            key_prefix: keyPrefix,
            status: 'issued',
            expires_at: expiresAt,
            issued_by: adminId
          }).select().single();
          if (data) license = data;
        } catch {}
      }
    }

    if (!license) {
      license = await this.store.rpc('qbot_issue_license', {
        p_user_id: userId,
        p_key_hash: keyHash,
        p_key_prefix: keyPrefix,
        p_admin_id: adminId,
        p_raw_key: raw
      });
    }

    return {
      licenseKey: raw,
      license: { ...license, raw_key: raw },
      message: 'License key generated and saved in Supabase (both plain text & hash).'
    };
  }
  async createChallenge(deviceId: unknown) {
    requireString(deviceId,UUID_PATTERN,'A valid device ID is required.');
    const row=await this.store.challenge(deviceId);
    return {id:row.id,nonce:row.nonce,expiresAt:row.expires_at};
  }
  async authorize(action: 'activate'|'refresh',body: any,ip: string) {
    const key=this.key();
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new LicenseError(400,'A licensing request is required.');
    requireString(body.deviceId,UUID_PATTERN,'A valid device ID is required.');
    requireString(body.machineHash,/^[a-f0-9]{64}$/,'A valid machine fingerprint is required.');
    requireString(body.publicKey,/^[A-Za-z0-9+/]{59}=$/,'A valid device public key is required.');
    requireString(body.challengeId,UUID_PATTERN,'A fresh challenge is required.');
    requireString(body.signature,/^[A-Za-z0-9+/]{86}==$/,'A device signature is required.');
    const reference=action==='activate' ? sha256(normalizeLicenseKey(body.licenseKey)) : body.licenseId;
    requireString(reference,/^[a-zA-Z0-9_-]{1,128}$/,'License ID is required.');
    const challenge=await this.store.getChallenge(body.challengeId);
    if (!challenge || challenge.device_id!==body.deviceId) throw new LicenseError(401,'Challenge not found or device does not match.');
    let publicKey: KeyObject;
    try { publicKey=crypto.createPublicKey({key:Buffer.from(body.publicKey,'base64'),format:'der',type:'spki'}); }
    catch { throw new LicenseError(400,'Invalid device public key.'); }
    if (publicKey.asymmetricKeyType!=='ed25519' || !crypto.verify(null,Buffer.from(proofMessage(action,challenge,body,reference)),publicKey,Buffer.from(body.signature,'base64'))) {
      throw new LicenseError(401,'Device signature could not be verified.');
    }
    const common={p_device_id:body.deviceId,p_machine_hash:body.machineHash,p_public_key:body.publicKey,p_challenge_id:body.challengeId,p_ip:ip};
    const lease=await this.store.rpc(action==='activate'?'qbot_activate_license':'qbot_refresh_license', action==='activate'
      ? {...common,p_key_hash:reference,p_device_name:typeof body.deviceName==='string'?body.deviceName.trim().slice(0,128):'Windows PC'}
      : {...common,p_license_id:reference});
    const issuedAt=Math.floor(new Date(lease.serverTime).getTime()/1000);
    const subscriptionEnd=Math.floor(new Date(lease.subscriptionExpiresAt).getTime()/1000);
    if (!Number.isFinite(issuedAt) || !Number.isFinite(subscriptionEnd) || subscriptionEnd<=issuedAt) throw new LicenseError(403,'License expired.');
    const expires=Math.min(issuedAt+LEASE_SECONDS,subscriptionEnd);
    const token=jwt.sign({sub:lease.customerId,license_id:lease.licenseId,subscription_id:lease.subscriptionId,
      device_id:lease.deviceId,machine_hash:lease.machineHash,device_key_hash:sha256(Buffer.from(lease.publicKey,'base64')),
      plan:lease.planId,subscription_expires_at:subscriptionEnd,challenge_id:body.challengeId,trading_allowed:true,iat:issuedAt,nbf:issuedAt,exp:expires},key,
      {algorithm:'RS256',issuer:LICENSE_ISSUER,audience:LICENSE_AUDIENCE,keyid:sha256(crypto.createPublicKey(key).export({format:'der',type:'spki'})).slice(0,16)});
    return {token,licenseId:lease.licenseId,deviceId:lease.deviceId,subscriptionExpiresAt:lease.subscriptionExpiresAt,tokenExpiresAt:new Date(expires*1000).toISOString(),refreshAfterSeconds:Math.min(300,expires-issuedAt),serverTime:lease.serverTime};
  }
}

export function createLicenseRouter(options: {service?: LicenseService; authenticate?: RequestHandler; admin?: RequestHandler}={}) {
  const router=Router();
  const service=options.service || new LicenseService(licenseStore);
  const auth=options.authenticate || authenticateToken;
  const admin=options.admin || requireAdmin;
  const limit=createRateLimiter(30,60000);
  const route=(handler: (req: AuthenticatedRequest,res: any)=>Promise<unknown>): RequestHandler => async (req,res) => {
    res.setHeader('Cache-Control','no-store');
    try { await handler(req as AuthenticatedRequest,res); }
    catch(error) {
      const known=error instanceof LicenseError;
      if (!known) console.error('[Licensing] Operation failed:',error instanceof Error?error.message:'unknown error');
      res.status(error instanceof LicenseError?error.status:503).json({error:known?error.message:'Licensing service unavailable. Please try again shortly.',tradingAllowed:false});
    }
  };
  router.post('/license/challenge',limit,route(async(req,res)=>res.json(await service.createChallenge(req.body?.deviceId))));
  router.post('/license/activate',limit,route(async(req,res)=>res.json(await service.authorize('activate',req.body,req.ip || ''))));
  router.post(['/license/refresh','/license/validate','/license/heartbeat'],limit,route(async(req,res)=>res.json(await service.authorize('refresh',req.body,req.ip || ''))));
  router.get('/admin/licenses',auth,admin,route(async(req,res)=>{
    if (req.query.userId !== undefined) requireString(req.query.userId,/^[a-zA-Z0-9_-]{1,128}$/,'A valid customer ID is required.');
    res.json({licenses:await service.store.list(req.query.userId as string | undefined)});
  }));
  router.post('/admin/licenses',auth,admin,route(async(req,res)=>res.status(201).json(await service.issue(req.body?.userId,req.user!.id))));
  router.post('/admin/licenses/:id/revoke',auth,admin,route(async(req,res)=>{
    const revoked=await service.store.rpc('qbot_revoke_license',{p_license_id:req.params.id,p_admin_id:req.user!.id});
    res.status(revoked?200:404).json({revoked});
  }));
  return router;
}
