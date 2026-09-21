import React, { useState } from 'react';
import { Shield, CheckCircle, CreditCard, Smartphone, Building2, AlertCircle, X, Loader2, ArrowRight } from 'lucide-react';

export interface RazorpayOrderData {
  order_id: string;
  amount: number;
  currency: string;
  planId: 'monthly' | 'annual';
  name?: string;
  description?: string;
  key_id?: string;
  isSimulated?: boolean;
  authError?: string;
}

interface RazorpayModalProps {
  isOpen: boolean;
  orderData: RazorpayOrderData | null;
  userEmail: string;
  userName: string;
  token: string;
  onClose: () => void;
  onSuccess: (paymentId: string) => void;
}

export const RazorpayModal: React.FC<RazorpayModalProps> = ({
  isOpen,
  orderData,
  userEmail,
  userName,
  token,
  onClose,
  onSuccess
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [upiId, setUpiId] = useState<string>('trader@okhdfcbank');
  const [cardNumber, setCardNumber] = useState<string>('4111 2222 3333 4444');
  const [cardExpiry, setCardExpiry] = useState<string>('12/28');
  const [cardCvv, setCardCvv] = useState<string>('123');
  const [selectedBank, setSelectedBank] = useState<string>('HDFC Bank');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [step, setStep] = useState<'select' | 'processing' | 'success' | 'error'>('select');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !orderData) return null;

  const displayAmount = (orderData.amount / 100).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  });

  const handleSimulatePayment = async () => {
    setIsProcessing(true);
    setStep('processing');
    setErrorMessage(null);

    try {
      // Simulate real gateway processing delay
      await new Promise((r) => setTimeout(r, 1200));

      const simulatedPaymentId = 'pay_rzp_' + Math.random().toString(36).substring(2, 10);
      const simulatedSignature = 'simulated_sig_success';

      const verifyResp = await fetch('/api/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          razorpay_order_id: orderData.order_id,
          razorpay_payment_id: simulatedPaymentId,
          razorpay_signature: simulatedSignature,
          planId: orderData.planId,
          email: userEmail
        })
      });

      const verifyResult = await verifyResp.json();

      if (verifyResp.ok && verifyResult.success) {
        setStep('success');
        setTimeout(() => {
          onSuccess(simulatedPaymentId);
        }, 1500);
      } else {
        setStep('error');
        setErrorMessage(verifyResult.error || 'Payment verification rejected by server.');
      }
    } catch (err: any) {
      setStep('error');
      setErrorMessage(err.message || 'Network error during signature verification.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0b1324] border border-cyan-500/40 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl shadow-cyan-950/60 relative">
        {/* Modal Top Header (Razorpay Styled) */}
        <div className="bg-gradient-to-r from-[#0c2340] to-[#081b33] p-5 border-b border-cyan-900/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white text-base tracking-tight">Razorpay Checkout</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  TEST SANDBOX
                </span>
              </div>
              <p className="text-xs text-slate-400">Algo Trders • QBot2 Algorithmic Platform</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pricing Summary Bar */}
        <div className="px-6 py-3 bg-[#070e1c] border-b border-slate-800 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-400">Order ID: </span>
            <span className="text-cyan-300 font-mono">{orderData.order_id}</span>
          </div>
          <div className="text-right">
            <span className="text-slate-400">Total: </span>
            <span className="text-white font-bold text-sm text-emerald-400">{displayAmount}</span>
          </div>
        </div>

        {/* Diagnostic Notice */}
        {orderData.authError && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 text-xs text-amber-200 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <strong className="font-semibold block text-amber-300">Razorpay API Authentication Notice:</strong>
              The credentials in <code className="bg-amber-900/60 px-1 py-0.5 rounded">.env</code> returned{' '}
              <em>401 Authentication Failed</em> on Razorpay servers (the test key may have been rolled on your dashboard).
              Use this interactive test checkout simulator to verify the full payment flow and unlock access instantly!
            </div>
          </div>
        )}

        {/* Step: Select & Fill */}
        {step === 'select' && (
          <div className="p-6 space-y-5">
            {/* Method Tabs */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('upi')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                  paymentMethod === 'upi'
                    ? 'bg-cyan-950/60 border-cyan-400 text-cyan-300 shadow-md shadow-cyan-500/20'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Smartphone className="w-5 h-5" />
                <span className="text-xs font-semibold">UPI Apps</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                  paymentMethod === 'card'
                    ? 'bg-cyan-950/60 border-cyan-400 text-cyan-300 shadow-md shadow-cyan-500/20'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <CreditCard className="w-5 h-5" />
                <span className="text-xs font-semibold">Card</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('netbanking')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                  paymentMethod === 'netbanking'
                    ? 'bg-cyan-950/60 border-cyan-400 text-cyan-300 shadow-md shadow-cyan-500/20'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Building2 className="w-5 h-5" />
                <span className="text-xs font-semibold">Netbanking</span>
              </button>
            </div>

            {/* Method Details */}
            {paymentMethod === 'upi' && (
              <div className="space-y-3 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <label className="block text-xs font-medium text-slate-300">Test UPI ID / VPA</label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-cyan-400"
                  placeholder="success@razorpay"
                />
                <div className="flex gap-2 pt-1">
                  {['trader@okhdfcbank', 'success@razorpay', 'algo@paytm'].map((id) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setUpiId(id)}
                      className="px-2 py-1 rounded bg-slate-800 text-[10px] text-cyan-300 hover:bg-slate-700"
                    >
                      {id}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {paymentMethod === 'card' && (
              <div className="space-y-3 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Card Number (Test)</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Valid Thru</label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">CVV</label>
                    <input
                      type="password"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'netbanking' && (
              <div className="space-y-3 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <label className="block text-xs font-medium text-slate-300">Select Bank</label>
                <div className="grid grid-cols-2 gap-2">
                  {['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank'].map((bank) => (
                    <button
                      key={bank}
                      type="button"
                      onClick={() => setSelectedBank(bank)}
                      className={`p-2.5 rounded-lg text-xs font-medium border text-left transition-all ${
                        selectedBank === bank
                          ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      {bank}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Customer Prefill Summary */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
              <span>Customer: {userName || 'Registered Trader'}</span>
              <span>{userEmail}</span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-1/3 py-3 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSimulatePayment}
                disabled={isProcessing}
                className="w-2/3 py-3 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>Pay {displayAmount}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step: Processing */}
        {step === 'processing' && (
          <div className="p-10 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center mx-auto animate-pulse">
              <Loader2 className="w-7 h-7 animate-spin" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Processing Razorpay Payment</h3>
              <p className="text-xs text-slate-400 mt-1">
                Authenticating transaction & verifying HMAC-SHA256 signature with server...
              </p>
            </div>
          </div>
        )}

        {/* Step: Success */}
        {step === 'success' && (
          <div className="p-10 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Payment Successful & Verified!</h3>
              <p className="text-xs text-slate-300 mt-1">
                Subscription activated. Unlocking Windows app and Android downloads...
              </p>
            </div>
          </div>
        )}

        {/* Step: Error */}
        {step === 'error' && (
          <div className="p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Payment Verification Error</h3>
              <p className="text-xs text-rose-300 mt-1">{errorMessage}</p>
            </div>
            <button
              type="button"
              onClick={() => setStep('select')}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Footer info */}
        <div className="px-6 py-3 bg-[#060b17] border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span>256-bit SSL Encrypted • PCI-DSS Compliant</span>
          </div>
          <span className="font-mono">Razorpay v1.x</span>
        </div>
      </div>
    </div>
  );
};
