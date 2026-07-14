import React, { useState, useRef, useEffect } from 'react';
import { Product, Profile, PaymentMethod } from '../../lib/types';
import { PLAN_CONFIGS } from '../../lib/planLimits';
import { useLang } from '../../lib/LanguageContext';
import { useAppPrefs } from '../../lib/AppPrefsContext';
import { supabase } from '../../lib/supabase';
import { LandingLang } from '../../lib/landingTranslations';
import LocationAutocomplete, { LocationValue } from '../ui/LocationAutocomplete';
import {
  ArrowLeft, CreditCard, Smartphone, Check, AlertCircle, ShieldCheck, Download,
  Package, Link2, Store, Lock, RotateCcw, Truck, Sun, Moon, Globe,
} from 'lucide-react';

interface PurchaseModalProps {
  product: Product;
  seller: Profile;
  onClose: () => void;
  /** Appelé une fois la commande validée (paiement confirmé), avant l'écran de succès.
   * Sert à décrémenter le vrai stock en base (visible dans le tableau de bord et pour
   * les autres visiteurs) — jusque-là la baisse de quantité n'était que locale/visuelle. */
  onSuccess?: () => void;
}

const LANG_OPTIONS: { code: LandingLang; label: string }[] = [
  { code: 'fr', label: '🇫🇷 Français'  },
  { code: 'en', label: '🇬🇧 English'   },
  { code: 'pt', label: '🇵🇹 Português' },
  { code: 'de', label: '🇩🇪 Deutsch'   },
];

