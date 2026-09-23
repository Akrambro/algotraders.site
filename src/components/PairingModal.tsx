import React, { useState, useEffect } from 'react';
import { X, Key, Monitor, Smartphone, CheckCircle, Copy, Clock, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface PairingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDevicePaired: () => void;
}

export const PairingModal: React.FC<PairingModalProps> = ({
  isOpen,
  onClose,
  onDevicePaired
}) => {
  const { token } = useAuth();
  const [activationCode, setActivationCode] = useState<string>('');
  const [expiresInSeconds, setExpiresInSeconds] = useState<number>(600);
  const [loadingCode, setLoadingCode] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // In-browser device pairing simulator
  const [simDeviceName, setSimDeviceName] = useState<string>('My Trading Workstation');
  const [simDeviceType, setSimDeviceType] = useState<'windows_backend' | 'android_app'>('windows_backend');
  const [simStatus, setSimStatus] = useState<'idle' | 'pairing' | 'success' | 'error'>('idle');
  const [simMessage, setSimMessage] = useState<string>('');

  const generateCode = async () => {
    if (!token) return;
    setLoadingCode(true);
    try {
      const resp = await fetch('/api/devices/generate-code', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await resp.json();
      if (resp.ok) {
        setActivationCode(data.code);
        setExpiresInSeconds(600);
      } else {
        alert(data.error || 'Failed to generate pairing code');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCode(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      generateCode();
      setSimStatus('idle');
      setSimMessage('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || expiresInSeconds <= 0) return;
    const timer = setInterval(() => {
      setExpiresInSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, expiresInSeconds]);

  const copyCode = () => {
    navigator.clipboard.writeText(activationCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Test pair device using API endpoint
  const handleSimulatePair = async () => {
    if (!activationCode) return;
    setSimStatus('pairing');
    setSimMessage('');

    try {
      const resp = await fetch('/api/devices/pair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: activationCode,
          deviceName: simDeviceName,
          deviceType: simDeviceType,
          hardwareFingerprint: `HW-${Math.random().toString(36).substring(2, 9).toUpperCase()}`
        })
      });

      const data = await resp.json();
      if (resp.ok) {
        setSimStatus('success');
        setSimMessage(`Paired successfully! Device ID: ${data.device.id}`);
        onDevicePaired();
      } else {
        setSimStatus('error');
        setSimMessage(data.error || 'Pairing rejected by cloud server.');
      }
    } catch (err: any) {
      setSimStatus('error');
      setSimMessage(err.message || 'Network error during simulated pairing.');
    }
  };

  if (!isOpen) return null;

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl p-6 sm:p-8 border border-slate-700/80 shadow-2xl bg-[#0b101e] max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 mx-auto mb-3">
            <Key className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-bold text-white tracking-tight">
            Pair Windows PC or Android App
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Authorize your device to access real-time Quotex binary options bot trading.
          </p>
        </div>

        {/* Activation Code Display */}
        <div className="bg-slate-950 rounded-2xl p-5 border border-slate-800 text-center mb-6">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            One-Time Pairing Activation Code
          </span>

          <div className="flex items-center justify-center gap-3">
            {loadingCode ? (
              <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
            ) : (
              <span className="font-mono text-3xl sm:text-4xl font-black tracking-widest text-cyan-300">
                {activationCode || 'GENERATING...'}
              </span>
            )}
            <button
              onClick={copyCode}
              disabled={!activationCode}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
              title="Copy Code"
            >
              {copied ? (
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              ) : (
                <Copy className="w-5 h-5 text-slate-400" />
              )}
            </button>
          </div>

          <div className="mt-3 flex items-center justify-center gap-2 text-xs text-slate-500">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Expires in {formatTimer(expiresInSeconds)}</span>
            <span>•</span>
            <button
              onClick={generateCode}
              className="text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          </div>
        </div>

        {/* Step-by-Step Instructions */}
        <div className="space-y-3 mb-6 text-xs text-slate-300">
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
              1
            </span>
            <p>
              Launch the <strong>QBot2 Windows PC backend</strong> application or install the Android mobile APK.
            </p>
          </div>
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
              2
            </span>
            <p>
              When prompted on initial startup, enter the 6-digit code above: <strong className="text-cyan-300 font-mono">{activationCode}</strong>.
            </p>
          </div>
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
              3
            </span>
            <p>
              The cloud server securely validates your subscription entitlement and registers the device hardware signature.
            </p>
          </div>
        </div>

        {/* Interactive Device Simulator: Allows instant testing directly on the web! */}
        <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/30">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
              <Monitor className="w-4 h-4 text-cyan-400" />
              Interactive Test: Pair a Simulated Device
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-900 text-cyan-200">
              Live API Test
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Device Label</label>
              <input
                type="text"
                value={simDeviceName}
                onChange={(e) => setSimDeviceName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Device Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSimDeviceType('windows_backend')}
                  className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 ${
                    simDeviceType === 'windows_backend'
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" /> Windows PC
                </button>
                <button
                  type="button"
                  onClick={() => setSimDeviceType('android_app')}
                  className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 ${
                    simDeviceType === 'android_app'
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" /> Android App
                </button>
              </div>
            </div>

            {simMessage && (
              <div
                className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                  simStatus === 'success'
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                }`}
              >
                {simStatus === 'success' ? (
                  <CheckCircle className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{simMessage}</span>
              </div>
            )}

            <button
              onClick={handleSimulatePair}
              disabled={simStatus === 'pairing' || !activationCode}
              className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {simStatus === 'pairing' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <span>Submit Pairing Code via API</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
