// import React, { useState } from 'react';
// import { Product, Profile, PaymentMethod } from '../../lib/types';
// import { COMMISSION_RATE } from '../../lib/planLimits';
// import { useLang } from '../../lib/LanguageContext';
// import { supabase } from '../../lib/supabase';
// import { X, CreditCard, Smartphone, Check, AlertCircle } from 'lucide-react';

// interface PurchaseModalProps {
//   product: Product;
//   seller: Profile;
//   onClose: () => void;
// }

// export default function PurchaseModal({ product, seller, onClose }: PurchaseModalProps) {
//   const { t } = useLang();
//   const [name, setName] = useState('');
//   const [email, setEmail] = useState('');
//   const [phone, setPhone] = useState('');
//   const [method, setMethod] = useState<PaymentMethod>('card');
//   const [submitting, setSubmitting] = useState(false);
//   const [success, setSuccess] = useState(false);
//   const [error, setError] = useState('');

//   const fee = Math.round(product.price * COMMISSION_RATE * 100) / 100;
//   const sellerAmount = Math.round((product.price - fee) * 100) / 100;

//   async function handlePay(e: React.FormEvent) {
//     e.preventDefault();
//     setError('');
//     setSubmitting(true);

//     try {
//       // Record the transaction
//       const { error: txErr } = await supabase.from('transactions').insert({
//         product_id: product.id,
//         seller_id: seller.user_id,
//         buyer_name: name,
//         buyer_email: email,
//         buyer_phone: phone,
//         amount: product.price,
//         platform_fee: fee,
//         seller_amount: sellerAmount,
//         payment_method: method,
//         status: 'completed',
//         currency: product.currency,
//       });
//       if (txErr) throw txErr;

//       // Update seller wallet balance
//       const newBalance = (seller.wallet_balance || 0) + sellerAmount;
//       await supabase
//         .from('profiles')
//         .update({ wallet_balance: newBalance })
//         .eq('id', seller.id);

//       setSuccess(true);
//     } catch {
//       setError(t.error);
//     } finally {
//       setSubmitting(false);
//     }
//   }

//   if (success) {
//     return (
//       <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
//         <div className="bg-white rounded-3xl w-full max-w-sm p-8 text-center shadow-2xl">
//           <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
//             <Check size={28} className="text-green-600" />
//           </div>
//           <h3 className="text-gray-900 font-bold text-xl mb-2">{t.purchaseSuccess}</h3>
//           <p className="text-gray-500 text-sm mb-6">{product.name}</p>
//           <p className="text-gray-900 font-bold text-2xl mb-6">
//             {product.price.toLocaleString()} {product.currency}
//           </p>
//           <button
//             onClick={onClose}
//             className="w-full bg-gray-900 text-white font-semibold py-3 rounded-xl"
//           >
//             {t.close}
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
//       <div className="bg-white w-full sm:max-w-sm sm:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto">
//         {/* Header */}
//         <div className="flex items-center justify-between px-5 pt-5 pb-3">
//           <h3 className="text-gray-900 font-bold text-lg">{t.purchaseTitle}</h3>
//           <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
//             <X size={20} />
//           </button>
//         </div>

//         {/* Product summary */}
//         <div className="mx-5 mb-4 bg-gray-50 rounded-2xl p-4 flex gap-3">
//           {product.image_url ? (
//             <img src={product.image_url} alt={product.name} className="w-16 h-16 rounded-xl object-cover shrink-0" />
//           ) : (
//             <div className="w-16 h-16 rounded-xl bg-gray-200 shrink-0 flex items-center justify-center text-gray-400 text-2xl">📦</div>
//           )}
//           <div className="flex-1 min-w-0">
//             <p className="text-gray-900 font-semibold text-sm truncate">{product.name}</p>
//             <p className="text-gray-500 text-xs mt-0.5 line-clamp-2">{product.description}</p>
//             <p className="text-gray-900 font-bold mt-1">{product.price.toLocaleString()} {product.currency}</p>
//           </div>
//         </div>

