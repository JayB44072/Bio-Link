import React, { useEffect, useState, lazy, Suspense } from 'react';
import { Profile, Transaction } from '../../../lib/types';
import { useAppPrefs } from '../../../lib/AppPrefsContext';
import { listSellerTransactions, markTransactionShipped, cancelTransaction } from '../../../lib/api/transactions';
import { getProductQuantity, setProductQuantity } from '../../../lib/api/products';
import { BRAND, GRADIENTS } from '../../../lib/theme';
import { dashPalette } from '../../../lib/dashPalette';
import { CenteredSpinner } from '../../ui/Spinner';
import EmptyState from '../../ui/EmptyState';
import SearchField from '../../ui/SearchField';
import { filterByQuery } from '../../../lib/search';
import { useFeedback } from '../../../lib/feedbackContext';
import {
  Package, Truck, CheckCircle2, XCircle, Smartphone, CreditCard, MessageCircle, Download, Route,
} from 'lucide-react';

// La carte (Leaflet) n'est chargée que lorsque le vendeur ouvre un suivi
const TrackingModal = lazy(() => import('./orders/TrackingModal'));

interface OrdersProps {
  profile: Profile;
}

type FilterId = 'all' | 'pending' | 'shipped' | 'completed' | 'cancelled';

const FILTERS: { id: FilterId; label: string }[] = [
  { id: 'all',       label: 'Toutes' },
  { id: 'pending',   label: 'En attente' },
  { id: 'shipped',   label: 'Expédiées' },
  { id: 'completed', label: 'Livrées' },
  { id: 'cancelled', label: 'Annulées' },
];

