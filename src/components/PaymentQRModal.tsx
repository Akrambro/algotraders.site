import React, { useState, useEffect } from 'react';
import {
  X,
  QrCode,
  Copy,
  Check,
  Mail,
  ShieldCheck,
  ArrowRight,
  Loader2,
  FileCheck2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Smartphone,
  AlertTriangle,
  Clock
} from 'lucide-react';
import QRCode from 'qrcode';
import { useAuth } from '../context/AuthContext.tsx';

interface PaymentQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPlan?: 'monthly' | 'annual';
}

// Function to generate unique website Order ID (e.g. ORD1024)
const generateOrderId = (): string => {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `ORD${randomNum}`;
};

export const PaymentQRModal: React.FC<PaymentQRModalProps> = ({
  isOpen,
  onClose,
  initialPlan = 'monthly'
}) => {
  const { user, token } = useAuth();
  const [plan, setPlan] = useState<'monthly' | 'annual'>(initialPlan);
  const [orderId, setOrderId] = useState<string>(() => generateOrderId());
  const [copiedOrderId, setCopiedOrderId] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [upiPayload, setUpiPayload] = useState<string>('');

  // 5-minute transaction countdown timeout state (300 seconds)
  const [timeLeft, setTimeLeft] = useState<number>(300);
  const [orderRefreshedNotice, setOrderRefreshedNotice] = useState<boolean>(false);

  // Submission form state
  const [utrNumber, setUtrNumber] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Exact UPI configuration specified by user
  const upiId = '8930709664@ybl';
  const payeeName = 'Dheeraj';
  const amount = plan === 'annual' ? 49999 : 4999;
  const currency = 'INR';
  const planName = plan === 'annual' ? 'Annual Full Suite (₹49,999/yr)' : 'Monthly Full Suite (₹4,999/mo)';

  useEffect(() => {
    if (initialPlan) {
      setPlan(initialPlan);
    }
  }, [initialPlan]);

  // When modal is newly opened, generate a fresh order ID if not already set & reset timer
  useEffect(() => {
    if (isOpen) {
      if (!orderId) {
        setOrderId(generateOrderId());
      }
      setTimeLeft(300);
    }
  }, [isOpen]);

  // Reset countdown timer when plan changes
  useEffect(() => {
    setTimeLeft(300);
  }, [plan]);

  // 5-Minute Countdown Timer: force refresh and change uniqueOrderId if not paid within 5 minutes
  useEffect(() => {
    if (!isOpen || submitSuccess) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // 5 minutes elapsed: generate new uniqueOrderId to stop older abandoned orders from conflicting
          const newOrderId = generateOrderId();
          setOrderId(newOrderId);
          setOrderRefreshedNotice(true);
          setTimeout(() => setOrderRefreshedNotice(false), 4500);
          return 300; // reset 5-minute countdown
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, submitSuccess]);

  // Generate dynamic UPI URI and QR Code
  // Format requested: upi://pay?pa=YOUR_UPI_ID@bank&pn=YOUR_NAME&am=AMOUNT&tn=ORDER_ID&tr=ORDER_ID&cu=INR
  useEffect(() => {
    const generateQr = async () => {
      try {
        const payload = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${amount}&tn=${encodeURIComponent(orderId)}&tr=${encodeURIComponent(orderId)}&cu=${currency}`;
        setUpiPayload(payload);

        const url = await QRCode.toDataURL(payload, {
          width: 320,
          margin: 1,
          color: {
            dark: '#030712',
            light: '#ffffff'
          },
          errorCorrectionLevel: 'M'
        });
        setQrDataUrl(url);
      } catch (err) {
        console.error('Failed to generate QR:', err);
      }
    };

    if (orderId) {
      generateQr();
    }
  }, [plan, amount, orderId]);

  if (!isOpen) return null;

  const handleRegenerateOrderId = () => {
    const newId = generateOrderId();
    setOrderId(newId);
    setTimeLeft(300);
    setOrderRefreshedNotice(true);
    setTimeout(() => setOrderRefreshedNotice(false), 3000);
  };

  const handleCopyOrderId = () => {
    navigator.clipboard.writeText(orderId);
    setCopiedOrderId(true);
    setTimeout(() => setCopiedOrderId(false), 2000);
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('algotraders.site@zohomail.in');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  // Format MM:SS for countdown timer
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedCountdown = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      setErrorMessage('Please enter your registered email address.');
      return;
    }
    if (!utrNumber.trim()) {
      setErrorMessage('Please enter your 12-digit UPI UTR / Reference Number.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const resp = await fetch('/api/billing/submit-manual-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          orderId,
          email: emailInput.trim(),
          utrNumber: utrNumber.trim(),
          planId: plan,
          amount,
          notes: notes.trim()
        })
      });

      const data = await resp.json();
      if (resp.ok) {
        setSubmitSuccess(true);
      } else {
        setErrorMessage(data.error || 'Failed to submit payment details.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error submitting payment proof.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl my-auto bg-[#090e1a] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden text-slate-100 max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Sticky Header with Close Button (Visible across all steps & states) */}
        <div className="sticky top-0 z-30 bg-[#0f172a] p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base md:text-lg font-bold text-white flex flex-wrap items-center gap-2">
                <span>Dynamic UPI Payment QR</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-400 font-mono font-bold">
                  AUTO-NOTE EMBEDDED
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Scan with PhonePe, Google Pay, Paytm, BHIM, or any UPI app
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Payment Modal"
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors shrink-0 cursor-pointer border border-transparent hover:border-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1 overscroll-contain">
          {/* Plan Selector */}
          <div className="flex rounded-xl bg-slate-950 p-1.5 border border-slate-800">
            <button
              onClick={() => {
                setPlan('monthly');
                setSubmitSuccess(false);
              }}
              className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-colors ${
                plan === 'monthly'
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Monthly Plan • ₹4,999
            </button>
            <button
              onClick={() => {
                setPlan('annual');
                setSubmitSuccess(false);
              }}
              className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                plan === 'annual'
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Annual Plan • ₹49,999</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500 text-slate-950 font-extrabold uppercase">
                Save ₹9,989
              </span>
            </button>
          </div>

          {!submitSuccess ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Left Column: Dynamic QR Code & UPI Details */}
              <div className="flex flex-col items-center bg-slate-950 p-5 rounded-2xl border border-slate-800 text-center">
                <div className="flex items-center justify-between w-full mb-2">
                  <span className="text-[11px] font-mono text-slate-400">Total Payable</span>
                  <span className="text-sm font-bold text-cyan-400 font-mono">
                    ₹{amount.toLocaleString('en-IN')} {currency}
                  </span>
                </div>

                {/* QR Code Container */}
                <div className="p-3 bg-white rounded-xl shadow-lg border border-slate-300 my-1 relative">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt={`Dynamic UPI QR Code for ₹${amount}`}
                      className="w-52 h-52 object-contain"
                    />
                  ) : (
                    <div className="w-52 h-52 flex items-center justify-center text-slate-500">
                      <Loader2 className="w-8 h-8 animate-spin" />
                    </div>
                  )}
                </div>

                {/* Transaction Timeout (5-Minute Countdown) */}
                <div className="mt-2.5 w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <span className="text-sm select-none">⌛</span>
                    <div>
                      <span className="text-xs font-bold text-white block leading-tight">Transaction Timeout</span>
                      <span className="text-[10px] text-slate-400">Forces refresh to prevent stale order conflicts</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-mono font-extrabold text-xs px-2.5 py-1 rounded border ${
                        timeLeft < 60
                          ? 'bg-rose-950 text-rose-300 border-rose-500/60 animate-pulse'
                          : 'bg-cyan-950 text-cyan-300 border-cyan-500/40'
                      }`}
                      title="5-minute countdown timer"
                    >
                      {formattedCountdown}
                    </span>
                    <button
                      type="button"
                      onClick={handleRegenerateOrderId}
                      className="p-1 text-slate-400 hover:text-cyan-300 cursor-pointer"
                      title="Refresh Order ID & Timer now"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {orderRefreshedNotice && (
                  <div className="mt-2 w-full py-1.5 px-3 rounded-lg bg-cyan-950/90 border border-cyan-500/50 text-cyan-300 text-[11px] flex items-center justify-between animate-in fade-in">
                    <span className="font-medium">Order ID refreshed for security!</span>
                    <span className="font-mono font-bold text-white">{orderId}</span>
                  </div>
                )}

                {/* Direct Mobile UPI Intent Button */}
                <a
                  href={upiPayload}
                  className="mt-3 w-full py-2 px-3 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Open in UPI App (Mobile Only)</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>

                {/* Specifications & Parameters Display */}
                {/* Specifications & Parameters Display */}
                <div className="mt-3 w-full text-left space-y-2 text-xs">
                  {/* Payee Name */}
                  <div className="flex items-center justify-between p-2.5 bg-slate-900 border border-slate-800 rounded-lg">
                    <span className="text-[11px] text-slate-400">Payee Name:</span>
                    <span className="font-bold text-white tracking-wide">{payeeName}</span>
                  </div>

                  {/* Unique Order ID (tn & tr) */}
                  <div className="p-2 bg-slate-900 border border-cyan-500/30 rounded-lg space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-cyan-300 font-semibold">Order ID (tn & tr):</span>
                      <div className="flex items-center gap-1">
                        <span className="font-mono font-extrabold text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/40 select-all">
                          {orderId}
                        </span>
                        <button
                          type="button"
                          onClick={handleCopyOrderId}
                          className="p-1 text-slate-400 hover:text-cyan-300 cursor-pointer"
                          title="Copy Order ID"
                        >
                          {copiedOrderId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={handleRegenerateOrderId}
                          className="p-1 text-slate-400 hover:text-cyan-300 cursor-pointer"
                          title="Generate fresh Order ID"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight">
                      This ID is embedded in the QR note and automatically appears on your PhonePe / GPay screen.
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Accepted on PhonePe, Google Pay, Paytm, BHIM & Cred</span>
                </div>
              </div>

              {/* Right Column: Steps & Submission Form */}
              <div className="space-y-4">
                <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-cyan-500 text-slate-950 font-mono flex items-center justify-center text-xs font-bold">
                      1
                    </span>
                    <span>Payment Instructions</span>
                  </h4>

                  <ol className="text-xs text-slate-300 space-y-2 leading-relaxed">
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-cyan-400 shrink-0">•</span>
                      <span>
                        Scan the dynamic QR code with any UPI app to pay <strong>₹{amount.toLocaleString('en-IN')}</strong> to payee <strong>{payeeName}</strong>.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-cyan-400 shrink-0">•</span>
                      <span>
                        The transaction note (tn/tr) will automatically show your Order ID: <strong className="text-cyan-300 font-mono">{orderId}</strong>.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-cyan-400 shrink-0">•</span>
                      <span>
                        After paying, submit your 12-digit UTR below and email your screenshot to{' '}
                        <strong className="text-white select-all">algotraders.site@zohomail.in</strong>.
                      </span>
                    </li>
                  </ol>
                </div>

                {/* Proof Submission Form */}
                <form onSubmit={handleSubmitProof} className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-cyan-500 text-slate-950 font-mono flex items-center justify-center text-xs font-bold">
                        2
                      </span>
                      <span>Submit Payment Verification</span>
                    </span>
                    <span className="font-mono text-[11px] text-cyan-400">Order: {orderId}</span>
                  </h4>

                  {errorMessage && (
                    <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <div>
                    <label className="text-[11px] font-medium text-slate-400 block mb-1">
                      Your Registered Email Address *
                    </label>
                    <input
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      required
                      placeholder="example@gmail.com"
                      onFocus={(e) => {
                        if (e.target.placeholder) e.target.placeholder = '';
                      }}
                      onBlur={(e) => {
                        if (!e.target.placeholder) e.target.placeholder = 'example@gmail.com';
                      }}
                      className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-400 placeholder:text-slate-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-400 block mb-1">
                      12-Digit UPI Reference / UTR Number *
                    </label>
                    <input
                      type="text"
                      value={utrNumber}
                      onChange={(e) => setUtrNumber(e.target.value)}
                      required
                      placeholder="e.g. 408912345678"
                      className="w-full px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-400 block mb-1">
                      Payment App / Bank Notes (Optional)
                    </label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Paid via PhonePe (HDFC Bank)"
                      className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-cyan-400 hover:bg-cyan-300 text-slate-950 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-md"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Submitting Verification...</span>
                      </>
                    ) : (
                      <>
                        <FileCheck2 className="w-4 h-4" />
                        <span>Submit Verification Request</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          ) : (
            /* Success confirmation screen */
            <div className="p-8 bg-slate-950 rounded-2xl border border-emerald-500/40 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <Check className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white">
                Payment Verification Submitted!
              </h3>
              <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                Thank you! Your verification request for Order <strong>{orderId}</strong> ({planName}) has been received by our administrators.
              </p>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-left max-w-md mx-auto space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Order ID (tn / tr):</span>
                  <span className="text-cyan-400 font-mono font-bold">{orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Payee:</span>
                  <span className="text-white font-medium">{payeeName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Amount:</span>
                  <span className="text-white font-mono font-bold">₹{amount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Registered Email:</span>
                  <span className="text-white font-mono">{emailInput}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">UTR / Reference:</span>
                  <span className="text-cyan-400 font-mono font-bold">{utrNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status:</span>
                  <span className="text-amber-400 font-bold">Pending Admin Verification</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <a
                  href={`mailto:algotraders.site@zohomail.in?subject=Payment Screenshot - Order ${orderId} (${emailInput})&body=Hello AlgoTraders Team,%0D%0A%0D%0APlease find attached my payment screenshot for the Quotex Bot subscription.%0D%0A%0D%0AOrder ID: ${orderId}%0D%0ARegistered Email: ${emailInput}%0D%0APlan: ${planName}%0D%0AAmount Paid: ₹${amount}%0D%0AUTR Number: ${utrNumber}%0D%0APayee: ${payeeName}%0D%0A%0D%0AThank you!`}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold bg-cyan-400 hover:bg-cyan-300 text-slate-950 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Mail className="w-4 h-4" />
                  <span>Send Screenshot via Email</span>
                </a>
                <button
                  onClick={onClose}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer"
                >
                  Close Window
                </button>
              </div>
            </div>
          )}

          {/* Quick email copy footer */}
          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-cyan-400" />
              <span>Send payment screenshot to:</span>
              <span className="font-mono text-white select-all">algotraders.site@zohomail.in</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleCopyEmail}
                className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                {copiedEmail ? 'Email Copied!' : 'Copy Email Address'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
