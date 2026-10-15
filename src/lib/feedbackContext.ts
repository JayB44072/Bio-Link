import { createContext, useContext } from 'react';

export type ToastKind = 'success' | 'error' | 'info';

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Mettre à `false` pour une confirmation non destructrice (bouton violet au lieu de rose). */
  danger?: boolean;
}

export interface Feedback {
  /** Affiche un message court qui disparaît seul (remplace `alert`). */
  notify: (message: string, kind?: ToastKind) => void;
  /** Demande une confirmation et renvoie le choix (remplace `confirm`). */
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

/** Sans fournisseur (tests, écrans isolés), on retombe sur les boîtes du navigateur. */
const FALLBACK: Feedback = {
  notify: message => { window.alert(message); },
  confirm: async ({ message }) => window.confirm(message),
};

export const FeedbackContext = createContext<Feedback>(FALLBACK);

export function useFeedback(): Feedback {
  return useContext(FeedbackContext);
}
