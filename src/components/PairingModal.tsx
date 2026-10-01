import React from 'react';
import {X} from 'lucide-react';

export const PairingModal: React.FC<{isOpen: boolean; onClose: () => void; onDevicePaired: () => void}> = ({isOpen, onClose}) => {
  if (!isOpen) return null;
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
    <section role="dialog" aria-modal="true" aria-labelledby="retired-activation-title" className="relative max-w-lg rounded-2xl border border-slate-700 bg-slate-950 p-7 text-slate-300">
      <button aria-label="Close activation help" onClick={onClose} className="absolute right-4 top-4"><X className="h-5 w-5"/></button>
      <h2 id="retired-activation-title" className="text-xl font-bold text-white">Activate the current licensed release</h2>
      <p className="mt-4 text-sm">Device activation through this website version has been retired. Contact the seller for the current licensed release and your private QB2 license key.</p>
      <p className="mt-4 text-sm">Extract the Windows ZIP and run <code>QBotBackend.exe</code>. Enter your key when prompted, or connect Android to the PC on the same trusted Wi-Fi and enter the key on its activation screen.</p>
      <p className="mt-4 text-sm">Renew through <strong>Settings &rarr; Enter a new key / renew</strong> in Android or <code>QBotBackend.exe --activate</code> on Windows. One Windows PC may be active at a time.</p>
    </section>
  </div>;
};