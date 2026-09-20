import crypto from 'crypto';
import { db } from './db.ts';
import { LicenseValidationResponse, DownloadItem } from '../types.ts';

const APP_DOWNLOAD_URL = process.env.APP_DOWNLOAD_URL || 'https://releases.algotrders.site/qbot2-windows-latest.zip';
const APK_DOWNLOAD_URL = process.env.APK_DOWNLOAD_URL || 'https://releases.algotrders.site/qbot2-android-v2.1.0.apk';
const JWT_SECRET = process.env.JWT_SECRET || 'algotrders_qbot2_production_secret_key_2026';

export const licensingService = {
  async validateLicense(
    deviceId: string,
    hardwareFingerprint?: string,
    ipAddress?: string
  ): Promise<LicenseValidationResponse> {
    const devices = await db.getAllActiveDevices();
    const device = devices.find((d) => d.id === deviceId);

    if (!device) {
      return {
        valid: false,
        entitlementId: 'invalid_device',
        status: 'suspended',
        planId: 'trial',
        maxDevices: 0,
        expiresAt: new Date(0).toISOString(),
        offlineGracePeriodHours: 0,
        tradingAllowed: false,
        message: 'Device not recognized. Please pair your Windows PC from the Algo Trders dashboard.'
      };
    }

    if (device.status === 'revoked') {
      return {
        valid: false,
        entitlementId: 'revoked',
        status: 'suspended',
        planId: 'trial',
        maxDevices: 0,
        expiresAt: new Date(0).toISOString(),
        offlineGracePeriodHours: 0,
        tradingAllowed: false,
        message: 'This device authorization has been revoked by the account owner.'
      };
    }

    // Update heartbeat
    await db.updateDeviceHeartbeat(device.id, ipAddress);

    // Retrieve user's subscription
    const sub = await db.getSubscription(device.userId);
    if (!sub) {
      return {
        valid: false,
        entitlementId: 'no_subscription',
        status: 'expired',
        planId: 'trial',
        maxDevices: 1,
        expiresAt: new Date(0).toISOString(),
        offlineGracePeriodHours: 0,
        tradingAllowed: false,
        message: 'No subscription record found for device owner.'
      };
    }

    const now = new Date();
    const periodEnd = new Date(sub.currentPeriodEnd);
    const isPastDue = now > periodEnd;

    const isEntitlementActive =
      (sub.status === 'active' || sub.status === 'trialing') && !isPastDue;

    const tradingAllowed = isEntitlementActive && sub.status !== 'suspended' && sub.status !== 'past_due';

    // Sign payload with HMAC so the Windows executable can cryptographically verify server integrity
    const payloadToSign = `${device.id}:${sub.id}:${tradingAllowed}:${sub.currentPeriodEnd}`;
    const signature = crypto.createHmac('sha256', JWT_SECRET).update(payloadToSign).digest('hex');

    return {
      valid: isEntitlementActive,
      entitlementId: sub.id,
      status: isPastDue ? 'expired' : sub.status,
      planId: sub.planId,
      maxDevices: sub.maxDevices,
      expiresAt: sub.currentPeriodEnd,
      offlineGracePeriodHours: 12, // 12-hour offline safety grace window
      tradingAllowed,
      message: tradingAllowed
        ? 'License active and verified. Live algorithmic trading allowed.'
        : `Trading disabled: Subscription status is ${sub.status}. Please renew your plan at https://algotrders.site/dashboard`,
      signature
    };
  },

  getAvailableDownloads(hasActiveEntitlement: boolean): DownloadItem[] {
    const list: DownloadItem[] = [
      {
        id: 'dl_win_backend',
        title: 'QBot2 Trading Windows Backend',
        version: 'v2.4.1 Stable',
        platform: 'windows',
        filename: 'QBot2-Windows-Backend-Setup-v2.4.1.zip',
        size: '64.2 MB',
        releaseDate: '2026-03-15',
        downloadUrl: hasActiveEntitlement ? APP_DOWNLOAD_URL : '',
        sha256: '9f83a0a3841029c786a34bcf93f54817a0b0ea37e8c33a921d74a106f34582f1',
        changelog: [
          'Direct local port 8000 WebSocket engine for ultra-low latency',
          'Automated Supertrend ATR calculation pipeline',
          'Encrypted local storage for broker API secrets',
          'Added automatic cloud license validation handshake'
        ]
      },
      {
        id: 'dl_android_apk',
        title: 'QBot2 Mobile Monitor Android App',
        version: 'v2.1.0',
        platform: 'android',
        filename: 'QBot2-Mobile-Monitor-v2.1.0.apk',
        size: '18.7 MB',
        releaseDate: '2026-03-18',
        downloadUrl: hasActiveEntitlement ? APK_DOWNLOAD_URL : '',
        sha256: '3a8820f861b5c479374c43d83ee662b66299b9cfecba5c3d4f40f2b38062953a',
        changelog: [
          'Automatic discovery of Windows PC on local Wi-Fi',
          'Live candlestick charting with Supertrend overlays',
          'One-tap emergency trading pause and asset filter toggles',
          'Push notifications for executed trades and daily risk limits'
        ]
      },
      {
        id: 'dl_setup_guide',
        title: 'QBot2 Official Installation & Pairing Guide',
        version: 'v2.4',
        platform: 'documentation',
        filename: 'QBot2-Setup-And-Network-Guide.pdf',
        size: '2.4 MB',
        releaseDate: '2026-03-12',
        downloadUrl: hasActiveEntitlement ? 'https://docs.algotrders.site/QBot2-Setup-Guide.pdf' : '',
        sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        changelog: [
          'Windows Firewall port 8000 exception setup',
          'Wi-Fi router client isolation configuration tips',
          'Practice account setup on major brokers'
        ]
      },
      {
        id: 'dl_release_notes',
        title: 'QBot2 Complete Release Notes & Changelog',
        version: 'v2.4.1',
        platform: 'documentation',
        filename: 'QBot2-Changelog-v2.4.1.pdf',
        size: '1.1 MB',
        releaseDate: '2026-03-18',
        downloadUrl: hasActiveEntitlement ? 'https://docs.algotrders.site/QBot2-Changelog.pdf' : '',
        sha256: 'a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0',
        changelog: [
          'Full security review audit results',
          'Supertrend algorithm parameter backtest benchmarks',
          'Broker API latency benchmarks'
        ]
      }
    ];

    return list;
  }
};
