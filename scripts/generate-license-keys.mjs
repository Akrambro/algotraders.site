import {generateKeyPairSync,randomBytes,createPublicKey} from 'node:crypto';
import {mkdirSync,writeFileSync,readFileSync,existsSync} from 'node:fs';
import path from 'node:path';

const directory=path.resolve('.secrets');
mkdirSync(directory,{recursive:true});
const privatePath=path.join(directory,'license-private.pem');
if (!existsSync(privatePath)) {
  const {privateKey}=generateKeyPairSync('rsa',{modulusLength:3072,privateKeyEncoding:{type:'pkcs8',format:'pem'},publicKeyEncoding:{type:'spki',format:'pem'}});
  writeFileSync(privatePath,privateKey,{flag:'wx',mode:0o600});
}
const privateKey=readFileSync(privatePath);
const publicKey=createPublicKey(privateKey).export({type:'spki',format:'pem'});
writeFileSync('license-public.pem',publicKey);
const desktopPublic=path.resolve('..','license_public_key.pem');
writeFileSync(desktopPublic,publicKey);
const envPath=path.join(directory,'render-licensing.env');
if (!existsSync(envPath)) writeFileSync(envPath,
  `LICENSE_PRIVATE_KEY_B64=${privateKey.toString('base64')}\nJWT_SECRET=${randomBytes(48).toString('hex')}\nSUPABASE_URL=https://myrqldmzekujotuvxfnb.supabase.co\nSUPABASE_SERVICE_ROLE_KEY=REPLACE_IN_RENDER_ONLY\nAPP_URL=https://algotraders-ena2.onrender.com\n`,{flag:'wx',mode:0o600});
console.log('Signing keys ready. Private Render settings: .secrets/render-licensing.env');
console.log('Only the public verification key was copied to the Windows project. Never distribute .secrets.');
