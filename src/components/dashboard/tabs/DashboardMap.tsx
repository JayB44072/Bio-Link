import React from 'react';
import { Profile, Product } from '../../../lib/types';
import { PLAN_CONFIGS } from '../../../lib/planLimits';
import { useLang } from '../../../lib/LanguageContext';
import { useAppPrefs } from '../../../lib/AppPrefsContext';
import ProductsMap from '../../ui/ProductsMap';
import { Lock, TrendingUp, MapPin } from 'lucide-react';

interface DashboardMapProps {
  profile: Profile;
  products: Product[];
}

export default function DashboardMap({ profile, products }: DashboardMapProps) {
  const { lang } = useLang();
  const { isDark: dk } = useAppPrefs();
  const hasAccess = PLAN_CONFIGS[profile.plan_type].map_access;

  const surface = dk ? '#12122b' : '#ffffff';
  const border  = dk ? 'rgba(139,124,255,0.16)' : '#eeebfb';
  const txtPrim = dk ? '#f2f1ff' : '#16162e';
  const txtSub  = dk ? '#8c8ab0' : '#8a87a3';

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
        <MapPin size={18} style={{ color: '#6C63FF' }} />
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
    </div>
  );
}
