import { useEffect, useMemo, useState } from 'react';
import { appOrigin } from '../../../lib/appOrigin';
import { BellRing, Download, Mail, Search, Send, Trash2, UserCheck, UserMinus, Users, X } from 'lucide-react';
import type { Profile } from '../../../lib/types';
import { useLang } from '../../../lib/LanguageContext';
import { useAppPrefs } from '../../../lib/AppPrefsContext';
import { useFeedback } from '../../../lib/feedbackContext';
import { dashPalette } from '../../../lib/dashPalette';
import { BRAND, GRADIENTS, STATUS } from '../../../lib/theme';
import { deleteSubscriber, listSubscribers, subscribersToCsv, type Subscriber } from '../../../lib/api/subscribers';
import { notifySubscribers } from '../../../lib/api/notify';
import StatTile from '../../ui/StatTile';
import { filterByQuery } from '../../../lib/search';
import EmptyState from '../../ui/EmptyState';
import { ButtonSpinner, CenteredSpinner } from '../../ui/Spinner';

interface SubscribersProps {
  profile: Profile;
}

const WEEK = 7 * 24 * 3600 * 1000;

/** Abonnés de la page publique : qui suit la boutique, export, et message libre à tous les abonnés. */
export default function Subscribers({ profile }: SubscribersProps) {
  const { lang } = useLang();
  const fr = lang === 'fr';
  const { isDark: dk } = useAppPrefs();
  const { notify, confirm } = useFeedback();
  const { surface, surfaceAlt, border, txtPrim, txtSub, inputBg, inputBorder, cardShadow } = dashPalette(dk);

  const [subs, setSubs] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let alive = true;
    listSubscribers().then(list => { if (alive) { setSubs(list); setLoading(false); } }).catch(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const active = useMemo(() => subs.filter(s => !s.unsubscribed_at), [subs]);
  const recent = active.filter(s => Date.now() - new Date(s.created_at).getTime() < WEEK).length;
  const shown = useMemo(() => {
    return filterByQuery(subs, query, s => [s.email]);
  }, [subs, query]);

  const palette = { surface, border, txtPrim, txtSub, shadow: cardShadow };
  const publicUrl = `${appOrigin()}/u/${profile.username}`;

  function exportCsv() {
    const blob = new Blob([subscribersToCsv(subs)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `abonnes-${profile.username}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function remove(sub: Subscriber) {
    const ok = await confirm({
      title: fr ? 'Retirer cet abonné ?' : 'Remove this subscriber?',
      message: fr ? `${sub.email} ne recevra plus vos e-mails. La personne pourra se réabonner.` : `${sub.email} will no longer receive your emails. They can subscribe again.`,
      confirmLabel: fr ? 'Retirer' : 'Remove', cancelLabel: fr ? 'Garder' : 'Keep', danger: true,
    });
    if (!ok) return;
    const { error } = await deleteSubscriber(sub.id);
    if (error) { notify(fr ? "La suppression a échoué." : 'Removal failed.', 'error'); return; }
    setSubs(prev => prev.filter(s => s.id !== sub.id));
  }

  async function send() {
    const ok = await confirm({
      title: fr ? 'Envoyer ce message ?' : 'Send this message?',
      message: fr ? `Il sera envoyé par e-mail à ${active.length} abonné${active.length > 1 ? 's' : ''}. Cette action est définitive.` : `It will be emailed to ${active.length} subscriber${active.length > 1 ? 's' : ''}. This cannot be undone.`,
      confirmLabel: fr ? 'Envoyer' : 'Send', cancelLabel: fr ? 'Annuler' : 'Cancel', danger: false,
    });
    if (!ok) return;
    setSending(true);
    const r = await notifySubscribers({ kind: 'custom', title: title.trim(), body: body.trim() });
    setSending(false);
    if (r.ok) {
      notify(fr ? `Message envoyé à ${r.sent} abonné${r.sent > 1 ? 's' : ''}.` : `Message sent to ${r.sent} subscriber${r.sent > 1 ? 's' : ''}.`, 'success');
      setTitle(''); setBody('');
    } else if (r.error === 'rate_limited') notify(fr ? 'Limite atteinte : 10 envois par 24 h.' : 'Limit reached: 10 sends per 24 h.', 'error');
    else if (r.error === 'no_subscribers') notify(fr ? "Vous n'avez aucun abonné actif." : 'You have no active subscribers.', 'error');
    else notify(fr ? "L'envoi d'e-mails n'est pas encore activé sur votre compte (fonction serveur à déployer)." : 'Email sending is not enabled yet (server function to deploy).', 'error');
  }

  const field = { background: inputBg, border: `1px solid ${inputBorder}`, color: txtPrim } as const;

  return (
    <div>
      <div className="mb-5">
        <h2 className="font-black text-2xl flex items-center gap-2" style={{ color: txtPrim }}>
          <BellRing size={22} aria-hidden style={{ color: BRAND.cyan }} />{fr ? 'Mes abonnés' : 'My subscribers'}
        </h2>
        <p className="text-sm mt-0.5" style={{ color: txtSub }}>
          {fr ? 'Les visiteurs qui ont laissé leur e-mail sur votre page publique pour suivre vos nouveautés.' : 'Visitors who left their email on your public page to follow your news.'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <StatTile icon={Users} tone={BRAND.violet} palette={palette} label={fr ? 'Abonnés actifs' : 'Active subscribers'} value={active.length} />
        <StatTile icon={UserCheck} tone={STATUS.success} palette={palette} label={fr ? 'Nouveaux (7 jours)' : 'New (7 days)'} value={recent} />
        <StatTile icon={UserMinus} tone={STATUS.warning} palette={palette} label={fr ? 'Désabonnés' : 'Unsubscribed'} value={subs.length - active.length} />
      </div>

      {/* Message libre */}
      <section className="rounded-3xl p-5 mb-5" style={{ background: surface, border: `1px solid ${border}`, boxShadow: cardShadow }} aria-labelledby="subs-compose">
        <h3 id="subs-compose" className="font-bold text-base flex items-center gap-2 mb-1" style={{ color: txtPrim }}>
          <Mail size={17} aria-hidden style={{ color: BRAND.pink }} />{fr ? 'Écrire à mes abonnés' : 'Write to my subscribers'}
        </h3>
        <p className="text-xs mb-3.5" style={{ color: txtSub }}>
          {fr ? 'Une promotion, une nouveauté, une annonce… Chaque e-mail contient un lien de désabonnement. 10 envois maximum par 24 h.' : 'A promotion, news, an announcement… Every email has an unsubscribe link. 10 sends per 24 h maximum.'}
        </p>
        <div className="grid gap-3">
          <input value={title} onChange={e => setTitle(e.target.value)} maxLength={140} aria-label={fr ? "Objet du message" : 'Message subject'}
            placeholder={fr ? 'Objet (ex. Nouvelle collection disponible)' : 'Subject (e.g. New collection available)'}
            className="w-full h-11 px-3.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#6C63FF]/40" style={field} />
          <textarea value={body} onChange={e => setBody(e.target.value)} maxLength={1000} rows={3} aria-label={fr ? 'Message' : 'Message'}
            placeholder={fr ? 'Votre message (optionnel)' : 'Your message (optional)'}
            className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none resize-none focus:ring-2 focus:ring-[#6C63FF]/40" style={field} />
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <span className="text-xs" style={{ color: txtSub }}>{body.length}/1000</span>
            <button type="button" onClick={() => void send()} disabled={sending || title.trim().length === 0 || active.length === 0}
              className="inline-flex items-center gap-2 h-11 px-5 rounded-full text-sm font-bold text-white disabled:opacity-50 transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#6C63FF]/40"
              style={{ background: GRADIENTS.pinkViolet, boxShadow: '0 8px 20px rgba(255,107,157,0.25)' }}>
              {sending ? <ButtonSpinner /> : <Send size={15} aria-hidden />}
              {fr ? `Envoyer à ${active.length} abonné${active.length > 1 ? 's' : ''}` : `Send to ${active.length} subscriber${active.length > 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      </section>

      {/* Liste */}
      <div className="flex flex-wrap items-center gap-2.5 mb-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} aria-hidden className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: txtSub }} />
          <input type="search" value={query} onChange={e => setQuery(e.target.value)} aria-label={fr ? 'Rechercher un abonné' : 'Search a subscriber'}
            placeholder={fr ? 'Rechercher un e-mail…' : 'Search an email…'}
            className="w-full h-11 pl-10 pr-10 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#6C63FF]/40" style={field} />
          {query && (
            <button type="button" onClick={() => setQuery('')} aria-label={fr ? 'Effacer la recherche' : 'Clear search'}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center" style={{ color: txtSub }}><X size={15} aria-hidden /></button>
          )}
        </div>
        <button type="button" onClick={exportCsv} disabled={active.length === 0}
          className="inline-flex items-center gap-2 h-11 px-4 rounded-xl text-sm font-bold disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C63FF]"
          style={{ background: surface, border: `1px solid ${border}`, color: txtPrim }}>
          <Download size={15} aria-hidden />{fr ? 'Exporter (CSV)' : 'Export (CSV)'}
        </button>
      </div>

      {loading ? (
        <CenteredSpinner className="py-12" />
      ) : subs.length === 0 ? (
        <EmptyState icon={BellRing} iconSize={38} iconOpacity={0.35} palette={{ surfaceAlt, border, txtSub }}
          message={fr ? "Aucun abonné pour l'instant. Partagez votre page : le formulaire « Suivez ma boutique » est en bas de la page." : 'No subscribers yet. Share your page: the “Follow my shop” form is at the bottom of it.'}>
          <button type="button" onClick={() => { void navigator.clipboard?.writeText(publicUrl).then(() => notify(fr ? 'Lien copié.' : 'Link copied.', 'success')); }}
            className="mt-3 text-sm font-semibold underline underline-offset-2" style={{ color: BRAND.violet }}>{fr ? 'Copier le lien de ma page' : 'Copy my page link'}</button>
        </EmptyState>
      ) : shown.length === 0 ? (
        <EmptyState icon={Search} iconSize={34} iconOpacity={0.35} palette={{ surfaceAlt, border, txtSub }} message={fr ? `Aucun abonné ne correspond à « ${query} »` : `No subscriber matches “${query}”`} />
      ) : (
        <ul className="space-y-2">
          {shown.map(s => {
            const gone = !!s.unsubscribed_at;
            return (
              <li key={s.id} className="flex items-center gap-3 rounded-2xl px-4 py-3" style={{ background: surface, border: `1px solid ${border}`, opacity: gone ? 0.65 : 1 }}>
                <span className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-black text-white" style={{ background: gone ? '#9ca3af' : GRADIENTS.brand }} aria-hidden>
                  {s.email[0]?.toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold truncate" style={{ color: txtPrim }}>{s.email}</p>
                  <p className="text-xs" style={{ color: txtSub }}>
                    {fr ? 'Abonné le' : 'Subscribed'} {new Date(s.created_at).toLocaleDateString(fr ? 'fr-FR' : 'en-US', { dateStyle: 'medium' })}
                    {gone && <span className="ml-2 font-semibold">· {fr ? 'Désabonné' : 'Unsubscribed'}</span>}
                  </p>
                </div>
                <button type="button" onClick={() => void remove(s)} aria-label={`${fr ? 'Retirer' : 'Remove'} ${s.email}`}
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B9D]"
                  style={{ color: BRAND.pink, background: dk ? 'rgba(255,107,157,0.1)' : '#fff1f6' }}>
                  <Trash2 size={16} aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