export default function PurchaseModal({ product, seller, onClose, onSuccess }: PurchaseModalProps) {
  const { t } = useLang();
  const { isDark: dk, toggleDark, lang, setLang } = useAppPrefs();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('card');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [activeImg, setActiveImg] = useState(0);
  const [deliveryLocation, setDeliveryLocation] = useState<LocationValue>({ address: '', lat: null, lng: null });
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  // Pour la simulation de carte bancaire
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const commissionRate = PLAN_CONFIGS[seller.plan_type]?.commission_rate ?? 0.05;
  const fee = Math.round(product.price * commissionRate * 100) / 100;
  const sellerAmount = Math.round((product.price - fee) * 100) / 100;
  const gallery = product.images?.length ? product.images : (product.image_url ? [product.image_url] : []);
  const shopDisplayName = seller.shop_name || seller.display_name || seller.username || 'Boutique';
  const isSyntheticCart = product.id === 'cart-checkout';

  /* ── Theme tokens ── */
  const bg         = dk ? '#0b0b1e' : '#f4f3ff';
  const surface    = dk ? '#12122b' : '#ffffff';
  const surfaceAlt = dk ? '#191938' : '#faf9ff';
  const border     = dk ? 'rgba(139,124,255,0.16)' : '#eeebfb';
  const txtPrim    = dk ? '#f2f1ff' : '#16162e';
  const txtLabel   = dk ? '#c7c5e8' : '#374151';
  const txtSub     = dk ? '#8c8ab0' : '#8a87a3';
  const inputBg    = dk ? '#0d0d22' : '#ffffff';
  const inputBorder= dk ? 'rgba(139,124,255,0.18)' : '#e5e7eb';
  const hoverBg    = dk ? 'rgba(139,124,255,0.08)' : '#f6f4ff';
  const inputCls   = 'w-full rounded-xl px-4 py-3 text-sm transition focus:outline-none focus:ring-2 focus:ring-brand-violet/25 font-medium';

  const isFormValid = () => {
    if (!name.trim()) return false;
    if (!deliveryLocation.address.trim()) return false;
    if (method === 'card') {
      return cardNumber.length >= 16 && cardExpiry.includes('/') && cardCvc.length >= 3;
    }
    return phone.trim().length >= 8;
  };

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      // Enregistre la commande — l'argent reste "en attente" (modèle Amazon) :
      // le vendeur n'est crédité et la commission encaissée qu'à la confirmation
      // de réception par l'acheteur (voir BuyerOrderPage).
      const { data: tx, error: txErr } = await supabase.from('transactions').insert({
        // Un panier multi-produits n'a pas de product_id unique valide (uuid) —
        // on laisse la colonne vide dans ce cas plutôt que d'envoyer un id fictif.
        product_id: isSyntheticCart ? null : product.id,
        seller_id: seller.user_id,
        buyer_name: name,
        buyer_email: method === 'card' ? email : undefined,
        buyer_phone: phone,
        amount: product.price,
        platform_fee: fee,
        seller_amount: sellerAmount,
        payment_method: method,
        status: 'pending',
        currency: product.currency,
        delivery_address: deliveryLocation.address,
        delivery_lat: deliveryLocation.lat,
        delivery_lng: deliveryLocation.lng,
      }).select().maybeSingle();
      if (txErr) throw txErr;

      onSuccess?.();
      setOrderId(tx?.id ?? null);
      setSuccess(true);
    } catch {
      setError(t.error);
    } finally {
      setSubmitting(false);
    }
  }

  function downloadInvoice() {
    const html = `
<!doctype html><html><head><meta charset="utf-8"><title>Facture BioLinkWD</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f3ff; padding: 40px 20px; color: #16162e; }
  .invoice { max-width: 640px; margin: 0 auto; background: #fff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 40px rgba(108,99,255,0.12); }
  .header { background: linear-gradient(135deg,#6C63FF 0%,#8B5FBF 55%,#FF6B9D 120%); padding: 36px 32px; text-align: center; color: #fff; }
  .header h1 { margin: 0; font-size: 22px; font-weight: 900; }
  .header p { margin: 4px 0 0; font-size: 12px; opacity: .85; font-weight: 600; }
  .body { padding: 32px; }
  .badge { display:inline-block; background:#f5f3ff; color:#6C63FF; font-size:11px; font-weight:800; padding:6px 14px; border-radius:999px; margin-bottom:18px; }
  .section-title { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: .06em; color: #8a87a3; margin: 24px 0 10px; text-align:center; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 11px 4px; border-bottom: 1px solid #f0eefb; font-size: 14px; text-align: center; }
  td.label { color: #8a87a3; font-weight: 600; width: 45%; }
  td.value { color: #16162e; font-weight: 700; }
  .total-box { margin-top: 24px; background: linear-gradient(135deg,#f5f3ff,#fdf1f6); border-radius: 16px; padding: 20px; text-align: center; }
  .total-box .label { font-size: 12px; color: #8a87a3; font-weight: 700; text-transform: uppercase; }
  .total-box .amount { font-size: 30px; font-weight: 900; color: #6C63FF; margin-top: 4px; }
  .footer { text-align: center; padding: 24px 32px 32px; color: #8a87a3; font-size: 11px; }
  .footer b { color: #FF6B9D; }
</style></head>
<body>
  <div class="invoice">
    <div class="header">
      <h1>BioLinkWD</h1>
      <p>by WhiteDuckSaaS</p>
    </div>
    <div class="body" style="text-align:center">
      <span class="badge">FACTURE ${orderId ? '#' + orderId.slice(0, 8).toUpperCase() : ''}</span>
      <p style="color:#8a87a3;font-size:12px;margin:0 0 8px">${new Date().toLocaleDateString()}</p>

      <div class="section-title">Vendeur</div>
      <table>
        <tr><td class="label">Boutique</td><td class="value">${shopDisplayName}</td></tr>
        <tr><td class="label">Nom d'utilisateur</td><td class="value">@${seller.username}</td></tr>
      </table>

      <div class="section-title">Client</div>
      <table>
        <tr><td class="label">Nom</td><td class="value">${name}</td></tr>
        <tr><td class="label">Téléphone</td><td class="value">${phone || '—'}</td></tr>
      </table>

      <div class="section-title">Commande</div>
      <table>
        <tr><td class="label">Produit</td><td class="value">${product.name}</td></tr>
        <tr><td class="label">Quantité</td><td class="value">${product.quantity ?? 1}</td></tr>
        <tr><td class="label">Moyen de paiement</td><td class="value">${method.toUpperCase()}</td></tr>
      </table>

      <div class="total-box">
        <div class="label">Montant total</div>
        <div class="amount">${product.price.toLocaleString()} ${product.currency}</div>
      </div>
    </div>
    <div class="footer">
      Merci pour votre confiance — <b>BioLinkWD</b> · propulsé par <b>WhiteDuckSaaS</b>
    </div>
  </div>
</body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `facture-biolinkwd-${orderId?.slice(0, 8) || 'commande'}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /* ══ Sélecteur langue + mode sombre, réutilisé sur les deux écrans ══ */
  const HeaderControls = () => (
    <div className="flex items-center gap-2">
      <button onClick={toggleDark}
        className="p-2 rounded-xl transition-colors"
        style={{ background: dk ? 'rgba(255,255,255,0.08)' : '#f3f4f6', color: dk ? '#fbbf24' : '#6b7280' }}>
        {dk ? <Sun size={16} /> : <Moon size={16} />}
      </button>
      <div className="relative" ref={langRef}>
        <button onClick={() => setLangOpen(v => !v)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors"
          style={{ background: dk ? 'rgba(255,255,255,0.08)' : '#f3f4f6', color: dk ? '#c0c0e0' : '#6b7280' }}>
          <Globe size={13} />{lang.toUpperCase()}
        </button>
        {langOpen && (
          <div className="absolute right-0 top-full mt-2 rounded-xl shadow-xl border py-1 min-w-[140px] z-50"
            style={{ background: surface, borderColor: border }}>
            {LANG_OPTIONS.map(({ code, label }) => (
              <button key={code} onClick={() => { setLang(code); setLangOpen(false); }}
                className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 transition-colors"
                style={{
                  color: lang === code ? '#6C63FF' : txtPrim,
                  background: lang === code ? hoverBg : 'transparent',
                }}>
                {label}
                {lang === code && <Check size={11} className="ml-auto text-brand-violet" />}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  /* ══════════════════ ÉCRAN DE SUCCÈS ══════════════════ */
  if (success) {
    const trackingUrl = orderId ? `${window.location.origin}/commande/${orderId}` : '';
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: bg }}>
        <div className="rounded-3xl w-full max-w-sm p-8 text-center shadow-sm" style={{ background: surface, border: `1px solid ${border}` }}>
          <div className="flex items-center justify-center gap-1.5 mb-5">
            <Link2 size={14} className="text-brand-violet" />
            <span className="font-black text-xs" style={{ color: txtPrim }}>BioLinkWD</span>
            <span className="text-[10px]" style={{ color: txtSub }}>by WhiteDuckSaaS</span>
          </div>

          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
            <Check size={36} className="text-emerald-600" />
          </div>
          <h3 className="font-black text-2xl mb-2" style={{ color: txtPrim }}>
            {lang === 'fr' ? 'Paiement Réussi !' : t.purchaseSuccess}
          </h3>
          <p className="text-sm font-medium mb-1" style={{ color: txtSub }}>{product.name}</p>
          <div className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold mb-4" style={{ background: surfaceAlt, color: txtSub }}>
            Via {method.toUpperCase()}
          </div>
          <p className="font-black text-3xl mb-5 tracking-tight" style={{ color: txtPrim }}>
            {product.price.toLocaleString()} <span className="text-sm font-bold">{product.currency}</span>
          </p>

          <div className="rounded-2xl p-4 mb-4 text-left" style={{ background: dk ? 'rgba(59,130,246,0.1)' : '#eff6ff', border: `1px solid ${dk ? 'rgba(59,130,246,0.25)' : '#dbeafe'}` }}>
            <p className="text-xs font-bold mb-1" style={{ color: dk ? '#93c5fd' : '#1e3a8a' }}>
              {lang === 'fr' ? 'Votre argent est protégé' : 'Your money is protected'}
            </p>
            <p className="text-xs leading-relaxed" style={{ color: dk ? '#a5c8f5' : '#1d4ed8' }}>
              {lang === 'fr'
                ? "Le vendeur ne sera payé qu'après votre confirmation de réception du colis. Conservez ce lien pour suivre votre commande et confirmer la livraison :"
                : 'The seller will only be paid after you confirm receipt of the package. Keep this link to track your order and confirm delivery:'}
            </p>
            {trackingUrl && (
              <a href={trackingUrl} target="_blank" rel="noopener noreferrer"
                className="block mt-2 text-xs font-bold underline break-all" style={{ color: dk ? '#93c5fd' : '#2563eb' }}>
                {trackingUrl}
              </a>
            )}
            <p className="text-[11px] leading-relaxed mt-2" style={{ color: dk ? 'rgba(165,200,245,0.7)' : 'rgba(29,78,216,0.7)' }}>
              {lang === 'fr'
                ? <>Lien perdu ? Retrouvez vos commandes sur <a href="/suivi" target="_blank" rel="noopener noreferrer" className="font-bold underline">/suivi</a> avec votre numéro de téléphone.</>
                : <>Lost the link? Find your orders at <a href="/suivi" target="_blank" rel="noopener noreferrer" className="font-bold underline">/suivi</a> using your phone number.</>}
            </p>
          </div>

          <button onClick={downloadInvoice}
            className="w-full flex items-center justify-center gap-2 border-2 font-bold py-3 rounded-2xl transition-all mb-3"
            style={{ background: surfaceAlt, borderColor: border, color: txtPrim }}>
            <Download size={16} />
            {lang === 'fr' ? 'Télécharger la facture' : 'Download invoice'}
          </button>

          <button
            onClick={onClose}
            className="w-full text-white font-bold py-4 rounded-2xl shadow-xl transition-all duration-300 transform active:scale-98"
            style={{ background: 'linear-gradient(135deg,#111827,#000)' }}
          >
            {t.close}
          </button>
        </div>
      </div>
    );
  }

  /* ══════════════════ PAGE DE PAIEMENT ══════════════════ */
  return (
    <div className="min-h-screen" style={{ background: bg }}>
      <div className="max-w-6xl mx-auto px-4 py-6">

        {/* Header — branding + retour + langue/mode sombre */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <button onClick={onClose} className="flex items-center gap-1.5 text-xs font-semibold transition-colors" style={{ color: txtSub }}>
            <ArrowLeft size={14} />
            {lang === 'fr' ? 'Retour' : 'Back'}
          </button>
          <div className="flex items-center gap-1.5">
            <Link2 size={14} className="text-brand-violet" />
            <span className="font-black text-sm" style={{ color: txtPrim }}>BioLinkWD</span>
            <span className="text-[10px] font-semibold" style={{ color: txtSub }}>by WhiteDuckSaaS</span>
          </div>
          <HeaderControls />
        </div>

        <div className="rounded-3xl shadow-sm overflow-hidden" style={{ background: surface, border: `1px solid ${border}` }}>
          <div className="px-6 pt-6 pb-4 border-b text-center" style={{ borderColor: border }}>
            <h3 className="font-black text-xl" style={{ color: txtPrim }}>{lang === 'fr' ? 'Finaliser la commande' : t.purchaseTitle}</h3>
            <p className="text-xs mt-1 flex items-center justify-center gap-1 font-medium" style={{ color: txtSub }}>
              <ShieldCheck size={12} className="text-emerald-500" /> Paiement 100% sécurisé
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-6 md:p-10">

            {/* ══ Produit — passe en second sur mobile, en 1ère colonne sur desktop ══ */}
            <div className="order-2 lg:order-1">
              <div className="aspect-square rounded-2xl overflow-hidden mb-3 flex items-center justify-center" style={{ background: surfaceAlt }}>
                {gallery[activeImg] ? (
                  <img src={gallery[activeImg]} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <Package size={48} style={{ color: txtSub }} />
                )}
              </div>
              {gallery.length > 1 && (
                <div className="grid grid-cols-5 gap-2 mb-5">
                  {gallery.map((img, i) => (
                    <button key={i} onClick={() => setActiveImg(i)}
                      className="aspect-square rounded-xl overflow-hidden border-2 transition"
                      style={{ borderColor: activeImg === i ? '#6C63FF' : inputBorder }}>
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              <div className="text-center mb-5">
                <p className="font-black text-lg" style={{ color: txtPrim }}>{product.name}</p>
                {product.description && <p className="text-xs mt-1 leading-relaxed" style={{ color: txtSub }}>{product.description}</p>}
                <p className="font-black text-2xl mt-2 tracking-tight" style={{ color: txtPrim }}>
                  {product.price.toLocaleString()} <span className="text-sm font-bold">{product.currency}</span>
                </p>
                {!isSyntheticCart && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full mt-2">
                    <Package size={11} />{lang === 'fr' ? `${product.quantity} disponible(s)` : `${product.quantity} available`}
                  </span>
                )}
              </div>
            </div>

            {/* ══ Moyens de paiement — passe en premier sur mobile ══ */}
            <div className="order-1 lg:order-2">
              <form onSubmit={handlePay} className="space-y-5">
                {error && (
                  <div className="flex items-center gap-2.5 rounded-xl p-3.5" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <AlertCircle size={16} className="text-red-500 shrink-0" />
                    <p className="text-red-500 text-xs font-semibold">{error}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-center" style={{ color: txtLabel }}>{lang === 'fr' ? 'Moyen de paiement' : t.paymentMethod}</label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      { id: 'card' as PaymentMethod, label: 'Carte', icon: CreditCard, activeClass: 'border-blue-600 bg-blue-50/40 text-blue-700' },
                      { id: 'mtn' as PaymentMethod, label: 'MTN MoMo', icon: Smartphone, activeClass: 'border-yellow-500 bg-yellow-50/50 text-amber-950 font-bold' },
                      { id: 'orange' as PaymentMethod, label: 'Orange Money', icon: Smartphone, activeClass: 'border-orange-500 bg-orange-50/40 text-orange-700 font-bold' },
                    ].map(({ id, label, icon: Icon, activeClass }) => (
                      <button
                        key={id} type="button" onClick={() => setMethod(id)}
                        className={`flex flex-col items-center justify-center gap-1.5 py-3.5 rounded-2xl border text-xs font-medium transition-all duration-200 ${
                          method === id ? `${dk ? '' : activeClass} shadow-sm ring-1 ring-current/20` : ''
                        }`}
                        style={method === id
                          ? (dk ? { borderColor: '#6C63FF', background: 'rgba(108,99,255,0.12)', color: '#a5b4fc' } : {})
                          : { borderColor: inputBorder, color: txtSub, background: inputBg }}
                      >
                        <Icon size={18} className={method === id ? 'scale-110 transition-transform' : ''} />
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl p-4 space-y-4" style={{ background: surfaceAlt, border: `1px solid ${border}` }}>

                  <div>
                    <label className="block text-xs font-bold mb-1.5" style={{ color: txtLabel }}>{lang === 'fr' ? 'Votre Nom Complet *' : `${t.buyerName} *`}</label>
                    <input
                      type="text" value={name} onChange={e => setName(e.target.value)} required
                      placeholder="Ex: nom "
                      className={inputCls} style={{ background: inputBg, border: `1px solid ${inputBorder}`, color: txtPrim }}
                    />
                  </div>

                  <LocationAutocomplete
                    label={lang === 'fr' ? 'Adresse de livraison *' : 'Delivery address *'}
                    placeholder={lang === 'fr' ? 'Ville, quartier, adresse...' : 'City, area, address...'}
                    myLocationLabel={lang === 'fr' ? 'Utiliser ma position actuelle' : 'Use my current location'}
                    value={deliveryLocation}
                    onChange={setDeliveryLocation}
                    isDark={dk}
                  />

                  {method === 'card' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold mb-1.5" style={{ color: txtLabel }}>{lang === 'fr' ? 'Adresse E-mail' : t.buyerEmail}</label>
                        <input
                          type="email" value={email} onChange={e => setEmail(e.target.value)}
                          placeholder="nom@exemple.com"
                          className={inputCls} style={{ background: inputBg, border: `1px solid ${inputBorder}`, color: txtPrim }}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold mb-1.5" style={{ color: txtLabel }}>Numéro de carte *</label>
                        <input
                          type="text" maxLength={16} placeholder="4242 •••• •••• ••••"
                          value={cardNumber} onChange={e => setCardNumber(e.target.value.replace(/\D/g, ''))}
                          className={`${inputCls} tracking-widest font-mono`} style={{ background: inputBg, border: `1px solid ${inputBorder}`, color: txtPrim }}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold mb-1.5" style={{ color: txtLabel }}>Expiration *</label>
                          <input
                            type="text" placeholder="MM/AA" maxLength={5}
                            value={cardExpiry} onChange={e => setCardExpiry(e.target.value)}
                            className={`${inputCls} text-center font-mono`} style={{ background: inputBg, border: `1px solid ${inputBorder}`, color: txtPrim }}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold mb-1.5" style={{ color: txtLabel }}>CVC *</label>
                          <input
                            type="password" placeholder="123" maxLength={3}
                            value={cardCvc} onChange={e => setCardCvc(e.target.value.replace(/\D/g, ''))}
                            className={`${inputCls} text-center font-mono`} style={{ background: inputBg, border: `1px solid ${inputBorder}`, color: txtPrim }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {method !== 'card' && (
                    <div>
                      <label className="block text-xs font-bold mb-1.5" style={{ color: txtLabel }}>
                        {lang === 'fr'
                          ? `Numéro de compte ${method === 'mtn' ? 'MTN MoMo' : 'Orange Money'} *`
                          : `${t.buyerPhone} *`}
                      </label>
                      <input
                        type="tel" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ''))} required
                        placeholder="Ex: 6XXXXXXXX"
                        className={`${inputCls} text-base tracking-wide`} style={{ background: inputBg, border: `1px solid ${inputBorder}`, color: txtPrim }}
                      />
                      <p className="text-[11px] mt-2 leading-normal" style={{ color: txtSub }}>
                        {lang === 'fr'
                          ? "Un message d'autorisation de débit de fonds vous sera envoyé instantanément sur ce numéro après validation."
                          : "A push notification prompt will be sent to this phone number to validate your payment."}
                      </p>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submitting || !isFormValid()}
                  className="w-full disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2.5 shadow-xl transform active:scale-99"
                  style={{ background: 'linear-gradient(135deg,#6C63FF,#00C2FF)' }}
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
              </form>
            </div>

            {/* ══ Vendeur + sécurité — reste en dernier ══ */}
            <div className="order-3 space-y-5">
              <div className="rounded-2xl p-4 flex items-center gap-3 justify-center" style={{ border: `1px solid ${border}` }}>
                <div className="w-11 h-11 rounded-xl overflow-hidden flex items-center justify-center shrink-0" style={{ background: surfaceAlt }}>
                  {seller.shop_logo_url ? (
                    <img src={seller.shop_logo_url} alt={shopDisplayName} className="w-full h-full object-cover" />
                  ) : (
                    <Store size={18} style={{ color: txtSub }} />
                  )}
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold" style={{ color: txtPrim }}>{shopDisplayName}</p>
                  <p className="text-xs" style={{ color: txtSub }}>@{seller.username}</p>
                </div>
              </div>

              <div className="rounded-2xl p-4 space-y-3" style={{ border: `1px solid ${border}` }}>
                <p className="text-xs font-bold uppercase tracking-wider text-center mb-1" style={{ color: txtLabel }}>
                  {lang === 'fr' ? 'Sécurité' : 'Security'}
                </p>
                <div className="flex items-center gap-2.5">
                  <Lock size={14} className="text-emerald-600 shrink-0" />
                  <p className="text-xs leading-relaxed" style={{ color: txtSub }}>
                    {lang === 'fr' ? 'Paiement chiffré et sécurisé.' : 'Encrypted, secure payment.'}
                  </p>
                </div>
                <div className="flex items-center gap-2.5">
                  <Truck size={14} className="text-brand-violet shrink-0" />
                  <p className="text-xs leading-relaxed" style={{ color: txtSub }}>
                    {lang === 'fr' ? 'Le vendeur est payé après confirmation de réception.' : 'The seller is paid only after delivery confirmation.'}
                  </p>
                </div>
                <div className="flex items-center gap-2.5">
                  <RotateCcw size={14} className="text-pink-500 shrink-0" />
                  <p className="text-xs leading-relaxed" style={{ color: txtSub }}>
                    {lang === 'fr' ? 'Protection remboursement en cas de non-livraison.' : 'Refund protection if not delivered.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