const STATUS_META: Record<string, { label: string; color: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = {
  pending:   { label: 'En attente d\'envoi', color: '#f59e0b', icon: Package },
  shipped:   { label: 'Expédiée',            color: BRAND.violet, icon: Truck },
  completed: { label: 'Livrée · payée',      color: '#22c55e', icon: CheckCircle2 },
  cancelled: { label: 'Annulée',             color: '#ef4444', icon: XCircle },
};

export default function Orders({ profile }: OrdersProps) {
  const { isDark: dk } = useAppPrefs();
  const { confirm } = useFeedback();
  const [orders, setOrders] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterId>('all');
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [trackingOrder, setTrackingOrder] = useState<Transaction | null>(null);

  const { surface, surfaceAlt, border, txtPrim, txtSub, cardShadow } = dashPalette(dk);

  useEffect(() => {
    async function load() {
      const { data } = await listSellerTransactions(profile.user_id);
      setOrders((data as Transaction[]) || []);
      setLoading(false);
    }
    load();
  }, [profile.user_id]);

  const filteredOrders = filterByQuery(
    filter === 'all' ? orders : orders.filter(o => o.status === filter),
    query,
    o => [o.buyer_name, o.buyer_phone, o.buyer_email, o.delivery_address, o.id, o.payment_method, o.amount],
  );
  const counts: Record<FilterId, number> = {
    all: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    completed: orders.filter(o => o.status === 'completed').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
  };

  async function markShipped(id: string) {
    setBusyId(id);
    await markTransactionShipped(id);
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'shipped', shipped_at: new Date().toISOString() } : o));
    setBusyId(null);
  }

  async function cancelOrder(order: Transaction) {
    const ok = await confirm({
      title: 'Annuler cette commande ?',
      message: 'Aucun montant ne sera crédité et le stock sera restauré.',
      confirmLabel: 'Annuler la commande',
      cancelLabel: 'Garder',
      danger: true,
    });
    if (!ok) return;
    setBusyId(order.id);
    await cancelTransaction(order.id);
    if (order.product_id) {
      const { data: prod } = await getProductQuantity(order.product_id);
      if (prod) {
        await setProductQuantity(order.product_id, prod.quantity + 1);
      }
    }
    setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'cancelled' } : o));
    setBusyId(null);
  }

  function downloadInvoice(order: Transaction) {
    const html = `
      <html><head><title>Facture ${order.id.slice(0, 8)}</title>
      <style>body{font-family:sans-serif;padding:40px;color:#16162e}
      h1{font-size:20px;margin-bottom:4px}
      .muted{color:#8a87a3;font-size:13px}
      table{width:100%;border-collapse:collapse;margin-top:24px}
      td{padding:10px 0;border-bottom:1px solid #eee;font-size:14px}
      .total{font-size:20px;font-weight:900;margin-top:16px}
      </style></head><body>
      <h1>BioLinkWD — Facture</h1>
      <p class="muted">Commande #${order.id.slice(0, 8)} · ${new Date(order.created_at).toLocaleDateString()}</p>
      <table>
        <tr><td>Client</td><td>${order.buyer_name}</td></tr>
        <tr><td>Téléphone</td><td>${order.buyer_phone}</td></tr>
        <tr><td>Moyen de paiement</td><td>${order.payment_method.toUpperCase()}</td></tr>
        <tr><td>Montant total</td><td>${order.amount.toLocaleString()} ${order.currency}</td></tr>
        <tr><td>Commission plateforme</td><td>-${order.platform_fee.toLocaleString()} ${order.currency}</td></tr>
        <tr><td>Montant reçu (vendeur)</td><td>${order.seller_amount.toLocaleString()} ${order.currency}</td></tr>
        <tr><td>Statut</td><td>${STATUS_META[order.status]?.label ?? order.status}</td></tr>
      </table>
      <p class="total">Total : ${order.amount.toLocaleString()} ${order.currency}</p>
      </body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `facture-${order.id.slice(0, 8)}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <h2 className="font-black text-xl mb-1" style={{ color: txtPrim }}>Mes commandes</h2>
      <p className="text-sm mb-5" style={{ color: txtSub }}>
        Suivez vos commandes en cours, expédiées, livrées et annulées.
      </p>

      <SearchField className="mb-4 max-w-md" value={query} onChange={setQuery} palette={{ surfaceAlt, border, txtPrim, txtSub }}
        placeholder="Rechercher un client, un téléphone, une adresse…" label="Rechercher une commande" clearLabel="Effacer la recherche" />

      {/* Filtres */}
      <div className="flex gap-1.5 mb-5 overflow-x-auto scrollbar-hide">
        {FILTERS.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold transition"
            style={filter === f.id
              ? { background: GRADIENTS.violetSoft, color: '#fff' }
              : { background: surfaceAlt, color: txtSub, border: `1px solid ${border}` }}>
            {f.label} <span className="opacity-70">({counts[f.id]})</span>
          </button>
        ))}
      </div>

      {loading ? (
        <CenteredSpinner className="py-16" />
      ) : filteredOrders.length === 0 ? (
        <EmptyState icon={Package} iconSize={36} palette={{ surfaceAlt, border, txtSub }} message={query.trim() ? `Aucune commande ne correspond à « ${query.trim()} ».` : 'Aucune commande dans cette catégorie.'} />
      ) : (
        <div className="space-y-3">
          {filteredOrders.map(order => {
            const meta = STATUS_META[order.status] ?? STATUS_META.pending;
            const Icon = meta.icon;
            const whatsappUrl = order.buyer_phone ? `https://wa.me/${order.buyer_phone.replace(/[^0-9]/g, '')}` : null;
            return (
              <div key={order.id} className="rounded-2xl p-4"
                style={{ background: surface, border: `1px solid ${border}`, boxShadow: cardShadow }}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${meta.color}1f` }}>
                      <Icon size={17} color={meta.color} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate" style={{ color: txtPrim }}>{order.buyer_name}</p>
                      <p className="text-xs" style={{ color: txtSub }}>{new Date(order.created_at).toLocaleDateString()} · {order.buyer_phone}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0" style={{ background: `${meta.color}1f`, color: meta.color }}>
                    {meta.label}
                  </span>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: txtSub }}>
                    {order.payment_method === 'card' ? <CreditCard size={13} /> : <Smartphone size={13} />}
                    {order.payment_method.toUpperCase()}
                  </div>
                  <p className="text-sm font-black" style={{ color: txtPrim }}>
                    {order.amount.toLocaleString()} {order.currency}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {order.status === 'pending' && (
                    <>
                      <button onClick={() => markShipped(order.id)} disabled={busyId === order.id}
                        className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition disabled:opacity-50"
                        style={{ background: GRADIENTS.brand, color: '#fff' }}>
                        <Truck size={13} />{busyId === order.id ? '...' : 'Marquer expédiée'}
                      </button>
                      <button onClick={() => cancelOrder(order)} disabled={busyId === order.id}
                        className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition disabled:opacity-50"
                        style={{ background: dk ? 'rgba(255,107,157,0.1)' : '#fff1f6', color: BRAND.pink }}>
                        <XCircle size={13} />Annuler
                      </button>
                    </>
                  )}
                  {(order.status === 'pending' || order.status === 'shipped') && (
                    <button onClick={() => setTrackingOrder(order)}
                      className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition"
                      style={{ background: 'rgba(108,99,255,0.12)', color: BRAND.violet }}>
                      <Route size={13} />Suivi de livraison
                    </button>
                  )}                  {whatsappUrl && (
                    <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition"
                      style={{ background: surfaceAlt, color: txtSub, border: `1px solid ${border}` }}>
                      <MessageCircle size={13} />Contacter
                    </a>
                  )}
                  <button onClick={() => downloadInvoice(order)}
                    className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition"
                    style={{ background: surfaceAlt, color: txtSub, border: `1px solid ${border}` }}>
                    <Download size={13} />Facture
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {trackingOrder && (
        <Suspense fallback={null}>
          <TrackingModal
            order={trackingOrder}
            profile={profile}
            onClose={() => setTrackingOrder(null)}
            onShipped={id => setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'shipped', shipped_at: new Date().toISOString() } : o))}
          />
        </Suspense>
      )}
    </div>
  );
}