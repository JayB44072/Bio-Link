import { lazy, Suspense, useEffect, useState } from 'react';
import { BRAND } from '../../lib/theme';
import { useAppPrefs } from '../../lib/AppPrefsContext';
import { PART_ORDER } from './shoe/buildShoe';
import { SHOE_COPY } from './shoe/shoeCopy';

const ShoeScene = lazy(() => import('./shoe/ShoeScene'));

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const DESKTOP_QUERY = '(min-width: 1024px)';

/** Vrai quand l'écran est assez large pour afficher le panneau (même seuil que `lg:` de Tailwind). */
function useIsDesktop() {
  const read = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(DESKTOP_QUERY).matches;
  const [isDesktop, setIsDesktop] = useState(read);
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia(DESKTOP_QUERY);
    const onChange = () => setIsDesktop(mq.matches);
    onChange();
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);
  return isDesktop;
}

/**
 * Panneau latéral des écrans de connexion / inscription (desktop uniquement) :
 * une chaussure en 3D se décompose, chaque pièce est présentée, puis elle se recompose.
 */
export default function ShoeShowcase() {
  const { lang } = useAppPrefs();
  const copy = SHOE_COPY[lang] ?? SHOE_COPY.fr;
  const [step, setStep] = useState(-1);
  const [unavailable, setUnavailable] = useState(false);
  const isDesktop = useIsDesktop();
  const part = step >= 0 ? copy.parts[PART_ORDER[step]] : null;

  return (
    <div className="hidden lg:flex flex-col w-[34%] min-w-[360px] max-w-[440px] relative overflow-hidden"
      style={{ background: 'radial-gradient(120% 90% at 50% 38%,#2a2a38 0%,#14141c 60%,#0b0b11 100%)' }}>

      {/* La 3D n'est montée (et téléchargée) que si le panneau est visible */}
      {isDesktop && !unavailable && (
        <Suspense fallback={null}>
          <ShoeScene onStep={setStep} onUnavailable={() => setUnavailable(true)} reducedMotion={prefersReducedMotion()} />
        </Suspense>
      )}

      {/* Marque */}
      <div className="relative z-10 flex items-center gap-3 px-8 pt-8">
        <img src="/logo-sm.png" alt="BioLinkWD" className="h-9 w-auto"
          onError={e => { e.currentTarget.style.display = 'none'; }} />
        <div>
          <span className="text-white font-bold text-xl">{copy.brand}</span>
          <p className="text-xs font-semibold text-white/70">by WhiteDuckSaaS</p>
        </div>
      </div>

      {/* Légende de la pièce présentée */}
      <div className="relative z-10 mt-auto px-8 pb-9 min-h-[150px]" aria-live="polite">
        <div key={part ? step : 'idle'} className="animate-fade-in">
          {part ? (
            <>
              <h2 className="text-white text-2xl font-bold leading-tight">{part.title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-white/75 max-w-[300px]">{part.text}</p>
            </>
          ) : (
            <p className="text-white text-xl font-semibold leading-snug max-w-[300px]">{copy.tagline}</p>
          )}
        </div>
        <div className="mt-5 flex gap-1.5" aria-hidden>
          {PART_ORDER.map((p, i) => (
            <span key={p} className="h-1 flex-1 rounded-full transition-colors duration-300"
              style={{ background: i === step ? BRAND.violet : 'rgba(255,255,255,0.18)' }} />
          ))}
        </div>
      </div>
    </div>
  );
}
