import assert from 'node:assert/strict';
import {afterEach, beforeEach, mock, test} from 'node:test';
import {createHash} from 'node:crypto';
import express from 'express';
import {authService} from '../src/server/auth.ts';
import {db} from '../src/server/db.ts';
import {createDownloadRouter} from '../src/server/downloads.ts';
import type {Subscription, User} from '../src/types.ts';

const customer = {id: 'download-customer', email: 'test@example.invalid', role: 'customer'} as User;
const artifact = Buffer.from('PK\x03\x04licensed release fixture');
const digest = createHash('sha256').update(artifact).digest('hex');
const envNames = ['APP_DOWNLOAD_URL', 'APK_DOWNLOAD_URL', 'APP_DOWNLOAD_SHA256', 'APK_DOWNLOAD_SHA256',
  ...['WINDOWS', 'ANDROID'].flatMap(platform => ['URL', 'SHA256', 'SIZE'].map(field => `LICENSED_${platform}_DOWNLOAD_${field}`))];
const originalEnv = Object.fromEntries(envNames.map(name => [name, process.env[name]]));
let subscription: Subscription | null;
let calls: string[];
let upstream: () => Promise<Response>;

beforeEach(() => {
  for (const name of envNames) delete process.env[name];
  subscription = {status: 'active', currentPeriodStart: new Date(Date.now() - 60_000).toISOString(),
    currentPeriodEnd: new Date(Date.now() + 60_000).toISOString()} as Subscription;
  mock.method(db, 'findUserById', async () => customer);
  mock.method(db, 'getSubscription', async () => subscription);
  calls = [];
  upstream = async () => new Response(artifact);
});
afterEach(() => {
  mock.restoreAll();
  for (const [name, value] of Object.entries(originalEnv)) {
    if (value === undefined) delete process.env[name]; else process.env[name] = value;
  }
});

function configure() {
  for (const platform of ['WINDOWS', 'ANDROID']) {
    process.env[`LICENSED_${platform}_DOWNLOAD_URL`] = `https://releases.example.invalid/licensed-${platform}`;
    process.env[`LICENSED_${platform}_DOWNLOAD_SHA256`] = digest;
  }
}

async function withHttp(run: (get: (path: string, token?: string | null) => Promise<Response>) => Promise<void>) {
  const app = express();
  app.use('/api/downloads', createDownloadRouter({fetchRelease: async (url) => {
    calls.push(String(url));
    return upstream();
  }}));
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve, reject) => {server.once('listening', resolve); server.once('error', reject);});
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  try {
    await run((route, token = authService.generateToken(customer)) => fetch(`http://127.0.0.1:${address.port}/api/downloads${route}`, {
      headers: token ? {Authorization: `Bearer ${token}`} : {}, redirect: 'manual'
    }));
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
}

test('catalog and direct files require a valid login; no upstream access occurs on rejection', async () => {
  configure();
  await withHttp(async get => {
    for (const route of ['', '/file/windows', '/file/android']) {
      for (const token of [null, 'forged-token']) {
        const response = await get(route, token);
        assert.equal(response.status, 401);
        assert.match(response.headers.get('cache-control')!, /no-store/);
      }
    }
  });
  assert.deepEqual(calls, []);
});

test('trial, inactive, expired, future and missing subscriptions cannot download', async () => {
  configure();
  const active = {...subscription!};
  await withHttp(async get => {
    const denied: Array<Subscription | null> = [null,
      ...['trialing', 'inactive', 'pending', 'halted', 'past_due', 'canceled', 'unpaid', 'expired', 'suspended'].map(status => ({...active, status} as Subscription)),
      {...active, currentPeriodEnd: new Date(Date.now() - 1).toISOString()},
      {...active, currentPeriodStart: new Date(Date.now() + 60_000).toISOString()},
      {...active, currentPeriodEnd: 'invalid'}];
    for (const sub of denied) {
      subscription = sub;
      const data = await (await get('')).json();
      assert.equal(data.isEntitled, false);
      assert.ok(data.downloads.every((item: any) => item.downloadUrl === ''));
      for (const platform of ['windows', 'android']) assert.equal((await get(`/file/${platform}`)).status, 403);
    }
  });
  assert.deepEqual(calls, []);
});

test('old release settings never enable downloads, even with an active subscription', async () => {
  process.env.APP_DOWNLOAD_URL = 'https://legacy.example.invalid/unlicensed.zip';
  process.env.APK_DOWNLOAD_URL = 'https://legacy.example.invalid/unlicensed.apk';
  process.env.APP_DOWNLOAD_SHA256 = process.env.APK_DOWNLOAD_SHA256 = digest;
  await withHttp(async get => {
    const data = await (await get('')).json();
    assert.equal(data.isEntitled, true);
    assert.ok(data.downloads.every((item: any) => item.downloadUrl === '' && item.sha256 === ''));
    for (const platform of ['windows', 'android']) {
      const response = await get(`/file/${platform}`);
      assert.equal(response.status, 503);
      assert.equal(response.headers.get('location'), null);
      assert.equal(response.headers.get('content-disposition'), null);
    }
  });
  assert.deepEqual(calls, []);
});

