import { useCallback } from 'react';
import { useFeedback } from './feedbackContext';
import { countActiveSubscribers } from './api/subscribers';
import { notifySubscribers, type NotifyKind } from './api/notify';

/**
 * Après la création d'un produit ou d'un service, propose au vendeur de prévenir ses abonnés par e-mail.
 * Rien n'est envoyé sans son accord, et rien n'est proposé s'il n'a aucun abonné.
 */
export function useOfferNotify(username: string, lang: string) {
  const { confirm, notify } = useFeedback();
  const fr = lang === 'fr';

  return useCallback(async (kind: Extract<NotifyKind, 'product' | 'service'>, title: string, description: string) => {
    let count = 0;
    try { count = await countActiveSubscribers(); } catch { return; }
    if (count === 0) return;

    const what = kind === 'product' ? (fr ? 'ce nouveau produit' : 'this new product') : (fr ? 'ce nouveau service' : 'this new service');
    const ok = await confirm({
      title: fr ? 'Prévenir vos abonnés ?' : 'Notify your subscribers?',
      message: fr
        ? `${count} abonné${count > 1 ? 's' : ''} ${count > 1 ? 'recevront' : 'recevra'} un e-mail pour leur présenter ${what}.`
        : `${count} subscriber${count > 1 ? 's' : ''} will receive an email about ${what}.`,
      confirmLabel: fr ? 'Envoyer' : 'Send',
      cancelLabel: fr ? 'Pas maintenant' : 'Not now',
      danger: false,
    });
    if (!ok) return;

    const r = await notifySubscribers({ kind, title, body: description.trim().slice(0, 300), path: `/u/${username}` });
    if (r.ok) notify(fr ? `E-mail envoyé à ${r.sent} abonné${r.sent > 1 ? 's' : ''}.` : `Email sent to ${r.sent} subscriber${r.sent > 1 ? 's' : ''}.`, 'success');
    else if (r.error === 'rate_limited') notify(fr ? 'Limite atteinte : 10 envois par 24 h.' : 'Limit reached: 10 sends per 24 h.', 'error');
    else notify(fr ? "L'envoi n'a pas pu être effectué pour le moment." : 'The email could not be sent right now.', 'error');
  }, [confirm, notify, fr, username]);
}