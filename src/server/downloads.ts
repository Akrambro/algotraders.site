import {Router, type RequestHandler} from 'express';
import {createHash} from 'node:crypto';
import {createWriteStream, existsSync, readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import {mkdtemp, unlink, rmdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {Readable, Transform} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import type {ReadableStream} from 'node:stream/web';
import {authenticateToken, requireAdmin, type AuthenticatedRequest} from './auth.ts';
import {db} from './db.ts';
import type {DownloadItem, Subscription} from '../types.ts';
import {hasActiveSubscription} from '../subscriptions.ts';

export function hasDownloadEntitlement(subscription: Subscription | null, now=Date.now()): boolean {
  return hasActiveSubscription(subscription, now);
}

/**
 * Extracts Google Drive File ID from:
 * - https://drive.google.com/file/d/1abc.../view?usp=sharing
 * - https://drive.google.com/open?id=1abc...
 * - https://drive.google.com/uc?id=1abc...&export=download
 * - https://drive.usercontent.google.com/download?id=1abc...
 * - Raw 25-55 character file ID
 */
export function extractGoogleDriveFileId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  // Raw file ID (letters, numbers, hyphens, underscores)
  if (/^[a-zA-Z0-9_-]{20,70}$/.test(trimmed) && !trimmed.startsWith('http') && !trimmed.includes('/') && !trimmed.includes('.')) {
    return trimmed;
  }
  // Standard share URL: /file/d/FILE_ID
  const matchD = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]{20,70})/);
  if (matchD) return matchD[1];

  // URL query parameter: id=FILE_ID
  const matchId = trimmed.match(/[?&]id=([a-zA-Z0-9_-]{20,70})/);
  if (matchId) return matchId[1];

  return null;
}

