import React, { useState } from 'react';
import {
  FileCode,
  Server,
  Smartphone,
  ShieldCheck,
  Terminal,
  Cpu,
  Copy,
  Check,
  ExternalLink,
  Wifi,
  Key
} from 'lucide-react';

export const DocsView: React.FC = () => {
  const [copiedCode, setCopiedCode] = useState(false);

  const pythonSample = `"""
QBot2 Trading - Windows PC Backend Licensing Integration
File: qbot2_windows_backend_licensing.py
Runs locally on Windows PC (port 8000).
Communicates with Android Mobile App over Local Wi-Fi.
Validates licensing with https://algotrders.site/api/license/validate.
"""

from fastapi import FastAPI, HTTPException, status
import requests, hashlib, os, datetime

app = FastAPI(title="QBot2 Windows Engine")

CLOUD_URL = "https://algotrders.site/api/license/validate"
DEVICE_ID = "DEV-WIN-8942"
HARDWARE_FP = "WINPC-I9-9900K"

def verify_cloud_license():
    try:
        r = requests.post(CLOUD_URL, json={
            "deviceId": DEVICE_ID,
            "hardwareFingerprint": HARDWARE_FP
        }, timeout=4.0)
        return r.json().get("tradingAllowed", False)
    except Exception:
        # Fallback to local 12-hour offline grace check
        return check_local_grace_period()

@app.post("/api/start")
def start_bot():
    if not verify_cloud_license():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Subscription inactive or expired. Renew at https://algotrders.site"
        )
    # Start Supertrend strategy on local broker...
    return {"status": "started", "strategy": "Supertrend (ATR=10, Mult=3.0)"}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(pythonSample);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10 text-center max-w-3xl mx-auto">
        <span className="text-xs uppercase font-bold tracking-widest text-cyan-400 font-mono">
          Engineering & Integration
        </span>
        <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          System Architecture & Windows PC Integration
        </h1>
        <p className="mt-3 text-slate-300 text-sm">
          Technical specifications of the hybrid local-cloud architecture powering QBot2 Trading.
        </p>
      </div>

      {/* 3-Tier Architecture Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="glass-card rounded-2xl p-6 border border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4">
            <Server className="w-5 h-5" />
          </div>
          <div className="text-xs font-mono text-cyan-400 uppercase">Tier 1: Cloud SaaS</div>
          <h3 className="text-lg font-bold text-white mt-1">Licensing & Auth Server</h3>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Hosted at <code>algotrders.site</code>. Manages customer identity, Stripe billing, HMAC signed entitlement tokens, and short-lived device pairing codes. Never touches broker credentials.
          </p>
        </div>

        <div className="glass-card rounded-2xl p-6 border border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-4">
            <Terminal className="w-5 h-5" />
          </div>
          <div className="text-xs font-mono text-blue-400 uppercase">Tier 2: Windows Engine</div>
          <h3 className="text-lg font-bold text-white mt-1">Local PC FastAPI Daemon</h3>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Executes on port 8000 on the customer&apos;s computer. Runs Supertrend mathematical models, manages broker sockets, caches a 12-hour offline grace period, and broadcasts WebSocket telemetry.
          </p>
        </div>

        <div className="glass-card rounded-2xl p-6 border border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-4">
            <Smartphone className="w-5 h-5" />
          </div>
          <div className="text-xs font-mono text-purple-400 uppercase">Tier 3: Mobile Client</div>
          <h3 className="text-lg font-bold text-white mt-1">Android Companion App</h3>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Connects to the Windows PC over local Wi-Fi. Offers real-time charts, notification sounds on indicator flips, parameter modification, and instant emergency stop triggers.
          </p>
        </div>
      </div>

      {/* Code Viewer Section */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-700/80 shadow-2xl mb-12">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-mono">
                qbot2_windows_backend_licensing.py
              </h3>
              <p className="text-xs text-slate-400">
                FastAPI implementation showing strict cloud validation before /api/start
              </p>
            </div>
          </div>

          <button
            onClick={copyToClipboard}
            className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-2 transition-colors cursor-pointer"
          >
            {copiedCode ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">Copied Python Code</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy Script</span>
              </>
            )}
          </button>
        </div>

        <pre className="p-4 rounded-xl bg-slate-950 font-mono text-xs text-slate-300 overflow-x-auto border border-slate-900 leading-relaxed">
          <code>{pythonSample}</code>
        </pre>
      </div>
    </div>
  );
};
