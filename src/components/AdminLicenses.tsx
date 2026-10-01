import React, {useCallback, useEffect, useRef, useState} from 'react';
import type {LicenseRecord, Subscription, User} from '../types.ts';
import {getSubscriptionStatus, hasActiveSubscription} from '../subscriptions.ts';
import {getLicenseStatus} from '../license-status.ts';

type Customer = User & {subscription?: Subscription | null};
type IssuedKey = {value: string; licenseId: string; name?: string; email: string; expiresAt: string};

function IssuedLicenseDialog({license, warning, onClose}: {license: IssuedKey; warning: string; onClose: () => void}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState('');

  useEffect(() => {
    const element = dialog.current!;
    element.showModal();
    return () => element.close();
  }, []);

  const copy = async () => {
    setCopyError('');
    try { await navigator.clipboard.writeText(license.value); setCopied(true); }
    catch { setCopyError('Clipboard unavailable. Select the key text and copy it manually before closing.'); }
  };

  return <dialog ref={dialog} aria-labelledby="issued-license-title" aria-describedby="issued-license-warning"
    onClose={() => { if (!dialog.current?.open) onClose(); }}
    className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-2xl border border-amber-700 bg-slate-950 p-6 text-white shadow-2xl backdrop:bg-black/80">
    <h3 id="issued-license-title" className="text-xl font-bold">License key generated</h3>
    <p className="mt-4 font-semibold">Customer: {license.name || license.email}</p>
    <p className="mt-2 break-all text-sm text-amber-100">Send only to {license.email}</p>
    <p className="mt-2 text-sm text-slate-300">Valid until {new Date(license.expiresAt).toLocaleString()}.</p>
    <p id="issued-license-warning" className="mt-4 text-sm text-amber-200">This key is shown only once. Copy it and save it securely before closing. After you close this popup, the full key cannot be viewed again.</p>
    <code data-testid="issued-license-key" className="mt-4 block break-all rounded-lg border border-slate-700 bg-slate-900 p-4 text-sm select-all">{license.value}</code>
    {copied && <p role="status" className="mt-3 text-sm text-cyan-200">Key copied for {license.email}.</p>}
    {copyError && <p role="alert" className="mt-3 text-sm text-rose-300">{copyError}</p>}
    {warning && <p role="alert" className="mt-3 text-sm text-amber-200">Your key was generated, but the dashboard could not refresh: {warning}</p>}
    <div className="mt-6 flex flex-wrap gap-3">
      <button autoFocus onClick={copy} className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white">Copy key</button>
      <button onClick={onClose} className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-200">Close and hide key</button>
    </div>
  </dialog>;
}

