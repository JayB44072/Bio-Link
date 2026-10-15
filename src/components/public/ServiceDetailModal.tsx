import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft, Briefcase, CalendarCheck, Check, ChevronLeft, ChevronRight, Clock, ExternalLink,
  MessageCircle, Phone, Play, Share2, Sparkles,
} from 'lucide-react';
import type { Profile, Service } from '../../lib/types';
import { useLang } from '../../lib/LanguageContext';
import { BRAND, GRADIENTS, STATUS } from '../../lib/theme';
import { serviceMessage, whatsappUrl, type ServiceMessageKind } from '../../lib/whatsapp';
import { waveLayout, sineEdgePath } from '../../lib/waveLayout';
import { useElementWidth } from '../../lib/useElementWidth';
import WaveRibbon from '../ui/WaveRibbon';
import type { ServiceWaveTheme } from './PublicServiceWave';

/* ═══════════════════════════════════════════
   Médias
═══════════════════════════════════════════ */

function getEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtube.com') || u.hostname === 'youtu.be') {
      const vid = u.hostname === 'youtu.be' ? u.pathname.slice(1) : u.searchParams.get('v') ?? u.pathname.split('/').pop() ?? '';
      return vid ? `https://www.youtube-nocookie.com/embed/${vid}?rel=0&modestbranding=1` : null;
    }
    if (u.hostname.includes('vimeo.com')) {
      const vid = u.pathname.split('/').filter(Boolean).pop() ?? '';
      return vid ? `https://player.vimeo.com/video/${vid}?title=0&byline=0` : null;
    }
  } catch { /* adresse invalide : ce n'est pas une vidéo */ }
  return null;
}

interface MediaItem { url: string; embed: string | null }

function buildMedia(images: string[], imageUrl: string): MediaItem[] {
  return [...new Set([imageUrl, ...images].filter(Boolean))].map(url => ({ url, embed: getEmbedUrl(url) }));
}

/** Palette de repli (boutique sombre aux couleurs de la marque) quand aucun thème n'est fourni. */
const FALLBACK_THEME: ServiceWaveTheme = {
  dark: true, pageBg: '#0b0b1e', text: '#f2f1ff', subtext: '#a09ec4', cardBg: '#12122b', cardBorder: 'rgba(139,124,255,0.18)',
  accent: BRAND.violet, priceColor: BRAND.pink, buttonGradient: GRADIENTS.pinkViolet, cardRadius: 'rounded-3xl',
};

/* ═══════════════════════════════════════════
   « Comment réserver » : mini ruban à trois stations
═══════════════════════════════════════════ */

