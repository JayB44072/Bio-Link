import { useMemo, useState } from 'react';
import { Product, Profile } from '../../../lib/types';
import SearchField from '../../ui/SearchField';
import { filterByQuery } from '../../../lib/search';
import { PLAN_CONFIGS, canAddProduct, getNextPlan } from '../../../lib/planLimits';
import { useLang } from '../../../lib/LanguageContext';
import { useAppPrefs } from '../../../lib/AppPrefsContext';
import { BRAND, GRADIENTS } from '../../../lib/theme';
import { dashPalette } from '../../../lib/dashPalette';
import EmptyState from '../../ui/EmptyState';
import Modal from '../../ui/Modal';
import { Plus, Trash2, Lock, Package, ArrowUp } from 'lucide-react';
import { useProductForm } from './products/useProductForm';
import ProductCard from './products/ProductCard';
import ProductFormView from './products/ProductFormView';
import AiHintModal from './products/AiHintModal';

interface ProductsProps {
  profile: Profile;
  products: Product[];
  onUpdate: (products: Product[]) => void;
}

export default function Products({ profile, products, onUpdate }: ProductsProps) {
  const { t, lang } = useLang();
  const { isDark: dk } = useAppPrefs();
  const state = useProductForm(profile, products, onUpdate, lang);
  const { surface, surfaceAlt, border, txtPrim, txtSub } = dashPalette(dk);

  const [query, setQuery] = useState('');
  const shown = useMemo(() => filterByQuery(products, query, p => [p.name, p.description, p.category]), [products, query]);

  const plan = profile.plan_type;
  const maxProducts = PLAN_CONFIGS[plan].max_products;
  const canAdd = canAddProduct(plan, products.length);
  const nextPlan = getNextPlan(plan);

  const progressPct = maxProducts ? Math.min((products.length / maxProducts) * 100, 100) : 0;
  const progressColor = !maxProducts ? BRAND.violet
    : products.length >= maxProducts ? '#ef4444'
    : products.length >= maxProducts * 0.8 ? '#f59e0b' : BRAND.violet;

  /* ══════════════════ FORMULAIRE ══════════════════ */
  if (state.view === 'form') {
    return (
      <>
        <ProductFormView state={state} />
        {state.aiHintOpen && <AiHintModal {...state} />}
      </>
    );
  }

  /* ══════════════════ LISTE ══════════════════ */
  return (
    <div>
      {/* En-tête */}
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h2 className="font-black text-xl" style={{ color: txtPrim }}>{t.myProducts}</h2>
          <p className="text-sm mt-0.5" style={{ color: txtSub }}>{t.productsCount(products.length, maxProducts)}</p>
        </div>
        {canAdd ? (
          <button
            onClick={state.openAdd}
            className="flex items-center gap-2 text-white text-sm font-bold px-4 py-2.5 rounded-2xl transition shadow-lg"
            style={{ background: GRADIENTS.brand, boxShadow: '0 8px 20px rgba(108,99,255,0.3)' }}
          >
            <Plus size={16} aria-hidden />{t.addProduct}
          </button>
        ) : (
          <div className="flex items-center gap-1.5 rounded-2xl px-3 py-2.5"
            style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)' }}>
            <Lock size={14} aria-hidden className="text-amber-500" />
            <span className="text-amber-500 text-xs font-semibold">{t.productLimitReached}</span>
          </div>
        )}
      </div>

      {/* Limite atteinte */}
      {!canAdd && nextPlan && (
        <div className="rounded-2xl p-4 mb-6 flex items-center gap-3"
          style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(251,191,36,0.18)' }}>
            <ArrowUp size={18} aria-hidden className="text-amber-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-amber-500">{t.productLimitReached}</p>
            <p className="text-xs" style={{ color: dk ? 'rgba(251,191,36,0.7)' : '#b45309' }}>
              {t.upgradeToAdd(PLAN_CONFIGS[nextPlan].name.fr)}
            </p>
          </div>
        </div>
      )}

      {/* Barre de progression */}
      {maxProducts && (
        <div className="mb-6">
          <div className="flex justify-between text-xs font-medium mb-1.5" style={{ color: txtSub }}>
            <span>{products.length} produits</span>
            <span>{maxProducts} max</span>
          </div>
          <div className="w-full rounded-full h-1.5" style={{ background: surfaceAlt }}
            role="progressbar" aria-valuemin={0} aria-valuemax={maxProducts} aria-valuenow={products.length}>
            <div className="h-1.5 rounded-full transition-all" style={{ width: `${progressPct}%`, background: progressColor }} />
          </div>
        </div>
      )}

      {/* Grille des produits */}
      {products.length > 1 && (
        <SearchField className="mb-5 max-w-md" value={query} onChange={setQuery} palette={{ surfaceAlt, border, txtPrim, txtSub }}
          placeholder={lang === 'fr' ? 'Rechercher un produit…' : 'Search a product…'} label={lang === 'fr' ? 'Rechercher un produit' : 'Search a product'}
          clearLabel={lang === 'fr' ? 'Effacer la recherche' : 'Clear search'} />
      )}
      {products.length === 0 ? (
        <EmptyState icon={Package} iconSize={40} palette={{ surfaceAlt, border, txtSub }} message={t.noProducts} />
      ) : shown.length === 0 ? (
        <EmptyState icon={Package} iconSize={34} iconOpacity={0.35} palette={{ surfaceAlt, border, txtSub }}
          message={lang === 'fr' ? `Aucun produit ne correspond à « ${query.trim()} »` : `No product matches “${query.trim()}”`} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {shown.map(product => (
            <ProductCard key={product.id} product={product} onEdit={state.openEdit} onDelete={state.setDeleteId} />
          ))}
        </div>
      )}

      {/* Confirmation de suppression */}
      {state.deleteId && (
        <Modal onClose={() => state.setDeleteId(null)}>
          <div className="w-full max-w-sm rounded-3xl shadow-2xl p-6 text-center" style={{ background: surface }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: dk ? 'rgba(255,107,157,0.12)' : '#fff1f6' }}>
              <Trash2 size={20} aria-hidden style={{ color: BRAND.pink }} />
            </div>
            <h3 className="font-bold mb-2" style={{ color: txtPrim }}>{t.confirmDelete}</h3>
            <div className="flex gap-3 mt-6">
              <button onClick={() => state.setDeleteId(null)} className="flex-1 text-sm font-semibold py-2.5 rounded-xl transition"
                style={{ background: surfaceAlt, color: txtSub }}>{t.cancel}</button>
              <button onClick={state.handleDelete} disabled={state.saving}
                className="flex-1 text-white text-sm font-bold py-2.5 rounded-xl transition disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#FF6B9D,#e94f85)' }}>
                {state.saving ? '...' : t.deleteProduct}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
