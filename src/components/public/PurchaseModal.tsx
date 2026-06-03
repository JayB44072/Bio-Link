import React, { useState } from 'react';
import { Product, Profile, PaymentMethod } from '../../lib/types';
import { COMMISSION_RATE } from '../../lib/planLimits';
import { useLang } from '../../lib/LanguageContext';
import { supabase } from '../../lib/supabase';
import { X, CreditCard, Smartphone, Check, AlertCircle } from 'lucide-react';

interface PurchaseModalProps {
  product: Product;
  seller: Profile;
  onClose: () => void;
}

export default function PurchaseModal({ product, seller, onClose }: PurchaseModalProps) {
  const { t } = useLang();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('card');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const fee = Math.round(product.price * COMMISSION_RATE * 100) / 100;
  const sellerAmount = Math.round((product.price - fee) * 100) / 100;

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      // Record the transaction
      const { error: txErr } = await supabase.from('transactions').insert({
        product_id: product.id,
        seller_id: seller.user_id,
        buyer_name: name,
        buyer_email: email,
        buyer_phone: phone,
        amount: product.price,
        platform_fee: fee,
        seller_amount: sellerAmount,
        payment_method: method,
        status: 'completed',
        currency: product.currency,
      });
      if (txErr) throw txErr;

      // Update seller wallet balance
      const newBalance = (seller.wallet_balance || 0) + sellerAmount;
      await supabase
        .from('profiles')
        .update({ wallet_balance: newBalance })
        .eq('id', seller.id);

      setSuccess(true);
    } catch {
      setError(t.error);
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl w-full max-w-sm p-8 text-center shadow-2xl">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check size={28} className="text-green-600" />
          </div>
          <h3 className="text-gray-900 font-bold text-xl mb-2">{t.purchaseSuccess}</h3>
          <p className="text-gray-500 text-sm mb-6">{product.name}</p>
          <p className="text-gray-900 font-bold text-2xl mb-6">
            {product.price.toLocaleString()} {product.currency}
          </p>
          <button
            onClick={onClose}
            className="w-full bg-gray-900 text-white font-semibold py-3 rounded-xl"
          >
            {t.close}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white w-full sm:max-w-sm sm:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h3 className="text-gray-900 font-bold text-lg">{t.purchaseTitle}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X size={20} />
          </button>
        </div>

        {/* Product summary */}
        <div className="mx-5 mb-4 bg-gray-50 rounded-2xl p-4 flex gap-3">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="w-16 h-16 rounded-xl object-cover shrink-0" />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-gray-200 shrink-0 flex items-center justify-center text-gray-400 text-2xl">📦</div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-gray-900 font-semibold text-sm truncate">{product.name}</p>
            <p className="text-gray-500 text-xs mt-0.5 line-clamp-2">{product.description}</p>
            <p className="text-gray-900 font-bold mt-1">{product.price.toLocaleString()} {product.currency}</p>
          </div>
        </div>

        <form onSubmit={handlePay} className="px-5 pb-6 space-y-3">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
              <AlertCircle size={14} className="text-red-500" />
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-gray-700 text-sm mb-1">{t.buyerName} *</label>
            <input
              type="text" value={name} onChange={e => setName(e.target.value)} required
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 text-sm focus:outline-none focus:border-gray-400"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm mb-1">{t.buyerEmail}</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 text-sm focus:outline-none focus:border-gray-400"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm mb-1">{t.buyerPhone}</label>
            <input
              type="tel" value={phone} onChange={e => setPhone(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 text-sm focus:outline-none focus:border-gray-400"
            />
          </div>

          {/* Payment method */}
          <div>
            <label className="block text-gray-700 text-sm mb-2">{t.paymentMethod}</label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { id: 'card' as PaymentMethod, label: 'Carte', icon: CreditCard },
                { id: 'mtn' as PaymentMethod, label: 'MTN', icon: Smartphone },
                { id: 'orange' as PaymentMethod, label: 'Orange', icon: Smartphone },
              ]).map(({ id, label, icon: Icon }) => (
                <button
                  key={id} type="button" onClick={() => setMethod(id)}
                  className={`flex flex-col items-center gap-1 py-3 rounded-xl border text-sm transition ${
                    method === id
                      ? 'border-gray-900 bg-gray-900 text-white'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <Icon size={18} />
                  <span className="text-xs">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-gray-50 rounded-xl p-3 text-sm space-y-1">
            <div className="flex justify-between text-gray-600">
              <span>Total</span>
              <span className="font-medium">{product.price.toLocaleString()} {product.currency}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || !name}
            className="w-full bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition flex items-center justify-center gap-2 mt-2"
          >
            {submitting ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t.paying}</>
            ) : (
              `${t.pay} · ${product.price.toLocaleString()} ${product.currency}`
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