export interface ReleaseConfig {
  url: string;
  sha256: string;
  size: string;
  fileId?: string;
  isGoogleDrive?: boolean;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const RELEASES_FILE = path.join(DATA_DIR, 'releases.json');

// Memory cache for dynamic releases
let dynamicReleases: Record<string, ReleaseConfig> = {};

function loadDynamicReleases(): void {
  try {
    if (existsSync(RELEASES_FILE)) {
      const content = readFileSync(RELEASES_FILE, 'utf-8');
      dynamicReleases = JSON.parse(content);
    }
  } catch {
    dynamicReleases = {};
  }
}

export function saveDynamicRelease(platform: 'windows' | 'android', config: { url: string; size?: string; sha256?: string }): ReleaseConfig {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
  loadDynamicReleases();
  const fileId = extractGoogleDriveFileId(config.url);
  const isGoogleDrive = Boolean(fileId);
  const effectiveUrl = isGoogleDrive
    ? `https://drive.google.com/uc?export=download&id=${fileId}`
    : config.url.trim();

  const saved: ReleaseConfig = {
    url: effectiveUrl,
    sha256: (config.sha256 || '').trim().toLowerCase(),
    size: config.size?.trim() || (isGoogleDrive ? '50+ MB (Google Drive)' : 'See download'),
    fileId: fileId || undefined,
    isGoogleDrive
  };

  dynamicReleases[platform] = saved;
  try {
    writeFileSync(RELEASES_FILE, JSON.stringify(dynamicReleases, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[Downloads] Could not persist releases.json:', err);
  }
  return saved;
}

// Initial load
loadDynamicReleases();

export function releaseConfig(platform: string): ReleaseConfig | null {
  loadDynamicReleases();
  if (dynamicReleases[platform]?.url) {
    return dynamicReleases[platform];
  }

  const prefix = platform === 'windows' ? 'LICENSED_WINDOWS' : 'LICENSED_ANDROID';
  // Check standard env or explicit GOOGLE_DRIVE_* env
  const rawUrl = (
    process.env[`${prefix}_DOWNLOAD_URL`] ||
    process.env[`GOOGLE_DRIVE_${platform.toUpperCase()}_URL`] ||
    process.env[`GOOGLE_DRIVE_${platform.toUpperCase()}_FILE_ID`] ||
    ''
  ).trim();

  const sha256 = process.env[`${prefix}_DOWNLOAD_SHA256`]?.trim().toLowerCase() || '';
  const gdriveId = extractGoogleDriveFileId(rawUrl);

  if (gdriveId) {
    // Valid Google Drive input (either full URL or raw ID)
    if (sha256 && !/^[a-f0-9]{64}$/.test(sha256)) return null;
    return {
      url: `https://drive.google.com/uc?export=download&id=${gdriveId}`,
      fileId: gdriveId,
      isGoogleDrive: true,
      sha256,
      size: process.env[`${prefix}_DOWNLOAD_SIZE`] || '50+ MB (Google Drive)'
    };
  }

  // Standard Direct HTTPS URL
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password || !/^[a-f0-9]{64}$/.test(sha256)) return null;
  } catch {
    return null;
  }
  return {
    url: rawUrl,
    sha256,
    size: process.env[`${prefix}_DOWNLOAD_SIZE`] || 'See download',
    isGoogleDrive: false
  };
}

/**
 * Downloads a file, automatically handling Google Drive virus scan warning pages
 * for files > 25MB-50MB.
 */
export async function fetchReleaseArtifact(
  release: ReleaseConfig,
  signal: AbortSignal,
  customFetch: typeof fetch = fetch
): Promise<Response> {
  const gdriveId = release.fileId || extractGoogleDriveFileId(release.url);

  if (!gdriveId) {
    // Standard direct HTTPS file
    return await customFetch(release.url, { signal });
  }

  // 1. First attempt: Direct usercontent endpoint with confirm=t
  const directUcUrl = `https://drive.usercontent.google.com/download?id=${gdriveId}&export=download&confirm=t`;
  try {
    const ucResp = await customFetch(directUcUrl, {
      signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const ucType = ucResp.headers.get('content-type') || '';
    if (ucResp.ok && !ucType.includes('text/html') && ucResp.body) {
      return ucResp;
    }
  } catch {
    // Fall through to standard endpoint
  }

  // 2. Second attempt: Standard uc?export=download
  const standardUrl = `https://drive.google.com/uc?export=download&id=${gdriveId}`;
  const initialResp = await customFetch(standardUrl, {
    signal,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });

  const initialType = initialResp.headers.get('content-type') || '';
  if (initialResp.ok && !initialType.includes('text/html') && initialResp.body) {
    return initialResp;
  }

  // 3. Large Google Drive file warning page (>25-50MB). Extract confirmation token!
  const html = await initialResp.text();
  const cookies = (typeof (initialResp.headers as any).getSetCookie === 'function'
    ? (initialResp.headers as any).getSetCookie().join('; ')
    : initialResp.headers.get('set-cookie')) || '';

  // Extract confirm token from form, URL, or cookie
  const confirmMatch =
    html.match(/name="confirm"\s+value="([^"]+)"/) ||
    html.match(/confirm=([a-zA-Z0-9_-]+)/) ||
    html.match(/download_warning_[^=]+=([^;]+)/);
  const uuidMatch = html.match(/name="uuid"\s+value="([^"]+)"/) || html.match(/uuid=([a-zA-Z0-9_-]+)/);

  let confirmUrl = `https://drive.usercontent.google.com/download?id=${gdriveId}&export=download`;
  if (confirmMatch) {
    confirmUrl += `&confirm=${confirmMatch[1]}`;
  } else {
    confirmUrl += `&confirm=t`;
  }
  if (uuidMatch) {
    confirmUrl += `&uuid=${uuidMatch[1]}`;
  }

  const formActionMatch = html.match(/<form[^>]+action="([^"]+)"/i);
  if (formActionMatch) {
    const rawAction = formActionMatch[1];
    try {
      const parsedAction = rawAction.startsWith('http')
        ? new URL(rawAction)
        : new URL(rawAction, 'https://drive.google.com');
      parsedAction.searchParams.set('id', gdriveId);
      parsedAction.searchParams.set('export', 'download');
      if (confirmMatch) parsedAction.searchParams.set('confirm', confirmMatch[1]);
      if (uuidMatch) parsedAction.searchParams.set('uuid', uuidMatch[1]);
      confirmUrl = parsedAction.toString();
    } catch {
      // Keep confirmUrl
    }
  }

  // Also check if an explicit "Download anyway" <a> tag exists
  const ucDownloadLinkMatch = html.match(/<a[^>]+id="uc-download-link"[^>]+href="([^"]+)"/i);
  if (ucDownloadLinkMatch) {
    const rawHref = ucDownloadLinkMatch[1].replace(/&amp;/g, '&');
    try {
      const parsedHref = rawHref.startsWith('http')
        ? new URL(rawHref)
        : new URL(rawHref, 'https://drive.google.com');
      confirmUrl = parsedHref.toString();
    } catch {
      // Keep confirmUrl
    }
  }

  // Issue the authenticated confirmation download request
  const confirmedResp = await customFetch(confirmUrl, {
    signal,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      ...(cookies ? { Cookie: cookies } : {})
    }
  });

  return confirmedResp;
}

