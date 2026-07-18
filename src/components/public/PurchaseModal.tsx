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
  Package, Link2, Store, Lock, RotateCcw, Truck, Sun, Moon, Globe, MessageCircle,
} from 'lucide-react';

export function buildWhatsAppOrderUrl(
  whatsappNumber: string,
  greeting: string,
  items: { name: string; qty: number; price: number; currency: string }[],
  total: number,
  currency: string,
  lang: 'fr' | 'en' | 'pt' | 'de',
): string {
  const digits = (whatsappNumber || '').replace(/\D/g, '');
  const defaultGreetings: Record<string, string> = {
    fr: 'Bonjour, je souhaite passer commande sur votre boutique.',
    en: 'Hello, I would like to place an order on your shop.',
    pt: 'Olá, gostaria de fazer uma encomenda na sua loja.',
    de: 'Hallo, ich möchte auf Ihrem Shop bestellen.',
  };
  const openLine = (greeting && greeting.trim()) ? greeting.trim() : (defaultGreetings[lang] || defaultGreetings.fr);
  const itemsHeader = lang === 'fr' ? 'Ma commande :' : lang === 'pt' ? 'Meu pedido:' : lang === 'de' ? 'Meine Bestellung:' : 'My order:';
  const totalLabel = lang === 'fr' ? 'Total' : lang === 'pt' ? 'Total' : lang === 'de' ? 'Gesamt' : 'Total';
  const closeLine = lang === 'fr'
    ? 'Merci de me confirmer et me préciser l\'adresse de livraison.'
    : lang === 'pt' ? 'Por favor confirme e indique o endereço de entrega.'
    : lang === 'de' ? 'Bitte bestätigen Sie und geben Sie die Lieferadresse an.'
    : 'Please confirm and let me know the delivery address.';
  const itemLines = items.map(i => {
    const subtotal = (i.price * i.qty).toLocaleString();
    return `• ${i.name} x${i.qty} = ${subtotal} ${i.currency}`;
  }).join('\n');
  const message = [
    openLine,
    '',
    itemsHeader,
    itemLines,
    '',
    `${totalLabel} : ${total.toLocaleString()} ${currency}`,
    '',
    closeLine,
  ].join('\n');
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  currency: string;
  image_url: string;
  qty: number;
}

interface PurchaseModalProps {
  product: Product;
  seller: Profile;
  cartItems?: CartItem[];
  onClose: () => void;
  onSuccess?: () => void;
}

const LANG_OPTIONS: { code: LandingLang; label: string }[] = [
  { code: 'fr', label: '🇫🇷 Français'  },
  { code: 'en', label: '🇬🇧 English'   },
  { code: 'pt', label: '🇵🇹 Português' },
  { code: 'de', label: '🇩🇪 Deutsch'   },
];

