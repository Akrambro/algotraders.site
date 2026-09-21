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
  ShieldCheck,
  Loader2,
  Download,
  Database
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

export const AdminDashboard: React.FC = () => {
  const { user, token, switchUserRoleDemo } = useAuth();
  const [metrics, setMetrics] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [isTestingDb, setIsTestingDb] = useState<boolean>(false);

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
        setActionMessage('Supabase PostgreSQL schema & seed script downloaded! Paste it into Supabase SQL Editor.');
      } else {
        setActionMessage('Failed to download Supabase SQL.');
      }
    } catch (err: any) {
      setActionMessage(`Error exporting Supabase SQL: ${err.message}`);
    }
  };

  const handleExportMySQLDump = async () => {
    try {
      const res = await fetch('/api/admin/database/export-sql', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'algotraders_mysql_dump.sql';
        document.body.appendChild(a);
        a.click();
        a.remove();
        setActionMessage('MySQL .SQL dump downloaded successfully!');
      } else {
        setActionMessage('Failed to download MySQL dump.');
      }
    } catch (err: any) {
      setActionMessage(`Error exporting SQL: ${err.message}`);
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
      const [mRes, uRes, wRes, dbRes] = await Promise.all([
        fetch('/api/admin/metrics', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/webhooks', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/database/status')
      ]);

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
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTestSupabaseLive = async () => {
    setIsTestingDb(true);
    try {
      const res = await fetch('/api/database/status');
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
  }, [token, user]);

  const handleActivateSubscription = async (subIdOrUserId: string) => {
    try {
      const resp = await fetch(`/api/admin/subscriptions/${subIdOrUserId}/activate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await resp.json();
      setActionMessage(data.message || 'Subscription activated successfully.');
      await fetchAdminData();
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
      setActionMessage(data.message || 'Subscription suspended.');
      await fetchAdminData();
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
      setActionMessage(data.message || 'Customer suspended.');
      await fetchAdminData();
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
      setActionMessage(data.message || 'Customer reactivated.');
      await fetchAdminData();
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
      setActionMessage(data.message || 'Granted 30 days promotional access.');
      await fetchAdminData();
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
      setActionMessage(data.message || 'Device revoked.');
      await fetchAdminData();
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
          note: supportNoteText
        })
      });
      const data = await resp.json();
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

  // If not logged in as admin, show role gate with 1-click switch button
  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto my-20 p-8 rounded-2xl glass-panel-glow border border-purple-500/30 text-center">
        <div className="w-14 h-14 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center mx-auto mb-4 border border-purple-500/40">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Admin Authorization Required</h2>
        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
          The administrative control panel is restricted to users with the <code className="text-purple-300">admin</code> role.
        </p>
        <div className="mt-6 pt-6 border-t border-slate-800">
          <button
            onClick={() => switchUserRoleDemo('admin')}
            className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 transition-all cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Switch to Admin Role</span>
          </button>
        </div>
      </div>
    );
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
            Global customer licensing, Razorpay billing webhooks, and device hardware telemetry.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportSupabaseSQL}
            className="px-3 py-2 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 hover:text-white text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-lg shadow-emerald-950/40"
            title="Download PostgreSQL / Supabase schema & initial data script"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export Supabase SQL (.sql)</span>
          </button>
          <button
            onClick={handleExportMySQLDump}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Download MySQL .sql file"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export MySQL (.sql)</span>
          </button>
          <button
            onClick={fetchAdminData}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Telemetry</span>
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

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <div className="glass-card rounded-2xl p-4 border border-slate-800">
          <div className="text-[11px] text-slate-400">Total Customers</div>
          <div className="text-2xl font-bold font-mono text-white mt-1">
            {metrics?.totalUsers ?? '...'}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-slate-800">
          <div className="text-[11px] text-slate-400">Active Subs</div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
            {metrics?.activeSubs ?? '...'}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-slate-800">
          <div className="text-[11px] text-slate-400">2-Day Trials</div>
          <div className="text-2xl font-bold font-mono text-cyan-400 mt-1">
            {metrics?.trialUsers ?? '...'}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-slate-800">
          <div className="text-[11px] text-slate-400">Expired Subs</div>
          <div className="text-2xl font-bold font-mono text-slate-400 mt-1">
            {metrics?.expiredSubs ?? '...'}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-slate-800">
          <div className="text-[11px] text-slate-400">Monthly Run Rate</div>
          <div className="text-2xl font-bold font-mono text-white mt-1">
            {metrics?.mrr ? `₹${Number(metrics.mrr).toLocaleString('en-IN')}` : '₹49,999'}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-slate-800">
          <div className="text-[11px] text-slate-400">Paired Hardware</div>
          <div className="text-2xl font-bold font-mono text-purple-300 mt-1">
            {metrics?.activeDevices ?? '...'}
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
              <h4 className="text-sm font-bold text-white">Database Engine & Supabase Cloud Sync</h4>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                dbStatus?.supabase?.connected
                  ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40'
                  : dbStatus?.supabase?.configured
                  ? 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                  : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}>
                {dbStatus?.supabase?.connected
                  ? 'SUPABASE SYNC CONNECTED'
                  : dbStatus?.supabase?.configured
                  ? 'KEYS DETECTED (SCHEMA PENDING)'
                  : 'IN-MEMORY LOCAL STORAGE'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              {dbStatus?.supabase?.message || 'In-memory engine active. Connect Supabase to persist customer records permanently.'}
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

      {/* Customer Management Section */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-700/80 shadow-2xl mb-8">
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
                        cust.subscription?.status === 'active'
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
                      {cust.subscription?.status || 'None'} ({cust.subscription?.planId || 'Free'})
                    </span>
                    {cust.subscription?.provider && (
                      <span className="ml-1 text-[9px] text-slate-500 font-mono">
                        [{cust.subscription.provider}]
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-slate-300">
                    {cust.devicesCount ?? (cust.devices?.length || 0)} device(s)
                  </td>
                  <td className="py-3 px-3 text-[11px] text-slate-400 max-w-[150px] truncate font-sans">
                    {cust.supportNotes ? cust.supportNotes[cust.supportNotes.length - 1] : 'No notes'}
                  </td>
                  <td className="py-3 px-3 text-right space-x-1">
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
            <h3 className="text-lg font-bold text-white">Payment & Subscription Webhook Audit Log</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Idempotent event processing for Razorpay Subscriptions and Cashfree Gateway events.
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-400">Idempotency Guard Active</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-slate-400 uppercase font-mono text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Event ID</th>
                <th className="py-2.5 px-3">Event Type</th>
                <th className="py-2.5 px-3">Processed At</th>
                <th className="py-2.5 px-3">Delivery Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {webhooks.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-slate-500">
                    No webhooks processed yet.
                  </td>
                </tr>
              ) : (
                webhooks.map((ev) => (
                  <tr key={ev.eventId}>
                    <td className="py-2.5 px-3 text-cyan-400">{ev.eventId}</td>
                    <td className="py-2.5 px-3 text-white font-bold">{ev.eventType}</td>
                    <td className="py-2.5 px-3 text-slate-400">
                      {new Date(ev.receivedAt).toLocaleTimeString()}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px]">
                        IDEMPOTENT SUCCESS
                      </span>
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
          <div className="w-full max-w-md rounded-2xl glass-panel-glow p-6 bg-[#0c1220] border border-slate-700">
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
