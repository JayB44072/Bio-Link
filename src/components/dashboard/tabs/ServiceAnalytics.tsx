import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { Transaction, Service } from '../../../lib/types';
import { TrendingUp, BarChart2, Sparkles, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { BRAND } from '../../../lib/theme';

interface Props {
  transactions: Transaction[];
  services: Service[];
  dk: boolean;
  txtPrim: string;
  txtSub: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  lang: string;
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  svgX: number;
  label: string;
  value: string;
  idx: number;
}

/* ────────────────────────────────────────────
   Interactive line chart
──────────────────────────────────────────── */
function LineChart({
  data,
  labels,
  color,
  gradientId,
  txtPrim,
  txtSub,
  surface,
  border,
  formatValue,
  unit,
  animated,
}: {
  data: number[];
  labels: string[];
  color: string;
  gradientId: string;
  txtPrim: string;
  txtSub: string;
  surface: string;
  border: string;
  formatValue: (v: number) => string;
  unit?: string;
  animated?: boolean;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false, x: 0, y: 0, svgX: 0, label: '', value: '', idx: -1,
  });
  const [lineLen, setLineLen] = useState(0);
  const [drawn, setDrawn] = useState(false);

  const W = 500, H = 110, padX = 10, padY = 12;
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => ({
    x: padX + (i / Math.max(data.length - 1, 1)) * (W - padX * 2),
    y: H - padY - (v / max) * (H - padY * 2),
    v,
  }));

  /* Smooth bezier line */
  let linePath = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const cx = (pts[i - 1].x + pts[i].x) / 2;
    linePath += ` C ${cx} ${pts[i - 1].y} ${cx} ${pts[i].y} ${pts[i].x} ${pts[i].y}`;
  }
  const areaPath = linePath + ` L ${pts[pts.length - 1].x} ${H} L ${pts[0].x} ${H} Z`;

  /* Measure path for dash animation */
  useEffect(() => {
    if (pathRef.current) {
      const len = pathRef.current.getTotalLength();
      setLineLen(len);
      setDrawn(false);
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => setDrawn(true));
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [data]);

  /* Mouse tracking → nearest point */
  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const relX = (mouseX / rect.width) * W;
    /* Find nearest point */
    let nearest = 0;
    let minDist = Infinity;
    pts.forEach((p, i) => {
      const dist = Math.abs(p.x - relX);
      if (dist < minDist) { minDist = dist; nearest = i; }
    });
    const p = pts[nearest];
    const screenX = (p.x / W) * rect.width + rect.left - rect.left;
    const screenY = (p.y / H) * rect.height;
    setTooltip({
      visible: true,
      x: screenX,
      y: screenY,
      svgX: p.x,
      label: labels[nearest] ?? '',
      value: formatValue(p.v),
      idx: nearest,
    });
  }, [pts, labels, formatValue]);

  const handleMouseLeave = useCallback(() => {
    setTooltip(t => ({ ...t, visible: false, idx: -1 }));
  }, []);

  const activeP = tooltip.idx >= 0 ? pts[tooltip.idx] : null;

  return (
    <div className="relative select-none">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full overflow-visible"
        style={{ height: 100, cursor: 'crosshair' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
        {[0.25, 0.5, 0.75].map(frac => {
          const gy = H - padY - frac * (H - padY * 2);
          return (
            <line key={frac} x1={padX} y1={gy} x2={W - padX} y2={gy}
              stroke={border} strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />
          );
        })}

        {/* Area fill */}
        <path d={areaPath} fill={`url(#${gradientId})`} />

        {/* Animated line */}
        <path
          ref={pathRef}
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            strokeDasharray: lineLen || 1000,
            strokeDashoffset: drawn ? 0 : (lineLen || 1000),
            transition: drawn ? 'stroke-dashoffset 1.1s cubic-bezier(.4,0,.2,1)' : 'none',
          }}
        />

        {/* Hover vertical line */}
        {activeP && (
          <line
            x1={activeP.x} y1={padY}
            x2={activeP.x} y2={H}
            stroke={color} strokeWidth="1" strokeDasharray="3 3" opacity="0.5"
          />
        )}

        {/* All points — small dots */}
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={tooltip.idx === i ? 5 : 2.5}
            fill={tooltip.idx === i ? color : surface}
            stroke={color} strokeWidth="2"
            style={{ transition: 'r .12s ease' }}
          />
        ))}

        {/* Active point glow */}
        {activeP && (
          <circle cx={activeP.x} cy={activeP.y} r={8}
            fill={color} opacity="0.15" />
        )}
      </svg>

      {/* Tooltip */}
      {tooltip.visible && activeP && (
        <div
          className="absolute pointer-events-none z-20 px-3 py-2 rounded-xl text-xs font-bold shadow-xl"
          style={{
            left: `${(activeP.x / W) * 100}%`,
            top: `${(activeP.y / H) * 100 - 10}%`,
            transform: 'translate(-50%, -100%)',
            background: surface,
            border: `1px solid ${color}`,
            color: txtPrim,
            boxShadow: `0 4px 20px rgba(0,0,0,0.25), 0 0 0 1px ${color}33`,
            minWidth: 90,
          }}>
          <p className="text-[10px] font-semibold mb-0.5" style={{ color: txtSub }}>{tooltip.label}</p>
          <p style={{ color }}>{tooltip.value}{unit ? <span className="ml-1 text-[10px] opacity-60">{unit}</span> : null}</p>
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────
   Auto-analysis of a data series
──────────────────────────────────────────── */
function useAnalysis(data: number[], lang: string, type: 'services' | 'revenue') {
  return useMemo(() => {
    if (data.every(v => v === 0)) {
      return lang === 'fr'
        ? type === 'services'
          ? 'Aucun service ajouté ce mois. Créez votre premier service pour commencer à vendre.'
          : 'Aucune transaction ce mois. Partagez votre lien bio pour générer des ventes.'
        : type === 'services'
          ? 'No services added this month. Create your first service to start selling.'
          : 'No transactions this month. Share your bio link to generate sales.';
    }
    const total = data.reduce((a, b) => a + b, 0);
    const last7 = data.slice(-7).reduce((a, b) => a + b, 0);
    const prev7 = data.slice(-14, -7).reduce((a, b) => a + b, 0);
    const trend = prev7 === 0 ? null : ((last7 - prev7) / prev7) * 100;
    const maxIdx = data.indexOf(Math.max(...data));
    const daysAgo = data.length - 1 - maxIdx;

    const tips: string[] = [];

    if (type === 'revenue') {
      if (trend !== null && trend > 20) {
        tips.push(lang === 'fr'
          ? `📈 Vos revenus progressent de +${Math.round(trend)}% cette semaine — continuez sur cette lancée !`
          : `📈 Revenue up +${Math.round(trend)}% this week — keep the momentum!`);
      } else if (trend !== null && trend < -20) {
        tips.push(lang === 'fr'
          ? `⚠️ Baisse de ${Math.abs(Math.round(trend))}% vs la semaine passée. Relancez vos clients via WhatsApp.`
          : `⚠️ Down ${Math.abs(Math.round(trend))}% vs last week. Re-engage clients via WhatsApp.`);
      } else if (trend === null || prev7 === 0) {
        tips.push(lang === 'fr'
          ? '💡 Activez votre lien WhatsApp pour que les clients commandent directement.'
          : '💡 Enable your WhatsApp link so clients can order directly.');
      } else {
        tips.push(lang === 'fr'
          ? '📊 Revenus stables cette semaine. Ajoutez une description plus détaillée à vos services pour convertir davantage.'
          : '📊 Stable revenue this week. Add more detail to your service descriptions to convert more.');
      }
      if (daysAgo <= 7) {
        tips.push(lang === 'fr'
          ? `🏆 Votre meilleure journée était il y a ${daysAgo} jour(s). Publiez un service similaire pour reproduire ce succès.`
          : `🏆 Your best day was ${daysAgo} day(s) ago. Publish a similar service to replicate that success.`);
      }
    } else {
      if (total > 0) {
        tips.push(lang === 'fr'
          ? `✅ ${total} service${total > 1 ? 's' : ''} ajouté${total > 1 ? 's' : ''} ce mois. Activez-les tous pour maximiser votre visibilité.`
          : `✅ ${total} service${total > 1 ? 's' : ''} added this month. Activate them all for maximum visibility.`);
      }
      tips.push(lang === 'fr'
        ? '💡 Ajoutez une vidéo de présentation à chaque service pour augmenter les conversions de 40%.'
        : '💡 Add a presentation video to each service to boost conversions by 40%.');
    }

    return tips.join(' ');
  }, [data, lang, type]);
}

/* ────────────────────────────────────────────
   Main component
──────────────────────────────────────────── */
export default function ServiceAnalytics({
  transactions, services, dk, txtPrim, txtSub, surface, surfaceAlt, border, lang,
}: Props) {
  const now = new Date();
  const days = 30;

  /* Day labels */
  const dayLabels = useMemo(() => {
    return Array.from({ length: days }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (days - 1 - i));
      return d.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short' });
    });
  }, [lang]);

  /* Services created per day — cumulative */
  const { servicesByDay } = useMemo(() => {
    const daily = new Array(days).fill(0);
    services.forEach(svc => {
      const diff = Math.floor((now.getTime() - new Date(svc.created_at).getTime()) / 86400000);
      if (diff >= 0 && diff < days) daily[days - 1 - diff]++;
    });
    const cum = daily.reduce<number[]>((acc, v) => {
      acc.push((acc[acc.length - 1] ?? 0) + v);
      return acc;
    }, []);
    return { servicesByDay: cum, dailyServices: daily };
  }, [services]);

  /* Revenue per day */
  const { revenueByDay, totalRevenue, trend } = useMemo(() => {
    const arr = new Array(days).fill(0);
    transactions.forEach(tx => {
      const diff = Math.floor((now.getTime() - new Date(tx.created_at).getTime()) / 86400000);
      if (diff >= 0 && diff < days) arr[days - 1 - diff] += tx.seller_amount || 0;
    });
    const total = arr.reduce((a, b) => a + b, 0);
    const last7 = arr.slice(-7).reduce((a, b) => a + b, 0);
    const prev7 = arr.slice(-14, -7).reduce((a, b) => a + b, 0);
    const t = prev7 === 0 ? null : Math.round(((last7 - prev7) / prev7) * 100);
    return { revenueByDay: arr, totalRevenue: total, trend: t };
  }, [transactions]);

  const currency = transactions[0]?.currency || 'FCFA';
  const activeCount = services.filter(s => s.is_active).length;

  const svcAnalysis = useAnalysis(servicesByDay, lang, 'services');
  const revAnalysis = useAnalysis(revenueByDay, lang, 'revenue');

  const cardStyle = { background: surface, border: `1px solid ${border}`, borderRadius: '1.25rem' };

  const TrendBadge = ({ t }: { t: number | null }) => {
    if (t === null) return null;
    const up = t >= 0;
    return (
      <span className="flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full ml-auto"
        style={{
          background: up ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
          color: up ? '#22c55e' : '#ef4444',
        }}>
        {up ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
        {Math.abs(t)}%
      </span>
    );
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">

      {/* ── Évolution des services ── */}
      <div className="p-5" style={cardStyle}>
        <div className="flex items-center gap-2 mb-1">
          <BarChart2 size={13} style={{ color: BRAND.violet }} />
          <span className="text-[11px] font-black uppercase tracking-wide" style={{ color: txtPrim }}>
            {lang === 'fr' ? 'Évolution des services' : 'Services growth'}
          </span>
          <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(108,99,255,0.12)', color: BRAND.violet }}>30j</span>
        </div>

        <div className="flex items-baseline gap-2 mb-4">
          <p className="text-2xl font-black" style={{ color: BRAND.violet }}>{activeCount}</p>
          <span className="text-xs font-semibold" style={{ color: txtSub }}>
            {lang === 'fr' ? 'services actifs' : 'active services'}
          </span>
        </div>

        <LineChart
          data={servicesByDay}
          labels={dayLabels}
          color={BRAND.violet}
          gradientId="svc-grad"
          txtPrim={txtPrim}
          txtSub={txtSub}
          surface={surface}
          border={border}
          formatValue={v => String(Math.round(v))}
          unit={lang === 'fr' ? 'svc' : 'svc'}
          animated
        />

        {/* Analysis */}
        <div className="mt-4 p-3 rounded-xl flex gap-2"
          style={{ background: 'rgba(108,99,255,0.07)', border: '1px solid rgba(108,99,255,0.12)' }}>
          <Sparkles size={12} className="shrink-0 mt-0.5" style={{ color: BRAND.violet }} />
          <p className="text-[11px] leading-relaxed" style={{ color: txtSub }}>{svcAnalysis}</p>
        </div>
      </div>

      {/* ── Revenus des services ── */}
      <div className="p-5" style={cardStyle}>
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp size={13} style={{ color: '#22c55e' }} />
          <span className="text-[11px] font-black uppercase tracking-wide" style={{ color: txtPrim }}>
            {lang === 'fr' ? 'Revenus des services' : 'Service revenue'}
          </span>
          <TrendBadge t={trend} />
        </div>

        <div className="flex items-baseline gap-2 mb-4">
          <p className="text-2xl font-black" style={{ color: '#22c55e' }}>
            {totalRevenue.toLocaleString()}
          </p>
          <span className="text-xs font-semibold" style={{ color: txtSub }}>{currency}</span>
        </div>

        <LineChart
          data={revenueByDay}
          labels={dayLabels}
          color="#22c55e"
          gradientId="rev-grad"
          txtPrim={txtPrim}
          txtSub={txtSub}
          surface={surface}
          border={border}
          formatValue={v => v.toLocaleString()}
          unit={currency}
          animated
        />

        {/* Analysis */}
        <div className="mt-4 p-3 rounded-xl flex gap-2"
          style={{ background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.12)' }}>
          <Sparkles size={12} className="shrink-0 mt-0.5" style={{ color: '#22c55e' }} />
          <p className="text-[11px] leading-relaxed" style={{ color: txtSub }}>{revAnalysis}</p>
        </div>
      </div>

    </div>
  );
}
