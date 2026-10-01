import crypto from 'crypto';
import { db } from './db.ts';
import { LicenseValidationResponse, DownloadItem } from '../types.ts';

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

  // Retired snapshot: never publish old artifacts, even if legacy settings remain.
  getAvailableDownloads(_hasActiveEntitlement: boolean): DownloadItem[] {
    return [];
  }
};
