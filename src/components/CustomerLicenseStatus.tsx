import React, { useState } from 'react';
import { Copy, Check, Key } from 'lucide-react';
import type { LicenseRecord, Subscription } from '../types.ts';
import { getLicenseStatus } from '../license-status.ts';
import { hasActiveSubscription } from '../subscriptions.ts';

export function CustomerLicenseStatus({ licenses, subscription, onActivate }: {
  licenses: LicenseRecord[]; subscription: Subscription | null; onActivate: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const current = licenses.find(license => license.status === 'active');
  const pending = licenses.find(license => license.status === 'issued' && Date.parse(license.expires_at) > Date.now());
  const latest = current || pending || licenses[0];
  const entitled = hasActiveSubscription(subscription);
  const needsRenewalKey = current && entitled && Date.parse(subscription!.currentPeriodEnd) > Date.parse(current.expires_at);

  const displayKey = latest?.raw_key || latest?.key_prefix;

  const handleCopy = async () => {
    if (displayKey) {
      try {
        await navigator.clipboard.writeText(displayKey);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      } catch {}
    }
  };

  return <section aria-labelledby="pc-license-title" className="mb-8 rounded-2xl border border-slate-700 bg-slate-950 p-5">
    <div className="flex items-center justify-between">
      <h2 id="pc-license-title" className="text-lg font-bold text-white flex items-center gap-2">
        <Key className="w-5 h-5 text-cyan-400" />
        Windows PC License
      </h2>
      {latest && (
        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
          latest.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
          latest.status === 'issued' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' :
          'bg-rose-500/20 text-rose-400 border border-rose-500/30'
        }`}>
          {latest.status.toUpperCase()}
        </span>
      )}
    </div>

    {!latest && <p className="mt-3 text-sm text-slate-300">{entitled
      ? 'Payment active. The administrator will issue your license key shortly, or contact support at algotraders.site@zohomail.in.'
      : 'Subscribe or submit UPI payment to receive your license key from the administrator.'}</p>}
    
    {latest && <>
      <p className="mt-3 text-sm text-cyan-200">{getLicenseStatus(latest, subscription)}</p>
      
      {/* License Key Box with Copy Action */}
      {displayKey && (
        <div className="mt-3 p-3 rounded-xl bg-slate-900 border border-cyan-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Your License Key</span>
            <code className="text-sm font-mono font-bold text-cyan-300 break-all select-all">{displayKey}</code>
          </div>
          <button
            onClick={handleCopy}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : 'Copy Key'}
          </button>
        </div>
      )}

      <p className="mt-3 text-xs text-slate-400">License valid until: <span className="text-slate-200 font-semibold">{new Date(latest.expires_at).toLocaleString()}</span></p>
      
      {latest.device_id && <div className="mt-3 text-xs text-slate-400">
        <p className="text-slate-300">Registered Workstation: <span className="font-semibold text-white">{latest.device?.device_name || 'Windows PC'}</span></p>
        <p className="mt-1 break-all font-mono text-[11px]">Device ID: {latest.device_id}</p>
      </div>}
    </>}

    {pending && <p className="mt-3 text-sm text-amber-200">Your key is ready to activate! Copy your license key above and enter it into QBotBackend or Android app.</p>}
    {needsRenewalKey && <p className="mt-3 text-sm text-amber-200">Your subscription has been extended. The current PC key keeps the expiry shown above until you enter a new renewal key.</p>}
    
    <button onClick={onActivate} className="mt-4 rounded-lg border border-cyan-700 px-4 py-2 text-sm text-cyan-200 hover:bg-cyan-950/40 transition">
      Activation & Renewal Instructions
    </button>
  </section>;
}
