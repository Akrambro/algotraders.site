// Browser regression checks against the production frontend and disposable API fixtures.
// No production database, account, payment or browser profile is used.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import {mkdir, mkdtemp, writeFile} from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import express from 'express';

const browserPath=process.env.QBOT_TEST_BROWSER || [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
].find(existsSync);
assert.ok(browserPath,'Set QBOT_TEST_BROWSER to a Chrome or Edge executable.');
assert.ok(existsSync('dist/index.html'),'Run npm run build before the browser checks.');
const artifacts=path.resolve('../.test-artifacts/website-license-audit');
await mkdir(artifacts,{recursive:true});
const profile=await mkdtemp(path.join(artifacts,'browser-'));
const now=Date.now();
const user=(id,role)=>({id,role,email:id+'@example.invalid',name:id,isVerified:true,twoFactorEnabled:false,createdAt:new Date(now).toISOString()});
const admin=user('audit-admin','admin'),customer=user('audit-customer','customer'),unpaid=user('audit-unpaid','customer');
let subscription={id:'audit-sub',userId:customer.id,planId:'monthly',provider:'manual',status:'inactive',
  currentPeriodStart:new Date(now-1000).toISOString(),currentPeriodEnd:new Date(now-1).toISOString(),maxDevices:1,cancelAtPeriodEnd:false};
const inactive={...subscription,id:'unpaid-sub',userId:unpaid.id};
const payment={id:'audit-payment',orderId:'AUDIT-ORDER',email:customer.email,planId:'monthly',utrNumber:'123456789012',status:'pending',createdAt:new Date(now).toISOString()};
let licenses=[],lastKey='',lastNote=null,lastPayment=null,failLicenseList=false,failIssuance=false,failNote=true;
const app=express();
app.use(express.json());
app.use('/api',(_req,res,next)=>{res.setHeader('Cache-Control','no-store');next();});
app.get('/api/auth/me',(req,res)=>{
  const current=req.headers.authorization==='Bearer audit-admin'?admin:req.headers.authorization==='Bearer audit-customer'?customer:null;
  if (!current) return res.status(401).json({error:'Test login required.'});
  res.json({user:current,subscription:current.role==='customer'?subscription:null,devices:[],licenses:current.role==='customer'?licenses:[],maxDevices:1});
});
app.get('/api/admin/users',(_req,res)=>res.json({users:[admin,{...customer,subscription,devicesCount:0},{...unpaid,subscription:inactive,devicesCount:0}]}));
app.get('/api/admin/metrics',(_req,res)=>res.json({totalCustomers:2,activeSubscriptions:subscription.status==='active'?1:0,activeLicenses:0,expiredSubscriptions:0,mrr:0,activeDevicesCount:0}));
app.get('/api/admin/audit-logs',(_req,res)=>res.json([]));
app.get('/api/database/status',(_req,res)=>res.json({supabase:{connected:true,configured:true,message:'Disposable test database'}}));
app.get('/api/admin/pending-payments',(_req,res)=>res.json({payments:[payment]}));
app.post('/api/admin/verify-manual-payment',(req,res)=>{
  assert.equal(req.body.paymentId,payment.id);
  payment.status='verified';payment.userId=customer.id;
  subscription={...subscription,status:'active',currentPeriodEnd:new Date(now+30*86400000).toISOString()};
  res.json({success:true,user:customer,payment,message:'Payment approved. Generate the customer license key.'});
});
app.get('/api/admin/licenses',(req,res)=>{
  if(failLicenseList){failLicenseList=false;return res.status(503).json({error:'Test license list unavailable.'});}
  res.json({licenses:licenses.filter(license=>!req.query.userId || license.user_id===req.query.userId)});
});
app.post('/api/admin/licenses',(req,res)=>{
  assert.equal(req.body.userId,customer.id);
  assert.equal(subscription.status,'active');
  if(failIssuance){failIssuance=false;return res.status(503).json({error:'Licensing database unavailable. Please try again shortly.'});}
  lastKey='QB2-'+crypto.randomBytes(24).toString('hex').toUpperCase().match(/.{8}/g).join('-');
  licenses=licenses.map(license=>license.status==='issued'?{...license,status:'revoked'}:license);
  const license={id:crypto.randomUUID(),user_id:customer.id,subscription_id:subscription.id,key_prefix:lastKey.slice(0,12),status:'issued',
    device_id:null,expires_at:subscription.currentPeriodEnd,issued_at:new Date().toISOString(),activated_at:null,revoked_at:null};
  licenses.unshift(license);
  res.status(201).json({licenseKey:lastKey,license});
});
app.post('/api/admin/licenses/:id/revoke',(req,res)=>{
  licenses=licenses.map(license=>license.id===req.params.id?{...license,status:'revoked'}:license);
  res.json({revoked:true});
});
app.post('/api/admin/support-notes',(req,res)=>{
  lastNote=req.body;
  if(failNote){failNote=false;return res.status(503).json({error:'Test support note failure.'});}
  res.json({id:'audit-note',...req.body});
});
app.post('/api/billing/submit-manual-payment',(req,res)=>{
  lastPayment=req.body;
  res.json({success:true,payment:{...req.body,status:'pending'}});
});
app.use('/api',(_req,res)=>res.status(404).json({error:'Unexpected fixture request.'}));
app.use(express.static(path.resolve('dist')));
const server=app.listen(0,'127.0.0.1');
await new Promise(resolve=>server.once('listening',resolve));
const origin='http://127.0.0.1:'+server.address().port;
const browser=spawn(browserPath,['--headless=new','--remote-debugging-port=0','--no-first-run','--no-default-browser-check',
  '--disable-background-networking','--disable-component-update','--disable-extensions','--user-data-dir='+profile,'about:blank'],
  {windowsHide:true,stdio:['ignore','ignore','pipe']});
