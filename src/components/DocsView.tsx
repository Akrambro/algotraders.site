import React from 'react';
import {Key, Monitor, Smartphone, RefreshCw, Wifi} from 'lucide-react';

export const DocsView: React.FC = () => (
  <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 text-slate-300">
    <h1 className="text-3xl font-bold text-white">QBot2 installation and activation</h1>
    <p className="mt-4 text-sm leading-relaxed">Use the licensed Windows ZIP and Android APK from your dashboard. After your payment is approved, the seller supplies a QB2 license key for your Windows PC.</p>
    <div className="mt-8 grid gap-6 md:grid-cols-2">
      <section className="glass-card rounded-2xl border border-slate-800 p-6">
        <Key className="mb-3 h-7 w-7 text-cyan-400"/>
        <h2 className="font-bold text-white">1. Receive your license key</h2>
        <p className="mt-3 text-sm leading-relaxed">Register with the email used for payment. Submit your payment reference for verification and keep the seller-issued <code>QB2-...</code> key private. Download access and Windows activation are separate steps.</p>
      </section>
      <section className="glass-card rounded-2xl border border-slate-800 p-6">
        <Monitor className="mb-3 h-7 w-7 text-cyan-400"/>
        <h2 className="font-bold text-white">2. Set up Windows</h2>
        <ol className="mt-3 list-decimal space-y-3 pl-5 text-sm leading-relaxed">
          <li>Extract the entire ZIP into a writable folder. Keep <code>QBotBackend.exe</code> and the <code>worker</code> folder together.</li>
          <li>Copy <code>.env.example</code> to <code>.env</code>, then enter your Quotex credentials. Keep this file private.</li>
          <li>Run <code>QBotBackend.exe</code>. Enter your license key when prompted, or press Enter to activate through Android. Leave the backend window open.</li>
          <li>Allow Windows Firewall access on Private networks. Find the PC's Wi-Fi IPv4 address using <code>ipconfig</code>.</li>
        </ol>
      </section>
      <section className="glass-card rounded-2xl border border-slate-800 p-6">
        <Smartphone className="mb-3 h-7 w-7 text-purple-400"/>
        <h2 className="font-bold text-white">3. Connect Android</h2>
        <p className="mt-3 text-sm leading-relaxed">Install the current APK. On the activation screen, enter your PC address, such as <code>http://192.168.1.25:8000</code>, and select <strong>Connect / check saved license</strong>. If the PC has not been activated, enter your seller-issued key there. The license belongs to the PC; the phone controls that PC.</p>
        <p className="mt-3 text-sm leading-relaxed">Keep both devices on the same trusted Wi-Fi. Once activated, configure the bot and begin with a Practice account.</p>
      </section>
      <section className="glass-card rounded-2xl border border-slate-800 p-6">
        <RefreshCw className="mb-3 h-7 w-7 text-cyan-400"/>
        <h2 className="font-bold text-white">Renewal and moving PCs</h2>
        <p className="mt-3 text-sm leading-relaxed">After paying for renewal, enter the new seller-issued key using <strong>Settings &rarr; Enter a new key / renew</strong> in Android, or run <code>QBotBackend.exe --activate</code> on Windows.</p>
        <p className="mt-3 text-sm leading-relaxed">One Windows PC can be active at a time. Contact the seller for a replacement key when changing PCs or reinstalling Windows. Activation is remembered under your Windows user account.</p>
      </section>
    </div>
    <section className="mt-6 rounded-2xl border border-slate-800 p-6">
      <Wifi className="mb-3 h-7 w-7 text-cyan-400"/>
      <h2 className="font-bold text-white">Connection and license checks</h2>
      <p className="mt-3 text-sm leading-relaxed">Starting the bot requires an online license check. During an existing session, authorization lasts for at most 15 minutes and never beyond the paid expiry. When authorization expires, new trades stop while monitoring of existing trades continues. Broker connectivity is still required.</p>
      <p className="mt-3 text-sm leading-relaxed">Keep the PC powered on. Do not forward port 8000 to the internet. If a release is unavailable, wait for the current licensed download or contact the seller.</p>
    </section>
  </div>
);
