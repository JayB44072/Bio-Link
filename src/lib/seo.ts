import { useEffect } from 'react';
import { applySeo, type SeoConfig } from './seoCore';

export * from './seoCore';

/** Applique le SEO d'une page tant qu'elle est affichée. `null` : rien à écrire (données pas encore chargées). */
export function useSeo(cfg: SeoConfig | null) {
  const key = cfg ? JSON.stringify(cfg) : '';
  useEffect(() => {
    if (!cfg) return;
    return applySeo(document, cfg);
    // `cfg` est entièrement décrit par `key`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}
