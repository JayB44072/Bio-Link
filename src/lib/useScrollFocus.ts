import { useEffect, type RefObject } from 'react';
import { findScroller } from './useScrollProgress';
import { prefersReducedMotion } from './product3d/env';

/**
 * Position d'un élément par rapport au centre de la zone visible, de -1 (tout en haut) à +1 (tout en bas),
 * 0 quand il est au centre. `reach` règle la distance (en fraction de la hauteur visible) où l'on atteint ±1.
 */
export function focusValue(center: number, viewTop: number, viewHeight: number, reach = 0.6): number {
  if (viewHeight <= 0) return 0;
  const f = (center - (viewTop + viewHeight / 2)) / (viewHeight * reach);
  return Math.max(-1, Math.min(1, f));
}

/**
 * Pose sur chaque élément `[data-focus-item]` du conteneur les variables CSS `--f` (position signée) et `--a`
 * (distance au centre, 0..1) à chaque défilement. Les styles 3D (inclinaison, profondeur, rotation des médaillons)
 * se calculent en CSS à partir de ces deux valeurs : aucun rendu React par image.
 * Sans effet si l'utilisateur préfère moins d'animations.
 */
export function useScrollFocus(containerRef: RefObject<HTMLElement>, enabled = true) {
  useEffect(() => {
    const box = containerRef.current;
    if (!box || !enabled || prefersReducedMotion()) return;
    let raf = 0;

    const update = () => {
      // Le conteneur qui défile est recherché à chaque mesure : au montage, la mise en page n'est pas encore stable
      const scroller = findScroller(box);
      const view = scroller === window
        ? { top: 0, height: window.innerHeight }
        : (() => { const r = (scroller as HTMLElement).getBoundingClientRect(); return { top: r.top, height: r.height }; })();
      box.querySelectorAll<HTMLElement>('[data-focus-item]').forEach(el => {
        const r = el.getBoundingClientRect();
        const f = focusValue(r.top + r.height / 2, view.top, view.height);
        el.style.setProperty('--f', f.toFixed(3));
        el.style.setProperty('--a', Math.abs(f).toFixed(3));
      });
    };
    const onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(update); };

    update();
    // En phase de capture : on entend le défilement de la fenêtre comme celui de n'importe quel conteneur (aperçu du téléphone…)
    window.addEventListener('scroll', onScroll, { capture: true, passive: true });
    window.addEventListener('resize', onScroll);
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(onScroll) : null;
    ro?.observe(box);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll, { capture: true });
      window.removeEventListener('resize', onScroll);
      ro?.disconnect();
    };
  }, [containerRef, enabled]);
}
