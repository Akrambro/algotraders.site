import React, { useState } from 'react';
import { X, Lock, Mail, User, Key, CheckCircle, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface AuthModalProps {
  isOpen: boolean;
  initialMode: 'signin' | 'signup' | 'forgot' | 'reset' | '2fa';
  onClose: () => void;
  onSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode,
  onClose,
  onSuccess
}) => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot' | 'reset' | '2fa'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [resetToken, setResetToken] = useState('demo-token-9812');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      if (mode === 'signin') {
        const result = await login(email, password, twoFactorCode);
        if (result.requires2FA) {
          setMode('2fa');
          setSuccessMessage(result.message || 'Enter your 6-digit 2FA security code.');
          setLoading(false);
          return;
        }
        onSuccess();
        onClose();
      } else if (mode === 'signup') {
        await register(email, password, name);
        onSuccess();
        onClose();
      } else if (mode === '2fa') {
        await login(email, password, twoFactorCode);
        onSuccess();
        onClose();
      } else if (mode === 'forgot') {
        const resp = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const data = await resp.json();
        setSuccessMessage(data.message || 'Password reset link sent.');
      } else if (mode === 'reset') {
        const resp = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: resetToken, newPassword: password })
        });
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.error);
        setSuccessMessage(data.message || 'Password updated. You can now log in.');
        setTimeout(() => setMode('signin'), 1500);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication error.');
    } finally {
      setLoading(false);
    }
  };

  const fillCustomerPreset = () => {
    setEmail('trader@algotrders.site');
    setPassword('password123');
    setTwoFactorCode('');
    setErrorMessage(null);
  };

  const fillAdminPreset = () => {
    setEmail('admin@algotrders.site');
    setPassword('password123');
    setTwoFactorCode('123456');
    setErrorMessage(null);
  };

  const selectTestCustomer = (selectedEmail: string, code = '') => {
    setEmail(selectedEmail);
    setPassword('password123');
    setTwoFactorCode(code);
    setErrorMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl glass-panel-glow p-6 sm:p-8 border border-slate-700/80 shadow-2xl bg-[#0b101e]">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-600/30 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-bold text-white tracking-tight">
            {mode === 'signin' && 'Sign In to QBot2'}
            {mode === 'signup' && 'Create Your Account'}
            {mode === 'forgot' && 'Reset Password'}
            {mode === 'reset' && 'Choose New Password'}
            {mode === '2fa' && 'Two-Factor Verification'}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {mode === 'signin' && 'Access your paired devices and subscription entitlements'}
            {mode === 'signup' && 'Activate your 7-day full access trial automatically'}
            {mode === 'forgot' && 'Enter your registered email to receive reset instructions'}
            {mode === 'reset' && 'Must be at least 8 characters long'}
            {mode === '2fa' && 'Enter your authenticator app code (Demo: 123456)'}
          </p>
        </div>

        {/* Presets Bar for Instant Database Testing */}
        {(mode === 'signin' || mode === '2fa') && (
          <div className="mb-5 p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-400">Database Test Accounts:</span>
              <span className="text-cyan-400 font-bold">PW: password123</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => selectTestCustomer('trader@algotrders.site')}
                className="px-2 py-1 rounded bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/30 text-[10px] font-semibold transition-colors"
                title="Alex Vance: Active Annual, 2 Paired Devices"
              >
                Alex (Active Annual)
              </button>
              <button
                type="button"
                onClick={() => selectTestCustomer('david.kim@quantfund.io')}
                className="px-2 py-1 rounded bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-500/30 text-[10px] font-semibold transition-colors"
                title="David Kim: 7-Day Trial"
              >
                David (Trialing)
              </button>
              <button
                type="button"
                onClick={() => selectTestCustomer('priya.patel@mumbaifx.com')}
                className="px-2 py-1 rounded bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold transition-colors"
                title="Priya Patel: Active Annual, 3 Max Devices Quota"
              >
                Priya (3 Devices)
              </button>
              <button
                type="button"
                onClick={() => selectTestCustomer('carlos.mendez@forexmadrid.es')}
                className="px-2 py-1 rounded bg-orange-950/80 hover:bg-orange-900 text-orange-300 border border-orange-500/30 text-[10px] font-semibold transition-colors"
                title="Carlos Mendez: Past Due Subscription"
              >
                Carlos (Past Due)
              </button>
              <button
                type="button"
                onClick={() => selectTestCustomer('admin@algotrders.site', '123456')}
                className="px-2 py-1 rounded bg-purple-950/80 hover:bg-purple-900 text-purple-300 border border-purple-500/30 text-[10px] font-semibold transition-colors"
                title="Chief Admin: System Admin with 2FA"
              >
                Admin (2FA)
              </button>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Your Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Vance"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 text-xs text-white placeholder-slate-600 outline-none"
                />
              </div>
            </div>
          )}

          {mode !== '2fa' && mode !== 'reset' && (
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 text-xs text-white placeholder-slate-600 outline-none"
                />
              </div>
            </div>
          )}

          {mode !== 'forgot' && mode !== '2fa' && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-slate-300">
                  {mode === 'reset' ? 'New Password' : 'Password'}
                </label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-[11px] text-cyan-400 hover:underline"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 text-xs text-white placeholder-slate-600 outline-none"
                />
              </div>
            </div>
          )}

          {mode === '2fa' && (
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                6-Digit Two-Factor Authentication Code
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value)}
                placeholder="123456"
                className="w-full text-center tracking-widest font-mono text-lg py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 text-cyan-300 outline-none"
              />
              <p className="text-[11px] text-slate-500 text-center mt-1">
                For demo testing, enter code <span className="text-cyan-400 font-mono">123456</span>
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>
                  {mode === 'signin' && 'Sign In'}
                  {mode === 'signup' && 'Create Account & Start Trial'}
                  {mode === 'forgot' && 'Send Reset Link'}
                  {mode === 'reset' && 'Update Password'}
                  {mode === '2fa' && 'Verify & Enter Dashboard'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer switches */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 text-center text-xs text-slate-400">
          {mode === 'signin' ? (
            <p>
              Don&apos;t have an account yet?{' '}
              <button
                type="button"
                onClick={() => setMode('signup')}
                className="text-cyan-400 font-semibold hover:underline"
              >
                Sign up for 7-day trial
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('signin')}
                className="text-cyan-400 font-semibold hover:underline"
              >
                Sign in here
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
