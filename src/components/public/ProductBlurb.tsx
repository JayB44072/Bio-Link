import { useMemo } from 'react';
import { ArrowRight } from 'lucide-react';
import { wavyLinePath } from '../../lib/waveLayout';

interface ProductBlurbProps {
  /** Description du produit (peut être vide). */
  text: string;
  /** Texte de remplacement quand il n'y a pas de description. */
  fallback: string;
  /** Couleur du texte (secondaire du thème) et d'accent (filet, indice). */
  color: string;
  accent: string;
  align?: 'left' | 'center';
  /** Libellé de l'indice « voir plus » (la carte entière ouvre la fiche). */
  moreLabel: string;
}

/**
 * Description d'un produit dans une carte : filet sinusoïdal aux couleurs du thème, texte lisible sur trois lignes
 * (hauteur constante pour aligner les cartes) et indice « voir plus » quand le texte est tronqué.
 */
export default function ProductBlurb({ text, fallback, color, accent, align = 'left', moreLabel }: ProductBlurbProps) {
  const wave = useMemo(() => wavyLinePath(64, 3, 3), []);
  const content = text.trim() || fallback;
  const long = text.trim().length > 110;
  const center = align === 'center';

  return (
    <div className={`mt-2 ${center ? 'flex flex-col items-center text-center' : ''}`}>
      <svg width="64" height="8" viewBox="0 0 64 8" aria-hidden="true" className="block mb-1.5">
        <path d={wave} fill="none" stroke={accent} strokeWidth="1.6" strokeLinecap="round" opacity="0.75" />
      </svg>
      <p className="text-xs leading-relaxed line-clamp-3 min-h-[3.6em]" style={{ color, opacity: text.trim() ? 1 : 0.7 }}>{content}</p>
      {long && (
        <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold" style={{ color: accent }} aria-hidden="true">
          {moreLabel}<ArrowRight size={11} />
        </span>
      )}
    </div>
  );
}
