import { useEffect, useRef, useState } from 'react';
import { Check, Copy, FacebookLogo, ShareNetwork, WhatsappLogo } from '@phosphor-icons/react';

interface ShareMenuProps {
  /** Adresse à partager (par défaut : la page courante). */
  url?: string;
  title: string;
  /** Message d'invitation déjà rédigé (ex. « Venez découvrir … sur la boutique … »). */
  message?: string;
  lang: string;
  /** « icon » : bouton rond de la barre ; « row » : ligne pleine largeur du menu mobile. */
  variant?: 'icon' | 'row';
  colors: { text: string; subtext: string; cardBg: string; border: string; hover: string };
}

/** Partage de la boutique : WhatsApp, Facebook, copie du lien (ou le partage natif du téléphone). */
export default function ShareMenu({ url, title, message, lang, variant = 'icon', colors }: ShareMenuProps) {
  const fr = lang === 'fr';
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const link = () => url ?? window.location.href.split('#')[0];
  const text = message ?? (fr ? `Découvrez ${title} :` : `Check out ${title}:`);

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', away);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', away); document.removeEventListener('keydown', esc); };
  }, [open]);

  async function toggle() {
    // Sur téléphone, le menu de partage du système propose toutes les applications installées
    if (typeof navigator.share === 'function' && window.matchMedia?.('(pointer: coarse)').matches) {
      try { await navigator.share({ title, text, url: link() }); return; } catch { /* annulé : on n'ouvre pas le menu */ return; }
    }
    setOpen(v => !v);
  }

  async function copy() {
    try { await navigator.clipboard.writeText(link()); setCopied(true); window.setTimeout(() => setCopied(false), 1800); } catch { /* presse-papiers indisponible */ }
  }

  const items = [
    { label: 'WhatsApp', icon: WhatsappLogo, color: '#25D366', href: `https://wa.me/?text=${encodeURIComponent(`${text} ${link()}`)}` },
    { label: 'Facebook', icon: FacebookLogo, color: '#1877F2', href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link())}&quote=${encodeURIComponent(text)}`, copyText: true },
  ];

  return (
    <div ref={box} className={variant === 'row' ? 'relative w-full' : 'relative shrink-0'}>
      <button type="button" onClick={() => void toggle()} aria-haspopup="menu" aria-expanded={open} aria-label={fr ? 'Partager cette boutique' : 'Share this shop'}
        className={variant === 'row'
          ? 'w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all'
          : 'w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition'}
        style={{ color: variant === 'row' ? colors.subtext : colors.text, background: variant === 'row' ? 'transparent' : colors.hover }}>
        <ShareNetwork size={variant === 'row' ? 16 : 15} weight="light" aria-hidden />
        {variant === 'row' && (fr ? 'Partager' : 'Share')}
      </button>
      {open && (
        <div role="menu" className={`absolute z-50 mt-2 min-w-[190px] rounded-2xl p-1.5 shadow-xl ${variant === 'row' ? 'left-0 bottom-full mb-2 mt-0' : 'right-0 top-full'}`}
          style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
          {items.map(({ label, icon: Icon, color, href, copyText }) => (
            <a key={label} role="menuitem" href={href} target="_blank" rel="noopener noreferrer"
              onClick={() => {
                // Facebook ignore parfois le texte pré-rempli : on le copie pour qu'il suffise de le coller
                if (copyText) void navigator.clipboard?.writeText(text).catch(() => {});
                setOpen(false);
              }}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold hover:opacity-80" style={{ color: colors.text }}>
              <Icon size={18} weight="fill" aria-hidden style={{ color }} />{label}
              {copyText && <span className="ml-auto text-[10px] font-medium opacity-60">{fr ? 'message copié' : 'message copied'}</span>}
            </a>
          ))}
          <button type="button" role="menuitem" onClick={() => void copy()}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold hover:opacity-80" style={{ color: colors.text }}>
            {copied ? <Check size={18} weight="bold" aria-hidden style={{ color: '#22c55e' }} /> : <Copy size={18} weight="light" aria-hidden />}
            {copied ? (fr ? 'Lien copié' : 'Link copied') : (fr ? 'Copier le lien' : 'Copy link')}
          </button>
        </div>
      )}
    </div>
  );
}
