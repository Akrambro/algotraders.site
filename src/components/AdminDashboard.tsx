import React, { useState, useEffect } from 'react';
import {
  Lock,
  Users,
  CreditCard,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Search,
  UserX,
  UserCheck,
  Gift,
  Trash2,
  FileText,
  RefreshCw,
  TrendingUp,
  Cpu,
  Monitor,
  Smartphone,
  ShieldCheck,
  Loader2,
  Download,
  Database,
  LogOut,
  CloudDownload,
  HardDrive,
  ExternalLink,
  HelpCircle,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { AdminLoginGate } from './AdminLoginGate.tsx';
import { AdminLicenses } from './AdminLicenses.tsx';
import {getSubscriptionStatus, hasActiveSubscription} from '../subscriptions.ts';

interface AdminDashboardProps {
  onExitAdmin?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onExitAdmin }) => {
  const { user, token, logout, refreshUserData } = useAuth();
  const [metrics, setMetrics] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [isTestingDb, setIsTestingDb] = useState<boolean>(false);
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);
  const [verifyingPaymentId, setVerifyingPaymentId] = useState<string | null>(null);
  const [licenseCustomerId, setLicenseCustomerId] = useState('');

  // Google Drive Releases state
  const [releases, setReleases] = useState<any>(null);
  const [winReleaseInput, setWinReleaseInput] = useState<string>('');
  const [androidReleaseInput, setAndroidReleaseInput] = useState<string>('');
  const [winReleaseSize, setWinReleaseSize] = useState<string>('58 MB');
  const [androidReleaseSize, setAndroidReleaseSize] = useState<string>('52 MB');
  const [savingReleasePlatform, setSavingReleasePlatform] = useState<string | null>(null);

  const fetchReleases = async () => {
    try {
      const res = await fetch('/api/downloads/admin/config', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setReleases(data);
        if (data.windows?.fileId || data.windows?.url) {
          setWinReleaseInput(data.windows.fileId || data.windows.url);
        }
        if (data.windows?.size) setWinReleaseSize(data.windows.size);
        if (data.android?.fileId || data.android?.url) {
          setAndroidReleaseInput(data.android.fileId || data.android.url);
        }
        if (data.android?.size) setAndroidReleaseSize(data.android.size);
      }
    } catch {}
  };

  const handleSaveRelease = async (platform: 'windows' | 'android') => {
    const inputVal = platform === 'windows' ? winReleaseInput : androidReleaseInput;
    const sizeVal = platform === 'windows' ? winReleaseSize : androidReleaseSize;
    if (!inputVal.trim()) {
      setActionMessage(`Please enter a Google Drive link or File ID for ${platform}.`);
      return;
    }
    setSavingReleasePlatform(platform);
    try {
      const res = await fetch('/api/downloads/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ platform, url: inputVal.trim(), size: sizeVal.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save release.');
      setActionMessage(`✓ ${platform === 'windows' ? 'Windows Backend' : 'Android Companion'} release updated successfully! Customer downloads are now active.`);
      fetchReleases();
    } catch (err: any) {
      setActionMessage(`Error updating release: ${err.message}`);
    } finally {
      setSavingReleasePlatform(null);
    }
  };

  const openLicenseControls = (customerId: string) => {
    setLicenseCustomerId(customerId);
    const section = document.getElementById('admin-license-controls');
    section?.scrollIntoView({behavior: 'smooth', block: 'start'});
    section?.focus({preventScroll: true});
  };

  const handleExportSupabaseSQL = async () => {
    try {
      const res = await fetch('/api/admin/database/export-supabase-sql', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'algotraders_supabase_schema.sql';
        document.body.appendChild(a);
        a.click();
        a.remove();
        setActionMessage('Licensing migration SQL downloaded. Back up the database before applying it in Supabase SQL Editor.');
      } else {
        setActionMessage('Failed to download Supabase SQL.');
      }
    } catch (err: any) {
      setActionMessage(`Error exporting Supabase SQL: ${err.message}`);
    }
  };

  // Support notes modal state
  const [selectedUserForNote, setSelectedUserForNote] = useState<any | null>(null);
  const [supportNoteText, setSupportNoteText] = useState<string>('');
  const [isSubmittingNote, setIsSubmittingNote] = useState<boolean>(false);

  const fetchAdminData = async () => {
    if (!token || user?.role !== 'admin') {
      setLoading(false);
      return;
    }

    try {
      const [mRes, uRes, wRes, dbRes, pRes] = await Promise.all([
        fetch('/api/admin/metrics', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/audit-logs', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/database/status', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/pending-payments', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      for (const response of [mRes, uRes, wRes, dbRes, pRes]) {
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Could not refresh the admin portal.');
        }
      }

      if (mRes.ok) setMetrics(await mRes.json());
      if (uRes.ok) {
        const uData = await uRes.json();
        setUsersList(Array.isArray(uData) ? uData : (uData.users || []));
      }
      if (wRes.ok) {
        const wData = await wRes.json();
        setWebhooks(Array.isArray(wData) ? wData : (wData.events || []));
      }
      if (dbRes.ok) {
        const dbData = await dbRes.json();
        setDbStatus(dbData);
      }
      if (pRes.ok) {
        const pData = await pRes.json();
        setPendingPayments(pData.payments || []);
      }
    } catch (err: any) {
      setActionMessage(err.message || 'Failed to load admin data.');
    } finally {
      setLoading(false);
    }
  };

  const handleTestSupabaseLive = async () => {
    setIsTestingDb(true);
    try {
      const res = await fetch('/api/database/status', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setDbStatus(data);
        if (data.supabase?.connected) {
          setActionMessage(`Supabase connection verified! Status: ${data.supabase.message}`);
        } else {
          setActionMessage(`Supabase check: ${data.supabase?.message || 'Not connected yet'}`);
        }
      }
    } catch (err: any) {
      setActionMessage(`Database check failed: ${err.message}`);
    } finally {
      setIsTestingDb(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
    fetchReleases();
    if (!token || user?.role !== 'admin') return;
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchAdminData();
        fetchReleases();
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [token, user?.id, user?.role]);

  const handleActivateSubscription = async (subIdOrUserId: string) => {
    try {
      const resp = await fetch(`/api/admin/subscriptions/${subIdOrUserId}/activate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Could not activate the subscription.');
      setActionMessage(data.message || 'Subscription activated successfully.');
      await fetchAdminData();
      await refreshUserData();
    } catch (err: any) {
      setActionMessage(err.message);
    }
  };

  const handleSuspendSubscription = async (subIdOrUserId: string) => {
    try {
      const resp = await fetch(`/api/admin/subscriptions/${subIdOrUserId}/suspend`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Could not suspend the subscription.');
      setActionMessage(data.message || 'Subscription suspended.');
      await fetchAdminData();
      await refreshUserData();
    } catch (err: any) {
      setActionMessage(err.message);
    }
  };

  const handleSuspendUser = async (userId: string) => {
    try {
      const resp = await fetch(`/api/admin/users/${userId}/suspend`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Could not suspend the customer.');
      setActionMessage(data.message || 'Customer suspended.');
      await fetchAdminData();
      await refreshUserData();
    } catch (err: any) {
      setActionMessage(err.message);
    }
  };

  const handleReactivateUser = async (userId: string) => {
    try {
      const resp = await fetch(`/api/admin/users/${userId}/reactivate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Could not reactivate the customer.');
      setActionMessage(data.message || 'Customer reactivated.');
      await fetchAdminData();
      await refreshUserData();
    } catch (err: any) {
      setActionMessage(err.message);
    }
  };

  const handleGrantPromo = async (userId: string) => {
    try {
      const resp = await fetch(`/api/admin/users/${userId}/grant-promo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ days: 30 })
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Could not grant promotional time.');
      setActionMessage(data.message || 'Granted 30 days promotional access.');
      await fetchAdminData();
      await refreshUserData();
      openLicenseControls(userId);
    } catch (err: any) {
      setActionMessage(err.message);
    }
  };

  const handleRevokeDevice = async (deviceId: string) => {
    if (!confirm('Revoke this device hardware authorization?')) return;
    try {
      const resp = await fetch(`/api/admin/devices/${deviceId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Could not revoke the device.');
      setActionMessage(data.message || 'Device revoked.');
      await fetchAdminData();
      await refreshUserData();
    } catch (err: any) {
      setActionMessage(err.message);
    }
  };

  const handleAddSupportNote = async () => {
    if (!selectedUserForNote || !supportNoteText) return;
    setIsSubmittingNote(true);
    try {
      const resp = await fetch('/api/admin/support-notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: selectedUserForNote.id,
          content: supportNoteText
        })
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Could not save the support note.');
      setActionMessage('Support note saved to customer audit log.');
      setSelectedUserForNote(null);
      setSupportNoteText('');
      await fetchAdminData();
    } catch (err: any) {
      setActionMessage(err.message);
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handleVerifyManualPayment = async (paymentId: string) => {
    setVerifyingPaymentId(paymentId);
    try {
      const resp = await fetch('/api/admin/verify-manual-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ paymentId })
      });
      const data = await resp.json();
      if (resp.ok) {
        setActionMessage(data.message || 'Payment approved. Generate and copy the customer’s license key above.');
        await fetchAdminData();
        await refreshUserData();
        if (data.user?.id) openLicenseControls(data.user.id);
      } else {
        setActionMessage(data.error || 'Failed to verify payment.');
      }
    } catch (err: any) {
      setActionMessage(err.message || 'Error verifying manual payment.');
    } finally {
      setVerifyingPaymentId(null);
    }
  };

  // If not logged in as admin, show secure production login gate
  if (!user || user.role !== 'admin') {
    return <AdminLoginGate onBackToHome={onExitAdmin || (() => { window.location.hash = ''; })} />;
  }

  const filteredUsers = usersList.filter(
    (u) =>
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.name && u.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 mb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Admin Control Panel
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-purple-950 border border-purple-500/40 text-purple-300">
              ROLE: ADMIN
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Global customer licensing, manual UPI payments, and device hardware telemetry.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportSupabaseSQL}
            className="px-3 py-2 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 hover:text-white text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-lg shadow-emerald-950/40"
            title="Download the current Supabase licensing migrations"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Download licensing SQL</span>
          </button>
          <button
            onClick={fetchAdminData}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Telemetry</span>
          </button>
          <button
            onClick={() => {
              logout();
              if (onExitAdmin) onExitAdmin();
              else window.location.hash = '';
            }}
            className="px-3 py-2 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-300 hover:bg-rose-900 hover:text-white text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Sign out of admin session and lock portal"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400" />
            <span>Lock Portal</span>
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="mb-6 p-3 rounded-xl bg-purple-950/60 border border-purple-500/40 text-purple-200 text-xs flex items-center justify-between animate-in fade-in">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage(null)} className="text-slate-400 hover:text-white">
            &times;
          </button>
        </div>
      )}

      {token && user?.role === 'admin' && <AdminLicenses token={token} users={usersList}
        customerId={licenseCustomerId} onCustomerChange={setLicenseCustomerId} onChanged={fetchAdminData} />}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <div className="glass-card rounded-2xl p-4 border border-slate-800">
          <div className="text-[11px] text-slate-400">Total Customers</div>
          <div className="text-2xl font-bold font-mono text-white mt-1">
            {metrics?.totalCustomers ?? '...'}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-slate-800">
          <div className="text-[11px] text-slate-400">Active Subs</div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
            {metrics?.activeSubscriptions ?? '...'}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-slate-800">
          <div className="text-[11px] text-slate-400">Active Licenses</div>
          <div className="text-2xl font-bold font-mono text-cyan-400 mt-1">
            {metrics?.activeLicenses ?? '...'}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-slate-800">
          <div className="text-[11px] text-slate-400">Expired Subs</div>
          <div className="text-2xl font-bold font-mono text-slate-400 mt-1">
            {metrics?.expiredSubscriptions ?? '...'}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-slate-800">
          <div className="text-[11px] text-slate-400">Monthly Run Rate</div>
          <div className="text-2xl font-bold font-mono text-white mt-1">
            {metrics?.mrr != null ? `₹${Number(metrics.mrr).toLocaleString('en-IN', {maximumFractionDigits: 2})}` : '...'}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-slate-800">
          <div className="text-[11px] text-slate-400">Recently Validated PCs</div>
          <div className="text-2xl font-bold font-mono text-purple-300 mt-1">
            {metrics?.activeDevicesCount ?? '...'}
          </div>
        </div>
      </div>

      {/* Supabase & Cloud Database Status Card */}
      <div className="glass-panel rounded-2xl p-4 border border-emerald-900/40 bg-emerald-950/20 shadow-xl mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
            dbStatus?.supabase?.connected
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
              : dbStatus?.supabase?.configured
              ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
              : 'bg-slate-800 text-slate-400 border-slate-700'
          }`}>
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-white">Licensing database</h4>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                dbStatus?.supabase?.connected
                  ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40'
                  : dbStatus?.supabase?.configured
                  ? 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                  : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}>
                {dbStatus?.supabase?.connected
                  ? 'SUPABASE CONNECTED'
                  : dbStatus?.supabase?.configured
                  ? 'KEYS DETECTED (SCHEMA PENDING)'
                  : 'DATABASE UNAVAILABLE'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              {dbStatus?.supabase?.message || 'Checking the persistent licensing database. Keys cannot be issued while it is unavailable.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            onClick={handleTestSupabaseLive}
            disabled={isTestingDb}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-emerald-500/50 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {isTestingDb ? <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" /> : <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />}
            <span>Test Live Connection</span>
          </button>
        </div>
      </div>

      {/* Software Releases & Google Drive Cloud Storage (>50MB Files) */}
      <div className="rounded-2xl p-6 border border-cyan-500/40 bg-[#091124] shadow-2xl mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-5 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <CloudDownload className="w-5 h-5 text-cyan-400" />
              <h3 className="text-lg font-bold text-white">Software Releases & Google Drive Storage</h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                50+ MB SUPABASE BYPASS
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Host bundled binaries on Google Drive (exceeding Supabase 50MB free-tier limits). Files stream directly to customers on the same page with zero redirects.
            </p>
          </div>

          <button
            onClick={fetchReleases}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white text-xs flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Refresh Links</span>
          </button>
        </div>

        {/* Informational Guide on Google Drive Link Part & Setup */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 mb-6 text-xs text-slate-300 space-y-2">
          <div className="flex items-center gap-2 text-cyan-400 font-semibold">
            <HelpCircle className="w-4 h-4" />
            <span>Which part of the Google Drive link should you provide?</span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-400">
            You can provide <strong className="text-white">EITHER</strong> the full Google Drive share link (e.g. <code className="text-cyan-300 select-all font-mono">https://drive.google.com/file/d/1A2b3c4D5e.../view?usp=sharing</code>) <strong className="text-white">OR</strong> just the raw File ID between <code className="text-cyan-300 font-mono">/file/d/</code> and <code className="text-cyan-300 font-mono">/view</code> (<code className="text-cyan-300 font-mono select-all">1A2b3c4D5e...</code>). Our system automatically detects and extracts the file ID.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-[11px] border-t border-slate-800/80">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong className="text-slate-200">Required Google Drive Setting:</strong> Right-click file in Google Drive &rarr; Share &rarr; set General access to <strong className="text-emerald-400">"Anyone with the link can view"</strong>.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
              <span><strong className="text-slate-200">Same-Page In-Place Downloads:</strong> Our backend streams the binary bytes directly, resolving Google's virus-scan warning page in the background with zero external redirects.</span>
            </div>
          </div>
        </div>

        {/* Release Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Windows Release Card */}
          <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                    <Monitor className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Windows Backend Release</h4>
                    <p className="text-[10px] font-mono text-slate-400">QBot2-Licensed-Windows-2.5.0.zip</p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  releases?.windows?.configured
                    ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40'
                    : 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                }`}>
                  {releases?.windows?.configured ? 'DOWNLOADS ACTIVE' : 'PENDING LINK'}
                </span>
              </div>

              <div className="mt-4 space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Google Drive Link or File ID
                  </label>
                  <input
                    type="text"
                    value={winReleaseInput}
                    onChange={(e) => setWinReleaseInput(e.target.value)}
                    placeholder="https://drive.google.com/file/d/1abc.../view or 1abc..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-cyan-500 text-xs text-white outline-none font-mono"
                  />
                  {releases?.windows?.fileId && (
                    <p className="text-[10px] font-mono text-cyan-400 mt-1">
                      Active File ID: <span className="text-white select-all">{releases.windows.fileId}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Display File Size
                  </label>
                  <input
                    type="text"
                    value={winReleaseSize}
                    onChange={(e) => setWinReleaseSize(e.target.value)}
                    placeholder="e.g. 58 MB or 50+ MB (Google Drive)"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-cyan-500 text-xs text-white outline-none font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-[10px] text-slate-400">
                {releases?.windows?.configured ? 'Customers can download from Dashboard' : 'Paste Google Drive link to activate'}
              </span>
              <button
                onClick={() => handleSaveRelease('windows')}
                disabled={savingReleasePlatform === 'windows'}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                {savingReleasePlatform === 'windows' ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Save Windows Link</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Android Release Card */}
          <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-950/60 border border-purple-500/30 flex items-center justify-center text-purple-400">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Android Companion Release</h4>
                    <p className="text-[10px] font-mono text-slate-400">QBot2-Licensed-Android-2.5.0.apk</p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  releases?.android?.configured
                    ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40'
                    : 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                }`}>
                  {releases?.android?.configured ? 'DOWNLOADS ACTIVE' : 'PENDING LINK'}
                </span>
              </div>

              <div className="mt-4 space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Google Drive Link or File ID
                  </label>
                  <input
                    type="text"
                    value={androidReleaseInput}
                    onChange={(e) => setAndroidReleaseInput(e.target.value)}
                    placeholder="https://drive.google.com/file/d/1abc.../view or 1abc..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-cyan-500 text-xs text-white outline-none font-mono"
                  />
                  {releases?.android?.fileId && (
                    <p className="text-[10px] font-mono text-purple-400 mt-1">
                      Active File ID: <span className="text-white select-all">{releases.android.fileId}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Display File Size
                  </label>
                  <input
                    type="text"
                    value={androidReleaseSize}
                    onChange={(e) => setAndroidReleaseSize(e.target.value)}
                    placeholder="e.g. 52 MB or 50+ MB (Google Drive)"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-cyan-500 text-xs text-white outline-none font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-[10px] text-slate-400">
                {releases?.android?.configured ? 'Customers can download from Dashboard' : 'Paste Google Drive link to activate'}
              </span>
              <button
                onClick={() => handleSaveRelease('android')}
                disabled={savingReleasePlatform === 'android'}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                {savingReleasePlatform === 'android' ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Save Android Link</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Manual UPI Payment Verification Queue (QR Code Scans) */}
      <div className="rounded-2xl p-6 border border-cyan-500/40 bg-[#091124] shadow-2xl mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white">Manual UPI Payment Verification Queue</h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                {pendingPayments.filter((p) => p.status === 'pending').length} PENDING APPROVAL
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Customers scan QR code & send screenshot to <strong className="text-cyan-300 select-all">algotraders.site@zohomail.in</strong>. Verify UTR / Screenshot and approve below to unlock software downloads.
            </p>
          </div>

          <button
            onClick={fetchAdminData}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white text-xs flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Check Incoming</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 text-slate-400 uppercase font-mono text-[10px]">
              <tr>
                <th className="py-3 px-3">Order ID (tn/tr)</th>
                <th className="py-3 px-3">Submission Time</th>
                <th className="py-3 px-3">Customer Email</th>
                <th className="py-3 px-3">Plan / Amount</th>
                <th className="py-3 px-3">UTR / Ref #</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Verification Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {pendingPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-500 font-sans">
                    No manual payments in queue. All QR code scans are up to date.
                  </td>
                </tr>
              ) : (
                pendingPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-3 font-mono font-extrabold text-cyan-400 text-xs select-all">
                      {p.orderId || 'ORD1024'}
                    </td>
                    <td className="py-3 px-3 text-slate-400 text-[11px]">
                      {new Date(p.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 font-sans font-medium text-white">
                      {p.email || p.userEmail}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-cyan-300">
                        {p.planId === 'annual' ? 'Yearly (₹49,999)' : 'Monthly (₹4,999)'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-amber-300 font-bold select-all">
                      {p.utrNumber}
                    </td>
                    <td className="py-3 px-3">
                      {p.status === 'verified' ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold">
                          PAYMENT VERIFIED
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/40 text-[10px] font-bold">
                          {p.status === 'rejected' ? 'REJECTED' : 'PENDING REVIEW'}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {p.status === 'verified' ? (
                        <button onClick={() => openLicenseControls(p.userId || usersList.find(c => c.email.toLowerCase() === p.email.toLowerCase())?.id || '')}
                          className="rounded-lg bg-cyan-950 px-3 py-1.5 text-xs text-cyan-200 font-sans">License keys</button>
                      ) : p.status === 'pending' ? (
                        <button
                          onClick={() => handleVerifyManualPayment(p.id)}
                          disabled={Boolean(verifyingPaymentId)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-sans text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
                        >
                          {verifyingPaymentId === p.id ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Approving...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Approve payment</span>
                            </>
                          )}
                        </button>
                      ) : <span className="text-xs text-slate-500">Rejected</span>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Management Section */}
      <div className="rounded-2xl p-6 border border-slate-800 bg-[#090e1a] shadow-2xl mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white">Customer Account Management</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Enforce licensing, grant promotional access, or manage device allocations.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by customer email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-600 outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-slate-400 uppercase font-mono text-[10px]">
              <tr>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Role</th>
                <th className="py-3 px-3">Subscription</th>
                <th className="py-3 px-3">Paired Devices</th>
                <th className="py-3 px-3">Notes</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredUsers.map((cust) => (
                <tr key={cust.id} className="hover:bg-slate-900/40">
                  <td className="py-3 px-3">
                    <div className="font-bold text-white font-sans">{cust.name || 'Anonymous Trader'}</div>
                    <div className="text-[11px] text-slate-400">{cust.email}</div>
                  </td>
                  <td className="py-3 px-3 uppercase text-[10px]">
                    <span
                      className={`px-2 py-0.5 rounded ${
                        cust.role === 'admin'
                          ? 'bg-purple-950 text-purple-300 border border-purple-500/40'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {cust.role}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        hasActiveSubscription(cust.subscription)
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : cust.subscription?.status === 'trialing'
                          ? 'bg-cyan-500/20 text-cyan-300'
                          : cust.subscription?.status === 'pending'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : cust.subscription?.status === 'halted'
                          ? 'bg-rose-500/30 text-rose-300 border border-rose-500/50 font-extrabold'
                          : cust.subscription?.status === 'suspended'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : cust.subscription?.status === 'past_due'
                          ? 'bg-orange-500/20 text-orange-300'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {getSubscriptionStatus(cust.subscription)} ({cust.subscription?.planId || 'No plan'})
                    </span>
                    {cust.subscription?.provider && (
                      <span className="ml-1 text-[9px] text-slate-500 font-mono">
                        [{cust.subscription.provider}]
                      </span>
                    )}
                    {cust.subscription?.currentPeriodEnd && <div className="mt-1 text-[10px] text-slate-400">Paid until {new Date(cust.subscription.currentPeriodEnd).toLocaleString()}</div>}
                  </td>
                  <td className="py-3 px-3 text-slate-300">
                    {cust.devicesCount ?? (cust.devices?.length || 0)} device(s)
                  </td>
                  <td className="py-3 px-3 text-[11px] text-slate-400 max-w-[150px] truncate font-sans">
                    {cust.supportNotes ? cust.supportNotes[cust.supportNotes.length - 1] : 'No notes'}
                  </td>
                  <td className="py-3 px-3 text-right space-x-1">
                    {cust.role === 'customer' && <button onClick={() => openLicenseControls(cust.id)}
                      className="px-2 py-1 rounded bg-cyan-800 text-white text-[11px] font-sans">License keys</button>}
                    <button
                      onClick={() => handleGrantPromo(cust.id)}
                      className="px-2 py-1 rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-300 text-[11px] font-sans"
                      title="Grant +30 days promo access"
                    >
                      +30 Days
                    </button>
                    {cust.subscription?.status === 'suspended' || cust.subscription?.status === 'halted' ? (
                      <button
                        onClick={() => handleActivateSubscription(cust.subscription?.id || cust.id)}
                        className="px-2 py-1 rounded bg-emerald-950 hover:bg-emerald-900 text-emerald-300 text-[11px] font-sans"
                        title="Activate subscription via POST /api/admin/subscriptions/:id/activate"
                      >
                        Activate Sub
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSuspendSubscription(cust.subscription?.id || cust.id)}
                        className="px-2 py-1 rounded bg-rose-950 hover:bg-rose-900 text-rose-300 text-[11px] font-sans"
                        title="Suspend subscription via POST /api/admin/subscriptions/:id/suspend"
                      >
                        Suspend Sub
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedUserForNote(cust)}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-sans"
                    >
                      Note
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Webhook Audit Logs */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-700/80 shadow-2xl">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white">License and payment activity</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Recent payment approvals, key generation, PC activations and revocations.
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-400">Latest 50 events</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-slate-400 uppercase font-mono text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Time</th>
                <th className="py-2.5 px-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {webhooks.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-slate-500">
                    No activity recorded yet.
                  </td>
                </tr>
              ) : (
                webhooks.map((ev) => (
                  <tr key={ev.id}>
                    <td className="py-2.5 px-3 text-cyan-400">{usersList.find(customer => customer.id === ev.userId)?.email || ev.userId || 'System'}</td>
                    <td className="py-2.5 px-3 text-white font-bold">{ev.action}</td>
                    <td className="py-2.5 px-3 text-slate-400">
                      {new Date(ev.timestamp).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3">
                      {ev.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Support Note Modal */}
      {selectedUserForNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl p-6 bg-[#0c1220] border border-slate-700 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Add Support Note</h3>
            <p className="text-xs text-slate-400 mb-4">
              Internal memo for customer: <span className="text-cyan-400">{selectedUserForNote.email}</span>
            </p>
            <textarea
              rows={3}
              value={supportNoteText}
              onChange={(e) => setSupportNoteText(e.target.value)}
              placeholder="e.g. Contacted user via Discord regarding Windows firewall port 8000 exception..."
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 outline-none focus:border-cyan-500"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setSelectedUserForNote(null)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSupportNote}
                disabled={isSubmittingNote}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-400 hover:bg-cyan-300 text-slate-950 cursor-pointer"
              >
                Save Memo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
