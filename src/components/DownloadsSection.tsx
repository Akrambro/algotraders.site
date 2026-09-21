import React, { useState, useEffect } from 'react';
import {
  Download,
  Monitor,
  Smartphone,
  BookOpen,
  FileCode,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ExternalLink,
  Loader2,
  FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface DownloadsSectionProps {
  onGoToPricing: () => void;
  onOpenDocs: () => void;
}

export const DownloadsSection: React.FC<DownloadsSectionProps> = ({
  onGoToPricing,
  onOpenDocs
}) => {
  const { token, subscription } = useAuth();
  const [downloads, setDownloads] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDownloads = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const resp = await fetch('/api/downloads', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await resp.json();
        if (resp.ok) {
          setDownloads(data);
        } else {
          setError(data.error || 'Failed to load downloads');
        }
      } catch (err: any) {
        setError(err.message || 'Error fetching downloads');
      } finally {
        setLoading(false);
      }
    };
    fetchDownloads();
  }, [token]);

  const hasEntitlement =
    subscription &&
    (subscription.status === 'active' || subscription.status === 'trialing');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Software Downloads & Releases</h2>
          <p className="text-xs text-slate-400 mt-1">
            Official cryptographically signed release builds of QBot2 Trading.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-xs px-3 py-1 rounded-full border font-mono flex items-center gap-1.5 ${
              hasEntitlement
                ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                : 'bg-amber-500/20 border-amber-500/30 text-amber-300'
            }`}
          >
            {hasEntitlement ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Entitlement Active • Verified</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Subscription or Trial Required</span>
              </>
            )}
          </span>
        </div>
      </div>

      {!hasEntitlement && (
        <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-amber-200">
            <strong>Active license required:</strong> Download links for production executables are gated. Please activate a trial or select a subscription to download.
          </div>
          <button
            onClick={onGoToPricing}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 shrink-0"
          >
            Select Subscription
          </button>
        </div>
      )}

      {/* Grid of Release Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Windows PC Backend */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800 flex flex-col justify-between hover:border-cyan-500/30 transition-all">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Monitor className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-slate-900 border border-slate-700 text-slate-300">
                v2.4.1 Production
              </span>
            </div>

            <h3 className="text-lg font-bold text-white">QBot2 Windows Backend</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Standalone trading daemon. Runs locally on port 8000, executes Supertrend algorithms with broker connectors, and serves real-time WebSockets to the Android app.
            </p>

            <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-2 text-xs text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Platform:</span>
                <span className="font-mono text-slate-200">Windows 10 / 11 (x64)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Package:</span>
                <span className="font-mono text-slate-200">Standalone ZIP (No install needed)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">SHA-256 Checksum:</span>
                <span className="font-mono text-[10px] text-cyan-400 truncate max-w-[200px]">
                  {downloads?.windows?.sha256 || 'e4b9c1d2...98f4'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800">
            {hasEntitlement ? (
              <a
                href={
                  downloads?.downloads?.find((d: any) => d.platform === 'windows')?.downloadUrl ||
                  downloads?.windows?.url ||
                  'https://myrqldmzekujotuvxfnb.supabase.co/storage/v1/object/sign/Qbot2%20Bundle/QBot2-Windows.zip?token=eyJraWQiOiI1ZWZmZDM4Mi0xZGE3LTQxNjQtYTAxOS1jNTNjYzQ0MWVhMDkiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJRYm90MiBCdW5kbGUvUUJvdDItV2luZG93cy56aXAiLCJzY29wZSI6ImRvd25sb2FkIiwiaWF0IjoxNzg5OTY5NDAwLCJleHAiOjE5NDc2NDk0MDB9.bg0k2noEcK2K5W1KPeEZN1l3IEjMeXJdro8aifxoK3iPDjrDTRg6ggpx7EjdRWPuXOqxzmE3ubB2okq9fOd0fg'
                }
                target="_blank"
                rel="noopener noreferrer"
                download="QBot2-Windows-Backend.zip"
                className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-cyan-400 hover:bg-cyan-300 text-slate-950 flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Windows Executable (ZIP)</span>
              </a>
            ) : (
              <button
                disabled
                className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-slate-800 text-slate-500 flex items-center justify-center gap-2 cursor-not-allowed"
              >
                <Lock className="w-4 h-4" />
                <span>Download Locked (Entitlement Required)</span>
              </button>
            )}
          </div>
        </div>

        {/* Card 2: Android APK Mobile Companion */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800 flex flex-col justify-between hover:border-purple-500/30 transition-all">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Smartphone className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-slate-900 border border-slate-700 text-slate-300">
                v2.1.0 Release
              </span>
            </div>

            <h3 className="text-lg font-bold text-white">QBot2 Android Mobile App</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Native Android monitor and remote control. Connects over local Wi-Fi to your PC backend. View candlestick charts, indicator flips, live trade notifications, and trigger emergency stops.
            </p>

            <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-2 text-xs text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Compatibility:</span>
                <span className="font-mono text-slate-200">Android 9.0+ (API 28+)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Format:</span>
                <span className="font-mono text-slate-200">Direct Signed APK</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">SHA-256 Checksum:</span>
                <span className="font-mono text-[10px] text-purple-400 truncate max-w-[200px]">
                  {downloads?.android?.sha256 || '9a8b7c6d...3312'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800">
            {hasEntitlement ? (
              <a
                href={
                  downloads?.downloads?.find((d: any) => d.platform === 'android')?.downloadUrl ||
                  downloads?.android?.url ||
                  'https://drive.google.com/uc?export=download&id=1Qjf-ICUswsxKkr2voaElHQ0RdsWRre0o'
                }
                target="_blank"
                rel="noopener noreferrer"
                download="QBot2-Mobile-Monitor-v2.1.0.apk"
                className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-purple-500 hover:bg-purple-400 text-slate-950 flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Android Mobile App (APK)</span>
              </a>
            ) : (
              <button
                disabled
                className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-slate-800 text-slate-500 flex items-center justify-center gap-2 cursor-not-allowed"
              >
                <Lock className="w-4 h-4" />
                <span>Download Locked (Entitlement Required)</span>
              </button>
            )}
          </div>
        </div>

        {/* Card 3: Setup Documentation & Guides */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-4">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Setup Documentation & LAN Pairing</h3>
            <p className="text-xs text-slate-400 mt-1">
              Step-by-step PDF guide for configuring Windows firewall permissions, router port bindings, and pairing Android clients.
            </p>
          </div>
          <button
            onClick={onOpenDocs}
            className="mt-4 text-xs font-semibold text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View Architecture Documentation</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 4: Python Backend Source Code */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4">
              <FileCode className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">FastAPI Windows Backend Code</h3>
            <p className="text-xs text-slate-400 mt-1">
              Inspect the Python licensing script (<code className="text-emerald-300">qbot2_windows_backend_licensing.py</code>) implementing offline grace period verification.
            </p>
          </div>
          <button
            onClick={onOpenDocs}
            className="mt-4 text-xs font-semibold text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Inspect Python Integration Code</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