let connection,sessionId,sequence=0;
const pending=new Map(),runtimeErrors=[];
const send=(method,params={},session=sessionId)=>new Promise((resolve,reject)=>{
  const id=++sequence;
  const timeout=setTimeout(()=>{pending.delete(id);reject(new Error('Browser command timed out: '+method));},10000);
  pending.set(id,{resolve:value=>{clearTimeout(timeout);resolve(value);},reject:error=>{clearTimeout(timeout);reject(error);}});
  connection.send(JSON.stringify({id,method,params,...(session?{sessionId:session}:{})}));
});
const evaluate=async expression=>{
  const result=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
  if(result.exceptionDetails) throw new Error(result.exceptionDetails.text+': '+result.exceptionDetails.exception?.description);
  return result.result.value;
};
const waitFor=async(expression,description)=>{
  const until=Date.now()+10000;
  while(Date.now()<until){if(await evaluate(expression))return;await new Promise(resolve=>setTimeout(resolve,75));}
  throw new Error('Timed out: '+description+'; runtime errors: '+JSON.stringify(runtimeErrors)+'; page: '+await evaluate('document.body.textContent.slice(0,3500)'));
};
const click=async(label,scope='document')=>evaluate(`(()=>{const button=[...${scope}.querySelectorAll('button')].find(button=>button.textContent.trim()===${JSON.stringify(label)});if(!button||button.disabled)throw Error('Button unavailable: '+${JSON.stringify(label)});button.click();})()`);
const selectCustomer=async id=>{
  await evaluate(`(()=>{const select=document.querySelector('[aria-label="License customer"]');select.value=${JSON.stringify(id)};select.dispatchEvent(new Event('change',{bubbles:true}));})()`);
  await waitFor("[...document.querySelectorAll('button')].some(button=>button.textContent.trim()==='Refresh licenses'&&!button.disabled)",'license list refreshed');
};
const passed=[];
const pass=name=>{passed.push(name);console.log('PASS '+name);};
try {
  const endpoint=await new Promise((resolve,reject)=>{
    let log='';const timer=setTimeout(()=>reject(new Error('Headless browser did not start. '+log.slice(-500))),20000);
    browser.once('error',error=>{clearTimeout(timer);reject(error);});
    browser.once('exit',code=>{clearTimeout(timer);reject(new Error('Headless browser exited: '+code));});
    browser.stderr.on('data',chunk=>{log+=chunk;const match=log.match(/DevTools listening on (ws:\/\/\S+)/);if(match){clearTimeout(timer);resolve(match[1]);}});
  });
  connection=new WebSocket(endpoint);
  await new Promise((resolve,reject)=>{connection.addEventListener('open',resolve,{once:true});connection.addEventListener('error',reject,{once:true});});
  connection.addEventListener('message',event=>{
    const message=JSON.parse(event.data);
    if(message.id){const request=pending.get(message.id);pending.delete(message.id);if(message.error)request?.reject(new Error(message.error.message));else request?.resolve(message.result);}
    if(message.method==='Runtime.exceptionThrown') runtimeErrors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
    if(message.method==='Fetch.requestPaused') {
      const {requestId,request}=message.params;
      send(request.url.startsWith(origin+'/')?'Fetch.continueRequest':'Fetch.failRequest',request.url.startsWith(origin+'/')?{requestId}:{requestId,errorReason:'BlockedByClient'}).catch(()=>{});
    }
  });
  const target=await send('Target.createTarget',{url:'about:blank'});
  sessionId=(await send('Target.attachToTarget',{targetId:target.targetId,flatten:true})).sessionId;
  await send('Page.enable');await send('Runtime.enable');
  await send('Fetch.enable',{patterns:[{urlPattern:'http*'}]});
  await send('Page.addScriptToEvaluateOnNewDocument',{source:"window.confirm=()=>true;Object.defineProperty(navigator,'clipboard',{value:{writeText:async value=>{if(window.__clipboardFailure)throw Error('Test clipboard failure');window.__copiedKey=value;}}});"});
  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  await send('Page.navigate',{url:origin+'/#admin'});
  await waitFor("Boolean(document.querySelector('input[type=password]'))",'admin login gate');
  await evaluate("localStorage.setItem('qbot2_token','audit-admin')");
  await send('Page.reload');
  await waitFor("Boolean(document.querySelector('#admin-license-controls'))",'admin controls');
  await selectCustomer(customer.id);
  assert.equal(await evaluate("[...document.querySelectorAll('button')].find(button=>button.textContent.trim()==='Generate license key').disabled"),true);
  assert.equal(await evaluate("document.body.innerText.includes('₹49,999')"),false);
  pass('unpaid customer cannot generate a key; metrics have no demo revenue');

  await click('Approve payment');
  await waitFor("[...document.querySelectorAll('button')].some(button=>button.textContent.trim()==='Generate license key'&&!button.disabled)",'approved customer selected');
  assert.equal(await evaluate("document.querySelector('[aria-label="+'"License customer"'+"]').value"),customer.id);
  assert.equal(await evaluate("document.querySelector('[aria-label="+'"License customer"'+"]').selectedOptions[0].textContent.includes('audit-customer — audit-customer@example.invalid')"),true);
  failIssuance=true;
  await click('Generate license key');
  await waitFor("document.body.innerText.includes('Licensing database unavailable.')",'failed hash save reported');
  assert.equal(await evaluate("Boolean(document.querySelector('dialog'))"),false);
  assert.equal(licenses.length,0);
  pass('database failure shows an error without a key popup and permits retry');

  await evaluate("(()=>{const button=[...document.querySelectorAll('button')].find(button=>button.textContent.trim()==='Generate license key');button.click();button.click();})()");
  await waitFor("Boolean(document.querySelector('[data-testid=issued-license-key]'))",'generated key');
  assert.equal(licenses.length,1);
  assert.equal(await evaluate("Boolean(document.querySelector('dialog:modal'))"),true);
  assert.equal(await evaluate("document.activeElement.textContent.trim()"),'Copy key');
  assert.equal(await evaluate("document.querySelector('[data-testid=issued-license-key]').textContent"),lastKey);
  assert.equal(await evaluate("document.querySelector('dialog').innerText.includes('Customer: audit-customer')"),true);
  assert.equal(await evaluate("document.body.innerText.includes('Send only to audit-customer@example.invalid')"),true);
  await click('Copy key');
  assert.equal(await evaluate('window.__copiedKey'),lastKey);
  pass('generation opens one copy popup for the named customer; duplicate clicks do not replace the key');
  const screenshot=await send('Page.captureScreenshot',{format:'png'});
  await writeFile(path.join(artifacts,'admin-license-controls.png'),Buffer.from(screenshot.data,'base64'));

  await click('Close and hide key');
  await waitFor("!document.querySelector('dialog')",'key popup removed');
  assert.equal(await evaluate('document.body.textContent.includes('+JSON.stringify(lastKey)+')'),false);
  assert.equal(await evaluate('(JSON.stringify(localStorage)+JSON.stringify(sessionStorage)).includes('+JSON.stringify(lastKey)+')'),false);
  await click('Refresh licenses');
  assert.equal(await evaluate("Boolean(document.querySelector('[data-testid=issued-license-key]'))"),false);
  pass('closing the popup clears the full key; refresh and browser storage cannot recover it');

  await send('Page.reload');
  await waitFor("Boolean(document.querySelector('#admin-license-controls'))",'reloaded controls');
  assert.equal(await evaluate("Boolean(document.querySelector('[data-testid=issued-license-key]'))"),false);
  assert.equal(await evaluate('document.body.innerText.includes('+JSON.stringify(lastKey)+')'),false);
  pass('raw key is not recovered from history or browser storage after reload');

  await selectCustomer(customer.id);
  failLicenseList=true;
  await click('Generate license key');
  await waitFor("document.body.innerText.includes('Test license list unavailable.')",'list failure surfaced');
  assert.equal(await evaluate("document.querySelector('[data-testid=issued-license-key]').textContent"),lastKey);
  await selectCustomer(unpaid.id);
  assert.equal(await evaluate("document.body.innerText.includes('Send only to audit-customer@example.invalid')"),true);
  pass('generated key survives a list failure and retains its recipient when selection changes');

  await evaluate('window.__clipboardFailure=true');
  await click('Copy key');
  await waitFor("document.querySelector('dialog').innerText.includes('Clipboard unavailable.')",'clipboard failure inside popup');
  assert.equal(await evaluate("document.querySelector('[data-testid=issued-license-key]').textContent"),lastKey);
  await evaluate('window.__clipboardFailure=false');
  await click('Copy key');
  assert.equal(await evaluate('window.__copiedKey'),lastKey);
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
  await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
  await waitFor("!document.querySelector('dialog')",'second key hidden');
  assert.equal(await evaluate('document.body.textContent.includes('+JSON.stringify(lastKey)+')'),false);
  pass('clipboard failure allows manual copy or retry; Escape also clears the key when closing');

  const customerRow="[...document.querySelectorAll('tr')].find(row=>row.innerText.includes('audit-customer@example.invalid')&&[...row.querySelectorAll('button')].some(button=>button.textContent.trim()==='Note'))";
  await click('Note','('+customerRow+')');
  await evaluate("(()=>{const input=document.querySelector('textarea');Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(input,'Payment checked by test admin.');input.dispatchEvent(new Event('input',{bubbles:true}));})()");
  await click('Save Memo');
  await waitFor("document.body.innerText.includes('Test support note failure.')",'rejected note visible');
  assert.equal(lastNote.content,'Payment checked by test admin.');
  assert.equal(await evaluate("Boolean(document.querySelector('textarea'))"),true);
  await click('Save Memo');
  await waitFor("!document.querySelector('textarea')",'note successfully saved');
  pass('support notes use the correct API field and errors keep the form open');

  await selectCustomer(customer.id);
  await click('Revoke',"document.querySelector('#admin-license-controls')");
  await waitFor("document.body.innerText.includes('License revoked.')",'revocation feedback');
  assert.equal(licenses.every(license=>license.status==='revoked'),true);
  pass('revocation updates the license list and removes the generated key');

  subscription={...subscription,currentPeriodEnd:new Date(now-10000).toISOString()};
  licenses=[{...licenses[0],status:'active',device_id:'audit-pc',expires_at:subscription.currentPeriodEnd,
    device:{id:'audit-pc',device_name:'Audit Windows PC',machine_hash:'a'.repeat(64),status:'online',last_heartbeat_at:new Date(now).toISOString()}}];
  await evaluate("localStorage.setItem('qbot2_token','audit-customer');location.hash='dashboard'");
  await send('Page.reload');
  await waitFor("document.body.textContent.includes('Windows PC license')&&document.body.textContent.includes('Subscription Expired')",'customer expiry');
  assert.equal(await evaluate("document.body.textContent.includes('Active Subscription')"),false);
  assert.equal(await evaluate("document.body.innerText.includes('Device ID: audit-pc')"),true);
  pass('expired paid period is not displayed as active; registered PC is shown');
  subscription={...subscription,currentPeriodEnd:new Date(now+60*86400000).toISOString()};
  await evaluate("document.querySelector('[title="+'"Refresh Status"'+"]').click()");
  await waitFor("document.body.innerText.includes('Your subscription has been extended.')",'renewal needs new key');
  pass('renewal shows that the old PC key still requires replacement');

  await click('Renew subscription');
  await waitFor("Boolean(document.querySelector('[placeholder="+'"e.g. 408912345678"'+"]'))",'renewal payment form');
  await evaluate("(()=>{const input=document.querySelector('[placeholder="+'"e.g. 408912345678"'+"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'987654321012');input.dispatchEvent(new Event('input',{bubbles:true}));})()");
  await click('Submit Verification Request');
  await waitFor("document.body.innerText.includes('Payment Verification Submitted!')",'payment submitted');
  assert.equal(lastPayment.email,customer.email);
  assert.match(lastPayment.orderId,/^ORD-[A-F0-9]{16}$/);
  await click('Close Window');
  await click('Renew subscription');
  await waitFor("Boolean(document.querySelector('[placeholder="+'"e.g. 408912345678"'+"]'))",'fresh renewal form');
  assert.equal(await evaluate("document.querySelector('[placeholder="+'"e.g. 408912345678"'+"]').value"),'');
  assert.equal(await evaluate("document.body.innerText.includes('Payment Verification Submitted!')"),false);
  await evaluate("document.querySelector('[aria-label="+'"Close Payment Modal"'+"]').click()");
  pass('renewal payment form opens a new receipt after a previous submission');

  await send('Page.navigate',{url:origin+'/#admin'});
  await waitFor("Boolean(document.querySelector('input[type=password]'))&&!document.querySelector('#admin-license-controls')",'customer denied admin controls');
  assert.deepEqual(runtimeErrors,[]);
  pass('customer cannot open admin controls; frontend has no uncaught errors');
  await writeFile(path.join(artifacts,'browser-results.json'),JSON.stringify({passed,fixtureOnly:true},null,2));
  console.log(passed.length+' browser checks passed. Screenshot: '+path.join(artifacts,'admin-license-controls.png'));
} finally {
  if(connection?.readyState===WebSocket.OPEN){try{await send('Browser.close',{},null);}catch{}connection.close();}
  if(browser.exitCode===null)browser.kill();
  server.closeAllConnections();await new Promise(resolve=>server.close(resolve));
}