function ReserveSteps({ theme, fr, viaWhatsApp }: { theme: ServiceWaveTheme; fr: boolean; viaWhatsApp: boolean }) {
  const boxRef = useRef<HTMLOListElement>(null);
  const width = useElementWidth(boxRef, 320);
  const ROW = 92;
  const R = 22;
  const cx = 34;
  const amplitude = 9;
  const layout = useMemo(() => waveLayout({ rows: 3, rowHeight: ROW, cx, amplitude, top: 4 }), []);
  const steps = [
    { icon: MessageCircle, title: viaWhatsApp ? (fr ? 'Écrivez au prestataire' : 'Message the provider') : (fr ? 'Contactez le prestataire' : 'Contact the provider'), text: viaWhatsApp ? (fr ? 'Un message WhatsApp déjà rédigé s’ouvre.' : 'A ready-made WhatsApp message opens.') : (fr ? 'Par téléphone.' : 'By phone.') },
    { icon: CalendarCheck, title: fr ? 'Convenez des détails' : 'Agree on the details', text: fr ? 'Date, lieu et modalités, directement avec lui.' : 'Date, place and terms, directly with them.' },
    { icon: Sparkles, title: fr ? 'Profitez du service' : 'Enjoy the service', text: fr ? 'La prestation est réalisée comme convenu.' : 'The service is carried out as agreed.' },
  ];

  return (
    <ol ref={boxRef} className="relative list-none m-0 p-0" style={{ height: layout.height }}>
      <WaveRibbon layout={layout} compact dark={theme.dark} stops={[theme.accent, theme.priceColor, theme.accent]} dot={theme.accent} startX={layout.nodes[0].x} />
      {steps.map((s, i) => (
        <li key={s.title} className="absolute inset-x-0 flex items-center gap-4" style={{ top: layout.nodes[i].y - ROW / 2, height: ROW }}>
          <span className="wave-in absolute flex items-center justify-center rounded-full"
            style={{ left: layout.nodes[i].x - R, width: R * 2, height: R * 2, background: theme.cardBg, border: `2px solid ${theme.accent}`, color: theme.accent, animationDelay: `${i * 120}ms` }}>
            <s.icon size={18} aria-hidden />
          </span>
          <div className="wave-in" style={{ marginLeft: cx + amplitude + R + 14, maxWidth: Math.max(160, width - (cx + amplitude + R + 14)), animationDelay: `${i * 120 + 60}ms` }}>
            <p className="text-sm font-bold" style={{ color: theme.text }}>{i + 1}. {s.title}</p>
            <p className="text-[13px] leading-snug mt-0.5" style={{ color: theme.subtext }}>{s.text}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

/* ═══════════════════════════════════════════
   Fiche service (plein écran)
═══════════════════════════════════════════ */

interface Props {
  service: Service;
  profile: Partial<Profile>;
  onClose: () => void;
  /** Couleurs et formes de la boutique (sinon : palette sombre de la marque). */
  theme?: ServiceWaveTheme;
}

export default function ServiceDetailModal({ service, profile, onClose, theme = FALLBACK_THEME }: Props) {
  const { lang } = useLang();
  const fr = lang === 'fr';
  const [idx, setIdx] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);
  const backRef = useRef<HTMLButtonElement>(null);

  const media = useMemo(() => buildMedia(service.images ?? [], service.image_url ?? ''), [service]);
  const cur = media[idx];
  const shopName = profile.shop_name || profile.display_name || profile.username || (fr ? 'Boutique' : 'Shop');
  const initials = shopName.slice(0, 2).toUpperCase();
  const priced = service.price > 0;
  const priceText = priced ? `${service.price.toLocaleString()} ${service.currency}` : '';

  /* Contact : WhatsApp en priorité, sinon téléphone */
  const info = { name: service.name, price: service.price, currency: service.currency };
  const link = (kind: ServiceMessageKind) => whatsappUrl(profile.whatsapp_number, serviceMessage(kind, info, lang));
  const whatsapp = link('interest');
  const phone = profile.contact_phone ? `tel:${profile.contact_phone.replace(/[^0-9+]/g, '')}` : null;
  const contactHref = whatsapp ?? phone;
  // Messages rapides : une intention par bouton, chacun ouvre WhatsApp avec le texte déjà rédigé
  const quickLinks = whatsapp ? ([
    { kind: 'book' as const, label: fr ? 'Réserver' : 'Book', icon: CalendarCheck },
    { kind: 'question' as const, label: fr ? 'Poser une question' : 'Ask a question', icon: MessageCircle },
    { kind: 'availability' as const, label: priced ? (fr ? 'Demander les disponibilités' : 'Ask availability') : (fr ? 'Demander un devis' : 'Request a quote'), icon: Clock },
  ].map(q => ({ ...q, href: link(q.kind)! }))) : [];

  const close = useCallback(() => { setMounted(false); window.setTimeout(onClose, 200); }, [onClose]);

  useEffect(() => {
    const t = window.setTimeout(() => setMounted(true), 10);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    backRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    return () => { window.clearTimeout(t); document.body.style.overflow = prevOverflow; document.removeEventListener('keydown', onKey); };
  }, [close]);

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: service.name, text: service.description, url });
      else { await navigator.clipboard.writeText(url); setCopied(true); window.setTimeout(() => setCopied(false), 1800); }
    } catch { /* partage annulé */ }
  };

  const go = (d: number) => setIdx(i => (i + d + media.length) % media.length);
  const heroWave = useMemo(() => sineEdgePath(240, 14, 7, 2), []);

  const ctaLabel = whatsapp ? (fr ? 'Contacter sur WhatsApp' : 'Contact on WhatsApp') : (fr ? 'Appeler le prestataire' : 'Call the provider');
  const CtaIcon = whatsapp ? MessageCircle : Phone;

  const cta = contactHref ? (
    <a href={contactHref} target="_blank" rel="noopener noreferrer"
      className="relative flex items-center justify-center gap-2.5 w-full h-14 rounded-full text-white font-black text-base overflow-hidden transition hover:-translate-y-0.5 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4"
      style={{ background: theme.buttonGradient, boxShadow: `0 12px 32px color-mix(in srgb, ${theme.accent} 40%, transparent)`, ['--tw-ring-color' as string]: `color-mix(in srgb, ${theme.accent} 40%, transparent)` }}>
      <span className="absolute inset-0 opacity-20 pointer-events-none" style={{ background: 'linear-gradient(200deg,rgba(255,255,255,0.5) 0%,transparent 55%)' }} />
      <CtaIcon size={19} aria-hidden className="relative" /><span className="relative">{ctaLabel}</span>
    </a>
  ) : (
    <p className="text-sm text-center rounded-2xl px-4 py-3" style={{ background: `color-mix(in srgb, ${theme.accent} 10%, transparent)`, color: theme.subtext }}>
      {fr ? 'Le prestataire n’a pas encore renseigné de moyen de contact.' : 'The provider has not added a contact method yet.'}
    </p>
  );

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="service-detail-title"
      className="fixed inset-0 z-[80] overflow-y-auto overscroll-contain"
      style={{ background: theme.pageBg, color: theme.text, opacity: mounted ? 1 : 0, transition: 'opacity .2s' }}>

      {/* ── Média ── */}
      <div className="relative w-full" style={{ height: 'clamp(280px, 46vh, 480px)', background: theme.cardBg }}>
        {cur ? (
          cur.embed ? (
            <iframe key={cur.embed} src={cur.embed} title={service.name} allowFullScreen className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
          ) : (
            <img src={cur.url} alt={service.name} className="absolute inset-0 w-full h-full object-cover" />
          )
        ) : (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: `linear-gradient(135deg, color-mix(in srgb, ${theme.accent} 45%, ${theme.pageBg}), ${theme.pageBg})` }}>
            <Briefcase size={64} aria-hidden style={{ color: theme.accent, opacity: 0.5 }} />
          </div>
        )}
        <div className="absolute inset-x-0 top-0 h-28 pointer-events-none" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)' }} />

        {/* Retour et partage */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
          <button ref={backRef} type="button" onClick={close}
            className="h-11 px-4 rounded-full flex items-center gap-2 text-sm font-bold text-white transition hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40"
            style={{ background: 'rgba(15,15,35,0.6)', backdropFilter: 'blur(8px)' }}>
            <ArrowLeft size={17} aria-hidden />{fr ? 'Retour' : 'Back'}
          </button>
          <button type="button" onClick={() => void share()} aria-label={fr ? 'Partager ce service' : 'Share this service'}
            className="h-11 px-4 rounded-full flex items-center gap-2 text-sm font-bold text-white transition hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40"
            style={{ background: 'rgba(15,15,35,0.6)', backdropFilter: 'blur(8px)' }}>
            {copied ? <Check size={16} aria-hidden /> : <Share2 size={16} aria-hidden />}
            <span className="hidden sm:inline">{copied ? (fr ? 'Lien copié' : 'Link copied') : (fr ? 'Partager' : 'Share')}</span>
          </button>
        </div>

        {/* Navigation des médias */}
        {media.length > 1 && !cur?.embed && (
          <>
            <button type="button" onClick={() => go(-1)} aria-label={fr ? 'Média précédent' : 'Previous media'}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center text-white transition hover:scale-110 z-10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40"
              style={{ background: 'rgba(15,15,35,0.6)', backdropFilter: 'blur(8px)' }}><ChevronLeft size={20} aria-hidden /></button>
            <button type="button" onClick={() => go(1)} aria-label={fr ? 'Média suivant' : 'Next media'}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center text-white transition hover:scale-110 z-10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40"
              style={{ background: 'rgba(15,15,35,0.6)', backdropFilter: 'blur(8px)' }}><ChevronRight size={20} aria-hidden /></button>
          </>
        )}

        {/* Bord sinusoïdal qui fond le média dans la page */}
        <svg className="absolute inset-x-0 bottom-[-1px] w-full pointer-events-none" style={{ height: 36 }} viewBox="0 0 240 28" preserveAspectRatio="none" aria-hidden="true">
          <path d={heroWave} transform="translate(0,28) scale(1,-1)" fill={theme.pageBg} />
        </svg>
      </div>

      {/* ── Contenu ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-32 lg:pb-16 grid lg:grid-cols-[minmax(0,1fr)_360px] gap-8 lg:gap-10">
        <div className="min-w-0 -mt-1">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: 'rgba(34,197,94,0.14)', color: theme.dark ? '#4ade80' : '#15803d' }}>
              <span className="w-2 h-2 rounded-full bg-green-500" />{fr ? 'Disponible' : 'Available'}
            </span>
            {service.duration && (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: `color-mix(in srgb, ${theme.accent} 14%, transparent)`, color: theme.accent }}>
                <Clock size={13} aria-hidden />{service.duration}
              </span>
            )}
          </div>

          <h1 id="service-detail-title" className="font-black text-3xl sm:text-4xl leading-tight break-words" style={{ color: theme.text }}>{service.name}</h1>

          {/* Prestataire */}
          <div className="mt-4 flex items-center gap-3">
            <span className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center text-xs font-black text-white shrink-0" style={{ background: GRADIENTS.violetPink }}>
              {profile.shop_logo_url ? <img src={profile.shop_logo_url} alt="" className="w-full h-full object-cover" /> : initials}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold truncate" style={{ color: theme.text }}>{shopName}</p>
              {profile.username && (
                <a href={`/u/${profile.username}`} className="inline-flex items-center gap-1 text-xs hover:underline" style={{ color: theme.subtext }}>
                  @{profile.username}<ExternalLink size={11} aria-hidden />
                </a>
              )}
            </div>
          </div>

          {/* Galerie : médaillons */}
          {media.length > 1 && (
            <div className="mt-6 flex gap-3 overflow-x-auto py-2 -mx-1 px-1" role="group" aria-label={fr ? 'Galerie' : 'Gallery'}>
              {media.map((m, i) => {
                const on = i === idx;
                return (
                  <button key={m.url} type="button" onClick={() => setIdx(i)} aria-label={`${fr ? 'Afficher le média' : 'Show media'} ${i + 1}`} aria-pressed={on}
                    className="shrink-0 w-16 h-16 rounded-full p-[3px] transition hover:scale-105 focus-visible:outline-none focus-visible:ring-4"
                    style={{ background: on ? `conic-gradient(${theme.accent}, ${theme.priceColor}, ${theme.accent})` : theme.cardBorder, ['--tw-ring-color' as string]: `color-mix(in srgb, ${theme.accent} 40%, transparent)` }}>
                    <span className="block w-full h-full rounded-full overflow-hidden relative" style={{ background: theme.cardBg }}>
                      {m.embed
                        ? <span className="absolute inset-0 flex items-center justify-center"><Play size={20} aria-hidden fill="currentColor" style={{ color: theme.accent }} /></span>
                        : <img src={m.url} alt="" className="w-full h-full object-cover" />}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Description */}
          {service.description && (
            <section className={`relative mt-6 overflow-hidden ${theme.cardRadius}`} style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}` }} aria-label={fr ? 'Description' : 'Description'}>
              <svg className="absolute inset-x-0 top-0 w-full" style={{ height: 36 }} viewBox="0 0 240 28" preserveAspectRatio="none" aria-hidden="true">
                <path d={sineEdgePath(240, 14, 7, 3)} fill={`color-mix(in srgb, ${theme.accent} ${theme.dark ? 24 : 12}%, transparent)`} />
              </svg>
              <div className="relative px-5 pt-9 pb-6">
                <h2 className="text-xs font-black uppercase tracking-[0.18em] mb-2.5" style={{ color: theme.accent }}>{fr ? 'À propos du service' : 'About this service'}</h2>
                <p className="text-[15px] leading-relaxed whitespace-pre-line" style={{ color: theme.text, opacity: 0.88 }}>{service.description}</p>
              </div>
            </section>
          )}

          {/* Contacter le prestataire : messages WhatsApp rapides */}
          {(whatsapp || phone) && (
            <section aria-labelledby="service-contact-title" className={`mt-6 p-5 ${theme.cardRadius}`}
              style={{ background: `color-mix(in srgb, ${STATUS.whatsapp} ${theme.dark ? 12 : 9}%, ${theme.cardBg})`, border: `1px solid color-mix(in srgb, ${STATUS.whatsapp} 35%, ${theme.cardBorder})` }}>
              <div className="flex items-center gap-3">
                <span className="relative w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-white" style={{ background: STATUS.whatsapp }}>
                  <MessageCircle size={22} aria-hidden fill="currentColor" />
                </span>
                <div className="min-w-0">
                  <h2 id="service-contact-title" className="font-black text-base leading-tight" style={{ color: theme.text }}>
                    {whatsapp ? (fr ? `Discuter avec ${shopName} sur WhatsApp` : `Chat with ${shopName} on WhatsApp`) : (fr ? `Contacter ${shopName}` : `Contact ${shopName}`)}
                  </h2>
                  <p className="text-[13px] leading-snug mt-0.5" style={{ color: theme.subtext }}>
                    {whatsapp
                      ? (fr ? 'Choisissez votre message : il est déjà rédigé, vous n’avez qu’à l’envoyer.' : 'Pick your message: it is already written, just send it.')
                      : (fr ? 'Le prestataire est joignable par téléphone.' : 'The provider can be reached by phone.')}
                  </p>
                </div>
              </div>
              {quickLinks.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {quickLinks.map(q => (
                    <a key={q.kind} href={q.href} target="_blank" rel="noopener noreferrer" data-quick={q.kind}
                      className="inline-flex items-center gap-2 h-11 px-4 rounded-full text-sm font-bold transition hover:-translate-y-0.5 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2"
                      style={{ background: theme.cardBg, color: theme.text, border: `1px solid color-mix(in srgb, ${STATUS.whatsapp} 45%, ${theme.cardBorder})`, ['--tw-ring-color' as string]: STATUS.whatsapp }}>
                      <q.icon size={15} aria-hidden style={{ color: STATUS.whatsapp }} />{q.label}
                    </a>
                  ))}
                </div>
              )}
              <div className="mt-4 flex flex-wrap gap-2.5">
                {whatsapp && (
                  <a href={whatsapp} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-full text-sm font-black text-white transition hover:-translate-y-0.5 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4"
                    style={{ background: STATUS.whatsapp, boxShadow: `0 10px 26px color-mix(in srgb, ${STATUS.whatsapp} 40%, transparent)`, ['--tw-ring-color' as string]: `color-mix(in srgb, ${STATUS.whatsapp} 40%, transparent)` }}>
                    <MessageCircle size={17} aria-hidden fill="currentColor" />{fr ? 'Ouvrir WhatsApp' : 'Open WhatsApp'}
                  </a>
                )}
                {phone && (
                  <a href={phone}
                    className="inline-flex items-center justify-center gap-2 h-12 px-5 rounded-full text-sm font-bold transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2"
                    style={{ border: `1px solid ${theme.cardBorder}`, color: theme.text }}>
                    <Phone size={16} aria-hidden />{fr ? 'Appeler' : 'Call'}
                  </a>
                )}
              </div>
            </section>
          )}

          {/* Comment réserver */}
          <section className="mt-9" aria-labelledby="service-steps-title">
            <h2 id="service-steps-title" className="text-xs font-black uppercase tracking-[0.18em] mb-4" style={{ color: theme.accent }}>{fr ? 'Comment réserver' : 'How to book'}</h2>
            <ReserveSteps theme={theme} fr={fr} viaWhatsApp={!!whatsapp} />
          </section>
        </div>

        {/* ── Ticket : prix et réservation (collé en haut sur grand écran) ── */}
        <aside className="hidden lg:block">
          <div className={`sticky top-6 ${theme.cardRadius} overflow-hidden`} style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, boxShadow: theme.dark ? '0 18px 50px rgba(0,0,0,0.4)' : '0 18px 50px rgba(108,99,255,0.14)' }}>
            <svg className="absolute inset-x-0 top-0 w-full" style={{ height: 40 }} viewBox="0 0 240 28" preserveAspectRatio="none" aria-hidden="true">
              <path d={sineEdgePath(240, 14, 7, 3)} fill={`color-mix(in srgb, ${theme.accent} ${theme.dark ? 26 : 14}%, transparent)`} />
            </svg>
            <div className="relative p-6 pt-10">
              <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: theme.subtext }}>{fr ? 'Tarif' : 'Price'}</p>
              {priced ? (
                <p className="mt-1 flex items-baseline gap-2">
                  <span className="text-4xl font-black tabular-nums" style={{ color: theme.priceColor }}>{service.price.toLocaleString()}</span>
                  <span className="text-base font-bold" style={{ color: theme.subtext }}>{service.currency}</span>
                </p>
              ) : (
                <p className="mt-1 text-2xl font-black" style={{ color: theme.priceColor }}>{fr ? 'Sur devis' : 'On quote'}</p>
              )}
              {service.duration && (
                <p className="mt-2 flex items-center gap-1.5 text-sm" style={{ color: theme.subtext }}><Clock size={14} aria-hidden />{service.duration}</p>
              )}
              <div className="mt-5">{cta}</div>
              {whatsapp && phone && (
                <a href={phone} className="mt-3 flex items-center justify-center gap-2 h-11 rounded-full text-sm font-bold transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2"
                  style={{ border: `1px solid ${theme.cardBorder}`, color: theme.text }}>
                  <Phone size={15} aria-hidden />{fr ? 'Appeler' : 'Call'}
                </a>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* ── Barre de réservation collée en bas (mobile) ── */}
      <div className="lg:hidden fixed inset-x-0 bottom-0 z-10 px-4 pt-3 pb-4 flex items-center gap-3"
        style={{ background: `color-mix(in srgb, ${theme.pageBg} 92%, transparent)`, backdropFilter: 'blur(14px)', borderTop: `1px solid ${theme.cardBorder}` }}>
        <div className="shrink-0 leading-tight">
          <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: theme.subtext }}>{fr ? 'Tarif' : 'Price'}</p>
          <p className="text-xl font-black tabular-nums" style={{ color: theme.priceColor }}>{priced ? priceText : (fr ? 'Sur devis' : 'On quote')}</p>
        </div>
        <div className="flex-1 min-w-0">{cta}</div>
      </div>
    </div>
  );
}
