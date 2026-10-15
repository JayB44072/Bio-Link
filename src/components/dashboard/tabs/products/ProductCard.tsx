import { Edit2, ShoppingBag, Trash2 } from 'lucide-react';
import type { Product } from '../../../../lib/types';
import { BRAND } from '../../../../lib/theme';
import { dashPalette } from '../../../../lib/dashPalette';
import { useLang } from '../../../../lib/LanguageContext';
import { useAppPrefs } from '../../../../lib/AppPrefsContext';

interface ProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
}

/** Carte d'un produit dans la grille de l'onglet Produits. */
export default function ProductCard({ product, onEdit, onDelete }: ProductCardProps) {
  const { t, lang } = useLang();
  const { isDark: dk } = useAppPrefs();
  const { surface, surfaceAlt, border, txtPrim, txtSub } = dashPalette(dk);
  const fr = lang === 'fr';

  return (
    <div className="rounded-3xl overflow-hidden transition-all group hover:-translate-y-1"
      style={{ background: surface, border: `1px solid ${border}`, boxShadow: dk ? 'none' : '0 2px 16px rgba(108,99,255,0.06)' }}>
      {/* Image */}
      <div className="h-40 relative overflow-hidden" style={{ background: surfaceAlt }}>
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag size={32} aria-hidden style={{ color: txtSub }} />
          </div>
        )}
        {product.images?.length > 1 && (
          <span className="absolute bottom-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
            style={{ background: 'rgba(0,0,0,0.5)' }}>
            +{product.images.length - 1}
          </span>
        )}
        <span className="absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded-full"
          style={product.quantity > 0
            ? { background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }
            : { background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
          {product.quantity > 0 ? `${t.inStock} (${product.quantity})` : t.outOfStock}
        </span>
      </div>
      {/* Infos */}
      <div className="p-4">
        <h3 className="font-bold text-sm truncate" style={{ color: txtPrim }}>{product.name}</h3>
        <p className="text-xs mt-0.5 line-clamp-2" style={{ color: txtSub }}>{product.description}</p>
        <div className="flex items-center justify-between mt-3">
          <span className="font-black text-sm" style={{ color: BRAND.violet }}>
            {product.price.toLocaleString()} {product.currency}
          </span>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity">
            <button onClick={() => onEdit(product)}
              aria-label={fr ? `Modifier ${product.name}` : `Edit ${product.name}`}
              className="p-1.5 rounded-lg transition relative after:absolute after:-inset-2 after:content-['']"
              style={{ color: txtSub, background: surfaceAlt }}>
              <Edit2 size={14} aria-hidden />
            </button>
            <button onClick={() => onDelete(product.id)}
              aria-label={fr ? `Supprimer ${product.name}` : `Delete ${product.name}`}
              className="p-1.5 rounded-lg transition relative after:absolute after:-inset-2 after:content-['']"
              style={{ color: BRAND.pink, background: dk ? 'rgba(255,107,157,0.1)' : '#fff1f6' }}>
              <Trash2 size={14} aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
