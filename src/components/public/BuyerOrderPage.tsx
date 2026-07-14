import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Transaction, Profile } from '../../lib/types';
import { useLang } from '../../lib/LanguageContext';
import { Package, Truck, CheckCircle2, ShieldCheck, Link2, Loader2 } from 'lucide-react';

interface BuyerOrderPageProps {
  orderId: string;
}

const STEPS = ['pending', 'shipped', 'completed'] as const;

export default function BuyerOrderPage({ orderId }: BuyerOrderPageProps) {
  const { lang } = useLang();
  const [order, setOrder] = useState<Transaction | null>(null);
  const [seller, setSeller] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: tx } = await supabase.from('transactions').select('*').eq('id', orderId).maybeSingle();
      if (tx) {
        setOrder(tx as Transaction);
        const { data: sellerProf } = await supabase.from('profiles').select('*').eq('user_id', tx.seller_id).maybeSingle();
        setSeller(sellerProf as Profile);
      }
      setLoading(false);
    }
    load();
  }, [orderId]);

  async function confirmDelivery() {
    if (!order || !seller) return;
    setConfirming(true);

    const newBalance = (seller.wallet_balance || 0) + order.seller_amount;
    await supabase.from('profiles').update({ wallet_balance: newBalance }).eq('user_id', seller.user_id);
    await supabase.from('transactions').update({
      status: 'completed',
      delivery_confirmed_at: new Date().toISOString(),
    }).eq('id', order.id);

    setOrder(prev => prev ? { ...prev, status: 'completed', delivery_confirmed_at: new Date().toISOString() } : prev);
    setConfirmed(true);
    setConfirming(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-brand-violet" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center px-4">
        <Package size={32} className="text-gray-300 mb-3" />
        <h1 className="text-gray-900 font-bold text-lg mb-1">
          {lang === 'fr' ? 'Commande introuvable' : 'Order not found'}
        </h1>
        <p className="text-gray-400 text-sm">{lang === 'fr' ? 'Ce lien de suivi est invalide ou a expiré.' : 'This tracking link is invalid or expired.'}</p>
      </div>
    );
  }

  const stepIndex = STEPS.indexOf(order.status as typeof STEPS[number]);
  const currentStep = stepIndex === -1 ? 0 : stepIndex;
  const shopName = seller?.shop_name || seller?.display_name || seller?.username || '';

  const STEP_LABEL: Record<typeof STEPS[number], string> = {
    pending: lang === 'fr' ? 'Paiement reçu' : 'Payment received',
    shipped: lang === 'fr' ? 'Expédiée' : 'Shipped',
    completed: lang === 'fr' ? 'Livrée' : 'Delivered',
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-2 mb-6 justify-center">
          <Link2 size={16} className="text-brand-violet" />
          <span className="font-black text-gray-900">BioLinkWD</span>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
          <p className="text-xs font-semibold text-gray-400 mb-1">
            {lang === 'fr' ? 'Suivi de commande' : 'Order tracking'}
          </p>
          <h1 className="text-lg font-black text-gray-900 mb-1">
            {order.amount.toLocaleString()} {order.currency}
          </h1>
          {shopName && <p className="text-xs text-gray-500 mb-5">{lang === 'fr' ? 'Vendu par' : 'Sold by'} {shopName}</p>}

          {/* Étapes */}
          <div className="flex items-center justify-between mb-6">
            {STEPS.map((step, i) => (
              <React.Fragment key={step}>
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center"
                    style={{
                      background: i <= currentStep ? 'linear-gradient(135deg,#6C63FF,#00C2FF)' : '#f3f4f6',
                      color: i <= currentStep ? '#fff' : '#9ca3af',
                    }}>
                    {step === 'pending' && <Package size={15} />}
                    {step === 'shipped' && <Truck size={15} />}
                    {step === 'completed' && <CheckCircle2 size={15} />}
                  </div>
                  <span className="text-[10px] font-semibold text-gray-500 text-center max-w-[64px]">{STEP_LABEL[step]}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="flex-1 h-0.5 mx-1" style={{ background: i < currentStep ? '#6C63FF' : '#e5e7eb' }} />
                )}
              </React.Fragment>
            ))}
          </div>

          {order.status === 'completed' || confirmed ? (
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-start gap-2.5">
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-emerald-800 text-xs leading-relaxed">
                {lang === 'fr'
                  ? 'Commande confirmée comme livrée. Le vendeur a été payé. Merci !'
                  : 'Order confirmed as delivered. The seller has been paid. Thank you!'}
              </p>
            </div>
          ) : (
            <>
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-4 flex items-start gap-2.5">
                <ShieldCheck size={18} className="text-blue-600 shrink-0 mt-0.5" />
                <p className="text-blue-800 text-xs leading-relaxed">
                  {lang === 'fr'
                    ? "Votre argent reste protégé jusqu'à ce que vous confirmiez avoir bien reçu votre colis. Ne confirmez que si tout est en ordre."
                    : "Your money stays protected until you confirm you've received your package. Only confirm once everything is in order."}
                </p>
              </div>
              <button onClick={confirmDelivery} disabled={confirming}
                className="w-full text-white font-bold py-3.5 rounded-2xl transition disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg,#6C63FF,#00C2FF)' }}>
                {confirming
                  ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <CheckCircle2 size={16} />}
                {lang === 'fr' ? "J'ai bien reçu ma commande" : "I've received my order"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
