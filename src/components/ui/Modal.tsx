import React, { useEffect, useRef } from 'react';

interface ModalProps {
  children: React.ReactNode;
  /** Fermeture (touche Échap, et clic sur le fond si `closeOnBackdrop`). */
  onClose?: () => void;
  /** Opacité du voile noir : 50 (défaut) ou 60. */
  dim?: 50 | 60;
  /** Fermer en cliquant à côté de la fenêtre. Désactivé par défaut pour ne pas perdre une saisie. */
  closeOnBackdrop?: boolean;
  /** Id de l'élément qui titre la fenêtre (accessibilité). */
  labelledBy?: string;
}

const FOCUSABLE = 'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

/** Élément affiché (ni `display: none` ni `visibility: hidden`). */
const isVisible = (el: HTMLElement) => {
  const s = window.getComputedStyle(el);
  return s.display !== 'none' && s.visibility !== 'hidden';
};

/**
 * Habillage commun des fenêtres modales : voile, centrage, rôle « dialog »,
 * fermeture à la touche Échap, focus piégé dans la fenêtre puis rendu à l'élément d'origine.
 */
export default function Modal({ children, onClose, dim = 50, closeOnBackdrop = false, labelledBy }: ModalProps) {
  const ref = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const previous = document.activeElement as HTMLElement | null;

    // Focus initial : premier élément interactif, sinon la fenêtre elle-même
    const first = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).find(isVisible);
    (first ?? root).focus({ preventScroll: true });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onCloseRef.current) {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab') return;
      const items = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(isVisible);
      if (items.length === 0) { e.preventDefault(); root.focus(); return; }
      const firstEl = items[0];
      const lastEl = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === firstEl || active === root)) { e.preventDefault(); lastEl.focus(); }
      else if (!e.shiftKey && active === lastEl) { e.preventDefault(); firstEl.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      previous?.focus?.({ preventScroll: true });
    };
  }, []);

  const voile = dim === 60 ? 'bg-black/60' : 'bg-black/50';
  return (
    <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={labelledBy} tabIndex={-1}
      className={`fixed inset-0 ${voile} backdrop-blur-sm z-50 flex items-center justify-center p-4 outline-none`}
      onMouseDown={closeOnBackdrop && onClose ? e => { if (e.target === e.currentTarget) onClose(); } : undefined}>
      {children}
    </div>
  );
}
