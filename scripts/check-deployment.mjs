// Read-only probes. Never log in, submit a payment, create a challenge or issue a key.
const base = new URL(process.argv[2] || 'https://algotraders-ena2.onrender.com');
if (base.protocol !== 'https:' && base.hostname !== '127.0.0.1' && base.hostname !== 'localhost') throw new Error('Use HTTPS for a deployed website.');
const get = path => fetch(new URL(path, base), {signal: AbortSignal.timeout(25000), redirect: 'error'});
const results = await Promise.allSettled(['/api/health', '/api/admin/licenses', '/'].map(async path => {
  const response = await get(path);
  const content = await response.text();
  if (path === '/') {
    const assets = [...content.matchAll(/src="([^"\s]+\.js)"/g)].map(match => match[1]);
    const sources = await Promise.all(assets.map(async asset => {
      if (new URL(asset, base).origin !== base.origin) return '';
      return (await get(asset)).text();
    }));
    return {path, status: response.status, hasLicenseControls: sources.some(source => /Generate license key|Generate \/ replace key/.test(source))};
  }
  let data;
  try { data = JSON.parse(content); } catch { data = null; }
  return {path, status: response.status, json: data !== null,
    ...(path === '/api/health' ? {version: data?.version, licensing: data?.licensing} : {})};
}));
for (let i = 0; i < results.length; i++) {
  const result = results[i];
  console.log(JSON.stringify(result.status === 'fulfilled' ? result.value : {probe: i, error: result.reason?.message || 'Request failed', cause: result.reason?.cause?.code || result.reason?.cause?.message}));
}
const admin = results[1];
const page = results[2];
if (admin.status !== 'fulfilled' || admin.value.status !== 401 || !admin.value.json || page.status !== 'fulfilled' || !page.value.hasLicenseControls) process.exitCode = 1;