//         <form onSubmit={handlePay} className="px-5 pb-6 space-y-3">
//           {error && (
//             <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
//               <AlertCircle size={14} className="text-red-500" />
//               <p className="text-red-600 text-sm">{error}</p>
//             </div>
//           )}

//           <div>
//             <label className="block text-gray-700 text-sm mb-1">{t.buyerName} *</label>
//             <input
//               type="text" value={name} onChange={e => setName(e.target.value)} required
//               className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 text-sm focus:outline-none focus:border-gray-400"
//             />
//           </div>
//           <div>
//             <label className="block text-gray-700 text-sm mb-1">{t.buyerEmail}</label>
//             <input
//               type="email" value={email} onChange={e => setEmail(e.target.value)}
//               className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 text-sm focus:outline-none focus:border-gray-400"
//             />
//           </div>
//           <div>
//             <label className="block text-gray-700 text-sm mb-1">{t.buyerPhone}</label>
//             <input
//               type="tel" value={phone} onChange={e => setPhone(e.target.value)}
//               className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 text-sm focus:outline-none focus:border-gray-400"
//             />
//           </div>

//           {/* Payment method */}
//           <div>
//             <label className="block text-gray-700 text-sm mb-2">{t.paymentMethod}</label>
//             <div className="grid grid-cols-3 gap-2">
//               {([
//                 { id: 'card' as PaymentMethod, label: 'Carte', icon: CreditCard },
//                 { id: 'mtn' as PaymentMethod, label: 'MTN', icon: Smartphone },
//                 { id: 'orange' as PaymentMethod, label: 'Orange', icon: Smartphone },
//               ]).map(({ id, label, icon: Icon }) => (
//                 <button
//                   key={id} type="button" onClick={() => setMethod(id)}
//                   className={`flex flex-col items-center gap-1 py-3 rounded-xl border text-sm transition ${
//                     method === id
//                       ? 'border-gray-900 bg-gray-900 text-white'
//                       : 'border-gray-200 text-gray-600 hover:border-gray-300'
//                   }`}
//                 >
//                   <Icon size={18} />
//                   <span className="text-xs">{label}</span>
//                 </button>
//               ))}
//             </div>
//           </div>

//           {/* Summary */}
//           <div className="bg-gray-50 rounded-xl p-3 text-sm space-y-1">
//             <div className="flex justify-between text-gray-600">
//               <span>Total</span>
//               <span className="font-medium">{product.price.toLocaleString()} {product.currency}</span>
//             </div>
//           </div>

//           <button
//             type="submit"
//             disabled={submitting || !name}
//             className="w-full bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition flex items-center justify-center gap-2 mt-2"
//           >
//             {submitting ? (
//               <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t.paying}</>
//             ) : (
//               `${t.pay} · ${product.price.toLocaleString()} ${product.currency}`
//             )}
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// }




import React, { useState } from 'react';
import { Product, Profile, PaymentMethod } from '../../lib/types';
import { COMMISSION_RATE } from '../../lib/planLimits';
import { useLang } from '../../lib/LanguageContext';
import { supabase } from '../../lib/supabase';
import { X, CreditCard, Smartphone, Check, AlertCircle, ShieldCheck } from 'lucide-react';

interface PurchaseModalProps {
  product: Product;
  seller: Profile;
  onClose: () => void;
}

