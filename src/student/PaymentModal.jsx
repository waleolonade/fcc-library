import React, { useState } from 'react';
import { X, CreditCard, ShieldCheck, CheckCircle2, Lock, ArrowRight, Building, Smartphone } from 'lucide-react';

export default function PaymentModal({ amount, purpose, reference, onClose, onSuccess }) {
  const [gateway, setGateway] = useState('paystack'); // 'paystack' | 'flutterwave' | 'moniepoint'
  const [method, setMethod] = useState('card'); // 'card' | 'transfer' | 'ussd'
  const [cardNumber, setCardNumber] = useState('5399 4100 8920 1194');
  const [expiry, setExpiry] = useState('08/28');
  const [cvv, setCvv] = useState('883');
  const [pin, setPin] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handlePay = (e) => {
    e.preventDefault();
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl p-6 shadow-2xl relative animate-fadeIn">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
        >
          <X size={16} />
        </button>

        {isSuccess ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 size={48} className="text-emerald-400 mx-auto animate-bounce" />
            <h3 className="text-lg font-bold text-white">Payment Successful!</h3>
            <p className="text-xs text-slate-300">
              ₦{amount.toLocaleString()} paid via {gateway.toUpperCase()}. Receipt generated and overdue fines automatically cleared.
            </p>
            <div className="text-[11px] font-mono text-emerald-400 bg-slate-950 p-2 rounded-xl border border-slate-800">
              REF: {reference || `TXN-${Math.floor(1000000 + Math.random() * 9000000)}`}
            </div>
          </div>
        ) : (
          <form onSubmit={handlePay} className="space-y-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 text-[10px] font-bold border border-emerald-800">
                <ShieldCheck size={12} /> Institutional Secure Payment Gateway
              </div>
              <h3 className="text-lg font-bold text-white mt-1">Settle Library Fees</h3>
              <p className="text-xs text-slate-400">{purpose} • Reference: {reference}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex justify-between items-center">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Total Amount Due</span>
                <div className="text-2xl font-black text-emerald-400">₦{amount.toLocaleString()}</div>
              </div>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-1 rounded">
                NGN NIGERIA
              </span>
            </div>

            {/* Gateway Selection */}
            <div>
              <label className="block text-[11px] text-slate-400 font-semibold mb-1.5">Select Payment Channel</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'paystack', name: 'Paystack' },
                  { id: 'flutterwave', name: 'Flutterwave' },
                  { id: 'moniepoint', name: 'Moniepoint' }
                ].map(g => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setGateway(g.id)}
                    className={`py-2 px-1 rounded-xl text-xs font-bold transition border ${
                      gateway === g.id
                        ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Card Details Form */}
            <div className="space-y-2.5 pt-1">
              <div>
                <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-1">Card Number</label>
                <div className="relative">
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <CreditCard size={14} className="absolute right-3 top-2.5 text-slate-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-1">Expiry</label>
                  <input
                    type="text"
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-1">CVV</label>
                  <input
                    type="password"
                    maxLength={3}
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-950 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {isProcessing ? (
                <span>Authorizing with {gateway.toUpperCase()}...</span>
              ) : (
                <>
                  <Lock size={13} /> Pay ₦{amount.toLocaleString()} Now
                </>
              )}
            </button>

            <div className="text-[10px] text-slate-500 text-center flex items-center justify-center gap-1">
              <ShieldCheck size={12} className="text-emerald-500" />
              256-Bit SSL Encrypted • Direct CBN / Interswitch Settlement
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
