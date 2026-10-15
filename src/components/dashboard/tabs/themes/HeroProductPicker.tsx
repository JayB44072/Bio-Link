import { useEffect, useMemo, useState } from 'react';
import { Wand2 } from 'lucide-react';
import { CATEGORIES, MODELS, getModel, guessModelId } from '../../../../lib/product3d/catalog';
import type { CategoryId } from '../../../../lib/product3d/types';
import { parseModelToken } from '../../../../lib/product3d/modelToken';
import HeroPhotoPanel from './HeroPhotoPanel';
import { dashPalette } from '../../../../lib/dashPalette';

interface HeroProductPickerProps {
  /** Modèle choisi (null = automatique, deviné d'après les produits de la boutique). */
  value: string | null;
  /** Textes (noms, catégories des produits) servant à deviner le modèle de l'option « Auto ». */
  hints: string[];
  accent: string;
  /** Propriétaire des photos (dossier de stockage) et photos de ses produits. */
  ownerId: string;
  productImages: string[];
  lang: string;
  dark: boolean;
  onChange: (modelId: string | null) => void;
}

const ACTIVE = '#a855f7';

/** Choix du produit 3D affiché dans le héros de la boutique, avec vignettes. */
export default function HeroProductPicker({ value, hints, accent, ownerId, productImages, lang, dark, onChange }: HeroProductPickerProps) {
  const fr = lang === 'fr';
  const l = fr ? 'fr' : 'en';
  const { surface, border, txtPrim, txtSub, txtLabel } = dashPalette(dark);
  const autoModelId = useMemo(() => guessModelId(...hints), [hints]);
  const token = parseModelToken(value);
  const selectedBase = token.base;
  const initialCategory = (getModel(selectedBase ?? autoModelId)?.category ?? 'footwear') as CategoryId;
  const [category, setCategory] = useState<CategoryId>(initialCategory);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});

  const list = useMemo(() => MODELS.filter(m => m.category === category), [category]);

  // Vignettes calculées à la demande, une catégorie à la fois (three.js chargé à ce moment-là)
  useEffect(() => {
    const missing = list.filter(m => !thumbs[`${accent}|${m.id}`]);
    if (missing.length === 0) return;
    let cancelled = false;
    import('../../../../lib/product3d/snapshots').then(({ renderModelSnapshots }) => {
      if (cancelled) return;
      const done = renderModelSnapshots(missing, { width: 200, height: 200, accent });
      setThumbs(prev => {
        const next = { ...prev };
        for (const [id, url] of Object.entries(done)) next[`${accent}|${id}`] = url;
        return next;
      });
    }).catch(() => { /* vignettes facultatives */ });
    return () => { cancelled = true; };
    // `thumbs` volontairement exclu : on ne recalcule que les vignettes manquantes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list, accent]);

  const autoName = getModel(autoModelId)?.name[l];

  const baseDef = getModel(selectedBase ?? autoModelId);
  const textureBase = baseDef?.photo ? baseDef.id : null;

  return (
    <div className="space-y-4">
      <HeroPhotoPanel
        ownerId={ownerId}
        value={value}
        textureBase={textureBase}
        textureName={baseDef?.name[l] ?? null}
        productImages={productImages}
        lang={lang}
        dark={dark}
        palette={{ surface, border, txtPrim, txtSub }}
        onApply={onChange}
      />
    <div className="rounded-2xl p-4 md:p-5" style={{ background: surface, border: `1px solid ${border}` }}>
      <div className="flex items-start justify-between gap-3 mb-1">
        <div>
          <h3 className="text-sm font-bold" style={{ color: txtPrim }}>
            {fr ? 'Produit du héros 3D' : '3D hero product'}
          </h3>
          <p className="text-xs mt-0.5" style={{ color: txtSub }}>
            {fr
              ? 'Ce produit se décompose en ses pièces en haut de votre boutique.'
              : 'This product breaks down into its parts at the top of your shop.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-pressed={value === null}
          className="shrink-0 flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition"
          style={value === null
            ? { background: ACTIVE, color: '#fff' }
            : { background: 'transparent', color: txtLabel, border: `1px solid ${border}` }}
        >
          <Wand2 size={12} />
          {fr ? 'Auto' : 'Auto'}{value === null && autoName ? ` · ${autoName}` : ''}
        </button>
      </div>

      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide py-3" role="tablist" aria-label={fr ? 'Catégories' : 'Categories'}>
        {CATEGORIES.map(c => {
          const on = c.id === category;
          return (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setCategory(c.id)}
              className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full transition"
              style={on
                ? { background: 'rgba(168,85,247,0.15)', color: ACTIVE, border: `1px solid ${ACTIVE}` }
                : { background: 'transparent', color: txtSub, border: `1px solid ${border}` }}
            >
              {c.name[l]}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-72 overflow-y-auto pr-0.5" role="listbox" aria-label={fr ? 'Produits 3D' : '3D products'}>
        {list.map(m => {
          const on = selectedBase === m.id;
          const src = thumbs[`${accent}|${m.id}`];
          return (
            <button
              key={m.id}
              type="button"
              role="option"
              aria-selected={on}
              onClick={() => onChange(m.id)}
              className="rounded-xl p-1.5 flex flex-col items-center transition hover:-translate-y-0.5"
              style={{
                border: `2px solid ${on ? ACTIVE : border}`,
                background: dark ? 'rgba(255,255,255,0.03)' : '#faf9ff',
              }}
            >
              <span className="w-full aspect-square flex items-center justify-center">
                {src
                  ? <img src={src} alt="" className="w-full h-full object-contain" draggable={false} />
                  : <span className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(168,85,247,0.25)', borderTopColor: ACTIVE }} />}
              </span>
              <span className="text-[10px] font-semibold text-center leading-tight mt-1 line-clamp-2" style={{ color: on ? ACTIVE : txtPrim }}>
                {m.name[l]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
    </div>
  );
}
