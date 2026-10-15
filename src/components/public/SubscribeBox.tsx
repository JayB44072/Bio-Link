import { useId, useMemo, useState } from 'react';
import { ArrowUpRight, BellRinging, Check, EnvelopeSimple, MapPinLine, Package, X } from '@phosphor-icons/react';
import { sineEdgePath } from '../../lib/waveLayout';
import { subscribeToPage, type SubscribeError } from '../../lib/api/subscribers';
import { ButtonSpinner } from '../ui/Spinner';
import type { ServiceWaveTheme } from './PublicServiceWave';

interface SubscribeBoxProps {
  username: string;
  shopName: string;
  lang: string;
  /** Couleurs et formes de la boutique (les mêmes que pour les services). */
  theme: ServiceWaveTheme;
  /** Faux dans un aperçu : le formulaire s'affiche mais n'envoie rien. */
  interactive: boolean;
  /** Fournie quand le formulaire est dans une fenêtre : affiche la croix de fermeture. */
  onClose?: () => void;
}

const storageKey = (username: string) => `biolinkwd_subscribed_${username}`;

function wasSubscribed(username: string): boolean {
  try { return localStorage.getItem(storageKey(username)) === '1'; } catch { return false; }
}

const COPY = {
  fr: {
    eyebrow: 'Restez informé', title: (s: string) => `Suivez ${s}`,
    text: 'Recevez un e-mail à chaque nouveau produit, nouveau service ou annonce.',
    label: 'Votre adresse e-mail', placeholder: 'vous@exemple.com', cta: "Je m'abonne",
    done: 'Merci ! Vous suivez maintenant cette boutique. Un e-mail de bienvenue vous a été envoyé : son lien « Voir mes livraisons » affiche vos livraisons sur la carte.', again: 'Utiliser une autre adresse',
    privacy: 'Votre adresse n’est utilisée que pour ces e-mails et n’est jamais revendue.',
    errors: { invalid_email: 'Cette adresse e-mail ne semble pas valide.', not_found: 'Cette boutique est introuvable.', limit_reached: 'Cette boutique ne peut plus accepter d’abonnés pour le moment.', unavailable: "L'abonnement n'est pas disponible pour le moment. Réessayez plus tard." } as Record<SubscribeError, string>,
    preview: 'Aperçu : le formulaire est actif sur la vraie page.',
    close: 'Fermer',
    perks: ['Nouveautés et annonces dans votre boîte mail', 'Vos livraisons sur la carte de la boutique', 'Désabonnement en un clic'],
  },
  en: {
    eyebrow: 'Stay in the loop', title: (s: string) => `Follow ${s}`,
    text: 'Get an email for every new product, service or announcement.',
    label: 'Your email address', placeholder: 'you@example.com', cta: 'Subscribe',
    done: 'Thank you! You are now following this shop. A welcome email is on its way: its “See my deliveries” link shows your deliveries on the map.', again: 'Use another address',
    privacy: 'Your address is only used for these emails and is never sold.',
    errors: { invalid_email: 'This email address does not look valid.', not_found: 'This shop could not be found.', limit_reached: 'This shop cannot accept more subscribers right now.', unavailable: 'Subscribing is not available right now. Please try again later.' } as Record<SubscribeError, string>,
    preview: 'Preview: the form is active on the live page.',
    close: 'Close',
    perks: ['New products and news in your inbox', 'Your deliveries on the shop map', 'Unsubscribe in one click'],
  },
} as const;

const EASE = 'cubic-bezier(0.32, 0.72, 0, 1)';
const PERK_ICONS = [EnvelopeSimple, MapPinLine, Package];

