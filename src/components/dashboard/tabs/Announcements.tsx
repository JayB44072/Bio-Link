import { useEffect, useState } from 'react';
import { Megaphone, PaperPlaneTilt, EnvelopeSimple, ClockCounterClockwise } from '@phosphor-icons/react';
import { useAppPrefs } from '../../../lib/AppPrefsContext';
import { useFeedback } from '../../../lib/feedbackContext';
import { dashPalette } from '../../../lib/dashPalette';
import { BRAND, GRADIENTS } from '../../../lib/theme';
import { ButtonSpinner } from '../../ui/Spinner';
import {
  listAnnouncements, sendAnnouncement, validateAnnouncement,
  type AnnounceError, type AnnouncementDraft, type SentAnnouncement,
} from '../../../lib/api/platformEmails';

const ERRORS: Record<AnnounceError, string> = {
  unavailable: "L'envoi n'est pas disponible : la fonction « platform-emails » n'est pas déployée ou mal configurée.",
  forbidden: "Votre adresse ne figure pas dans la liste des administrateurs (secret ADMIN_EMAILS).",
  rate_limited: 'Limite atteinte : 3 annonces maximum par 24 h.',
  no_recipients: 'Aucun destinataire pour le moment.',
  invalid: 'Le message est incomplet ou invalide.',
  failed: "L'envoi a échoué côté service d'e-mails. Réessayez plus tard.",
};

const EMPTY: AnnouncementDraft = { title: '', body: '', cta_label: '', cta_path: '/' };

