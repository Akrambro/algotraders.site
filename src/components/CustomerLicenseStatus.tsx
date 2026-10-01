import React from 'react';
import type {LicenseRecord, Subscription} from '../types.ts';
import {getLicenseStatus} from '../license-status.ts';
import {hasActiveSubscription} from '../subscriptions.ts';

export function CustomerLicenseStatus({licenses, subscription, onActivate}: {
  licenses: LicenseRecord[]; subscription: Subscription | null; onActivate: () => void;
}) {
  const current = licenses.find(license => license.status === 'active');
  const pending = licenses.find(license => license.status === 'issued' && Date.parse(license.expires_at) > Date.now());
  const latest = current || pending || licenses[0];
  const entitled = hasActiveSubscription(subscription);
  const needsRenewalKey = current && entitled && Date.parse(subscription!.currentPeriodEnd) > Date.parse(current.expires_at);

  return <section aria-labelledby="pc-license-title" className="mb-8 rounded-2xl border border-slate-700 bg-slate-950 p-5">
    <h2 id="pc-license-title" className="text-lg font-bold text-white">Windows PC license</h2>
    {!latest && <p className="mt-2 text-sm text-slate-300">{entitled
      ? 'Payment approved. Ask the seller for your private license key, then enter it on your Windows PC or in the connected Android app.'
      : 'After your payment is approved, the seller will send your private license key.'}</p>}
    {latest && <>
      <p className="mt-2 text-sm text-cyan-200">{getLicenseStatus(latest, subscription)} — {latest.key_prefix}…</p>
      <p className="mt-2 text-sm text-slate-300">PC key expiry: {new Date(latest.expires_at).toLocaleString()}</p>
      {latest.device_id && <div className="mt-3 text-xs text-slate-400">
        <p>{latest.device?.device_name || 'Windows PC'}</p>
        <p className="mt-1 break-all font-mono">Device ID: {latest.device_id}</p>
        {latest.device?.machine_hash && <details className="mt-2"><summary className="cursor-pointer">Machine fingerprint</summary><code className="break-all">{latest.device.machine_hash}</code></details>}
      </div>}
    </>}
    {pending && <p className="mt-3 text-sm text-amber-200">A {current ? 'replacement or renewal' : 'new'} key is ready to activate. Get the complete key from the seller and enter it in the app.</p>}
    {needsRenewalKey && <p className="mt-3 text-sm text-amber-200">Your subscription has been extended. The current PC key keeps the expiry shown above until you enter a new renewal key.</p>}
    <button onClick={onActivate} className="mt-4 rounded-lg border border-cyan-700 px-4 py-2 text-sm text-cyan-200">Activation and renewal instructions</button>
  </section>;
}
