import { Check, Crown, Box } from 'lucide-react';
import type { ShopThemeConfig } from '../../../../lib/planLimits';

interface ThemeCardProps {
  label: string;
  config: ShopThemeConfig;
  /** Mode d'aperçu : les thèmes « toujours sombres » ignorent le mode clair. */
  dark: boolean;
  selected: boolean;
  current: boolean;
  /** Réservé à un forfait supérieur que l'utilisateur n'a pas. */
  locked: boolean;
  currentLabel: string;
  premiumLabel: string;
  onSelect: () => void;
  /** Couleurs du tableau de bord (texte, bordure, fond de carte). */
  txtPrim: string;
  border: string;
  surface: string;
}

const ACTIVE = '#a855f7';

/** Rayon du mini-aperçu, approchant la forme réelle des cartes produit du thème. */
const radiusPx = (cls: string) => (cls.includes('rounded-3xl') ? 7 : cls.includes('rounded-2xl') ? 6 : cls.includes('rounded-xl') ? 5 : cls.includes('rounded-lg') ? 4 : cls.includes('rounded-full') ? 7 : 1);

/** Mini-boutique dessinée avec les vraies couleurs du thème (titre, héros, cartes produit, bouton). */
function MiniShop({ config, dark }: { config: ShopThemeConfig; dark: boolean }) {
  const useDark = config.inherentlyDark || dark;
  const pick = (d: string, l: string | null) => (l === null ? d : useDark ? d : l);
  const page = pick(config.pageBg, config.pageBgLight);
  const card = pick(config.cardBg, config.cardBgLight);
  const edge = pick(config.cardBorder, config.cardBorderLight);
  const text = pick(config.textColor, config.textColorLight);
  const sub = pick(config.subtextColor, config.subtextColorLight);
  const r = radiusPx(config.cardRadius);
  const round = config.imageRadius === 'rounded-full';
  const hero = config.hero3d;

  return (
    <div className="absolute inset-0 p-2 flex flex-col gap-1.5" style={{ background: page }} aria-hidden="true">
      {/* en-tête */}
      <div className="flex items-center gap-1">
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: config.buttonGradient }} />
        <span className="h-1 w-8 rounded-full" style={{ background: text, opacity: 0.85 }} />
        <span className="ml-auto h-1.5 w-6 rounded-full" style={{ background: edge === 'transparent' ? sub : edge }} />
      </div>

      {/* héros 3D ou titre */}
      {hero ? (
        <div className="relative rounded-md overflow-hidden flex items-center justify-center" style={{ background: hero.stage, height: 30 }}>
          <Box size={15} strokeWidth={2} style={{ color: hero.accent }} />
          <span className="absolute left-1.5 top-1 h-0.5 w-6 rounded-full" style={{ background: hero.ink, opacity: 0.8 }} />
          <span className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
            {[0, 1, 2, 3].map(i => <span key={i} className="h-0.5 rounded-full" style={{ width: i === 1 ? 7 : 3, background: hero.accent, opacity: i === 1 ? 1 : 0.5 }} />)}
          </span>
        </div>
      ) : (
        <div className="flex flex-col gap-0.5">
          <span className="h-1 w-14 rounded-full" style={{ background: text }} />
          <span className="h-0.5 w-9 rounded-full" style={{ background: sub, opacity: 0.8 }} />
        </div>
      )}

      {/* cartes produit */}
      <div className="grid grid-cols-3 gap-1 flex-1 min-h-0">
        {[0, 1, 2].map(i => (
          <div key={i} className="flex flex-col p-0.5 gap-0.5" style={{ background: card, border: `1px solid ${edge}`, borderRadius: r, boxShadow: config.cardShadow && config.cardShadow !== 'none' ? '0 2px 6px rgba(0,0,0,0.18)' : undefined }}>
            <span className="flex-1 min-h-[8px]" style={{ background: sub, opacity: 0.28, borderRadius: round ? 999 : Math.max(1, r - 2) }} />
            <span className="h-0.5 w-2/3 rounded-full" style={{ background: config.priceColor }} />
            <span className="h-1 rounded-full" style={{ background: config.buttonGradient }} />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Carte de choix de thème : aperçu fidèle, nom, état (choisi / actuel / premium) lisible sans la couleur. */
export default function ThemeCard({ label, config, dark, selected, current, locked, currentLabel, premiumLabel, onSelect, txtPrim, border, surface }: ThemeCardProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className="group text-left rounded-xl p-1.5 transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#a855f7]"
      style={{
        background: surface,
        border: `2px solid ${selected ? ACTIVE : border}`,
        boxShadow: selected ? '0 4px 14px rgba(168,85,247,0.28)' : 'none',
      }}
    >
      <span className="relative block w-full overflow-hidden rounded-lg" style={{ aspectRatio: '2 / 1' }}>
        <MiniShop config={config} dark={dark} />
        {locked && (
          <span className="absolute top-1 left-1 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full shadow"
            style={{ background: 'linear-gradient(135deg,#f59e0b,#f97316)' }}>
            <Crown size={9} className="text-white" strokeWidth={2.5} />
            <span className="text-[8px] font-black text-white uppercase tracking-wider">{premiumLabel}</span>
          </span>
        )}
        {selected && (
          <span className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center shadow" style={{ background: ACTIVE }}>
            <Check size={12} className="text-white" strokeWidth={3} />
          </span>
        )}
      </span>
      <span className="flex items-center justify-between gap-1 px-0.5 pt-1.5 pb-0.5">
        <span className="text-xs font-semibold truncate" style={{ color: selected ? ACTIVE : txtPrim }}>{label}</span>
        {current && (
          <span className="shrink-0 text-[9px] font-black px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(168,85,247,0.15)', color: ACTIVE }}>
            {currentLabel}
          </span>
        )}
      </span>
    </button>
  );
}