// Legacy APP_DOWNLOAD_* / APK_DOWNLOAD_* settings must never enable a release.
export const licensingService = {
  getAvailableDownloads(entitled: boolean): DownloadItem[] {
    const windows = releaseConfig('windows');
    const android = releaseConfig('android');
    return [
      {
        id: 'dl_win_backend',
        title: 'QBot2 Windows Backend',
        platform: 'windows',
        version: '2.5.0',
        filename: 'QBot2-Licensed-Windows-2.5.0.zip',
        size: windows?.size || '50+ MB (Google Drive)',
        releaseDate: '2026-09-27',
        downloadUrl: entitled && windows ? '/api/downloads/file/windows' : '',
        sha256: windows?.sha256 || '',
        changelog: [
          'Seller-issued keys and device-bound activation',
          'Windows-protected activation storage',
          'Subscription checks at startup and before new trades'
        ]
      },
      {
        id: 'dl_android_apk',
        title: 'QBot2 Android Companion',
        platform: 'android',
        version: '2.5.0',
        filename: 'QBot2-Licensed-Android-2.5.0.apk',
        size: android?.size || '50+ MB (Google Drive)',
        releaseDate: '2026-09-27',
        downloadUrl: entitled && android ? '/api/downloads/file/android' : '',
        sha256: android?.sha256 || '',
        changelog: [
          'License activation before opening the dashboard',
          'Renewal key entry in Settings',
          'Windows PC connection and subscription status'
        ]
      }
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

  // Public endpoint for checking release status info (requires login)
  router.get('/', authenticateToken, (async (req: AuthenticatedRequest, res) => {
    try {
      const sub = await db.getSubscription(req.user!.id);
      const isEntitled = hasDownloadEntitlement(sub);
      res.json({
        isEntitled,
        subscriptionStatus: sub?.status || 'none',
        downloads: licensingService.getAvailableDownloads(isEntitled)
      });
    } catch {
      res.status(503).json({error: 'Downloads temporarily unavailable. Please try again shortly.'});
    }
  }) as RequestHandler);

  // Authenticated file streaming endpoint
  router.get('/file/:platform', authenticateToken, (async (req: AuthenticatedRequest, res) => {
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

      const signal = AbortSignal.any([disconnected.signal, AbortSignal.timeout(300_000)]);
      let upstream: Response;

      if (options.fetchRelease) {
        upstream = await options.fetchRelease(release.url, {signal});
      } else {
        upstream = await fetchReleaseArtifact(release, signal, fetchRelease);
      }

      if (!upstream.ok || !upstream.body) {
        await upstream.body?.cancel();
        throw new Error('Release storage unavailable');
      }

      // Buffer and verify artifact before sending bytes
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

      // If SHA-256 is configured, enforce strict verification
      if (!bytes || (release.sha256 && hash.digest('hex') !== release.sha256)) {
        throw new Error('Release checksum mismatch');
      }

      if (!hasDownloadEntitlement(await db.getSubscription(req.user!.id))) {
        res.status(403).json({error: 'Your subscription is no longer active. Please renew before downloading.'});
        return;
      }

      const item = licensingService.getAvailableDownloads(true).find(item => item.platform === platform)!;
      res.type(platform === 'windows' ? 'application/zip' : 'application/vnd.android.package-archive');
      await new Promise<void>((resolve, reject) => {
        res.download(file!, item.filename, {cacheControl: false, acceptRanges: false, lastModified: false}, error => error ? reject(error) : resolve());
      });
    } catch (err: any) {
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

  // Admin endpoints for managing releases
  router.get('/admin/config', authenticateToken, requireAdmin, ((_req: AuthenticatedRequest, res) => {
    loadDynamicReleases();
    const win = releaseConfig('windows');
    const android = releaseConfig('android');
    res.json({
      windows: {
        configured: Boolean(win),
        url: win?.url || '',
        fileId: win?.fileId || '',
        isGoogleDrive: Boolean(win?.isGoogleDrive),
        size: win?.size || '',
        sha256: win?.sha256 || ''
      },
      android: {
        configured: Boolean(android),
        url: android?.url || '',
        fileId: android?.fileId || '',
        isGoogleDrive: Boolean(android?.isGoogleDrive),
        size: android?.size || '',
        sha256: android?.sha256 || ''
      }
    });
  }) as RequestHandler);

  router.post('/admin/config', authenticateToken, requireAdmin, (async (req: AuthenticatedRequest, res) => {
    const { platform, url, size, sha256 } = req.body || {};
    if (platform !== 'windows' && platform !== 'android') {
      res.status(400).json({ error: 'Platform must be "windows" or "android".' });
      return;
    }
    if (!url || typeof url !== 'string' || !url.trim()) {
      res.status(400).json({ error: 'A valid Google Drive URL or File ID is required.' });
      return;
    }

    const saved = saveDynamicRelease(platform, { url, size, sha256 });
    res.json({
      success: true,
      message: `Release configuration for ${platform} updated successfully.`,
      release: saved
    });
  }) as RequestHandler);

  return router;
}
