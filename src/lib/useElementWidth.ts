import { useEffect, useState, type RefObject } from 'react';

/** Largeur d'un élément, suivie à chaque redimensionnement (800 tant qu'elle est inconnue). */
export function useElementWidth(ref: RefObject<HTMLElement>, initial = 800): number {
  const [width, setWidth] = useState(initial);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const read = () => { const w = el.getBoundingClientRect().width; if (w > 0) setWidth(Math.round(w)); };
    read();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return width;
}
