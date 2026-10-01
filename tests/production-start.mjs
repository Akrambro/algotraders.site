// Smoke-test the bundled entry point with disposable signing keys and no database credentials.
import assert from 'node:assert/strict';
import net from 'node:net';
import crypto from 'node:crypto';
import {spawn} from 'node:child_process';

const reserve=net.createServer();
await new Promise((resolve,reject)=>{reserve.once('error',reject);reserve.listen(0,'127.0.0.1',resolve);});
const port=reserve.address().port;
await new Promise(resolve=>reserve.close(resolve));
const key=crypto.generateKeyPairSync('rsa',{modulusLength:2048}).privateKey.export({format:'pem',type:'pkcs8'});
const child=spawn(process.execPath,['dist/server.mjs'],{windowsHide:true,env:{...process.env,NODE_ENV:'production',PORT:String(port),
  JWT_SECRET:crypto.randomBytes(48).toString('hex'),LICENSE_PRIVATE_KEY_B64:Buffer.from(key).toString('base64'),
  SUPABASE_URL:'',SUPABASE_SERVICE_ROLE_KEY:''},stdio:['ignore','pipe','pipe']});
let log='';
try {
  await new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>reject(new Error('Startup timeout: '+log)),15000);
    child.stdout.on('data',data=>{log+=data;if(log.includes('server running on port')){clearTimeout(timer);resolve();}});
    child.stderr.on('data',data=>log+=data);
    child.once('error',error=>{clearTimeout(timer);reject(error);});
    child.once('exit',code=>{clearTimeout(timer);reject(new Error('Server exited: '+code+' '+log));});
  });
  const base='http://127.0.0.1:'+port;
  const get=path=>fetch(base+path,{signal:AbortSignal.timeout(5000)});
  const health=await(await get('/api/health')).json();
  assert.equal(health.licensing,'seller-issued-device-bound-v1');
  assert.equal((await get('/api/admin/licenses')).status,401);
  assert.equal((await get('/api/not-a-route')).status,404);
  assert.equal((await get('/')).status,200);
  console.log('PASS Production server startup, frontend, protected license route and JSON 404.');
} finally {child.kill();}
