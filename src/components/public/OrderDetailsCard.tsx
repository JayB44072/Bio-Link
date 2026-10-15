import { useState } from 'react';
import { CheckCircle2, MapPin, MessageCircle, Package, ShieldCheck, ShoppingBag, Truck, X } from 'lucide-react';
import type { OrderDetails } from '../../lib/api/orders';
import { whatsappUrl } from '../../lib/whatsapp';
import { GRADIENTS } from '../../lib/theme';
import { ButtonSpinner } from '../ui/Spinner';
import OrderTrackingPanel from './OrderTrackingPanel';
import type { ServiceWaveTheme } from './PublicServiceWave';
import { LIGHT_ORDER_THEME } from './orderTheme';

interface OrderDetailsCardProps {
  details: OrderDetails;
  lang: string;
  theme?: ServiceWaveTheme;
  /** Confirme la réception ; renvoie un message d'erreur à afficher, ou null si tout s'est bien passé. */
  onConfirm: () => Promise<string | null>;
}

const STEPS = ['pending', 'shipped', 'completed'] as const;

/**
 * Écran de suivi d'une commande, tout en un : le produit (photo, description, emplacement), l'avancement de la livraison,
 * la carte avec la position du colis, la confirmation de réception et le contact du vendeur.
 * Utilisé par l'onglet « Suivi » de la page publique et par la page /commande/….
 */