/** Annonces aux vendeurs (nouvelles fonctionnalités…). Réservé aux administrateurs ; le serveur revérifie. */
export default function Announcements() {
  const { isDark: dk } = useAppPrefs();
  const { notify, confirm } = useFeedback();
  const { surface, border, txtPrim, txtSub, inputBg, inputBorder, cardShadow } = dashPalette(dk);

  const [draft, setDraft] = useState<AnnouncementDraft>(EMPTY);
  const [busy, setBusy] = useState<'test' | 'all' | null>(null);
  const [history, setHistory] = useState<SentAnnouncement[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { void listAnnouncements().then(setHistory); }, []);

  const field = { background: inputBg, border: `1px solid ${inputBorder}`, color: txtPrim };
  const set = (k: keyof AnnouncementDraft) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft(d => ({ ...d, [k]: e.target.value }));

  async function send(test: boolean) {
    const invalid = validateAnnouncement(draft);
    if (invalid) { setError(invalid); return; }
    if (!test && !(await confirm({ title: 'Envoyer à tous les vendeurs ?', message: 'Cette annonce sera envoyée par e-mail à tous les vendeurs inscrits. Cette action est définitive.', confirmLabel: 'Envoyer', danger: false }))) return;
    setError(null);
    setBusy(test ? 'test' : 'all');
    const r = await sendAnnouncement(draft, test);
    setBusy(null);
    if (!r.ok) { setError(ERRORS[r.error]); return; }
    notify(test ? 'E-mail de test envoyé à votre adresse.' : `Annonce envoyée à ${r.sent} vendeur${r.sent > 1 ? 's' : ''}.`);
    if (!test) { setDraft(EMPTY); setHistory(await listAnnouncements()); }
  }

  return (
    <div>
      <div className="mb-5">
        <h2 className="font-black text-2xl flex items-center gap-2" style={{ color: txtPrim }}>
          <Megaphone size={24} weight="light" aria-hidden style={{ color: BRAND.pink }} />Annonces aux vendeurs
        </h2>
        <p className="text-sm mt-0.5" style={{ color: txtSub }}>
          Prévenez tous les vendeurs d'une nouvelle fonctionnalité. Chaque e-mail contient un lien « Ne plus recevoir ces e-mails », respecté ensuite.
        </p>
      </div>

      <section className="rounded-3xl p-5 mb-5" style={{ background: surface, border: `1px solid ${border}`, boxShadow: cardShadow }} aria-labelledby="ann-compose">
        <h3 id="ann-compose" className="font-bold text-base flex items-center gap-2 mb-3" style={{ color: txtPrim }}>
          <EnvelopeSimple size={18} weight="light" aria-hidden style={{ color: BRAND.violet }} />Nouvelle annonce
        </h3>
        <div className="grid gap-3">
          <input value={draft.title} onChange={set('title')} maxLength={140} aria-label="Titre de l'annonce"
            placeholder="Titre (ex. Suivi de livraison sur carte, nouveau sur BioLinkWD)"
            className="w-full h-11 px-3.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#6C63FF]/40" style={field} />
          <textarea value={draft.body} onChange={set('body')} maxLength={2000} rows={6} aria-label="Message"
            placeholder={'Décrivez la nouveauté en quelques phrases.\n\nUne ligne vide sépare deux paragraphes.'}
            className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none resize-y focus:ring-2 focus:ring-[#6C63FF]/40" style={field} />
          <div className="grid gap-3 sm:grid-cols-2">
            <input value={draft.cta_label} onChange={set('cta_label')} maxLength={60} aria-label="Texte du bouton"
              placeholder="Texte du bouton (ex. Découvrir)" className="w-full h-11 px-3.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#6C63FF]/40" style={field} />
            <input value={draft.cta_path} onChange={set('cta_path')} aria-label="Lien du bouton"
              placeholder="/" className="w-full h-11 px-3.5 rounded-xl text-sm outline-none font-mono focus:ring-2 focus:ring-[#6C63FF]/40" style={field} />
          </div>
          {error && <p role="alert" className="text-xs font-semibold text-red-500">{error}</p>}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <span className="text-xs" style={{ color: txtSub }}>{draft.body.length}/2000</span>
            <div className="flex gap-2 flex-wrap">
              <button type="button" onClick={() => void send(true)} disabled={busy !== null || !draft.title.trim()}
                className="inline-flex items-center gap-2 h-11 px-5 rounded-full text-sm font-bold disabled:opacity-50 transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#6C63FF]/40"
                style={{ border: `1px solid ${border}`, color: txtPrim }}>
                {busy === 'test' && <ButtonSpinner />}M'envoyer un essai
              </button>
              <button type="button" onClick={() => void send(false)} disabled={busy !== null || !draft.title.trim()}
                className="inline-flex items-center gap-2 h-11 px-5 rounded-full text-sm font-bold text-white disabled:opacity-50 transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#6C63FF]/40"
                style={{ background: GRADIENTS.pinkViolet, boxShadow: '0 8px 20px rgba(255,107,157,0.25)' }}>
                {busy === 'all' ? <ButtonSpinner /> : <PaperPlaneTilt size={16} weight="light" aria-hidden />}Envoyer à tous les vendeurs
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl p-5" style={{ background: surface, border: `1px solid ${border}`, boxShadow: cardShadow }} aria-labelledby="ann-history">
        <h3 id="ann-history" className="font-bold text-base flex items-center gap-2 mb-3" style={{ color: txtPrim }}>
          <ClockCounterClockwise size={18} weight="light" aria-hidden style={{ color: BRAND.cyan }} />Dernières annonces
        </h3>
        {history.length === 0 ? (
          <p className="text-sm" style={{ color: txtSub }}>Aucune annonce envoyée pour l'instant.</p>
        ) : (
          <ul className="divide-y" style={{ borderColor: border }}>
            {history.map(a => (
              <li key={a.id} className="py-2.5 flex items-center justify-between gap-3" style={{ borderColor: border }}>
                <span className="text-sm font-semibold truncate" style={{ color: txtPrim }}>{a.title}</span>
                <span className="text-xs shrink-0" style={{ color: txtSub }}>{new Date(a.created_at).toLocaleDateString('fr-FR')} · {a.recipients} destinataires</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
