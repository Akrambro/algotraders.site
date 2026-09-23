import React, { useState } from 'react';
import {
  Smartphone,
  Sliders,
  History,
  Terminal,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Wifi,
  Lock,
  Pause,
  Play,
  RotateCcw
} from 'lucide-react';

export const ScreenshotsSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'mobile' | 'settings' | 'history' | 'windows'>('mobile');

  return (
    <section className="py-24 relative border-t border-slate-800/80 bg-[#070b14]" id="screenshots">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs uppercase font-bold tracking-widest text-cyan-400">
            Interface Preview
          </span>
          <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Designed for Precision and Clarity
          </h2>
          <p className="mt-4 text-slate-300 text-base">
            Explore the high-fidelity native interfaces of both the QBot2 Android companion app and Windows execution backend.
          </p>

          {/* Tab Selector */}
          <div className="mt-8 inline-flex p-1.5 rounded-xl bg-slate-900/90 border border-slate-800 flex-wrap justify-center gap-1">
            <button
              onClick={() => setActiveTab('mobile')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'mobile'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Mobile Dashboard</span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'settings'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Trading Settings</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'history'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Trade History</span>
            </button>
            <button
              onClick={() => setActiveTab('windows')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'windows'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Terminal className="w-4 h-4" />
              <span>Windows Backend Setup</span>
            </button>
          </div>
        </div>

        {/* Tab Showcase Card */}
        <div className="max-w-4xl mx-auto glass-panel rounded-2xl p-6 sm:p-8 border border-slate-700/80 shadow-2xl">
          {/* TAB 1: Mobile Dashboard */}
          {activeTab === 'mobile' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <div className="text-xs uppercase font-mono text-cyan-400">Android Mobile Monitor</div>
                  <h3 className="text-xl font-bold text-white">Live Execution & Status Hub</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 flex items-center gap-1.5 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    PC Connected (192.168.1.145:8000)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800">
                  <div className="text-xs text-slate-400">Active Trading Mode</div>
                  <div className="text-lg font-bold text-white mt-1">PRACTICE ACCOUNT</div>
                  <div className="text-[11px] text-emerald-400 mt-1">Virtual Broker Balance: $10,000.00</div>
                </div>

                <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800">
                  <div className="text-xs text-slate-400">Today&apos;s Performance</div>
                  <div className="text-lg font-bold font-mono text-emerald-400 mt-1">+$184.50 (Net)</div>
                  <div className="text-[11px] text-slate-400 mt-1">12 Orders • 8 Wins • 4 Losses</div>
                </div>

                <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800">
                  <div className="text-xs text-slate-400">Strategy Indicator</div>
                  <div className="text-lg font-bold text-cyan-300 mt-1">Quotex Binary Engine (M1)</div>
                  <div className="text-[11px] text-slate-400 mt-1">1-Min Candle Interval</div>
                </div>
              </div>

              {/* Visual Mobile Screen Frame */}
              <div className="bg-[#050811] rounded-xl p-5 border border-slate-800">
                <div className="flex justify-between items-center text-xs mb-3 text-slate-400 font-mono">
                  <span>ACTIVE TICKER: EUR/USD</span>
                  <span className="text-cyan-400">Payout: 88%</span>
                </div>

                {/* Live bar chart mockup */}
                <div className="h-32 bg-slate-950/80 rounded-lg p-3 flex items-end justify-between gap-2 border border-slate-850">
                  {[35, 45, 40, 60, 50, 65, 80, 75, 90, 85, 95, 92].map((v, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center">
                      <div
                        className={`w-full rounded-t ${
                          i > 8 ? 'bg-emerald-400 shadow-sm shadow-emerald-500/50' : 'bg-cyan-500/80'
                        }`}
                        style={{ height: `${v}%` }}
                      />
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 font-mono">
                      Stop Loss Cap: $15.00
                    </span>
                    <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 font-mono">
                      Trailing ATR: Active
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1">
                      <Pause className="w-3.5 h-3.5" /> Pause
                    </button>
                    <button className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 flex items-center gap-1 font-bold">
                      Emergency Stop
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Trading Settings */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <div className="text-xs uppercase font-mono text-cyan-400">Risk & Strategy Config</div>
                  <h3 className="text-xl font-bold text-white">Algorithmic Parameter Management</h3>
                </div>
                <span className="text-xs text-slate-400 font-mono">Hot-reloads directly to PC</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800 space-y-4">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-cyan-400" />
                    Quotex Algo Bot Parameters
                  </h4>
                  <div>
                    <label className="text-xs text-slate-400 flex justify-between">
                      <span>ATR Period</span>
                      <span className="text-cyan-400 font-mono">10</span>
                    </label>
                    <input
                      type="range"
                      min="5"
                      max="30"
                      defaultValue="10"
                      className="w-full mt-1.5 accent-cyan-400 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 flex justify-between">
                      <span>ATR Multiplier</span>
                      <span className="text-cyan-400 font-mono">3.0</span>
                    </label>
                    <input
                      type="range"
                      min="1.0"
                      max="5.0"
                      step="0.1"
                      defaultValue="3.0"
                      className="w-full mt-1.5 accent-cyan-400 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 flex justify-between">
                      <span>Timeframe Resolution</span>
                      <span className="text-cyan-400 font-mono">1 Minute (M1)</span>
                    </label>
                    <select className="w-full mt-1.5 bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200">
                      <option>1 Minute (M1)</option>
                      <option>5 Minutes (M5)</option>
                      <option>15 Minutes (M15)</option>
                    </select>
                  </div>
                </div>

                <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800 space-y-4">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Lock className="w-4 h-4 text-purple-400" />
                    Capital & Risk Protection
                  </h4>
                  <div>
                    <label className="text-xs text-slate-400 flex justify-between">
                      <span>Max Risk Per Order</span>
                      <span className="text-purple-400 font-mono">1.0% of Balance ($10.00)</span>
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="5.0"
                      step="0.5"
                      defaultValue="1.0"
                      className="w-full mt-1.5 accent-purple-400 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 flex justify-between">
                      <span>Daily Drawdown Limit</span>
                      <span className="text-rose-400 font-mono">-$50.00 (Hard Stop)</span>
                    </label>
                    <input
                      type="range"
                      min="20"
                      max="200"
                      defaultValue="50"
                      className="w-full mt-1.5 accent-rose-400 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 flex justify-between">
                      <span>Minimum Asset Payout Cutoff</span>
                      <span className="text-emerald-400 font-mono">&gt; 80%</span>
                    </label>
                    <input
                      type="range"
                      min="70"
                      max="95"
                      defaultValue="80"
                      className="w-full mt-1.5 accent-emerald-400 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Trade History */}
          {activeTab === 'history' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <div className="text-xs uppercase font-mono text-cyan-400">Order Execution Audit</div>
                  <h3 className="text-xl font-bold text-white">Full Trade Logs & Fill Prices</h3>
                </div>
                <div className="text-xs font-mono text-emerald-400">Win Rate: 66.7%</div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900/80 text-slate-400 uppercase font-mono text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Order ID</th>
                      <th className="py-2.5 px-3">Pair</th>
                      <th className="py-2.5 px-3">Signal</th>
                      <th className="py-2.5 px-3">Entry</th>
                      <th className="py-2.5 px-3">Exit</th>
                      <th className="py-2.5 px-3">Return</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    <tr>
                      <td className="py-3 px-3 text-slate-400">TRD-8822</td>
                      <td className="py-3 px-3 font-bold text-white">EUR/USD</td>
                      <td className="py-3 px-3 text-emerald-400">BUY</td>
                      <td className="py-3 px-3">1.0842</td>
                      <td className="py-3 px-3">1.0876</td>
                      <td className="py-3 px-3 text-emerald-400 font-bold">+$34.00</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px]">
                          PROFIT
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-3 text-slate-400">TRD-8821</td>
                      <td className="py-3 px-3 font-bold text-white">GBP/JPY</td>
                      <td className="py-3 px-3 text-rose-400">SELL</td>
                      <td className="py-3 px-3">192.15</td>
                      <td className="py-3 px-3">191.70</td>
                      <td className="py-3 px-3 text-emerald-400 font-bold">+$45.00</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px]">
                          PROFIT
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-3 text-slate-400">TRD-8820</td>
                      <td className="py-3 px-3 font-bold text-white">USD/CAD</td>
                      <td className="py-3 px-3 text-emerald-400">BUY</td>
                      <td className="py-3 px-3">1.3540</td>
                      <td className="py-3 px-3">1.3525</td>
                      <td className="py-3 px-3 text-rose-400 font-bold">-$15.00</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px]">
                          STOP LOSS
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: Windows Backend Setup */}
          {activeTab === 'windows' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <div className="text-xs uppercase font-mono text-cyan-400">Windows PC Execution Daemon</div>
                  <h3 className="text-xl font-bold text-white">FastAPI Local Server on Port 8000</h3>
                </div>
                <div className="text-xs font-mono text-cyan-300">Local Wi-Fi Host</div>
              </div>

              {/* Terminal Code Mock */}
              <div className="bg-[#04060d] rounded-xl p-4 font-mono text-xs text-slate-300 border border-slate-850 space-y-2">
                <div className="text-slate-500 flex items-center justify-between">
                  <span>C:\QBot2&gt; python -m uvicorn main:app --host 0.0.0.0 --port 8000</span>
                  <span className="text-emerald-400">[ONLINE]</span>
                </div>
                <div className="text-cyan-400">
                  INFO: [Licensing] Validating license token with cloud server: https://algotraders.site/api/license/validate
                </div>
                <div className="text-emerald-400">
                  INFO: [Licensing] Handshake SUCCESS. Subscription Active. Offline grace: 12 hrs.
                </div>
                <div className="text-slate-400">
                  INFO: [Network] Bound to interface 192.168.1.145:8000
                </div>
                <div className="text-purple-400">
                  INFO: [Wi-Fi Pairing] Waiting for Android Mobile connection...
                </div>
                <div className="text-emerald-300">
                  INFO: [Wi-Fi Pairing] Handshake accepted from Android client at 192.168.1.189
                </div>
                <div className="text-slate-400">
                  INFO: [Strategy] Quotex binary options algo bot engine initialized (M1 timeframe)
                </div>
              </div>

              <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
                <span>Network discovery: Android phone discovers PC automatically over LAN.</span>
                <span className="text-cyan-400 font-mono font-bold">Latency: &lt; 5ms</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
