import React, {useEffect, useState} from 'react';
import {Download, Monitor, Smartphone, Loader2, BookOpen} from 'lucide-react';
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
    setBusy(item.id);setMessage('Preparing your download…');
    try {
      const response=await fetch(`/api/downloads/file/${item.platform}`,{headers:{Authorization:`Bearer ${token}`},redirect:'error'});
      if(!response.ok) {const body=await response.json();throw new Error(body.error || 'Download unavailable.');}
      const url=URL.createObjectURL(await response.blob());
      const anchor=document.createElement('a');anchor.href=url;anchor.download=item.filename;
      document.body.appendChild(anchor);anchor.click();anchor.remove();
      setTimeout(()=>URL.revokeObjectURL(url),60000);
      setMessage('Download started. A seller-issued license is required to activate the Windows bot.');
    } catch(error:any) {setMessage(error.message || 'Download failed. Retry shortly.');}
    finally {setBusy('');}
  };
  return <section className="space-y-5">
    <h2 className="text-xl font-bold text-white">Licensed QBot2 downloads</h2>
    <p className="text-sm text-slate-400">Payment approval enables downloads. Enter the separately supplied license key to activate your Windows PC.</p>
    {message && <p role="status" className="text-sm text-cyan-300">{message}</p>}
    {!token && <p className="text-sm text-slate-400">Sign in to view your downloads.</p>}
    {token && !data && !message && <Loader2 className="h-6 w-6 animate-spin text-cyan-400"/>}
    {data && !data.isEntitled && <button onClick={onGoToPricing} className="rounded-lg bg-amber-500 px-4 py-3 text-sm font-bold text-slate-950">Choose a subscription / renew</button>}
    <div className="grid gap-5 md:grid-cols-2">{data?.downloads.map(item=><article key={item.id} className="rounded-xl border border-slate-800 bg-slate-950 p-5">
      {item.platform==='windows'?<Monitor className="h-8 w-8 text-cyan-400"/>:<Smartphone className="h-8 w-8 text-purple-400"/>}
      <h3 className="mt-3 font-bold text-white">{item.title} {item.version}</h3>
      <p className="mt-2 text-xs text-slate-400">{item.platform==='windows'?'Windows 10/11 x64. Extract the entire ZIP; keep both programs together.':'Android companion. The licensed Windows PC must remain running on your trusted network.'}</p>
      <ul className="my-4 list-disc space-y-1 pl-4 text-xs text-slate-300">{item.changelog.map(line=><li key={line}>{line}</li>)}</ul>
      {item.sha256 && <p className="mb-4 break-all font-mono text-[10px] text-slate-400">SHA-256: {item.sha256}</p>}
      <button onClick={()=>download(item)} disabled={!data.isEntitled || !item.downloadUrl || Boolean(busy)} className="flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-3 text-xs font-bold text-slate-950 disabled:opacity-40">
        {busy===item.id?<Loader2 className="h-4 w-4 animate-spin"/>:<Download className="h-4 w-4"/>}
        {!data.isEntitled?'Active subscription required':!item.downloadUrl?'Release upload pending':busy===item.id?'Downloading…':`Download ${item.platform==='windows'?'Windows ZIP':'Android APK'}`}
      </button>
    </article>)}</div>
    <button onClick={onOpenDocs} className="flex items-center gap-2 text-sm text-cyan-400"><BookOpen className="h-4 w-4"/>Installation and licensing help</button>
  </section>;
}
