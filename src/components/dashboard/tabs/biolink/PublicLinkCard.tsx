import { Check, Copy, ExternalLink, Link2 } from 'lucide-react';
import { BRAND } from '../../../../lib/theme';
import { useBioTheme } from './bioTheme';
import type { BioLinkState } from './useBioLinkForm';

/** Carte pleine largeur « Mon lien bio public » : adresse, copie et visite. */
export default function PublicLinkCard({ state }: { state: BioLinkState }) {
  const { t, fr } = useBioTheme();
  const { publicUrl, copied, handleCopy } = state;

  return (
    <div className="rounded-3xl p-5 md:p-6 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg,#6C63FF 0%,#8B5FBF 55%,#FF6B9D 120%)' }}>
      <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }} />
      <div className="absolute -bottom-14 -left-8 w-32 h-32 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.18)' }}>
            <Link2 size={15} color="#fff" aria-hidden />
          </span>
          <h2 className="text-white font-black text-base">{fr ? 'Mon lien bio public' : 'My public bio link'}</h2>
        </div>
        <div className="rounded-2xl px-4 py-3 mb-4 font-mono text-[13px] truncate"
          style={{ background: 'rgba(0,0,0,0.18)', color: 'rgba(255,255,255,0.9)' }}>
          {publicUrl.replace(/^https?:\/\//, '')}
        </div>
        <div className="flex flex-col sm:flex-row gap-2.5">
          <button onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-2 font-bold text-sm py-3 rounded-2xl transition-all"
            style={{ background: '#fff', color: BRAND.violet }}>
            {copied ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />}
            {copied ? t.copied : t.copyLink}
          </button>
          <a href={publicUrl} target="_blank" rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 font-bold text-sm py-3 rounded-2xl transition-all border-2"
            style={{ borderColor: 'rgba(255,255,255,0.5)', color: '#fff' }}>
            <ExternalLink size={15} aria-hidden />
            {t.visitPublicPage}
          </a>
        </div>
      </div>
    </div>
  );
}