export default function PurchaseModal({ product, seller, cartItems, onClose, onSuccess }: PurchaseModalProps) {
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
  const [qty, setQty] = useState(1);
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
  const unitPrice = product.price;
  const totalAmount = Math.round(unitPrice * qty * 100) / 100;
  // fee and sellerAmount are NOT shown to buyer; computed here only for storing in DB
  // Actual deduction happens in BuyerOrderPage.confirmDelivery()
  const fee = Math.round(totalAmount * commissionRate * 100) / 100;
  const sellerAmount = Math.round((totalAmount - fee) * 100) / 100;
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
        amount: totalAmount,
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

      // Notifications (fire-and-forget, ne bloquent jamais le paiement)
      supabase.from('notifications').insert({
        user_id: seller.user_id,
        type: 'order',
        title: lang === 'fr' ? 'Nouvelle commande !' : 'New order!',
        message: lang === 'fr'
          ? `${name} a commandé "${product.name}" pour ${totalAmount.toLocaleString()} ${product.currency} (${method.toUpperCase()}).`
          : `${name} ordered "${product.name}" for ${totalAmount.toLocaleString()} ${product.currency} (${method.toUpperCase()}).`,
        metadata: { order_id: tx?.id, product_name: product.name, amount: totalAmount, currency: product.currency, buyer_name: name },
      }).then(() => {}).catch(() => {});

      supabase.functions.invoke('send-order-email', {
        body: {
          seller_id: seller.user_id,
          buyer_name: name,
          product_name: product.name,
          amount: totalAmount,
          currency: product.currency,
          payment_method: method,
          order_id: tx?.id,
        },
      }).catch(() => {});
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : (err as { message?: string })?.message || t.error;
      console.error('[BioLinkWD] Erreur paiement:', err);
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  function downloadInvoice() {
    const invoiceNum = orderId ? orderId.slice(0, 8).toUpperCase() : '00000000';
    const dateStr = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
    const html = `
<!doctype html><html><head><meta charset="utf-8"><title>Facture #${invoiceNum} — BioLinkWD</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', 'Segoe UI', system-ui, sans-serif; background: #f0eef8; padding: 32px 16px; color: #1a1a2e; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .page { max-width: 680px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(108,99,255,0.08); }

  /* ── Header ── */
  .hdr { display: flex; justify-content: space-between; align-items: flex-start; padding: 36px 36px 28px; border-bottom: 2px solid #f0eefb; }
  .hdr-left { }
  .logo { font-size: 22px; font-weight: 900; color: #1a1a2e; letter-spacing: -0.5px; }
  .logo span { color: #6C63FF; }
  .logo-sub { font-size: 10px; font-weight: 700; color: #FF6B9D; letter-spacing: 0.5px; margin-top: 2px; }
  .hdr-right { text-align: right; }
  .inv-label { font-size: 28px; font-weight: 900; color: #6C63FF; letter-spacing: -1px; }
  .inv-num { font-size: 12px; font-weight: 700; color: #8a87a3; margin-top: 2px; }
  .inv-date { font-size: 11px; color: #b0aec6; margin-top: 4px; }

  /* ── Parties ── */
  .parties { display: flex; gap: 24px; padding: 28px 36px; background: #faf9ff; }
  .party { flex: 1; }
  .party-label { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.2px; color: #6C63FF; margin-bottom: 8px; }
  .party-name { font-size: 15px; font-weight: 800; color: #1a1a2e; }
  .party-detail { font-size: 12px; color: #8a87a3; margin-top: 3px; line-height: 1.5; }

  /* ── Tableau commande ── */
  .items { padding: 0 36px; }
  .items table { width: 100%; border-collapse: collapse; margin-top: 24px; }
  .items thead th { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #8a87a3; padding: 0 0 10px; border-bottom: 2px solid #f0eefb; }
  .items thead th:first-child { text-align: left; }
  .items thead th:last-child, .items thead th:nth-child(2), .items thead th:nth-child(3) { text-align: right; }
  .items tbody td { padding: 16px 0; border-bottom: 1px solid #f5f4fa; font-size: 13px; }
  .items tbody td:first-child { text-align: left; font-weight: 700; color: #1a1a2e; }
  .items tbody td:nth-child(2) { text-align: right; color: #8a87a3; font-weight: 600; }
  .items tbody td:nth-child(3) { text-align: right; color: #8a87a3; font-weight: 600; }
  .items tbody td:last-child { text-align: right; font-weight: 800; color: #1a1a2e; }

  /* ── Totaux ── */
  .totals { padding: 20px 36px 0; display: flex; justify-content: flex-end; }
  .totals-box { width: 260px; }
  .totals-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 13px; }
  .totals-row .lbl { color: #8a87a3; font-weight: 600; }
  .totals-row .val { color: #1a1a2e; font-weight: 700; }
  .totals-row.grand { margin-top: 8px; padding-top: 14px; border-top: 2px solid #6C63FF; }
  .totals-row.grand .lbl { font-size: 14px; font-weight: 800; color: #1a1a2e; }
  .totals-row.grand .val { font-size: 20px; font-weight: 900; color: #6C63FF; }

  /* ── Paiement ── */
  .payment { margin: 28px 36px 0; padding: 16px 20px; background: #f5f3ff; border-radius: 12px; display: flex; align-items: center; gap: 12px; }
  .pay-icon { width: 36px; height: 36px; background: #6C63FF; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 16px; font-weight: 900; }
  .pay-info { }
  .pay-method { font-size: 12px; font-weight: 700; color: #1a1a2e; }
  .pay-status { font-size: 11px; color: #22c55e; font-weight: 700; margin-top: 1px; }

  /* ── Footer ── */
  .ftr { padding: 28px 36px; margin-top: 28px; border-top: 1px solid #f0eefb; text-align: center; }
  .ftr p { font-size: 11px; color: #b0aec6; line-height: 1.6; }
  .ftr .brand { font-weight: 800; color: #6C63FF; }
  .ftr .pink { color: #FF6B9D; font-weight: 700; }

  @media print {
    body { background: #fff; padding: 0; }
    .page { box-shadow: none; border-radius: 0; }
  }
</style></head>
<body>
  <div class="page">
    <div class="hdr">
      <div class="hdr-left">
        <div class="logo">BioLink<span>WD</span></div>
        <div class="logo-sub">by WhiteDuckSaaS</div>
      </div>
      <div class="hdr-right">
        <div class="inv-label">FACTURE</div>
        <div class="inv-num">#${invoiceNum}</div>
        <div class="inv-date">${dateStr}</div>
      </div>
    </div>

    <div class="parties">
      <div class="party">
        <div class="party-label">Vendeur</div>
        <div class="party-name">${shopDisplayName}</div>
        <div class="party-detail">@${seller.username}</div>
      </div>
      <div class="party">
        <div class="party-label">Client</div>
        <div class="party-name">${name}</div>
        <div class="party-detail">${phone || '—'}</div>
        ${deliveryLocation.address ? `<div class="party-detail">${deliveryLocation.address}</div>` : ''}
      </div>
    </div>

    <div class="items">
      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th>Prix unitaire</th>
            <th>Qté</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${cartItems && cartItems.length > 0
            ? cartItems.map(ci => `<tr>
                <td>${ci.name}</td>
                <td>${ci.price.toLocaleString()} ${ci.currency}</td>
                <td>${ci.qty}</td>
                <td>${(ci.price * ci.qty).toLocaleString()} ${ci.currency}</td>
              </tr>`).join('')
            : `<tr>
                <td>${product.name}</td>
                <td>${unitPrice.toLocaleString()} ${product.currency}</td>
                <td>${qty}</td>
                <td>${totalAmount.toLocaleString()} ${product.currency}</td>
              </tr>`
          }
        </tbody>
      </table>
    </div>

    <div class="totals">
      <div class="totals-box">
        <div class="totals-row">
          <span class="lbl">Sous-total</span>
          <span class="val">${totalAmount.toLocaleString()} ${product.currency}</span>
        </div>
        <div class="totals-row">
          <span class="lbl">Livraison</span>
          <span class="val">—</span>
        </div>
        <div class="totals-row grand">
          <span class="lbl">Total</span>
          <span class="val">${totalAmount.toLocaleString()} ${product.currency}</span>
        </div>
      </div>
    </div>

    <div class="payment">
      <div class="pay-icon">${method === 'card' ? '💳' : '📱'}</div>
      <div class="pay-info">
        <div class="pay-method">Payé via ${method === 'card' ? 'Carte bancaire' : method === 'mtn' ? 'MTN Mobile Money' : 'Orange Money'}</div>
        <div class="pay-status">&#10003; Paiement confirmé</div>
      </div>
    </div>

    <div class="ftr">
      <p>
        Merci pour votre confiance.<br>
        <span class="brand">BioLinkWD</span> · propulsé par <span class="pink">WhiteDuckSaaS</span>
      </p>
    </div>
  </div>
</body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `facture-${invoiceNum}.html`;
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
            {totalAmount.toLocaleString()} <span className="text-sm font-bold">{product.currency}</span>
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

              <div className="mb-5">
                <p className="font-black text-lg text-center" style={{ color: txtPrim }}>{product.name}</p>
                {product.description && <p className="text-xs mt-1 leading-relaxed text-center" style={{ color: txtSub }}>{product.description}</p>}

                {/* Prix unitaire */}
                <div className="flex items-center justify-between mt-3 px-1">
                  <span className="text-xs font-semibold" style={{ color: txtSub }}>{lang === 'fr' ? 'Prix unitaire' : 'Unit price'}</span>
                  <span className="font-bold text-sm" style={{ color: txtPrim }}>{unitPrice.toLocaleString()} {product.currency}</span>
                </div>

                {/* Sélecteur quantité */}
                {!isSyntheticCart && (
                  <div className="flex items-center justify-between mt-2 px-1">
                    <span className="text-xs font-semibold" style={{ color: txtSub }}>{lang === 'fr' ? 'Quantité' : 'Quantity'}</span>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => setQty(q => Math.max(1, q - 1))}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold transition"
                        style={{ background: surfaceAlt, border: `1px solid ${border}`, color: txtPrim }}>−</button>
                      <span className="w-8 text-center text-sm font-bold" style={{ color: txtPrim }}>{qty}</span>
                      <button type="button" onClick={() => setQty(q => Math.min(product.quantity ?? 99, q + 1))}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold transition"
                        style={{ background: surfaceAlt, border: `1px solid ${border}`, color: txtPrim }}>+</button>
                    </div>
                  </div>
                )}

                {/* Total */}
                <div className="flex items-center justify-between mt-3 px-1 pt-3" style={{ borderTop: `1px solid ${border}` }}>
                  <span className="text-xs font-bold uppercase tracking-wide" style={{ color: txtLabel }}>{lang === 'fr' ? 'Total' : 'Total'}</span>
                  <span className="font-black text-xl tracking-tight" style={{ color: '#6C63FF' }}>{totalAmount.toLocaleString()} {product.currency}</span>
                </div>

                {!isSyntheticCart && (
                  <div className="text-center mt-2">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                      <Package size={11} />{lang === 'fr' ? `${product.quantity} disponible(s)` : `${product.quantity} available`}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* ══ Moyens de paiement — passe en premier sur mobile ══ */}
            <div className="order-1 lg:order-2">
              {seller.whatsapp_enabled && seller.whatsapp_number && (
                <a
                  href={buildWhatsAppOrderUrl(
                    seller.whatsapp_number,
                    seller.whatsapp_greeting,
                    cartItems && cartItems.length > 0
                      ? cartItems.map(ci => ({ name: ci.name, qty: ci.qty, price: ci.price, currency: ci.currency }))
                      : [{ name: product.name, qty, price: unitPrice, currency: product.currency }],
                    totalAmount,
                    product.currency,
                    lang,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full mb-5 flex items-center justify-center gap-2.5 text-white font-bold py-4 rounded-2xl transition-all duration-300 shadow-xl transform active:scale-99"
                  style={{ background: '#25D366' }}
                >
                  <MessageCircle size={18} />
                  <span>
                    {lang === 'fr' ? 'Commander via WhatsApp' : 'Order via WhatsApp'}
                  </span>
                </a>
              )}
              {seller.whatsapp_enabled && seller.whatsapp_number && (
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex-1 h-px" style={{ background: border }} />
                  <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: txtSub }}>
                    {lang === 'fr' ? 'ou payer en ligne' : 'or pay online'}
                  </span>
                  <div className="flex-1 h-px" style={{ background: border }} />
                </div>
              )}
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
                      { id: 'card' as PaymentMethod, label: 'Carte', icon: CreditCard, logo: null, activeClass: 'border-blue-600 bg-blue-50/40 text-blue-700' },
                      { id: 'mtn' as PaymentMethod, label: 'MTN MoMo', icon: null, logo: '/mtn.png', activeClass: 'border-yellow-500 bg-yellow-50/50 text-amber-950 font-bold' },
                      { id: 'orange' as PaymentMethod, label: 'Orange Money', icon: null, logo: '/orange.png', activeClass: 'border-orange-500 bg-orange-50/40 text-orange-700 font-bold' },
                    ].map(({ id, label, icon: Icon, logo, activeClass }) => (
                      <button
                        key={id} type="button" onClick={() => setMethod(id)}
                        className={`flex flex-col items-center justify-center gap-1.5 py-3.5 rounded-2xl border text-xs font-medium transition-all duration-200 ${
                          method === id ? `${dk ? '' : activeClass} shadow-sm ring-1 ring-current/20` : ''
                        }`}
                        style={method === id
                          ? (dk ? { borderColor: '#6C63FF', background: 'rgba(108,99,255,0.12)', color: '#a5b4fc' } : {})
                          : { borderColor: inputBorder, color: txtSub, background: inputBg }}
                      >
                        {logo ? (
                          <img src={logo} alt={label} className={`w-6 h-6 object-contain ${method === id ? 'scale-110 transition-transform' : ''}`} />
                        ) : Icon ? (
                          <Icon size={18} className={method === id ? 'scale-110 transition-transform' : ''} />
                        ) : null}
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
                      {lang === 'fr' ? 'Confirmer le paiement' : t.pay} · {totalAmount.toLocaleString()} {product.currency}
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
