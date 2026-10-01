import React from 'react';

export const DownloadsSection: React.FC<{onGoToPricing: () => void; onOpenDocs: () => void}> = ({onOpenDocs}) => (
  <section className="space-y-4 text-slate-300">
    <h2 className="text-xl font-bold text-white">Legacy downloads retired</h2>
    <p className="text-sm">Downloads from this website version are no longer available. Contact the seller for the current licensed Windows ZIP and Android APK.</p>
    <p className="text-sm">The current Windows release requires a seller-issued QB2 license key. If a new download is unavailable, wait for it to be restored.</p>
    <button onClick={onOpenDocs} className="text-sm text-cyan-400">Installation and activation help</button>
  </section>
);