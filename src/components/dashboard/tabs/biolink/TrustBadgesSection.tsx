import { ShieldCheck } from 'lucide-react';
import { BRAND } from '../../../../lib/theme';
import { useBioTheme } from './bioTheme';

const BADGES = [
  { labelFr: 'Vendeur vérifié',   labelEn: 'Verified seller', critFr: 'Forfait payant OU 5+ commandes',   critEn: 'Paid plan OR 5+ orders' },
  { labelFr: 'Expédition rapide', labelEn: 'Fast shipping',   critFr: 'Expédition médiane < 24h (5+ cmd)', critEn: 'Median ship < 24h (5+ orders)' },
  { labelFr: 'Top vendeur',       labelEn: 'Top seller',      critFr: '20+ commandes livrées',             critEn: '20+ completed orders' },
  { labelFr: 'Réactif',           labelEn: 'Active seller',   critFr: 'Connecté cette semaine',            critEn: 'Active this week' },
  { labelFr: 'Fiable',            labelEn: 'Reliable',        critFr: '< 5% annulations (10+ commandes)',  critEn: '< 5% cancellations (10+ orders)' },
];

/** Section « Badges de confiance » : information seulement, les badges sont attribués automatiquement. */
export default function TrustBadgesSection() {
  const { fr, surface, border, txtPrim, txtSub, fieldBg, inputBorder } = useBioTheme();

  return (
    <div className="rounded-3xl p-5" style={{ background: surface, border: `1px solid ${border}` }}>
      <div className="flex items-center gap-2.5 mb-4">
        <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(108,99,255,0.15)' }}>
          <ShieldCheck size={17} aria-hidden style={{ color: BRAND.violet }} />
        </span>
        <div>
          <h2 className="font-black text-base leading-tight" style={{ color: txtPrim }}>
            {fr ? 'Badges de confiance' : 'Trust badges'}
          </h2>
          <p className="text-[11px] mt-0.5" style={{ color: txtSub }}>
            {fr ? 'Attribués automatiquement — impossibles à activer manuellement.' : 'Awarded automatically — cannot be self-declared.'}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {BADGES.map(b => (
          <div key={b.labelFr} className="flex items-center gap-3 px-3 py-2.5 rounded-2xl"
            style={{ background: fieldBg, border: `1px solid ${inputBorder}` }}>
            <ShieldCheck size={14} aria-hidden style={{ color: BRAND.violet }} className="shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-bold truncate" style={{ color: txtPrim }}>{fr ? b.labelFr : b.labelEn}</p>
              <p className="text-[10px] leading-snug" style={{ color: txtSub }}>{fr ? b.critFr : b.critEn}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