export default function PurchaseModal({ product, seller, onClose }: PurchaseModalProps) {
  const { t, lang } = useLang();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('card');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Pour la simulation de carte bancaire
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');

  const fee = Math.round(product.price * COMMISSION_RATE * 100) / 100;
  const sellerAmount = Math.round((product.price - fee) * 100) / 100;

  // Validation dynamique selon le mode de paiement
  const isFormValid = () => {
    if (!name.trim()) return false;
    if (method === 'card') {
      return cardNumber.length >= 16 && cardExpiry.includes('/') && cardCvc.length >= 3;
    } else {
      // Pour MTN et Orange Money, le numéro de téléphone est obligatoire
      return phone.trim().length >= 8; 
    }
  };

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
        buyer_email: method === 'card' ? email : undefined, // Optionnel ou nettoyé pour MoMo
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
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
        <div className="bg-white rounded-3xl w-full max-w-sm p-8 text-center shadow-2xl border border-gray-100 transform scale-100 transition-transform">
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
            <Check size={36} className="text-emerald-600 animate-bounce" />
          </div>
          <h3 className="text-gray-900 font-black text-2xl mb-2">
            {lang === 'fr' ? 'Paiement Réussi !' : t.purchaseSuccess}
          </h3>
          <p className="text-gray-500 text-sm font-medium mb-1">{product.name}</p>
          <div className="inline-block bg-gray-50 px-4 py-1.5 rounded-full text-xs text-gray-500 font-semibold mb-6">
            Via {method.toUpperCase()}
          </div>
          <p className="text-gray-950 font-black text-3xl mb-8 tracking-tight">
            {product.price.toLocaleString()} <span className="text-sm font-bold">{product.currency}</span>
          </p>
          <button
            onClick={onClose}
            className="w-full bg-gray-950 hover:bg-gray-900 text-white font-bold py-4 rounded-2xl shadow-xl transition-all duration-300 transform active:scale-98"
          >
            {t.close}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center animate-fade-in">
      <div className="bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl max-h-[92vh] flex flex-col transform transition-all duration-300">
        
        {/* HEADER MODAL */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-gray-950 font-black text-xl">{lang === 'fr' ? 'Finaliser la commande' : t.purchaseTitle}</h3>
            <p className="text-gray-400 text-xs mt-0.5 flex items-center gap-1 font-medium">
              <ShieldCheck size={12} className="text-emerald-500" /> Paiement 100% sécurisé
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-50 rounded-full transition">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          {/* APERÇU PRODUIT STYLE SHOPIFY */}
          <div className="bg-gray-50 rounded-2xl p-4 flex gap-4 border border-gray-100/50">
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} className="w-18 h-18 rounded-xl object-cover shrink-0 shadow-sm border border-white" />
            ) : (
              <div className="w-18 h-18 rounded-xl bg-gray-200 shrink-0 flex items-center justify-center text-3xl shadow-inner">📦</div>
            )}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <p className="text-gray-950 font-bold text-base truncate">{product.name}</p>
              {product.description && <p className="text-gray-500 text-xs mt-0.5 line-clamp-1">{product.description}</p>}
              <p className="text-gray-950 font-black text-lg mt-1 tracking-tight">
                {product.price.toLocaleString()} <span className="text-xs font-bold">{product.currency}</span>
              </p>
            </div>
          </div>

          <form onSubmit={handlePay} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2.5 bg-red-50 border border-red-100 rounded-xl p-3.5 animate-shake">
                <AlertCircle size={16} className="text-red-500 shrink-0" />
                <p className="text-red-700 text-xs font-semibold">{error}</p>
              </div>
            )}

            {/* CHOIX DU MOYEN DE PAIEMENT UNIQUE ET VISUEL */}
            <div className="space-y-2">
              <label className="block text-gray-800 text-xs font-bold uppercase tracking-wider">{lang === 'fr' ? 'Moyen de paiement' : t.paymentMethod}</label>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { id: 'card' as PaymentMethod, label: 'Carte', icon: CreditCard, activeClass: 'border-blue-600 bg-blue-50/40 text-blue-700' },
                  { id: 'mtn' as PaymentMethod, label: 'MTN MoMo', icon: Smartphone, activeClass: 'border-yellow-500 bg-yellow-50/50 text-amber-950 font-bold' },
                  { id: 'orange' as PaymentMethod, label: 'Orange Money', icon: Smartphone, activeClass: 'border-orange-500 bg-orange-50/40 text-orange-700 font-bold' },
                ].map(({ id, label, icon: Icon, activeClass }) => (
                  <button
                    key={id} type="button" onClick={() => setMethod(id)}
                    className={`flex flex-col items-center justify-center gap-1.5 py-3.5 rounded-2xl border text-xs font-medium transition-all duration-200 ${
                      method === id
                        ? `${activeClass} shadow-sm ring-1 ring-current/20`
                        : 'border-gray-200 text-gray-500 bg-white hover:border-gray-300 hover:text-gray-800'
                    }`}
                  >
                    <Icon size={18} className={method === id ? 'scale-110 transition-transform' : ''} />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* ZONE DE CHAMPS DYNAMIQUES */}
            <div className="bg-gray-50/50 border border-gray-100 rounded-2xl p-4 space-y-4 transition-all duration-300">
              
              {/* NOM COMPLET (Toujours requis) */}
              <div>
                <label className="block text-gray-700 text-xs font-bold mb-1.5">{lang === 'fr' ? 'Votre Nom Complet *' : `${t.buyerName} *`}</label>
                <input
                  type="text" value={name} onChange={e => setName(e.target.value)} required
                  placeholder="Ex: Jean Dupont"
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-950 text-sm focus:outline-none focus:border-gray-950 focus:ring-1 focus:ring-gray-950/20 transition-all font-medium"
                />
              </div>

              {/* SI FORMULAIRE CARTE BANCAIRE (Amazon Style) */}
              {method === 'card' && (
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <label className="block text-gray-700 text-xs font-bold mb-1.5">{lang === 'fr' ? 'Adresse E-mail' : t.buyerEmail}</label>
                    <input
                      type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="nom@exemple.com"
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-950 text-sm focus:outline-none focus:border-gray-950 transition-all font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-xs font-bold mb-1.5">Numéro de carte *</label>
                    <input
                      type="text" maxLength={16} placeholder="4242 •••• •••• ••••"
                      value={cardNumber} onChange={e => setCardNumber(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-950 text-sm focus:outline-none focus:border-gray-950 transition-all tracking-widest font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-700 text-xs font-bold mb-1.5">Expiration *</label>
                      <input
                        type="text" placeholder="MM/AA" maxLength={5}
                        value={cardExpiry} onChange={e => setCardExpiry(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-950 text-sm text-center focus:outline-none focus:border-gray-950 transition-all font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 text-xs font-bold mb-1.5">CVC *</label>
                      <input
                        type="password" placeholder="123" maxLength={3}
                        value={cardCvc} onChange={e => setCardCvc(e.target.value.replace(/\D/g, ''))}
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-950 text-sm text-center focus:outline-none focus:border-gray-950 transition-all font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* SI FORMULAIRE MOBILE MONEY (MTN / ORANGE) */}
              {method !== 'card' && (
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <label className="block text-gray-700 text-xs font-bold mb-1.5">
                      {lang === 'fr' 
                        ? `Numéro de compte ${method === 'mtn' ? 'MTN MoMo' : 'Orange Money'} *` 
                        : `${t.buyerPhone} *`}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-400 text-sm font-bold">
                        {/* Optionnel : préfixe pays ou icône d'appel */}
                        📱
                      </div>
                      <input
                        type="tel" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ''))} required
                        placeholder="Ex: 6XXXXXXXX"
                        className="w-full bg-white border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-gray-950 text-base font-bold focus:outline-none focus:border-gray-950 transition-all tracking-wide"
                      />
                    </div>
                    <p className="text-[11px] text-gray-400 mt-2 leading-normal">
                      {lang === 'fr' 
                        ? "Un message d'autorisation de débit de fonds vous sera envoyé instantanément sur ce numéro après validation."
                        : "A push notification prompt will be sent to this phone number to validate your payment."}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* TOTAL ET BOUTON DE SOUMISSION */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting || !isFormValid()}
                className="w-full bg-gray-950 hover:bg-gray-900 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2.5 shadow-xl shadow-gray-950/10 transform active:scale-99"
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{lang === 'fr' ? 'Traitement sécurisé...' : t.paying}</span>
                  </>
                ) : (
                  <span>
                    {lang === 'fr' ? 'Confirmer le paiement' : t.pay} · {product.price.toLocaleString()} {product.currency}
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}