export function AdminLicenses({token, users, customerId, onCustomerChange, onChanged}: {
  token: string; users: Customer[]; customerId: string;
  onCustomerChange: (id: string) => void; onChanged: () => Promise<void>;
}) {
  const [licenses, setLicenses] = useState<LicenseRecord[]>([]);
  const [newKey, setNewKey] = useState<IssuedKey | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const inFlight = useRef(false);
  const requestId = useRef(0);
  const selection = useRef({customerId, token});
  selection.current = {customerId, token};
  const customer = users.find(user => user.id === customerId && user.role === 'customer');
  const eligible = Boolean(customer && hasActiveSubscription(customer.subscription));

  const refresh = useCallback(async () => {
    if (selection.current.customerId !== customerId || selection.current.token !== token) return;
    const id = ++requestId.current;
    setLoading(true);
    try {
      const query = customerId ? '?userId=' + encodeURIComponent(customerId) : '';
      const response = await fetch('/api/admin/licenses' + query, {headers: {Authorization: 'Bearer ' + token}});
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not load licenses.');
      if (id === requestId.current) setLicenses(data.licenses);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [token, customerId]);

  useEffect(() => {
    setLicenses([]);
    setError('');
    refresh().catch(error => setError(error.message));
    return () => { requestId.current++; };
  }, [refresh]);

  const issue = async () => {
    if (!customer || !eligible || inFlight.current || newKey) return;
    const recipient = customer;
    inFlight.current = true;
    setBusy(true); setNewKey(null); setMessage(''); setError('');
    try {
      const response = await fetch('/api/admin/licenses', {
        method: 'POST', headers: {Authorization: 'Bearer ' + token, 'Content-Type': 'application/json'},
        body: JSON.stringify({userId: recipient.id})
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not issue the key.');
      // Keep the recipient with the once-only key if another control changes the selection.
      setNewKey({value: data.licenseKey, licenseId: data.license.id, name: recipient.name, email: recipient.email, expiresAt: data.license.expires_at});
      await refresh();
      await onChanged();
    } catch (error: any) { setError(error.message); }
    finally { inFlight.current = false; setBusy(false); }
  };

  const revoke = async (license: LicenseRecord) => {
    if (inFlight.current || !window.confirm('Revoke this license? The PC will be unable to renew its trading authorization.')) return;
    inFlight.current = true;
    setBusy(true); setError(''); setMessage('');
    try {
      const response = await fetch('/api/admin/licenses/' + encodeURIComponent(license.id) + '/revoke', {
        method: 'POST', headers: {Authorization: 'Bearer ' + token}
      });
      const data = await response.json();
      if (!response.ok || !data.revoked) throw new Error(data.error || 'Could not revoke the license.');
      if (newKey?.licenseId === license.id) setNewKey(null);
      setMessage('License revoked. New trades stop at the next check, within 15 minutes if offline.');
      await refresh();
      await onChanged();
    } catch (error: any) { setError(error.message); }
    finally { inFlight.current = false; setBusy(false); }
  };

  const hideKey = () => {
    setNewKey(null);
    setMessage('The full key is now hidden and cannot be displayed again. If it was not saved, generate a replacement key.');
  };

  return <section id="admin-license-controls" tabIndex={-1} aria-labelledby="admin-license-title" className="mb-8 scroll-mt-28 rounded-2xl border border-cyan-900 bg-slate-950 p-5">
    <h2 id="admin-license-title" className="text-lg font-bold text-white">Customer license keys</h2>
    <p className="mt-2 text-sm text-slate-400">1. Approve the payment below. 2. Select the customer and generate a key. 3. Copy and send it privately. The customer enters it on Windows or in Android connected to that PC.</p>
    <div className="mt-4 flex flex-wrap gap-3">
      <select aria-label="License customer" disabled={busy} className="max-w-full rounded-lg border border-slate-700 bg-slate-900 p-3 text-sm text-white" value={customerId} onChange={event => {onCustomerChange(event.target.value); setMessage('');}}>
        <option value="">Select a customer</option>
        {users.filter(user => user.role === 'customer').map(user => <option key={user.id} value={user.id}>{user.name ? user.name + ' — ' : ''}{user.email} — {getSubscriptionStatus(user.subscription)}</option>)}
      </select>
      <button disabled={!eligible || busy || Boolean(newKey)} onClick={issue} className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">{busy ? 'Working…' : 'Generate license key'}</button>
      <button disabled={busy || loading} onClick={() => {setError(''); refresh().catch(error => setError(error.message));}} className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 disabled:opacity-40">Refresh licenses</button>
    </div>
    {customer && <p className="mt-3 text-sm text-slate-300">{eligible
      ? 'Key expiry: ' + new Date(customer.subscription!.currentPeriodEnd).toLocaleString() + '. One Windows PC can be active at a time.'
      : 'Approve a payment or grant subscription time before generating a key. Expired, future and suspended subscriptions cannot receive a key.'}</p>}
    <p className="mt-3 text-xs text-slate-400">Renewal or a replacement PC: generate a new key and ask the customer to choose “Enter a new key / renew” in Android or run “QBotBackend.exe --activate”. The current key keeps its original expiry until the new key is activated. Generating again replaces any unused key.</p>
    {message && <p role="status" className="mt-4 text-sm text-cyan-200">{message}</p>}
    {error && <p role="alert" className="mt-4 text-sm text-rose-300">{error}</p>}
    {newKey && <IssuedLicenseDialog license={newKey} warning={error} onClose={hideKey}/>}
    <div className="mt-5 overflow-x-auto"><table className="w-full text-left text-xs text-slate-300">
      <thead><tr><th className="p-2">Customer</th><th className="p-2">Key / status</th><th className="p-2">Key expiry</th><th className="p-2">Registered PC</th><th className="p-2">Action</th></tr></thead>
      <tbody>
        {loading && <tr><td colSpan={5} className="p-3">Loading licenses…</td></tr>}
        {!loading && !licenses.length && <tr><td colSpan={5} className="p-3">No license keys issued{customer ? ' for this customer' : ''}.</td></tr>}
        {!loading && licenses.map(license => <tr key={license.id} className="border-t border-slate-800">
          <td className="p-2"><div className="font-semibold">{users.find(user => user.id === license.user_id)?.name || 'Customer'}</div><div>{users.find(user => user.id === license.user_id)?.email || license.user_id}</div></td>
          <td className="p-2">{license.key_prefix}…<br/>{getLicenseStatus(license, users.find(user => user.id === license.user_id)?.subscription)}</td>
          <td className="p-2">{new Date(license.expires_at).toLocaleString()}</td>
          <td className="p-2">{license.device_id ? <>
            <div>{license.device?.device_name || 'Windows PC'}</div>
            <div className="break-all font-mono">Device ID: {license.device_id}</div>
            {license.device?.machine_hash && <details className="mt-1"><summary className="cursor-pointer text-cyan-300">Machine fingerprint</summary><code className="break-all">{license.device.machine_hash}</code></details>}
            {license.device?.last_heartbeat_at && <div className="mt-1 text-slate-500">Last checked: {new Date(license.device.last_heartbeat_at).toLocaleString()}</div>}
          </> : 'Not activated'}</td>
          <td className="p-2">{license.status !== 'revoked' && <button disabled={busy} onClick={() => revoke(license)} className="rounded bg-rose-950 px-3 py-1 text-rose-200 disabled:opacity-40">Revoke</button>}</td>
        </tr>)}
      </tbody>
    </table></div>
  </section>;
}
