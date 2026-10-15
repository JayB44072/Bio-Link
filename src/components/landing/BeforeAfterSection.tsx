import { Check, X, BadgeCheck, MessageCircle, Instagram, Globe, Music } from 'lucide-react';
import type { LandingT } from '../../lib/landingTranslations';
import { BRAND, GRADIENTS } from '../../lib/theme';
import AnimSection from './AnimSection';

interface Props { t: LandingT; dk: boolean }

/** Comparaison : lien bio classique à gauche, page BioLinkWD avec boutique à droite. */
export default function BeforeAfterSection({ t, dk }: Props) {
  const txtPrimary = dk ? '#f0f0ff' : BRAND.navy;
  const txtSub = dk ? 'text-gray-400' : 'text-gray-500';
  const cardBg = dk ? '#111128' : '#fff';
  const cardBorder = dk ? '#1e1e3f' : '#f3f4f6';
  const screenBg = dk ? '#0b0b1e' : '#f6f6fa';

  const before = [t.baBefore1, t.baBefore2, t.baBefore3];
  const after = [t.baAfter1, t.baAfter2, t.baAfter3];

  return (
    <section id="compare" className="py-24 px-5" style={{ background: dk ? '#080818' : '#fff' }}>
      <div className="max-w-6xl mx-auto">
        <AnimSection direction="up" className="text-center mb-14">
          <h2 className="text-4xl font-black mb-4 max-w-2xl mx-auto" style={{ color: txtPrimary }}>{t.baTitle}</h2>
          <p className={`max-w-xl mx-auto ${txtSub}`}>{t.baSub}</p>
        </AnimSection>

        <div className="grid md:grid-cols-2 gap-6 lg:gap-10 items-stretch">
          {/* ── Avant ── */}
          <AnimSection direction="up" className="h-full">
            <div className="h-full rounded-3xl border p-6 sm:p-8 flex flex-col" style={{ background: cardBg, borderColor: cardBorder }}>
              <h3 className="text-xl font-black mb-5" style={{ color: txtPrimary }}>{t.baBeforeTitle}</h3>

              <div data-ui className="mx-auto w-full max-w-[260px] rounded-2xl p-4 mb-6" style={{ background: screenBg }}>
                <div className="flex flex-col items-center text-center mb-4">
                  <div className="h-14 w-14 rounded-full bg-gray-300" />
                  <p className="mt-2 text-sm font-bold" style={{ color: txtPrimary }}>@awa.kicks</p>
                </div>
                {[{ I: Instagram, l: 'Instagram' }, { I: Music, l: 'TikTok' }, { I: MessageCircle, l: 'WhatsApp' }, { I: Globe, l: 'Mon site' }].map(({ I, l }) => (
                  <div key={l} className="mb-2 flex items-center justify-center gap-2 rounded-full border border-gray-300 bg-white py-2.5 text-xs font-medium text-gray-700">
                    <I size={14} aria-hidden />{l}
                  </div>
                ))}
              </div>

              <ul className="space-y-3 mt-auto">
                {before.map(text => (
                  <li key={text} className="flex items-start gap-3">
                    <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-red-100 text-red-500"><X size={14} aria-hidden /></span>
                    <span className={`text-sm font-medium leading-snug ${txtSub}`}>{text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </AnimSection>

          {/* ── Après ── */}
          <AnimSection direction="up" delay={120} className="h-full">
            <div className="h-full rounded-3xl border-2 p-6 sm:p-8 flex flex-col" style={{ background: cardBg, borderColor: BRAND.violet }}>
              <h3 className="text-xl font-black mb-5" style={{ color: txtPrimary }}>{t.baAfterTitle}</h3>

              <div data-ui className="mx-auto w-full max-w-[260px] rounded-2xl p-4 mb-6" style={{ background: screenBg }}>
                <div className="flex flex-col items-center text-center mb-3">
                  <div className="h-14 w-14 rounded-full" style={{ background: GRADIENTS.brand }} />
                  <p className="mt-2 flex items-center gap-1 text-sm font-bold" style={{ color: txtPrimary }}>
                    Awa Kicks <BadgeCheck size={14} className="text-brand-violet" aria-hidden />
                  </p>
                </div>
                <div className="mb-3 flex justify-center gap-2">
                  {[Instagram, MessageCircle, Music].map((I, i) => (
                    <span key={i} className="grid h-8 w-8 place-items-center rounded-full bg-white text-brand-violet shadow-sm"><I size={14} aria-hidden /></span>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[{ n: 'Pulse Violet', p: '35 000', c: '#ECEAFF' }, { n: 'Dune Sable', p: '38 000', c: '#F3EBDD' }].map(({ n, p, c }) => (
                    <div key={n} className="rounded-xl bg-white p-1.5 shadow-sm">
                      <div className="h-16 rounded-lg" style={{ background: c }} />
                      <p className="mt-1.5 truncate text-[11px] font-bold text-gray-900">{n}</p>
                      <p className="text-[11px] font-bold text-brand-violet">{p} FCFA</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold text-white" style={{ background: '#1FA855' }}>
                  <MessageCircle size={14} aria-hidden />WhatsApp
                </div>
              </div>

              <ul className="space-y-3 mt-auto">
                {after.map(text => (
                  <li key={text} className="flex items-start gap-3">
                    <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-green-100 text-green-600"><Check size={14} aria-hidden /></span>
                    <span className={`text-sm font-medium leading-snug ${txtSub}`}>{text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </AnimSection>
        </div>
      </div>
    </section>
  );
}
