import React, {useEffect, useState} from 'react';
import {Download, Monitor, Smartphone, Loader2, BookOpen, CheckCircle2, CloudDownload, HardDrive} from 'lucide-react';
import {useAuth} from '../context/AuthContext.tsx';
import type {DownloadItem} from '../types.ts';

export function DownloadsSection({onGoToPricing,onOpenDocs}: {onGoToPricing:()=>void;onOpenDocs:()=>void}) {
  const {token,subscription}=useAuth();
  const [data,setData]=useState<{isEntitled:boolean;downloads:DownloadItem[]}|null>(null);
  const [message,setMessage]=useState('');
  const [busy,setBusy]=useState('');

  useEffect(()=>{
    setData(null);
    setMessage('');
    if (!token) return;
    let mounted=true;
    fetch('/api/downloads',{headers:{Authorization:`Bearer ${token}`}})
      .then(async response=>{const body=await response.json();if(!response.ok)throw new Error(body.error || 'Downloads unavailable.');return body;})
      .then(body=>{if(mounted)setData(body);})
      .catch(error=>{if(mounted)setMessage(error.message);});
    return ()=>{mounted=false;};
  },[token,subscription?.status,subscription?.currentPeriodStart,subscription?.currentPeriodEnd]);

  const download=async (item: DownloadItem)=>{
    setBusy(item.id);
    setMessage(`Connecting to secure cloud storage & preparing ${item.platform === 'windows' ? 'Windows ZIP' : 'Android APK'} (${item.size || '50+ MB'})... Please wait a moment.`);
    try {
      const response=await fetch(`/api/downloads/file/${item.platform}`,{headers:{Authorization:`Bearer ${token}`},redirect:'error'});
      if(!response.ok) {
        const body=await response.json().catch(() => ({}));
        throw new Error(body.error || 'Download unavailable. Please contact support or try again later.');
      }
      const blob = await response.blob();
      const url=URL.createObjectURL(blob);
      const anchor=document.createElement('a');
      anchor.href=url;
      anchor.download=item.filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(()=>URL.revokeObjectURL(url),60000);
      setMessage(`✓ ${item.filename} downloaded directly to your device! A seller-issued license key is required to activate the software.`);
    } catch(error:any) {
      setMessage(error.message || 'Download failed. Retry shortly.');
    } finally {
      setBusy('');
    }
  };

  return <section className="space-y-5">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span>Licensed QBot2 Software Downloads</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-mono font-bold">
            DIRECT IN-PAGE
          </span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Files download directly to your browser without redirecting to external websites. Active subscription required.
        </p>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800">
        <CloudDownload className="w-3.5 h-3.5 text-cyan-400" />
        <span>High-speed Cloud Storage</span>
      </div>
    </div>

    {message && (
      <div className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 ${
        message.startsWith('✓') 
          ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300' 
          : message.includes('Connecting') || message.includes('preparing')
          ? 'bg-cyan-950/70 border-cyan-500/40 text-cyan-200 animate-pulse'
          : 'bg-amber-950/70 border-amber-500/40 text-amber-300'
      }`}>
        {message.startsWith('✓') ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        ) : message.includes('Connecting') ? (
          <Loader2 className="w-4 h-4 text-cyan-400 animate-spin shrink-0" />
        ) : null}
        <span>{message}</span>
      </div>
    )}

    {!token && <p className="text-sm text-slate-400">Sign in to view your downloads.</p>}
    {token && !data && !message && <Loader2 className="h-6 w-6 animate-spin text-cyan-400"/>}
    {data && !data.isEntitled && (
      <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-xs text-amber-300">
          Payment verification or active subscription required to unlock software downloads.
        </p>
        <button onClick={onGoToPricing} className="rounded-lg bg-amber-500 hover:bg-amber-400 px-4 py-2 text-xs font-bold text-slate-950 cursor-pointer transition-colors">
          Choose a subscription / renew
        </button>
      </div>
    )}

    <div className="grid gap-5 md:grid-cols-2">
      {data?.downloads.map(item=>(
        <article key={item.id} className="rounded-2xl border border-slate-800 bg-slate-950/90 p-5 flex flex-col justify-between hover:border-slate-700 transition-colors">
          <div>
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center">
                {item.platform==='windows'?<Monitor className="h-5 w-5 text-cyan-400"/>:<Smartphone className="h-5 w-5 text-purple-400"/>}
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-900 text-slate-300 border border-slate-800 flex items-center gap-1">
                <HardDrive className="w-3 h-3 text-cyan-400" />
                {item.size || '50+ MB'}
              </span>
            </div>

            <h3 className="mt-3 font-bold text-white text-base">{item.title}</h3>
            <p className="text-xs font-mono text-cyan-400 mt-0.5">Version {item.version} • {item.filename}</p>

            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              {item.platform==='windows'
                ?'Windows 10/11 x64. Extract the entire ZIP to your PC; keep all backend executables together.'
                :'Android companion app. The licensed Windows PC must remain running on your trusted network.'}
            </p>

            <div className="my-3 pt-3 border-t border-slate-800/80">
              <p className="text-[11px] font-semibold text-slate-300 mb-1.5">Package Highlights:</p>
              <ul className="list-disc space-y-1 pl-4 text-[11px] text-slate-400">
                {item.changelog.map(line=><li key={line}>{line}</li>)}
              </ul>
            </div>

            {item.sha256 && (
              <p className="mb-3 break-all font-mono text-[9px] text-slate-500">
                SHA-256: {item.sha256}
              </p>
            )}
          </div>

          <div className="pt-3 border-t border-slate-800/60">
            <button
              onClick={()=>download(item)}
              disabled={!data.isEntitled || !item.downloadUrl || Boolean(busy)}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 px-4 py-3 text-xs font-bold text-slate-950 disabled:opacity-40 disabled:hover:bg-cyan-500 cursor-pointer transition-colors shadow-lg shadow-cyan-950/50"
            >
              {busy===item.id?(
                <>
                  <Loader2 className="h-4 w-4 animate-spin"/>
                  <span>Streaming file (50+ MB)...</span>
                </>
              ):(
                <>
                  <Download className="h-4 w-4"/>
                  <span>
                    {!data.isEntitled
                      ?'Active subscription required'
                      :!item.downloadUrl
                      ?'Release upload pending'
                      :`Download ${item.platform==='windows'?'Windows ZIP':'Android APK'}`}
                  </span>
                </>
              )}
            </button>
            <p className="text-[10px] text-center text-slate-500 mt-1.5">
              Direct download on this page • No external redirects
            </p>
          </div>
        </article>
      ))}
    </div>

    <button onClick={onOpenDocs} className="flex items-center gap-2 text-xs font-medium text-cyan-400 hover:text-cyan-300 cursor-pointer transition-colors pt-2">
      <BookOpen className="h-4 w-4"/>
      <span>Need installation or license key activation help? View Documentation</span>
    </button>
  </section>;
}
