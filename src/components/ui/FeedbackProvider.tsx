import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { BRAND } from '../../lib/theme';
import { dashPalette } from '../../lib/dashPalette';
import { useAppPrefs } from '../../lib/AppPrefsContext';
import type { LandingLang } from '../../lib/landingTranslations';
import { FeedbackContext, type ConfirmOptions, type Feedback, type ToastKind } from '../../lib/feedbackContext';
import Modal from './Modal';

const LABELS: Record<LandingLang, { confirm: string; cancel: string; close: string }> = {
  fr: { confirm: 'Confirmer', cancel: 'Annuler', close: 'Fermer' },
  en: { confirm: 'Confirm', cancel: 'Cancel', close: 'Close' },
  pt: { confirm: 'Confirmar', cancel: 'Cancelar', close: 'Fechar' },
  de: { confirm: 'Bestätigen', cancel: 'Abbrechen', close: 'Schließen' },
};

interface Toast { id: number; message: string; kind: ToastKind }
interface PendingConfirm extends ConfirmOptions { resolve: (ok: boolean) => void }

const TOAST_MS = 4500;
const KIND_STYLE: Record<ToastKind, { color: string; Icon: typeof Info }> = {
  success: { color: '#16a34a', Icon: CheckCircle2 },
  error:   { color: '#dc2626', Icon: AlertCircle },
  info:    { color: BRAND.violet, Icon: Info },
};

/**
 * Messages et confirmations du tableau de bord : remplace les `alert` / `confirm`
 * du navigateur par des éléments aux couleurs de l'application, accessibles au clavier.
 */
export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const { isDark: dk, lang } = useAppPrefs();
  const labels = LABELS[lang] ?? LABELS.fr;
  const { surface, border, txtPrim, txtSub, surfaceAlt } = dashPalette(dk);

  const [toasts, setToasts] = useState<Toast[]>([]);
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  const nextId = useRef(1);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    const t = timers.current.get(id);
    if (t) { clearTimeout(t); timers.current.delete(id); }
    setToasts(list => list.filter(x => x.id !== id));
  }, []);

  const notify = useCallback((message: string, kind: ToastKind = 'info') => {
    const id = nextId.current++;
    setToasts(list => [...list.slice(-3), { id, message, kind }]);
    timers.current.set(id, setTimeout(() => dismiss(id), TOAST_MS));
  }, [dismiss]);

  const confirm = useCallback((options: ConfirmOptions) =>
    new Promise<boolean>(resolve => setPending({ ...options, resolve })), []);

  const answer = (ok: boolean) => {
    pending?.resolve(ok);
    setPending(null);
  };

  useEffect(() => {
    const map = timers.current;
    return () => { map.forEach(clearTimeout); map.clear(); };
  }, []);

  const value = useMemo<Feedback>(() => ({ notify, confirm }), [notify, confirm]);

  return (
    <FeedbackContext.Provider value={value}>
      {children}

      {/* Messages */}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4">
        {toasts.map(({ id, message, kind }) => {
          const { color, Icon } = KIND_STYLE[kind];
          return (
            <div key={id} role={kind === 'error' ? 'alert' : 'status'}
              className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl px-4 py-3 shadow-xl animate-fade-in"
              style={{ background: surface, border: `1px solid ${border}`, boxShadow: '0 12px 32px rgba(0,0,0,0.18)' }}>
              <Icon size={18} aria-hidden className="mt-0.5 shrink-0" style={{ color }} />
              <p className="flex-1 text-sm font-medium" style={{ color: txtPrim }}>{message}</p>
              <button type="button" onClick={() => dismiss(id)} aria-label={labels.close}
                className="-mr-1 grid h-6 w-6 shrink-0 place-items-center rounded-lg" style={{ color: txtSub }}>
                <X size={14} aria-hidden />
              </button>
            </div>
          );
        })}
      </div>

      {/* Confirmation */}
      {pending && (
        <Modal onClose={() => answer(false)} labelledBy="feedback-confirm-title">
          <div className="w-full max-w-sm rounded-3xl p-6 text-center shadow-2xl" style={{ background: surface, border: `1px solid ${border}` }}>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full"
              style={{ background: dk ? 'rgba(255,107,157,0.12)' : '#fff1f6' }}>
              <AlertTriangle size={20} aria-hidden style={{ color: pending.danger === false ? BRAND.violet : BRAND.pink }} />
            </div>
            {pending.title && <h3 id="feedback-confirm-title" className="mb-2 font-bold" style={{ color: txtPrim }}>{pending.title}</h3>}
            <p className="mb-5 text-sm leading-relaxed" style={{ color: txtSub }}>{pending.message}</p>
            <div className="flex gap-3">
              <button type="button" onClick={() => answer(false)}
                className="flex-1 rounded-xl py-2.5 text-sm font-semibold"
                style={{ background: surfaceAlt, color: txtSub, border: `1px solid ${border}` }}>
                {pending.cancelLabel ?? labels.cancel}
              </button>
              <button type="button" onClick={() => answer(true)}
                className="flex-1 rounded-xl py-2.5 text-sm font-bold text-white"
                style={{ background: pending.danger === false ? BRAND.violet : BRAND.pink }}>
                {pending.confirmLabel ?? labels.confirm}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </FeedbackContext.Provider>
  );
}