/** Fenêtre « suivre cette boutique » : un visiteur laisse son e-mail pour être prévenu des nouveautés et retrouver ses livraisons. */
export default function SubscribeBox({ username, shopName, lang, theme, interactive, onClose }: SubscribeBoxProps) {
  const c = COPY[lang === 'fr' ? 'fr' : 'en'];
  const inputId = useId();
  const errId = useId();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(() => interactive && wasSubscribed(username));
  const [error, setError] = useState<SubscribeError | null>(null);
  const edge = useMemo(() => sineEdgePath(240, 14, 7, 3), []);
  const hair = theme.dark ? 'rgba(255,255,255,0.08)' : 'rgba(22,22,46,0.07)';
  const field = theme.dark ? 'rgba(255,255,255,0.06)' : '#f7f6ff';

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!interactive || busy) return;
    setBusy(true);
    setError(null);
    const r = await subscribeToPage(username, email);
    setBusy(false);
    if (!r.ok) { setError(r.error); return; }
    try { localStorage.setItem(storageKey(username), '1'); } catch { /* stockage indisponible */ }
    setDone(true);
    setEmail('');
  }

  return (
    // Double enveloppe : coque translucide + cœur, pour un rendu « plaque de verre » net
    <div className="w-full rounded-[2rem] p-1.5" style={{ background: theme.dark ? 'rgba(255,255,255,0.05)' : 'rgba(22,22,46,0.04)', boxShadow: `0 0 0 1px ${hair}, 0 30px 80px -20px rgba(0,0,0,0.45)` }}>
      <section aria-labelledby={`${inputId}-title`} className="relative overflow-hidden rounded-[calc(2rem-0.375rem)]"
        style={{ background: theme.cardBg, boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.12)' }}>
        <svg className="absolute inset-x-0 top-0 w-full pointer-events-none" style={{ height: 64 }} viewBox="0 0 240 28" preserveAspectRatio="none" aria-hidden="true">
          <path d={edge} fill={`color-mix(in srgb, ${theme.accent} ${theme.dark ? 26 : 15}%, transparent)`} />
        </svg>

        {onClose && (
          <button type="button" onClick={onClose} aria-label={c.close}
            className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-transform duration-500 hover:rotate-90 active:scale-95 focus-visible:outline-none focus-visible:ring-2"
            style={{ background: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.85)', color: theme.text, transitionTimingFunction: EASE, ['--tw-ring-color' as string]: theme.accent }}>
            <X size={16} weight="light" aria-hidden />
          </button>
        )}

        <div className="relative px-6 sm:px-8 pt-9 pb-7">
          <span className="w-14 h-14 rounded-2xl flex items-center justify-center text-white" style={{ background: theme.buttonGradient, boxShadow: '0 14px 30px -10px rgba(0,0,0,0.4)' }}>
            <BellRinging size={26} weight="light" aria-hidden />
          </span>

          <p className="mt-5 inline-block rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: theme.accent, background: `color-mix(in srgb, ${theme.accent} 12%, transparent)` }}>{c.eyebrow}</p>
          <h2 id={`${inputId}-title`} className="mt-3 text-[26px] sm:text-[30px] font-black leading-[1.1] tracking-tight break-words" style={{ color: theme.text }}>{c.title(shopName)}</h2>
          <p className="mt-2.5 text-[15px] leading-relaxed" style={{ color: theme.subtext }}>{c.text}</p>

          {done ? (
            <div className="mt-6 rounded-2xl p-4 flex items-start gap-3" role="status" style={{ background: 'rgba(34,197,94,0.1)', boxShadow: 'inset 0 0 0 1px rgba(34,197,94,0.28)' }}>
              <span className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-white" style={{ background: '#22c55e' }}><Check size={18} weight="bold" aria-hidden /></span>
              <div className="min-w-0">
                <p className="text-sm font-semibold leading-snug" style={{ color: theme.text }}>{c.done}</p>
                <button type="button" onClick={() => setDone(false)} className="mt-1.5 text-xs font-semibold underline underline-offset-2" style={{ color: theme.subtext }}>{c.again}</button>
              </div>
            </div>
          ) : (
            <>
              <form onSubmit={submit} noValidate className="mt-6">
                <label htmlFor={inputId} className="sr-only">{c.label}</label>
                <div className="relative">
                  <EnvelopeSimple size={20} weight="light" aria-hidden className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: theme.subtext }} />
                  <input id={inputId} type="email" inputMode="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)}
                    placeholder={c.placeholder} disabled={!interactive || busy}
                    aria-invalid={!!error} aria-describedby={error ? errId : undefined}
                    className="w-full h-14 pl-12 pr-4 rounded-full text-[15px] outline-none transition-shadow duration-500 focus:ring-4 disabled:opacity-70"
                    style={{ background: field, boxShadow: `inset 0 0 0 1px ${error ? '#ef4444' : hair}`, color: theme.text, transitionTimingFunction: EASE, ['--tw-ring-color' as string]: `color-mix(in srgb, ${theme.accent} 28%, transparent)` }} />
                </div>
                {error && <p id={errId} role="alert" className="mt-2 px-2 text-xs font-semibold" style={{ color: '#ef4444' }}>{c.errors[error]}</p>}

                <button type="submit" disabled={!interactive || busy || email.trim().length === 0}
                  className="group mt-3 w-full h-14 pl-7 pr-2 rounded-full text-[15px] font-bold text-white flex items-center justify-between transition-transform duration-500 hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-55 disabled:hover:translate-y-0 focus-visible:outline-none focus-visible:ring-4"
                  style={{ background: theme.buttonGradient, boxShadow: '0 16px 32px -14px rgba(0,0,0,0.5)', transitionTimingFunction: EASE, ['--tw-ring-color' as string]: `color-mix(in srgb, ${theme.accent} 40%, transparent)` }}>
                  <span>{c.cta}</span>
                  <span className="w-10 h-10 rounded-full flex items-center justify-center bg-white/20 transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-px group-hover:scale-105" style={{ transitionTimingFunction: EASE }}>
                    {busy ? <ButtonSpinner /> : <ArrowUpRight size={18} weight="light" aria-hidden />}
                  </span>
                </button>
              </form>

              <ul className="mt-6 space-y-3">
                {c.perks.map((perk, i) => {
                  const Icon = PERK_ICONS[i];
                  return (
                    <li key={perk} className="flex items-center gap-3 text-sm" style={{ color: theme.text }}>
                      <span className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: `color-mix(in srgb, ${theme.accent} 12%, transparent)`, color: theme.accent }}>
                        <Icon size={16} weight="light" aria-hidden />
                      </span>
                      {perk}
                    </li>
                  );
                })}
              </ul>
              <p className="mt-5 text-[11px] leading-snug" style={{ color: theme.subtext }}>{interactive ? c.privacy : c.preview}</p>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