test('missing checksums and invalid release URLs keep the release unavailable', async () => {
  await withHttp(async get => {
    for (const [url, sha] of [['https://releases.example.invalid/new.zip', ''],
      ['https://releases.example.invalid/new.zip', 'not-a-checksum'], ['http://releases.example.invalid/new.zip', digest],
      ['not-a-url', digest], ['https://user:password@releases.example.invalid/new.zip', digest]]) {
      process.env.LICENSED_WINDOWS_DOWNLOAD_URL = url;
      process.env.LICENSED_WINDOWS_DOWNLOAD_SHA256 = sha;
      assert.equal((await get('/file/windows')).status, 503);
      assert.equal((await (await get('')).json()).downloads[0].downloadUrl, '');
    }
  });
  assert.deepEqual(calls, []);
});

test('only verified release bytes are served, with internal links and correct attachment names', async () => {
  configure();
  await withHttp(async get => {
    const data = await (await get('')).json();
    assert.ok(!JSON.stringify(data).includes('releases.example.invalid'));
    for (const platform of ['windows', 'android']) {
      const item = data.downloads.find((entry: any) => entry.platform === platform);
      assert.equal(item.downloadUrl, `/api/downloads/file/${platform}`);
      const response = await get(`/file/${platform}`);
      assert.equal(response.status, 200);
      assert.match(response.headers.get('content-disposition')!, new RegExp(item.filename.replaceAll('.', '\\.')));
      assert.match(response.headers.get('cache-control')!, /no-store/);
      assert.equal(response.headers.get('location'), null);
      assert.deepEqual(Buffer.from(await response.arrayBuffer()), artifact);
    }
  });
  assert.equal(calls.length, 2);
});

test('storage errors, corrupted streams and substituted binaries fail without a redirect or attachment', async () => {
  configure();
  await withHttp(async get => {
    const failures = [
      async () => new Response('missing', {status: 404}),
      async () => new Response('storage down', {status: 500}),
      async () => new Response(null, {status: 204}),
      async () => new Response('old unlicensed binary'),
      async () => new Response('<html>error page</html>'),
      async () => new Response(new ReadableStream({start(controller) {controller.error(new Error('broken transfer'));}})),
      async () => {throw new Error('network unavailable');}
    ];
    for (const failure of failures) {
      upstream = failure;
      const response = await get('/file/windows');
      assert.equal(response.status, 503);
      assert.equal(response.headers.get('location'), null);
      assert.equal(response.headers.get('content-disposition'), null);
      assert.match(response.headers.get('content-type')!, /application\/json/);
      assert.match((await response.json()).error, /licensed download is unavailable/);
    }
  });
  assert.equal(calls.length, 7);
});

test('subscription is checked again after fetching the file', async () => {
  configure();
  upstream = async () => {subscription = null; return new Response(artifact);};
  await withHttp(async get => {
    const response = await get('/file/windows');
    assert.equal(response.status, 403);
    assert.equal(response.headers.get('content-disposition'), null);
  });
});

test('unknown platforms and database outages cannot fall through to a download', async () => {
  configure();
  await withHttp(async get => {
    assert.equal((await get('/file/legacy')).status, 404);
    mock.method(db, 'getSubscription', async () => {throw new Error('database unavailable');});
    assert.equal((await get('')).status, 503);
    assert.equal((await get('/file/windows')).status, 503);
  });
  assert.deepEqual(calls, []);
});

test('Google Drive releases are supported via URL or raw File ID without redirects', async () => {
  const gdriveId = '1a2B3c4D5e6F7g8H9i0JklmnOPQRstuvw';
  process.env.LICENSED_WINDOWS_DOWNLOAD_URL = `https://drive.google.com/file/d/${gdriveId}/view?usp=sharing`;
  process.env.LICENSED_WINDOWS_DOWNLOAD_SIZE = '58 MB';
  await withHttp(async get => {
    const data = await (await get('')).json();
    assert.equal(data.isEntitled, true);
    const winItem = data.downloads.find((d: any) => d.platform === 'windows');
    assert.ok(winItem);
    assert.equal(winItem.downloadUrl, '/api/downloads/file/windows');
    assert.equal(winItem.size, '58 MB');

    const fileResp = await get('/file/windows');
    assert.equal(fileResp.status, 200);
    assert.equal(fileResp.headers.get('location'), null);
    assert.match(fileResp.headers.get('content-disposition')!, /QBot2-Licensed-Windows-2\.5\.0\.zip/);
    assert.deepEqual(Buffer.from(await fileResp.arrayBuffer()), artifact);
  });
  assert.equal(calls.length, 1);
});

