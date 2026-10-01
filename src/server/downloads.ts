import {Router, type RequestHandler} from 'express';
import {createHash} from 'node:crypto';
import {createWriteStream} from 'node:fs';
import {mkdtemp, unlink, rmdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {Readable, Transform} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import type {ReadableStream} from 'node:stream/web';
import {authenticateToken, type AuthenticatedRequest} from './auth.ts';
import {db} from './db.ts';
import type {DownloadItem, Subscription} from '../types.ts';
import {hasActiveSubscription} from '../subscriptions.ts';

export function hasDownloadEntitlement(subscription: Subscription | null, now=Date.now()): boolean {
  return hasActiveSubscription(subscription, now);
}

function releaseConfig(platform: string) {
  const prefix = platform === 'windows' ? 'LICENSED_WINDOWS' : 'LICENSED_ANDROID';
  const url = process.env[`${prefix}_DOWNLOAD_URL`]?.trim() || '';
  const sha256 = process.env[`${prefix}_DOWNLOAD_SHA256`]?.trim().toLowerCase() || '';
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password || !/^[a-f0-9]{64}$/.test(sha256)) return null;
  } catch { return null; }
  return {url, sha256, size: process.env[`${prefix}_DOWNLOAD_SIZE`] || 'See download'};
}

// Legacy APP_DOWNLOAD_* / APK_DOWNLOAD_* settings must never enable a release.
export const licensingService = {
  getAvailableDownloads(entitled: boolean): DownloadItem[] {
    const windows = releaseConfig('windows');
    const android = releaseConfig('android');
    return [
      {id:'dl_win_backend',title:'QBot2 Windows Backend',platform:'windows',version:'2.5.0',
        filename:'QBot2-Licensed-Windows-2.5.0.zip',size:windows?.size || 'See download',
        releaseDate:'2026-09-27',downloadUrl:entitled && windows ? '/api/downloads/file/windows' : '',
        sha256:windows?.sha256 || '',
        changelog:['Seller-issued keys and device-bound activation','Windows-protected activation storage','Subscription checks at startup and before new trades']},
      {id:'dl_android_apk',title:'QBot2 Android Companion',platform:'android',version:'2.5.0',
        filename:'QBot2-Licensed-Android-2.5.0.apk',size:android?.size || 'See download',
        releaseDate:'2026-09-27',downloadUrl:entitled && android ? '/api/downloads/file/android' : '',
        sha256:android?.sha256 || '',
        changelog:['License activation before opening the dashboard','Renewal key entry in Settings','Windows PC connection and subscription status']}
    ];
  }
};

export function createDownloadRouter(options: {fetchRelease?: typeof fetch} = {}) {
  const router = Router();
  const fetchRelease = options.fetchRelease || fetch;
  router.use((_req, res, next) => {
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
  });
  router.use(authenticateToken);

  router.get('/', (async (req: AuthenticatedRequest, res) => {
    try {
      const sub = await db.getSubscription(req.user!.id);
      const isEntitled = hasDownloadEntitlement(sub);
      res.json({isEntitled, subscriptionStatus: sub?.status || 'none', downloads: licensingService.getAvailableDownloads(isEntitled)});
    } catch {
      res.status(503).json({error: 'Downloads temporarily unavailable. Please try again shortly.'});
    }
  }) as RequestHandler);

  router.get('/file/:platform', (async (req: AuthenticatedRequest, res) => {
    let temporary: string | undefined;
    let file: string | undefined;
    const disconnected = new AbortController();
    const abort = () => { if (!res.writableFinished) disconnected.abort(); };
    res.on('close', abort);
    try {
      const platform = req.params.platform;
      if (platform !== 'windows' && platform !== 'android') {
        res.status(404).json({error: 'Unknown platform.'});
        return;
      }
      if (!hasDownloadEntitlement(await db.getSubscription(req.user!.id))) {
        res.status(403).json({error: 'An active paid subscription is required to download.'});
        return;
      }
      const release = releaseConfig(platform);
      if (!release) {
        res.status(503).json({error: 'The licensed release is not available yet. Please try again later.'});
        return;
      }
      const signal = AbortSignal.any([disconnected.signal, AbortSignal.timeout(120_000)]);
      const upstream = await fetchRelease(release.url, {signal});
      if (!upstream.ok || !upstream.body) {
        await upstream.body?.cancel();
        throw new Error('Release storage unavailable');
      }

      // Verify the entire artifact before serving any bytes. A changed URL or
      // CDN error page must not silently deliver a different (legacy) binary.
      temporary = await mkdtemp(path.join(tmpdir(), 'qbot-download-'));
      file = path.join(temporary, 'release');
      const hash = createHash('sha256');
      let bytes = 0;
      const verifier = new Transform({transform(chunk, _encoding, callback) {
        bytes += chunk.length;
        if (bytes > 1024 * 1024 * 1024) return callback(new Error('Release exceeds 1 GiB'));
        hash.update(chunk);
        callback(null, chunk);
      }});
      await pipeline(Readable.fromWeb(upstream.body as ReadableStream), verifier, createWriteStream(file), {signal});
      if (!bytes || hash.digest('hex') !== release.sha256) throw new Error('Release checksum mismatch');
      if (!hasDownloadEntitlement(await db.getSubscription(req.user!.id))) {
        res.status(403).json({error: 'Your subscription is no longer active. Please renew before downloading.'});
        return;
      }
      const item = licensingService.getAvailableDownloads(true).find(item => item.platform === platform)!;
      res.type(platform === 'windows' ? 'application/zip' : 'application/vnd.android.package-archive');
      await new Promise<void>((resolve, reject) => {
        res.download(file!, item.filename, {cacheControl: false, acceptRanges: false, lastModified: false}, error => error ? reject(error) : resolve());
      });
    } catch {
      if (!res.headersSent && !res.destroyed) {
        res.removeHeader('Content-Disposition');
        res.removeHeader('Content-Length');
        res.removeHeader('Content-Type');
        res.status(503).json({error: 'The licensed download is unavailable. Please try again later.'});
      } else if (!res.destroyed) res.destroy();
    } finally {
      disconnected.abort();
      res.off('close', abort);
      if (file) await unlink(file).catch(() => {});
      if (temporary) await rmdir(temporary).catch(() => {});
    }
  }) as RequestHandler);
  return router;
}
