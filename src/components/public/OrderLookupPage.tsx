import React, { useState } from 'react';
import { lookupOrders, type OrderSummary } from '../../lib/api/orders';
import { Link2, Search, Package, Truck, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { BRAND, GRADIENTS } from '../../lib/theme';

const STATUS_META: Record<string, { label: string; color: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = {
  pending:   { label: 'En attente d\'envoi', color: '#f59e0b', icon: Package },
  shipped:   { label: 'Expédiée',            color: BRAND.violet, icon: Truck },
  completed: { label: 'Livrée · payée',      color: '#22c55e', icon: CheckCircle2 },
  cancelled: { label: 'Annulée',             color: '#ef4444', icon: XCircle },
};

export default function OrderLookupPage() {
  const [phone, setPhone] = useState('');
  const [orders, setOrders] = useState<OrderSummary[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.trim()) return;
    setLoading(true);
    setSearched(true);
    setOrders(await lookupOrders({ phone: phone.trim() }));
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-2 mb-6 justify-center">
          <Link2 size={16} className="text-brand-violet" />
          <span className="font-black text-gray-900">BioLinkWD</span>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-4">
          <h1 className="text-lg font-black text-gray-900 mb-1">Retrouver ma commande</h1>
          <p className="text-xs text-gray-500 mb-4">
            Entrez le numéro de téléphone utilisé lors du paiement pour retrouver toutes vos commandes.
          </p>
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="tel" value={phone} onChange={e => setPhone(e.target.value)} required
              placeholder="+225 07 00 00 00"
              className="flex-1 rounded-xl px-4 py-2.5 text-sm border border-gray-200 outline-none focus:border-brand-violet"
            />
            <button type="submit" disabled={loading}
              className="w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0 disabled:opacity-50"
              style={{ background: GRADIENTS.brand }}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            </button>
          </form>
        </div>

        {searched && !loading && orders && orders.length === 0 && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 text-center">
            <Package size={28} className="text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Aucune commande trouvée pour ce numéro.</p>
          </div>
        )}

        {orders && orders.length > 0 && (
          <div className="space-y-3">
            {orders.map(order => {
              const meta = STATUS_META[order.status] ?? STATUS_META.pending;
              const Icon = meta.icon;
              return (
                <a key={order.id} href={`/commande/${order.id}`}
                  className="block bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:border-gray-200 transition">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center shrink-0"
                        style={{ background: `${meta.color}1f` }}>
                        {order.product_image
                          ? <img src={order.product_image} alt="" loading="lazy" className="w-full h-full object-cover" />
                          : <Icon size={16} color={meta.color} />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 line-clamp-1">{order.product_name ?? 'Commande'}</p>
                        <p className="text-xs text-gray-500">{order.amount.toLocaleString()} {order.currency}</p>
                        <p className="text-xs" style={{ color: meta.color }}>{meta.label}</p>
                      </div>
                    </div>
                    <p className="text-[11px] text-gray-400">{new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
