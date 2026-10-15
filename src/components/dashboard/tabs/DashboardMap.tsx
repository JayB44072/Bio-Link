import { lazy, Suspense, useEffect, useState } from 'react';
import { Profile, Product } from '../../../lib/types';
import { PLAN_CONFIGS } from '../../../lib/planLimits';
import { useLang } from '../../../lib/LanguageContext';
import { useAppPrefs } from '../../../lib/AppPrefsContext';
import ProductsMap from '../../ui/ProductsMap';
import { Lock, TrendingUp, MapPin, Route } from 'lucide-react';
import { listOrderRoutes, type OrderRoute } from '../../../lib/api/orderRoutes';
import { ROUTE_COLORS } from '../../ui/OrdersRouteMap';
import { BRAND } from '../../../lib/theme';
import { dashPalette } from '../../../lib/dashPalette';

const OrdersRouteMap = lazy(() => import('../../ui/OrdersRouteMap'));

interface DashboardMapProps {
  profile: Profile;
  products: Product[];
}

export default function DashboardMap({ profile, products }: DashboardMapProps) {
  const { lang } = useLang();
  const { isDark: dk } = useAppPrefs();
  const hasAccess = PLAN_CONFIGS[profile.plan_type].map_access;

  const { surface, border, txtPrim, txtSub } = dashPalette(dk);

  const [routes, setRoutes] = useState<OrderRoute[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  useEffect(() => {
    if (!hasAccess || !profile.user_id) return;
    let alive = true;
    listOrderRoutes(profile.user_id, products).then(r => { if (alive) setRoutes(r); });
    return () => { alive = false; };
  }, [hasAccess, profile.user_id, products]);
  const statusLabel = (st: string) => st === 'pending' ? (lang === 'fr' ? "En attente d'envoi" : 'Awaiting shipment') : st === 'shipped' ? (lang === 'fr' ? 'Expédiée' : 'Shipped') : (lang === 'fr' ? 'Livrée' : 'Delivered');

  const pins = products
    .filter(p => p.location_lat != null && p.location_lng != null)
    .map(p => ({
      id: p.id, name: p.name, price: p.price, currency: p.currency,
      image_url: p.image_url, lat: p.location_lat as number, lng: p.location_lng as number,
    }));

  if (!hasAccess) {
    return (
      <div className="relative">
        <div className="blur-sm pointer-events-none select-none rounded-3xl overflow-hidden" style={{ height: 420, background: dk ? '#0d0d22' : '#faf9ff' }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="rounded-2xl p-8 text-center max-w-sm mx-4 shadow-2xl"
            style={{ background: surface, border: `1px solid ${border}` }}>
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(251,191,36,0.12)' }}>
              <Lock size={24} className="text-amber-500" />
            </div>
            <h3 className="font-bold text-lg mb-2" style={{ color: txtPrim }}>
              {lang === 'fr' ? 'Carte verrouillée' : 'Map locked'}
            </h3>
            <p className="text-sm leading-relaxed mb-6" style={{ color: txtSub }}>
              {lang === 'fr'
                ? "La carte des emplacements de vos produits est réservée aux forfaits Business et Premium."
                : 'The product location map is reserved for Business and Premium plans.'}
            </p>
            <div className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5"
              style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)' }}>
              <TrendingUp size={14} className="text-amber-500" />
              <span className="text-amber-500 text-xs font-semibold">Business / Premium</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <MapPin size={18} style={{ color: BRAND.violet }} />
        <h2 className="font-black text-xl" style={{ color: txtPrim }}>
          {lang === 'fr' ? 'Carte de mes produits' : 'My products map'}
        </h2>
      </div>
      <p className="text-sm mb-5" style={{ color: txtSub }}>
        {lang === 'fr'
          ? "Visualisez où se trouvent vos produits. Basculez entre vue simple et vue satellite."
          : 'Visualize where your products are located. Switch between simple and satellite view.'}
      </p>
      <ProductsMap pins={pins} isDark={dk} height={520}
        emptyLabel={lang === 'fr' ? "Ajoutez un emplacement à vos produits pour les voir apparaître ici." : 'Add a location to your products to see them appear here.'}
        searchPlaceholder={lang === 'fr' ? 'Rechercher un produit...' : 'Search a product...'}
        noResultsLabel={lang === 'fr' ? 'Aucun produit trouvé.' : 'No product found.'} />

      {/* Commandes : d'où part chaque produit et où il est livré */}
      <section className="mt-10" aria-labelledby="orders-map-title">
        <div className="flex items-center gap-2 mb-1">
          <Route size={18} style={{ color: BRAND.violet }} />
          <h2 id="orders-map-title" className="font-black text-xl" style={{ color: txtPrim }}>
            {lang === 'fr' ? 'Commandes et itinéraires' : 'Orders and routes'}
          </h2>
        </div>
        <p className="text-sm mb-5" style={{ color: txtSub }}>
          {lang === 'fr'
            ? "Chaque ligne relie l'emplacement du produit à l'adresse de livraison. Trait plein : trajet déjà parcouru ; pointillés : reste à parcourir."
            : 'Each line links the product location to the delivery address. Solid: distance already covered; dotted: what remains.'}
        </p>
        {routes === null ? (
          <div className="h-[200px] rounded-2xl animate-pulse" style={{ background: surface, border: `1px solid ${border}` }} />
        ) : routes.length === 0 ? (
          <div className="rounded-2xl p-8 text-center" style={{ background: surface, border: `1px dashed ${border}` }}>
            <p className="text-sm" style={{ color: txtSub }}>
              {lang === 'fr' ? "Aucune commande avec une adresse de livraison localisée pour l'instant." : 'No order with a located delivery address yet.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
            <ul className="space-y-2 max-h-[520px] overflow-y-auto pr-1" aria-label={lang === 'fr' ? 'Commandes' : 'Orders'}>
              {routes.map(r => {
                const active = r.id === selectedId;
                const color = ROUTE_COLORS[r.status] ?? BRAND.violet;
                return (
                  <li key={r.id}>
                    <button type="button" onClick={() => setSelectedId(active ? null : r.id)} aria-pressed={active}
                      className="w-full text-left rounded-2xl p-3 flex gap-3 items-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-violet"
                      style={{ background: active ? `${color}14` : surface, border: `1px solid ${active ? color : border}` }}>
                      <span className="w-12 h-12 rounded-xl overflow-hidden shrink-0 flex items-center justify-center" style={{ background: `${color}1f` }}>
                        {r.productImage ? <img src={r.productImage} alt="" loading="lazy" className="w-full h-full object-cover" /> : <MapPin size={16} style={{ color }} />}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-bold truncate" style={{ color: txtPrim }}>{r.productName || (lang === 'fr' ? 'Commande' : 'Order')}</span>
                        <span className="block text-xs truncate" style={{ color: txtSub }}>{r.buyerName}{r.address ? ` · ${r.address}` : ''}</span>
                        <span className="block text-xs font-semibold" style={{ color }}>{statusLabel(r.status)}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <Suspense fallback={<div className="h-[480px] rounded-2xl animate-pulse" style={{ background: surface }} />}>
              <OrdersRouteMap routes={routes} selectedId={selectedId} onSelect={setSelectedId} height={480} lang={lang}
                labels={{ origin: lang === 'fr' ? 'Départ' : 'Start', destination: lang === 'fr' ? 'Livraison' : 'Delivery', current: lang === 'fr' ? 'Position du colis' : 'Parcel position' }} />
            </Suspense>
          </div>
        )}
      </section>
    </div>
  );
}
