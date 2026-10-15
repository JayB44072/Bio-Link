import { BRAND } from '../../lib/theme';

/** Anneau de chargement aux couleurs de la marque. */
export function Spinner({ className = '' }: { className?: string }) {
  return (
    <div role="status" aria-label="Loading"
      className={`w-6 h-6 rounded-full animate-spin ${className}`}
      style={{ border: '2px solid rgba(108,99,255,0.15)', borderTopColor: BRAND.violet }} />
  );
}

/** Petit anneau blanc, à placer dans un bouton coloré pendant un envoi. */
export function ButtonSpinner({ className = '' }: { className?: string }) {
  return <div aria-hidden className={`w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin ${className}`} />;
}

/** Anneau centré, pour les zones qui chargent leur contenu. `className` règle l'espacement vertical. */
export function CenteredSpinner({ className = 'py-16' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Spinner />
    </div>
  );
}
