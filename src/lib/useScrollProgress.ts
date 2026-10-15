import { useEffect, useRef, useState, type RefObject } from 'react';

/** Premier ancêtre qui défile verticalement (ex. le cadre d'aperçu du téléphone), sinon la fenêtre. */
export function findScroller(el: HTMLElement | null): HTMLElement | Window {
  let node = el?.parentElement ?? null;
  while (node && node !== document.body) {
    const oy = getComputedStyle(node).overflowY;
    if ((oy === 'auto' || oy === 'scroll') && node.scrollHeight > node.clientHeight + 1) return node;
    node = node.parentElement;
  }
  return window;
}

interface Options {
  /** Hauteur de l'en-tête collant : la scène se fige juste dessous. */
  stickyOffset?: number;
  /** Appelé (hors rendu React) à chaque changement de progression, valeur 0..1. */
  onProgress?: (p: number) => void;
}

/**
 * Progression (0..1) du défilement à travers une « piste » haute dont la scène est collée (`position: sticky`).
 * La progression est exposée par une ref pour ne pas re-rendre React à chaque image ;
 * `viewportHeight` (en px) permet de dimensionner la scène selon le conteneur réel (fenêtre ou aperçu).
 */
export function useScrollProgress(trackRef: RefObject<HTMLElement>, { stickyOffset = 0, onProgress }: Options = {}) {
  const progress = useRef(0);
  const callback = useRef(onProgress);
  callback.current = onProgress;
  const [viewportHeight, setViewportHeight] = useState(() => (typeof window === 'undefined' ? 700 : window.innerHeight));

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let raf = 0;

    const measure = () => {
      // Le conteneur qui défile est recherché à chaque mesure : au montage, la mise en page n'est pas encore stable
      const scroller = findScroller(track);
      const isWindow = scroller === window;
      const top = isWindow ? 0 : (scroller as HTMLElement).getBoundingClientRect().top;
      const vh = isWindow ? window.innerHeight : (scroller as HTMLElement).clientHeight;
      setViewportHeight(prev => (Math.abs(prev - vh) > 1 ? vh : prev));
      const rect = track.getBoundingClientRect();
      const stage = Math.max(0, vh - stickyOffset);
      const distance = Math.max(1, rect.height - stage);
      const p = Math.min(1, Math.max(0, (top + stickyOffset - rect.top) / distance));
      if (p !== progress.current) {
        progress.current = p;
        callback.current?.(p);
      }
    };
    const onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(measure); };

    measure();
    // En phase de capture : on entend le défilement de la fenêtre comme celui de n'importe quel conteneur
    window.addEventListener('scroll', onScroll, { capture: true, passive: true });
    window.addEventListener('resize', onScroll);
    const ro = new ResizeObserver(onScroll);
    ro.observe(track);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll, { capture: true });
      window.removeEventListener('resize', onScroll);
      ro.disconnect();
    };
  }, [trackRef, stickyOffset]);

  return { progress, viewportHeight };
}