export default function OrderDetailsCard({ details, lang, theme = LIGHT_ORDER_THEME, onConfirm }: OrderDetailsCardProps) {
  const fr = lang === 'fr';
  const { order, product, seller, tracking } = details;
  const [expanded, setExpanded] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const idle = theme.dark ? 'rgba(255,255,255,0.1)' : '#f3f4f6';
  const photo = product?.image_url || product?.images?.[0] || '';
  const shopName = seller.shop_name || seller.display_name || seller.username;
  const shortId = order.id.slice(0, 8);
  const description = (product?.description ?? '').trim();
  const longText = description.length > 140;
  const hasEvents = (tracking?.events.length ?? 0) > 0;
  const showTracking = !!tracking && (hasEvents || tracking.origin || tracking.destination);
  const stepIndex = Math.max(0, STEPS.indexOf(order.status as typeof STEPS[number]));
  const unit = product ? product.price : null;

  const contact = whatsappUrl(seller.whatsapp_number, fr
    ? `Bonjour, je vous écris au sujet de ma commande n°${shortId}${product ? ` (${product.name})` : ''}.`
    : `Hello, I'm writing about my order #${shortId}${product ? ` (${product.name})` : ''}.`);

  async function confirm() {
    setConfirming(true);
    setError(null);
    setError(await onConfirm());
    setConfirming(false);
  }

  const stepLabel = (s: typeof STEPS[number]) => s === 'pending' ? (fr ? 'Paiement reçu' : 'Payment received') : s === 'shipped' ? (fr ? 'Expédiée' : 'Shipped') : (fr ? 'Livrée' : 'Delivered');

  return (
    <article className={`${theme.cardRadius} overflow-hidden`} style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, boxShadow: theme.dark ? 'none' : '0 1px 3px rgba(0,0,0,0.05)' }}>
      {/* ── Le produit commandé ── */}
      <header className="p-5 flex gap-4">
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center" style={{ background: idle }}>
          {photo
            ? <img src={photo} alt={product?.name ?? ''} loading="lazy" className="w-full h-full object-cover" />
            : <ShoppingBag size={30} aria-hidden style={{ color: theme.subtext }} />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: theme.subtext }}>
            {fr ? 'Commande' : 'Order'} #{shortId} · {new Date(order.created_at).toLocaleDateString(fr ? 'fr-FR' : 'en-US', { dateStyle: 'medium' })}
          </p>
          <h2 className="text-lg font-black leading-snug mt-0.5 break-words" style={{ color: theme.text }}>
            {product?.name ?? (fr ? 'Votre commande' : 'Your order')}
          </h2>
          {shopName && <p className="text-xs mt-0.5" style={{ color: theme.subtext }}>{fr ? 'Vendu par' : 'Sold by'} {shopName}</p>}
          <p className="mt-2 flex items-baseline gap-1.5 flex-wrap">
            <span className="text-xl font-black tabular-nums" style={{ color: theme.priceColor }}>{order.amount.toLocaleString()} {order.currency}</span>
            {order.quantity > 1 && unit != null && (
              <span className="text-xs" style={{ color: theme.subtext }}>{order.quantity} × {unit.toLocaleString()}</span>
            )}
          </p>
        </div>
      </header>

      {(description || product?.location_address || order.delivery_address) && (
        <div className="px-5 pb-4 space-y-3">
          {description && (
            <div>
              <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: theme.subtext, ...(expanded ? {} : { display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }) }}>
                {description}
              </p>
              {longText && (
                <button type="button" onClick={() => setExpanded(v => !v)} aria-expanded={expanded}
                  className="mt-1 text-xs font-bold focus-visible:outline-none focus-visible:underline" style={{ color: theme.accent }}>
                  {expanded ? (fr ? 'Réduire' : 'Show less') : (fr ? 'Lire la suite' : 'Read more')}
                </button>
              )}
            </div>
          )}
          <dl className="grid gap-2 sm:grid-cols-2 text-sm">
            {product?.location_address && (
              <div className="flex items-start gap-2">
                <MapPin size={15} aria-hidden className="mt-0.5 shrink-0" style={{ color: theme.accent }} />
                <div><dt className="text-[11px] font-bold uppercase tracking-wider" style={{ color: theme.subtext }}>{fr ? 'Emplacement du produit' : 'Product location'}</dt>
                  <dd style={{ color: theme.text }}>{product.location_address}</dd></div>
              </div>
            )}
            {order.delivery_address && (
              <div className="flex items-start gap-2">
                <Truck size={15} aria-hidden className="mt-0.5 shrink-0" style={{ color: theme.accent }} />
                <div><dt className="text-[11px] font-bold uppercase tracking-wider" style={{ color: theme.subtext }}>{fr ? 'Livraison à' : 'Delivery to'}</dt>
                  <dd style={{ color: theme.text }}>{order.delivery_address}</dd></div>
              </div>
            )}
          </dl>
        </div>
      )}

      <div className="px-5 pb-5" style={{ borderTop: `1px solid ${theme.cardBorder}` }}>
        {/* ── Avancement et carte ── */}
        <div className="pt-5">
          {order.status === 'cancelled' ? (
            <div className="rounded-2xl p-4 flex items-start gap-2.5" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
              <X size={18} aria-hidden className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-red-500 text-xs leading-relaxed">{fr ? 'Cette commande a été annulée par le vendeur.' : 'This order was cancelled by the seller.'}</p>
            </div>
          ) : showTracking ? (
            <OrderTrackingPanel tracking={tracking!} lang={lang} orderStatus={order.status} theme={theme} embedded />
          ) : (
            <ol className="flex items-start justify-between" aria-label={fr ? 'Progression' : 'Progress'}>
              {STEPS.map((s, i) => {
                const Icon = s === 'pending' ? Package : s === 'shipped' ? Truck : CheckCircle2;
                const done = i <= stepIndex;
                return (
                  <li key={s} className="flex-1 flex flex-col items-center relative" aria-current={i === stepIndex ? 'step' : undefined}>
                    {i > 0 && <span className="absolute top-[17px] right-1/2 w-full h-0.5" style={{ background: i <= stepIndex ? theme.accent : theme.cardBorder }} aria-hidden />}
                    <span className="relative z-10 w-9 h-9 rounded-full flex items-center justify-center" style={{ background: done ? GRADIENTS.brand : idle, color: done ? '#fff' : theme.subtext }}>
                      <Icon size={15} aria-hidden />
                    </span>
                    <span className="mt-1.5 text-[10px] font-semibold text-center leading-tight" style={{ color: done ? theme.text : theme.subtext }}>{stepLabel(s)}</span>
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        {/* ── Réception ── */}
        {order.status === 'completed' ? (
          <div className="rounded-2xl p-4 mt-5 flex items-start gap-2.5" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)' }}>
            <CheckCircle2 size={18} aria-hidden className="text-emerald-500 shrink-0 mt-0.5" />
            <p className="text-emerald-600 text-xs leading-relaxed" role="status">
              {fr ? 'Commande confirmée comme livrée. Le vendeur a été payé. Merci !' : 'Order confirmed as delivered. The seller has been paid. Thank you!'}
            </p>
          </div>
        ) : order.status === 'shipped' ? (
          <>
            <div className="rounded-2xl p-4 mt-5 mb-4 flex items-start gap-2.5" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
              <ShieldCheck size={18} aria-hidden className="text-blue-500 shrink-0 mt-0.5" />
              <p className="text-blue-500 text-xs leading-relaxed">
                {fr ? "Votre argent reste protégé jusqu'à ce que vous confirmiez avoir bien reçu votre colis. Ne confirmez que si tout est en ordre." : "Your money stays protected until you confirm you've received your package. Only confirm once everything is in order."}
              </p>
            </div>
            <button type="button" onClick={() => void confirm()} disabled={confirming}
              className="w-full h-12 rounded-full text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60 transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4"
              style={{ background: theme.buttonGradient, ['--tw-ring-color' as string]: `color-mix(in srgb, ${theme.accent} 40%, transparent)` }}>
              {confirming ? <ButtonSpinner /> : <CheckCircle2 size={16} aria-hidden />}{fr ? "J'ai bien reçu ma commande" : "I've received my order"}
            </button>
            {error && <p role="alert" className="mt-2 text-xs font-semibold text-red-500">{error}</p>}
          </>
        ) : order.status === 'pending' ? (
          <p className="mt-5 text-xs leading-relaxed" style={{ color: theme.subtext }}>
            {fr ? "Le vendeur prépare votre commande. Vous pourrez confirmer la réception une fois le colis expédié." : 'The seller is preparing your order. You can confirm receipt once it has shipped.'}
          </p>
        ) : null}

        {/* ── Contacter le vendeur ── */}
        {contact && order.status !== 'completed' && (
          <a href={contact} target="_blank" rel="noopener noreferrer"
            className="mt-4 flex items-center justify-center gap-2 h-11 rounded-full text-sm font-bold transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2"
            style={{ border: `1px solid ${theme.cardBorder}`, color: theme.text }}>
            <MessageCircle size={16} aria-hidden style={{ color: '#25D366' }} />{fr ? 'Contacter le vendeur' : 'Contact the seller'}
          </a>
        )}
      </div>
    </article>
  );
}
