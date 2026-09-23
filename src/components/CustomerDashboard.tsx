import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Smartphone,
  Monitor,
  Key,
  Download,
  CreditCard,
  Settings,
  HelpCircle,
  ExternalLink,
  CheckCircle2,
  Trash2,
  RefreshCw,
  Plus,
  Wifi,
  FileDown,
  UserX,
  LogOut,
  ChevronRight,
  Sparkles,
  User,
  Mail,
  Shield,
  BadgeCheck,
  Save,
  Info,
  Fingerprint
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { PairingModal } from './PairingModal.tsx';
import { DownloadsSection } from './DownloadsSection.tsx';
import { PaymentQRModal } from './PaymentQRModal.tsx';

interface CustomerDashboardProps {
  onGoToPricing: () => void;
  onOpenDocs: () => void;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({
  onGoToPricing,
  onOpenDocs
}) => {
  const { user, token, subscription, devices, refreshUserData, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'devices' | 'downloads' | 'settings'>('overview');
  const [pairingModalOpen, setPairingModalOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalMessage, setPortalMessage] = useState<string | null>(null);

  // Settings states
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(user?.twoFactorEnabled || false);
  const [twoFactorMessage, setTwoFactorMessage] = useState<string | null>(null);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileUpdating, setProfileUpdating] = useState(false);
  const [profileSuccessMessage, setProfileSuccessMessage] = useState<string | null>(null);
  const [profileErrorMessage, setProfileErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user?.name) setProfileName(user.name);
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileUpdating(true);
    setProfileSuccessMessage(null);
    setProfileErrorMessage(null);
    try {
      const resp = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: profileName })
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Failed to update profile.');
      setProfileSuccessMessage(data.message || 'Profile successfully updated in database.');
      await refreshUserData();
    } catch (err: any) {
      setProfileErrorMessage(err.message || 'Error updating profile.');
    } finally {
      setProfileUpdating(false);
    }
  };

  // Interactive Getting Started Checklist state
  const [checklist, setChecklist] = useState({
    installedWindows: false,
    pairedDevice: devices.length > 0,
    configuredStrategy: false,
    testedPractice: false
  });

  useEffect(() => {
    setChecklist((prev) => ({ ...prev, pairedDevice: devices.length > 0 }));
  }, [devices]);

  const toggleChecklist = (key: keyof typeof checklist) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Device revocation
  const handleRevokeDevice = async (deviceId: string) => {
    if (!confirm('Are you sure you want to revoke this device authorization?')) return;
    setRevokingId(deviceId);
    try {
      const resp = await fetch(`/api/devices/${deviceId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (resp.ok) {
        await refreshUserData();
      } else {
        const data = await resp.json();
        alert(data.error || 'Failed to revoke device.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRevokingId(null);
    }
  };

  // Razorpay / Payment Provider Customer Portal
  const handleManageBilling = async () => {
    setPortalLoading(true);
    setPortalMessage(null);
    try {
      const resp = await fetch('/api/billing/customer-portal', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await resp.json();
      if (resp.ok && data.url) {
        if (data.mode === 'simulated_dev' || data.mode === 'in_app_portal') {
          setPortalMessage(data.message || 'Subscription details and entitlements are active.');
        } else {
          window.location.href = data.url;
        }
      } else {
        setPortalMessage(data.error || 'Could not open billing portal.');
      }
    } catch (err: any) {
      setPortalMessage(err.message || 'Error opening billing portal.');
    } finally {
      setPortalLoading(false);
    }
  };

  // 2FA toggle
  const handleToggle2FA = async () => {
    try {
      const resp = await fetch('/api/auth/toggle-2fa', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await resp.json();
      if (resp.ok) {
        setTwoFactorEnabled(data.twoFactorEnabled);
        setTwoFactorMessage(data.message);
        await refreshUserData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // GDPR Data Export
  const handleExportData = async () => {
    try {
      const resp = await fetch('/api/auth/export-data', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await resp.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `algotraders_export_${user?.id || 'account'}.json`;
      a.click();
      setExportMessage('Data exported successfully to JSON format.');
    } catch (err) {
      console.error(err);
    }
  };

  // Calculate banner status
  const subStatus = subscription?.status || 'none';
  const isCanceled = subscription?.cancelAtPeriodEnd;
  const isTrial = subStatus === 'trialing';
  const isActive = subStatus === 'active';
  const isPending = subStatus === 'pending';
  const isHalted = subStatus === 'halted';
  const isPastDue = subStatus === 'past_due';
  const isExpired = subStatus === 'canceled' || subStatus === 'expired';
  const isSuspended = subStatus === 'suspended';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Customer Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 mb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Customer Dashboard
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-cyan-950 border border-cyan-500/40 text-cyan-300">
              {user?.email}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Manage your QBot2 subscription entitlement, pair Windows/Android hardware, and download releases.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPairingModalOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-400 hover:bg-cyan-300 text-slate-950 flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
            id="dashboard-pair-device-btn"
          >
            <Plus className="w-4 h-4" />
            <span>Pair New Device</span>
          </button>
          <button
            onClick={refreshUserData}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Refresh Status"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Subscription Banner supporting all states */}
      <div className="mb-8">
        {/* State 1: Active Subscription */}
        {isActive && !isCanceled && (
          <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    Active Subscription
                  </span>
                  <span className="text-[11px] px-2 py-0.2 rounded bg-emerald-900/50 text-emerald-200 font-mono">
                    {subscription?.planId?.toUpperCase()} PLAN
                  </span>
                </div>
                <div className="text-xs text-slate-300 mt-0.5">
                  Your QBot2 license is verified and healthy. Renews on{' '}
                  <span className="text-white font-semibold">
                    {subscription?.currentPeriodEnd
                      ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
                      : 'Next billing cycle'}
                  </span>
                  .
                </div>
              </div>
            </div>
            <button
              onClick={handleManageBilling}
              disabled={portalLoading}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 transition-colors shrink-0"
            >
              Manage Billing
            </button>
          </div>
        )}

        {/* State 2: Inactive License / No Active Plan */}
        {(!isActive && !isPending && !isHalted && !isPastDue && !isSuspended && !isCanceled) && (
          <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                    License Activation Required
                  </span>
                  <span className="text-[11px] px-2 py-0.2 rounded bg-cyan-900/60 text-cyan-200 font-mono">
                    INACTIVE
                  </span>
                </div>
                <div className="text-xs text-slate-300 mt-0.5">
                  Get your Monthly or Annual Pro license to unlock instant software downloads and automated Quotex trading algorithms.
                </div>
              </div>
            </div>
            <button
              onClick={() => setQrModalOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-400 hover:bg-cyan-300 text-slate-950 shrink-0 shadow-md shadow-cyan-500/20 cursor-pointer"
            >
              Scan QR & Activate License
            </button>
          </div>
        )}

        {/* State 3: Payment Failed / Past Due */}
        {isPastDue && (
          <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
                    Payment Failed
                  </span>
                  <span className="text-[11px] px-2 py-0.2 rounded bg-rose-900/60 text-rose-200 font-mono">
                    ACTION REQUIRED
                  </span>
                </div>
                <div className="text-xs text-slate-300 mt-0.5">
                  Your subscription renewal is pending. Please scan the payment QR code and email your screenshot to algotraders.site@zohomail.in.
                </div>
              </div>
            </div>
            <button
              onClick={() => setQrModalOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-500 hover:bg-rose-400 text-white shrink-0 cursor-pointer"
            >
              Pay via QR Code
            </button>
          </div>
        )}

        {/* State 3B: Subscription Halted */}
        {isHalted && (
          <div className="p-4 rounded-2xl bg-rose-950/50 border border-rose-600 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-600/20 text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
                    Subscription Halted
                  </span>
                  <span className="text-[11px] px-2 py-0.2 rounded bg-rose-900 text-rose-200 font-mono">
                    EXECUTION SUSPENDED
                  </span>
                </div>
                <div className="text-xs text-slate-300 mt-0.5">
                  Subscription expired. Scan the payment QR code and email your screenshot to algotraders.site@zohomail.in to re-activate.
                </div>
              </div>
            </div>
            <button
              onClick={() => setQrModalOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-500 hover:bg-rose-400 text-white shrink-0 shadow-lg shadow-rose-900/30 cursor-pointer"
            >
              Scan QR & Renew
            </button>
          </div>
        )}

        {/* State 3C: Subscription Pending Authorization */}
        {isPending && (
          <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    Payment Verification Pending
                  </span>
                  <span className="text-[11px] px-2 py-0.2 rounded bg-amber-900/60 text-amber-200 font-mono">
                    AWAITING ADMIN APPROVAL
                  </span>
                </div>
                <div className="text-xs text-slate-300 mt-0.5">
                  Your payment verification is under review. If you have not sent the screenshot yet, email it to <span className="text-white font-mono">algotraders.site@zohomail.in</span>. Software download links activate upon verification.
                </div>
              </div>
            </div>
            <button
              onClick={() => setQrModalOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shrink-0 cursor-pointer"
            >
              View QR & Submit UTR
            </button>
          </div>
        )}

        {/* State 4: Canceled but Still Active */}
        {isCanceled && (
          <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    Canceled (Active Until Period End)
                  </span>
                </div>
                <div className="text-xs text-slate-300 mt-0.5">
                  Your subscription will not renew. You have access until{' '}
                  <span className="text-white font-semibold">
                    {subscription?.currentPeriodEnd
                      ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
                      : 'End of period'}
                  </span>
                  .
                </div>
              </div>
            </div>
            <button
              onClick={handleManageBilling}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shrink-0"
            >
              Reactivate Subscription
            </button>
          </div>
        )}

        {/* State 5: Expired / No Plan */}
        {(isExpired || subStatus === 'none') && (
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Subscription Expired
                  </span>
                </div>
                <div className="text-xs text-slate-300 mt-0.5">
                  Trading algorithm execution is halted. Select a plan to restore your licensing key.
                </div>
              </div>
            </div>
            <button
              onClick={onGoToPricing}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-400 hover:bg-cyan-300 text-slate-950 shrink-0"
            >
              Choose a Plan
            </button>
          </div>
        )}

        {/* State 6: Suspended by Admin */}
        {isSuspended && (
          <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-500 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                <UserX className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-rose-400">
                  Account Suspended
                </div>
                <div className="text-xs text-slate-200 mt-0.5">
                  This account has been suspended by an administrator. Please contact algotraders.site@zohomail.in.
                </div>
              </div>
            </div>
          </div>
        )}

        {portalMessage && (
          <div className="mt-2 text-xs text-cyan-300 p-2.5 rounded-lg bg-cyan-950/40 border border-cyan-500/30">
            {portalMessage}
          </div>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-800 mb-8 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-4 text-xs font-bold tracking-wide border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'overview'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Monitor className="w-4 h-4" />
          <span>System Overview & Checklist</span>
        </button>
        <button
          onClick={() => setActiveTab('devices')}
          className={`pb-3 px-4 text-xs font-bold tracking-wide border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'devices'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>Paired Hardware ({devices.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('downloads')}
          className={`pb-3 px-4 text-xs font-bold tracking-wide border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'downloads'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Download className="w-4 h-4" />
          <span>Software Downloads</span>
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`pb-3 px-4 text-xs font-bold tracking-wide border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'settings'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Security & Account</span>
        </button>
      </div>

      {/* TAB CONTENT 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card rounded-2xl p-5 border border-slate-800">
              <div className="text-xs text-slate-400">Active Devices Limit</div>
              <div className="text-2xl font-bold font-mono text-white mt-1">
                {devices.length}{' '}
                <span className="text-xs text-slate-500">/ {subscription?.maxDevices || 2} Allowed</span>
              </div>
              <div className="mt-2 text-[11px] text-cyan-400">
                {devices.length === 0 ? 'No paired hardware yet' : 'Hardware within plan limits'}
              </div>
            </div>

            <div className="glass-card rounded-2xl p-5 border border-slate-800">
              <div className="text-xs text-slate-400">PC Connection Status</div>
              <div className="text-2xl font-bold text-white mt-1 flex items-center gap-2">
                {devices.some((d) => d.deviceType === 'windows_backend') ? (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-base text-emerald-400">ONLINE</span>
                  </>
                ) : (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
                    <span className="text-base text-slate-400">UNPAIRED</span>
                  </>
                )}
              </div>
              <div className="mt-2 text-[11px] text-slate-400 font-mono">
                Port 8000 • Local LAN
              </div>
            </div>

            <div className="glass-card rounded-2xl p-5 border border-slate-800">
              <div className="text-xs text-slate-400">Mobile Monitor Status</div>
              <div className="text-2xl font-bold text-white mt-1 flex items-center gap-2">
                {devices.some((d) => d.deviceType === 'android_app' || d.deviceType === 'android_mobile') ? (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse" />
                    <span className="text-base text-purple-300">PAIRED</span>
                  </>
                ) : (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
                    <span className="text-base text-slate-400">NOT CONNECTED</span>
                  </>
                )}
              </div>
              <div className="mt-2 text-[11px] text-slate-400">Wi-Fi Direct Protocol</div>
            </div>

            <div className="glass-card rounded-2xl p-5 border border-slate-800">
              <div className="text-xs text-slate-400">Offline Grace Period</div>
              <div className="text-2xl font-bold font-mono text-cyan-300 mt-1">12 Hours</div>
              <div className="mt-2 text-[11px] text-slate-400">Automatic local fallback cache</div>
            </div>
          </div>

          {/* Interactive Getting Started Checklist */}
          <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-700/80 shadow-2xl">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white">Getting Started Checklist</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Follow these 4 steps to deploy your Quotex binary options trading bot engine.
                </p>
              </div>
              <span className="text-xs font-mono text-cyan-400">
                {Object.values(checklist).filter(Boolean).length} / 4 Complete
              </span>
            </div>

            <div className="space-y-3">
              {/* Item 1 */}
              <div
                onClick={() => toggleChecklist('installedWindows')}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  checklist.installedWindows
                    ? 'bg-emerald-950/20 border-emerald-500/40 text-slate-200'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                      checklist.installedWindows
                        ? 'bg-emerald-500 text-slate-950'
                        : 'border border-slate-700 text-transparent'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">1. Download & Extract Windows Backend</h4>
                    <p className="text-[11px] text-slate-400">
                      Get the standalone ZIP from the Downloads tab and launch <code>qbot2_engine.exe</code>.
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </div>

              {/* Item 2 */}
              <div
                onClick={() => setPairingModalOpen(true)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  checklist.pairedDevice
                    ? 'bg-emerald-950/20 border-emerald-500/40 text-slate-200'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                      checklist.pairedDevice
                        ? 'bg-emerald-500 text-slate-950'
                        : 'border border-slate-700 text-transparent'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">2. Pair Windows PC Hardware</h4>
                    <p className="text-[11px] text-slate-400">
                      Generate a 6-digit activation code and authorize your PC installation.
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-cyan-400">Pair Now &rarr;</span>
              </div>

              {/* Item 3 */}
              <div
                onClick={() => toggleChecklist('configuredStrategy')}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  checklist.configuredStrategy
                    ? 'bg-emerald-950/20 border-emerald-500/40 text-slate-200'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                      checklist.configuredStrategy
                        ? 'bg-emerald-500 text-slate-950'
                        : 'border border-slate-700 text-transparent'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">3. Configure Quotex Bot Parameters</h4>
                    <p className="text-[11px] text-slate-400">
                      Define your binary options expiration timeframe, payout cutoff threshold, and stop-loss limits.
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </div>

              {/* Item 4 */}
              <div
                onClick={() => toggleChecklist('testedPractice')}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  checklist.testedPractice
                    ? 'bg-emerald-950/20 border-emerald-500/40 text-slate-200'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                      checklist.testedPractice
                        ? 'bg-emerald-500 text-slate-950'
                        : 'border border-slate-700 text-transparent'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">4. Run in Practice Account Mode First</h4>
                    <p className="text-[11px] text-slate-400">
                      Always complete at least 10 simulated trades before switching to real capital.
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: PAIRED HARDWARE */}
      {activeTab === 'devices' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Authorized Devices</h2>
              <p className="text-xs text-slate-400 mt-1">
                Hardware licensed to execute or monitor algorithms under your account.
              </p>
            </div>
            <button
              onClick={() => setPairingModalOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-400 hover:bg-cyan-300 text-slate-950 flex items-center gap-1.5 cursor-pointer shadow-lg shadow-cyan-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Pair Another Device</span>
            </button>
          </div>

          {devices.length === 0 ? (
            <div className="text-center py-16 glass-card rounded-2xl border border-slate-800 p-8">
              <Smartphone className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white">No Devices Paired Yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-5">
                Generate an activation code to connect your Windows PC backend or Android companion phone.
              </p>
              <button
                onClick={() => setPairingModalOpen(true)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-cyan-400 hover:bg-cyan-300 text-slate-950 cursor-pointer"
              >
                Generate Pairing Code
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {devices.map((device) => (
                <div
                  key={device.id}
                  className="glass-card rounded-2xl p-5 border border-slate-800 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400">
                          {device.deviceType === 'windows_backend' ? (
                            <Monitor className="w-5 h-5" />
                          ) : (
                            <Smartphone className="w-5 h-5 text-purple-400" />
                          )}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white">{device.deviceName}</h4>
                          <span className="text-[10px] uppercase font-mono text-slate-400">
                            {device.deviceType === 'windows_backend' ? 'Windows Engine' : 'Android Client'}
                          </span>
                        </div>
                      </div>

                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        AUTHORIZED
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-400 font-mono pt-3 border-t border-slate-850">
                      <div className="flex justify-between">
                        <span>Device ID:</span>
                        <span className="text-slate-200">{device.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Hardware Hash:</span>
                        <span className="text-slate-200">{device.hardwareFingerprint || 'WIN-AUTO-89'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Last Heartbeat:</span>
                        <span className="text-slate-200">
                          {device.lastHeartbeatAt
                            ? new Date(device.lastHeartbeatAt).toLocaleTimeString()
                            : 'Just now'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
                    <button
                      onClick={() => handleRevokeDevice(device.id)}
                      disabled={revokingId === device.id}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{revokingId === device.id ? 'Revoking...' : 'Revoke Hardware'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 3: DOWNLOADS */}
      {activeTab === 'downloads' && (
        <DownloadsSection onGoToPricing={onGoToPricing} onOpenDocs={onOpenDocs} />
      )}

      {/* TAB CONTENT 4: SETTINGS & ACCOUNT IDENTITY */}
      {activeTab === 'settings' && (
        <div className="max-w-3xl space-y-6">
          {/* 1. User Profile & Account Identity (Backend Database Connected) */}
          <div className="glass-card rounded-2xl p-6 border border-slate-800">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-base">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>User Profile & Identity</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono font-normal flex items-center gap-1">
                      <BadgeCheck className="w-3 h-3" />
                      VERIFIED
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Your personal profile records stored in the PostgreSQL / in-memory database.
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 px-2.5 py-1 rounded-lg border border-cyan-500/20">
                {user?.role === 'admin' ? 'SYSTEM ADMIN' : 'QUANT TRADER'}
              </span>
            </div>

            <form onSubmit={handleUpdateProfile} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Display Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      placeholder="Your Full Name"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 focus:border-cyan-500 text-xs text-white outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Registered Email (Database Key)
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-850 text-xs text-slate-400 cursor-not-allowed outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Database metadata badges */}
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-850 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">User Record ID</span>
                  <span className="text-slate-300 text-[11px] truncate block">{user?.id || 'usr_demo'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Member Since</span>
                  <span className="text-slate-300 text-[11px] block">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Active Member'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Plan Entitlement</span>
                  <span className="text-cyan-400 text-[11px] block font-bold uppercase">
                    {subscription?.planId || 'Standard'} ({subscription?.maxDevices || 2} Devices)
                  </span>
                </div>
              </div>

              {profileSuccessMessage && (
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{profileSuccessMessage}</span>
                </div>
              )}
              {profileErrorMessage && (
                <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{profileErrorMessage}</span>
                </div>
              )}

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={profileUpdating || profileName === user?.name}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 text-slate-950 flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-cyan-500/10"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{profileUpdating ? 'Saving to Database...' : 'Save Profile Changes'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* 2. GDPR Data Privacy & Statutory User Rights */}
          <div className="glass-card rounded-2xl p-6 border border-slate-800">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>GDPR Privacy & Data Sovereignty</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-500/30 font-mono">
                    EU GDPR 2016/679
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Why GDPR is in this section: Under international privacy mandates, you maintain full sovereign ownership over your stored User Profile, billing transactions, hardware fingerprints, and trading telemetry.
                </p>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              {/* Article 15/20: Data Portability */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-slate-200">Article 15 & 20: Data Portability Export</h4>
                    <span className="text-[10px] text-cyan-400 font-mono bg-cyan-950/40 px-1.5 py-0.2 rounded border border-cyan-500/20">
                      User Profile + Telemetry
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Download a comprehensive JSON document containing your profile information, subscription history, paired device MAC hashes, and support notes.
                  </p>
                </div>
                <button
                  onClick={handleExportData}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <FileDown className="w-4 h-4 text-cyan-400" />
                  <span>Export Profile JSON</span>
                </button>
              </div>

              {exportMessage && (
                <p className="text-xs text-emerald-400 font-mono pl-1">{exportMessage}</p>
              )}

              {/* Article 17: Right to Erasure */}
              <div className="p-4 rounded-xl bg-rose-950/15 border border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-rose-300">Article 17: Right to Erasure (&quot;Right to be Forgotten&quot;)</h4>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Permanently purge your user profile, revoke all paired PC & Android device authorizations, and delete billing associations from the database.
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (confirm('Permanently delete your profile and account? All paired hardware and subscriptions will be immediately purged from the database. This action cannot be undone.')) {
                      fetch('/api/auth/delete-account', {
                        method: 'POST',
                        headers: { Authorization: `Bearer ${token}` }
                      }).then(() => logout());
                    }
                  }}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shrink-0 cursor-pointer"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>

          {/* 3. Two-Factor Authentication (2FA) & Session Security */}
          <div className="glass-card rounded-2xl p-6 border border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Two-Factor Authentication (2FA)</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Require a 6-digit TOTP code during account sign-in for additional protection.
                </p>
              </div>
              <button
                onClick={handleToggle2FA}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  twoFactorEnabled
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30'
                    : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400'
                }`}
              >
                {twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
              </button>
            </div>
            {twoFactorMessage && (
              <p className="mt-3 text-xs text-emerald-400 font-mono">{twoFactorMessage}</p>
            )}
          </div>
        </div>
      )}

      {/* Pairing Modal */}
      <PairingModal
        isOpen={pairingModalOpen}
        onClose={() => setPairingModalOpen(false)}
        onDevicePaired={refreshUserData}
      />

      {/* Payment QR Modal */}
      <PaymentQRModal
        isOpen={qrModalOpen}
        onClose={() => {
          setQrModalOpen(false);
          refreshUserData();
        }}
      />
    </div>
  );
};
