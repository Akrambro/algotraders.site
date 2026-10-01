import React from 'react';
import {X, Key} from 'lucide-react';

export function ActivationHelp({isOpen,onClose,onDevicePaired}: {
  isOpen: boolean; onClose: () => void; onDevicePaired: () => void;
}) {
  if (!isOpen) return null;
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
    <section role="dialog" aria-modal="true" aria-labelledby="activation-help-title" className="relative w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-950 p-7 text-slate-300">
      <button aria-label="Close activation instructions" onClick={onClose} className="absolute right-4 top-4"><X className="h-5 w-5"/></button>
      <Key className="mb-4 h-8 w-8 text-cyan-400"/>
      <h3 id="activation-help-title" className="text-xl font-bold text-white">Activate your Windows PC</h3>
      <ol className="mt-5 list-decimal space-y-4 pl-5 text-sm leading-relaxed">
        <li>Register with the email used for payment. After manually verifying your payment, the seller sends you a <code>QB2-...</code> license key.</li>
        <li>Extract the Windows ZIP and run <code>QBotBackend.exe</code>. Enter the key when prompted, or press Enter to activate from the Android app.</li>
        <li>On Android, connect to your PC on the same trusted Wi-Fi and enter the key on the activation screen. This activates the PC, not a separate phone license.</li>
        <li>Your PC remembers its activation. Internet validation is required whenever the bot starts, and the subscription must remain active.</li>
      </ol>
      <p className="mt-5 text-sm">Renewal: pay the seller, receive a new key, then choose <strong>Settings → Enter a new key / renew</strong> in the app. On Windows you can also run <code>QBotBackend.exe --activate</code>.</p>
      <p className="mt-4 text-xs text-slate-400">One Windows PC may be active at a time. Moving to another PC or reinstalling Windows requires a replacement key from the seller. There are no browser-generated pairing codes.</p>
      <button onClick={()=>{onDevicePaired();onClose();}} className="mt-6 rounded-lg bg-cyan-500 px-4 py-3 text-sm font-bold text-slate-950">Done — refresh my devices</button>
    </section>
  </div>;
}
