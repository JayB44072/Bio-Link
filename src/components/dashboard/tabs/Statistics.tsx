import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Profile, Transaction, PageView } from '../../../lib/types';
import { useLang } from '../../../lib/LanguageContext';
import { useAppPrefs } from '../../../lib/AppPrefsContext';
import { supabase } from '../../../lib/supabase';
import { Lock, Eye, ShoppingCart, TrendingUp, DollarSign, ArrowUpRight, Activity, Download, Zap, Star } from 'lucide-react';
import { BRAND, GRADIENTS } from '../../../lib/theme';
import { dashPalette } from '../../../lib/dashPalette';

interface StatisticsProps { profile: Profile; }
type Period = '7d' | '30d' | '3m' | '1y';
const PERIOD_DAYS: Record<Period, number> = { '7d': 7, '30d': 30, '3m': 90, '1y': 365 };

/* ── Animated counter hook ── */
function useAnimatedNumber(target: number, duration = 1200) {
  const [current, setCurrent] = useState(0);
  const rafRef = useRef<number>(0);
  useEffect(() => {
    const start = Date.now();
    const from = 0;
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(from + (target - from) * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);
  return current;
}

/* ── Fade-in mount hook ── */
function useFadeIn(delay = 0) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return visible;
}

interface ChartPoint { label: string; revenue: number; sales: number; }

/* ══ SVG Line Chart ══ */
function LineChart({
  data, valueKey, color, gradStart, gradEnd, height = 160,
}: {
  data: ChartPoint[];
  valueKey: 'revenue' | 'sales';
  color: string;
  gradStart: string;
  gradEnd: string;
  height?: number;
}) {
  const [animated, setAnimated] = useState(false);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 200); return () => clearTimeout(t); }, [data]);

  if (data.length < 2) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>Pas encore de données</p>
      </div>
    );
  }

  const values = data.map(d => d[valueKey]);
  const max = Math.max(...values, 1);
  const W = 480; const H = height;
  const PAD = { t: 14, r: 10, b: 32, l: 48 };
  const cW = W - PAD.l - PAD.r; const cH = H - PAD.t - PAD.b;

  const pts = data.map((d, i) => ({
    x: PAD.l + (i / (data.length - 1)) * cW,
    y: PAD.t + (1 - d[valueKey] / max) * cH,
    v: d[valueKey],
    label: d.label,
  }));

  const smooth = (ps: typeof pts) => {
    return ps.map((p, i) => {
      if (i === 0) return `M${p.x.toFixed(1)},${p.y.toFixed(1)}`;
      const prev = ps[i - 1];
      const cp1x = prev.x + (p.x - prev.x) * 0.4;
      const cp2x = p.x - (p.x - prev.x) * 0.4;
      return `C${cp1x.toFixed(1)},${prev.y.toFixed(1)} ${cp2x.toFixed(1)},${p.y.toFixed(1)} ${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    }).join(' ');
  };

  const linePath = smooth(pts);
  const bottom = PAD.t + cH;
  const areaPath = `${linePath} L${pts[pts.length - 1].x.toFixed(1)},${bottom} L${PAD.l},${bottom} Z`;
  const totalLen = pts.length * 80; // approx

  const gradId = `lg-${valueKey}`;
  const maskId = `mask-${valueKey}`;
  const glowId = `glow-${valueKey}`;

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => ({
    y: PAD.t + (1 - f) * cH,
    v: f * max,
  }));

  function fmt(v: number) {
    if (valueKey === 'revenue') {
      if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
      if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
      return `${Math.round(v)}`;
    }
    return `${Math.round(v)}`;
  }

  const step = Math.max(1, Math.floor(pts.length / 5));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height, overflow: 'visible' }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={gradStart} stopOpacity="0.45" />
          <stop offset="100%" stopColor={gradEnd} stopOpacity="0" />
        </linearGradient>
        <filter id={glowId} x="-20%" y="-40%" width="140%" height="180%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <clipPath id={maskId}>
          <rect x={PAD.l} y={PAD.t} width={animated ? cW : 0} height={cH + 10}
            style={{ transition: `width ${1000}ms cubic-bezier(.4,0,.2,1)` }} />
        </clipPath>
      </defs>

      {/* Grid lines */}
      {yTicks.map((tick, i) => (
        <g key={i}>
          <line x1={PAD.l} y1={tick.y} x2={W - PAD.r} y2={tick.y}
            stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="4 3" />
          <text x={PAD.l - 7} y={tick.y + 4} textAnchor="end"
            fontSize="9" fill="rgba(255,255,255,0.25)">{fmt(tick.v)}</text>
        </g>
      ))}

      {/* Area */}
      <path d={areaPath} fill={`url(#${gradId})`} clipPath={`url(#${maskId})`} />

      {/* Line */}
      <path d={linePath} fill="none" stroke={color} strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round"
        filter={`url(#${glowId})`}
        clipPath={`url(#${maskId})`}
        style={{
          strokeDasharray: totalLen,
          strokeDashoffset: animated ? 0 : totalLen,
          transition: `stroke-dashoffset 1000ms cubic-bezier(.4,0,.2,1)`,
        }}
      />

      {/* Hover interaction zones */}
      {pts.map((p, i) => (
        <rect key={i}
          x={p.x - cW / pts.length / 2} y={PAD.t} width={cW / pts.length} height={cH}
          fill="transparent"
          onMouseEnter={() => setHoverIdx(i)}
          onMouseLeave={() => setHoverIdx(null)}
          style={{ cursor: 'crosshair' }}
        />
      ))}

      {/* Hover tooltip */}
      {hoverIdx !== null && animated && (() => {
        const p = pts[hoverIdx];
        const tw = 80; const th = 28;
        const tx = Math.min(Math.max(p.x - tw / 2, PAD.l), W - PAD.r - tw);
        return (
          <g>
            <line x1={p.x} y1={PAD.t} x2={p.x} y2={PAD.t + cH}
              stroke={color} strokeWidth="1" strokeOpacity="0.4" strokeDasharray="3 3" />
            <circle cx={p.x} cy={p.y} r={5} fill={color}
              stroke="rgba(0,0,0,0.6)" strokeWidth="2" filter={`url(#${glowId})`} />
            <rect x={tx} y={p.y - th - 8} width={tw} height={th} rx="6"
              fill="rgba(10,10,30,0.92)" stroke={color} strokeWidth="1" strokeOpacity="0.5" />
            <text x={tx + tw / 2} y={p.y - th + 2} textAnchor="middle"
              fontSize="8.5" fill="rgba(255,255,255,0.5)">{p.label}</text>
            <text x={tx + tw / 2} y={p.y - 12} textAnchor="middle"
              fontSize="10" fontWeight="bold" fill={color}>{fmt(p.v)}</text>
          </g>
        );
      })()}

      {/* End glow dot */}
      {animated && (
        <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r={4}
          fill={color} stroke="rgba(0,0,0,0.7)" strokeWidth="2"
          filter={`url(#${glowId})`} />
      )}

      {/* X axis labels */}
      {pts.filter((_, i) => i % step === 0 || i === pts.length - 1).map(p => (
        <text key={p.x} x={p.x} y={H - 8} textAnchor="middle"
          fontSize="8.5" fill="rgba(255,255,255,0.28)">{p.label}</text>
      ))}
    </svg>
  );
}

/* ══ KPI Card ══ */
function KpiCard({
  label, rawValue, unit, icon: Icon, color, sub, delay,
}: {
  label: string; rawValue: number; unit?: string; icon: React.ElementType;
  color: string; sub?: string; delay: number;
}) {
  const { isDark: dk } = useAppPrefs();
  const { surface, border, txtPrim, txtSub } = dashPalette(dk);

  const animated = useFadeIn(delay);
  const count = useAnimatedNumber(rawValue, 1200);
  const [hover, setHover] = useState(false);

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="rounded-2xl p-4 relative overflow-hidden cursor-default transition-all duration-500"
      style={{
        background: surface,
        border: `1px solid ${hover ? color + '55' : border}`,
        boxShadow: hover
          ? `0 12px 32px ${color}22, 0 0 0 1px ${color}33`
          : dk ? 'none' : '0 2px 16px rgba(108,99,255,0.05)',
        opacity: animated ? 1 : 0,
        transform: animated ? 'translateY(0)' : 'translateY(12px)',
        transition: `opacity 500ms ${delay}ms, transform 500ms ${delay}ms, box-shadow 300ms, border-color 300ms`,
      }}>
      {/* Background glow on hover */}
      <div className="absolute inset-0 pointer-events-none transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle at top right, ${color}12 0%, transparent 70%)`,
          opacity: hover ? 1 : 0,
        }} />
      <div className="relative">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 transition-transform duration-300"
          style={{
            background: hover ? color : `${color}1f`,
            transform: hover ? 'scale(1.1) rotate(-5deg)' : 'scale(1)',
          }}>
          <Icon size={15} color={hover ? '#fff' : color} />
        </div>
        <p className="font-black text-xl leading-none" style={{ color: txtPrim }}>
          {count.toLocaleString()}
          {unit && <span className="text-xs font-bold ml-1" style={{ color: txtSub }}>{unit}</span>}
        </p>
        <p className="text-[11px] mt-1 font-semibold" style={{ color: txtSub }}>{label}</p>
        {sub && <p className="text-[10px] mt-0.5" style={{ color: dk ? 'rgba(139,124,255,0.45)' : '#c8c4e8' }}>{sub}</p>}
      </div>
    </div>
  );
}

export default function Statistics({ profile }: StatisticsProps) {
  const { lang } = useLang();
  const { isDark: dk } = useAppPrefs();
  const hasAccess = profile.plan_type === 'business' || profile.plan_type === 'premium';

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [views, setViews] = useState<PageView[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('7d');
  const [mounted, setMounted] = useState(false);

  /* Theme tokens */
  const { surface, surfaceAlt, border, txtPrim, txtSub } = dashPalette(dk);
  const chartBg    = dk ? '#0b0b1f' : '#14142a';

  useEffect(() => { const t = setTimeout(() => setMounted(true), 50); return () => clearTimeout(t); }, []);

  useEffect(() => {
    if (!hasAccess) { setLoading(false); return; }
    async function load() {
      const [viewsRes, txRes] = await Promise.all([
        supabase.from('page_views').select('*').eq('profile_id', profile.id),
        supabase.from('transactions').select('*').eq('seller_id', profile.user_id).order('created_at', { ascending: false }),
      ]);
      setViews((viewsRes.data || []) as PageView[]);
      setTransactions((txRes.data || []) as Transaction[]);
      setLoading(false);
    }
    load();
  }, [hasAccess, profile]);

  /* Chart data builder */
  const chartData = useMemo<ChartPoint[]>(() => {
    const days = PERIOD_DAYS[period];
    const now = new Date();
    const useMonths = period === '1y' || period === '3m';
    const bucketCount = useMonths ? (period === '1y' ? 12 : 12) : days;

    const buckets: ChartPoint[] = Array.from({ length: bucketCount }, (_, i) => {
      let label = '';
      if (useMonths) {
        const d = new Date(now);
        d.setMonth(d.getMonth() - (bucketCount - 1 - i));
        label = d.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { month: 'short' });
      } else {
        const d = new Date(now);
        d.setDate(d.getDate() - (days - 1 - i));
        label = d.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short' });
      }
      return { label, revenue: 0, sales: 0 };
    });

    transactions.forEach(tx => {
      const txDate = new Date(tx.created_at);
      const diffDays = (now.getTime() - txDate.getTime()) / 86400000;
      if (diffDays > days) return;
      let idx: number;
      if (useMonths) {
        const md = (now.getFullYear() - txDate.getFullYear()) * 12 + (now.getMonth() - txDate.getMonth());
        idx = bucketCount - 1 - md;
      } else {
        idx = bucketCount - 1 - Math.floor(diffDays);
      }
      if (idx >= 0 && idx < bucketCount) {
        buckets[idx].revenue += tx.seller_amount;
        buckets[idx].sales   += 1;
      }
    });
    return buckets;
  }, [transactions, period, lang]);

  /* KPIs */
  const periodDays = PERIOD_DAYS[period];
  const cutoff     = new Date(Date.now() - periodDays * 86400000).toISOString();
  const prevCutoff = new Date(Date.now() - periodDays * 2 * 86400000).toISOString();
  const periodTxs     = transactions.filter(tx => tx.created_at >= cutoff);
  const periodViews   = views.filter(v => v.viewed_at >= cutoff);
  const periodRevenue = periodTxs.reduce((s, t) => s + t.seller_amount, 0);
  const prevRevenue   = transactions.filter(tx => tx.created_at >= prevCutoff && tx.created_at < cutoff)
    .reduce((s, t) => s + t.seller_amount, 0);
  const revenueGrowth = prevRevenue > 0 ? ((periodRevenue - prevRevenue) / prevRevenue * 100) : null;
  const conversionRate = periodViews.length > 0 ? ((periodTxs.length / periodViews.length) * 100).toFixed(1) : '0';
  const totalRevenue   = transactions.reduce((s, t) => s + t.seller_amount, 0);

  /* Greeting */
  const greetingHour = new Date().getHours();
  const greeting = greetingHour < 12
    ? (lang === 'fr' ? 'Bonjour' : 'Good morning')
    : greetingHour < 18 ? (lang === 'fr' ? 'Bon après-midi' : 'Good afternoon')
    : (lang === 'fr' ? 'Bonsoir' : 'Good evening');

  const periodLabels: Record<Period, string> = {
    '7d': lang === 'fr' ? '7 jours' : '7 days',
    '30d': lang === 'fr' ? '30 jours' : '30 days',
    '3m': lang === 'fr' ? '3 mois' : '3 months',
    '1y': lang === 'fr' ? 'Année' : 'Year',
  };

  /* ── Locked ── */
  if (!hasAccess) {
    return (
      <div className="relative">
        <div className="blur-sm pointer-events-none select-none space-y-4">
          <div className="rounded-3xl p-6 h-32" style={{ background: 'linear-gradient(135deg,#1a1535,#251a35)', border: `1px solid ${border}` }} />
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl h-40" style={{ background: surfaceAlt, border: `1px solid ${border}` }} />
            <div className="rounded-2xl h-40" style={{ background: surfaceAlt, border: `1px solid ${border}` }} />
          </div>
          <div className="grid grid-cols-4 gap-3">
            {[0,1,2,3].map(i => <div key={i} className="rounded-2xl h-24" style={{ background: surfaceAlt, border: `1px solid ${border}` }} />)}
          </div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="rounded-3xl p-8 text-center max-w-sm mx-4 shadow-2xl backdrop-blur-sm"
            style={{ background: dk ? 'rgba(18,18,43,0.97)' : 'rgba(255,255,255,0.97)', border: `1px solid ${border}` }}>
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse"
              style={{ background: 'rgba(251,191,36,0.15)' }}>
              <Lock size={24} className="text-amber-500" />
            </div>
            <h3 className="font-bold text-lg mb-2" style={{ color: txtPrim }}>
              {lang === 'fr' ? 'Statistiques réservées Business / Premium' : 'Stats — Business / Premium'}
            </h3>
            <p className="text-sm leading-relaxed mb-4" style={{ color: txtSub }}>
              {lang === 'fr'
                ? 'Graphiques de ventes, taux de conversion et performances par période.'
                : 'Sales charts, conversion rates and period-based performance.'}
            </p>
            <span className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5"
              style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)' }}>
              <TrendingUp size={14} className="text-amber-500" />
              <span className="text-amber-500 text-xs font-semibold">Business / Premium</span>
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="relative">
          <div className="w-12 h-12 rounded-full animate-spin"
            style={{ border: '3px solid rgba(108,99,255,0.15)', borderTopColor: BRAND.pink }} />
          <div className="absolute inset-0 w-12 h-12 rounded-full animate-ping opacity-20"
            style={{ background: GRADIENTS.pinkViolet }} />
        </div>
      </div>
    );
  }

  /* ══════════ MAIN RENDER ══════════ */
  return (
    <div className="space-y-5">

      {/* ── Animated keyframes in a style tag ── */}
      <style>{`
        @keyframes statFloatA { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(10px,-15px) scale(1.05)} }
        @keyframes statFloatB { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-8px,12px) scale(0.95)} }
        @keyframes statPulse { 0%,100%{opacity:.6} 50%{opacity:1} }
        @keyframes statSlideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes statShimmer {
          0%{background-position:-200% 0}
          100%{background-position:200% 0}
        }
        .stat-shimmer {
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 50%, transparent 100%);
          background-size: 200% 100%;
          animation: statShimmer 2.5s linear infinite;
        }
        .stat-slide-up { animation: statSlideUp 0.5s ease forwards; }
      `}</style>

      {/* ── Welcome banner ── */}
      <div
        className="rounded-3xl p-5 md:p-6 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg,#12103a 0%,#1e1040 40%,#2d0f25 100%)',
          border: '1px solid rgba(255,107,157,0.2)',
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(-12px)',
          transition: 'opacity 600ms, transform 600ms',
        }}>
        {/* Animated blob 1 */}
        <div className="absolute -top-12 -right-12 w-56 h-56 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle,rgba(255,107,157,0.22) 0%,transparent 70%)',
            animation: 'statFloatA 8s ease-in-out infinite',
          }} />
        {/* Animated blob 2 */}
        <div className="absolute -bottom-16 -left-8 w-48 h-48 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle,rgba(108,99,255,0.18) 0%,transparent 70%)',
            animation: 'statFloatB 10s ease-in-out infinite',
          }} />
        {/* Shimmer overlay */}
        <div className="absolute inset-0 rounded-3xl stat-shimmer pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(255,107,157,0.18)', color: BRAND.pink, border: '1px solid rgba(255,107,157,0.35)' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                {lang === 'fr' ? 'Temps réel' : 'Real time'}
              </span>
              <span className="text-[10px] font-semibold" style={{ color: 'rgba(255,255,255,0.35)' }}>
                #{profile.username}
              </span>
            </div>
            <h1 className="font-black text-xl md:text-2xl text-white leading-tight">
              {greeting}, {(profile.display_name || profile.username || '').split(' ')[0]} 👋
            </h1>
            <p className="text-sm mt-1.5 flex items-center gap-2 flex-wrap" style={{ color: 'rgba(255,255,255,0.45)' }}>
              {lang === 'fr' ? "Chiffre d'affaires total :" : 'Total revenue:'}
              <span className="font-black text-base" style={{ color: BRAND.pink }}>
                {totalRevenue.toLocaleString()} FCFA
              </span>
              {transactions.length > 0 && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e' }}>
                  <Star size={8} fill="#22c55e" />
                  {transactions.length} {lang === 'fr' ? 'commandes' : 'orders'}
                </span>
              )}
            </p>
          </div>
          <button className="flex items-center gap-2 self-start sm:self-auto text-white/70 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all hover:text-white hover:scale-105 shrink-0"
            style={{
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.12)',
            }}>
            <Download size={13} />
            {lang === 'fr' ? 'Rapport mensuel' : 'Monthly report'}
          </button>
        </div>
      </div>

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          label={lang === 'fr' ? 'Vues' : 'Views'}
          rawValue={periodViews.length}
          icon={Eye}
          color={BRAND.violet}
          sub={`${views.length.toLocaleString()} total`}
          delay={0}
        />
        <KpiCard
          label={lang === 'fr' ? 'Commandes' : 'Orders'}
          rawValue={periodTxs.length}
          icon={ShoppingCart}
          color="#22c55e"
          sub={`${transactions.length} total`}
          delay={80}
        />
        <KpiCard
          label={lang === 'fr' ? 'Revenus' : 'Revenue'}
          rawValue={periodRevenue}
          unit="FCFA"
          icon={DollarSign}
          color={BRAND.pink}
          sub={revenueGrowth !== null
            ? `${revenueGrowth >= 0 ? '+' : ''}${revenueGrowth.toFixed(1)}% vs période préc.`
            : undefined}
          delay={160}
        />
        <KpiCard
          label={lang === 'fr' ? 'Conversion' : 'Conversion'}
          rawValue={parseFloat(conversionRate)}
          unit="%"
          icon={TrendingUp}
          color="#f59e0b"
          sub={lang === 'fr' ? 'vues → commandes' : 'views → orders'}
          delay={240}
        />
      </div>

      {/* ── Charts card ── */}
      <div
        className="rounded-3xl overflow-hidden"
        style={{
          background: surface,
          border: `1px solid ${border}`,
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(16px)',
          transition: 'opacity 600ms 200ms, transform 600ms 200ms',
        }}>
        {/* Chart header */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b flex-wrap" style={{ borderColor: border }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,107,157,0.12)' }}>
              <Activity size={13} style={{ color: BRAND.pink }} />
            </div>
            <h3 className="font-bold text-sm" style={{ color: txtPrim }}>
              {lang === 'fr' ? 'Performances & Analytiques Ventes' : 'Sales Performance & Analytics'}
            </h3>
          </div>
          <div className="flex items-center gap-0.5 p-0.5 rounded-xl" style={{ background: dk ? 'rgba(139,124,255,0.08)' : '#f0eeff' }}>
            {(['7d', '30d', '3m', '1y'] as Period[]).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className="text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all duration-200"
                style={{
                  background: period === p ? GRADIENTS.pinkViolet : 'transparent',
                  color: period === p ? '#fff' : txtSub,
                  boxShadow: period === p ? '0 2px 8px rgba(255,107,157,0.35)' : 'none',
                }}>
                {periodLabels[p]}
              </button>
            ))}
          </div>
        </div>

        {/* Two charts side by side on a dark canvas */}
        <div className="grid grid-cols-1 lg:grid-cols-2" style={{ background: chartBg }}>
          {/* Revenue */}
          <div className="p-5 lg:border-r" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {lang === 'fr' ? "Évolution du chiffre d'affaires (FCFA)" : 'Revenue trend (FCFA)'}
                </p>
                <p className="font-black text-2xl text-white leading-none">
                  {periodRevenue.toLocaleString()}
                  <span className="text-xs font-bold ml-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>FCFA</span>
                </p>
                {revenueGrowth !== null && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold mt-1.5 px-2 py-0.5 rounded-full"
                    style={
                      revenueGrowth >= 0
                        ? { background: 'rgba(34,197,94,0.15)', color: '#22c55e' }
                        : { background: 'rgba(239,68,68,0.15)', color: '#ef4444' }
                    }>
                    <ArrowUpRight size={9} style={{ transform: revenueGrowth < 0 ? 'rotate(90deg)' : 'none' }} />
                    {revenueGrowth >= 0 ? '+' : ''}{revenueGrowth.toFixed(1)}% vs M-1
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
                <span className="text-[9px] font-bold" style={{ color: 'rgba(255,255,255,0.3)' }}>LIVE</span>
              </div>
            </div>
            <LineChart
              data={chartData}
              valueKey="revenue"
              color={BRAND.pink}
              gradStart={BRAND.pink}
              gradEnd={BRAND.violet}
              height={160}
            />
          </div>

          {/* Sales volume */}
          <div className="p-5 border-t lg:border-t-0" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {lang === 'fr' ? 'Volume de services vendus' : 'Services sold volume'}
                </p>
                <p className="font-black text-2xl text-white leading-none">
                  {periodTxs.length}
                  <span className="text-xs font-bold ml-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    {lang === 'fr' ? 'commandes' : 'orders'}
                  </span>
                </p>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold mt-1.5 px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(108,99,255,0.18)', color: '#8B7CFF' }}>
                  <Zap size={8} />
                  Conv. {conversionRate}%
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: BRAND.violet }} />
                <span className="text-[9px] font-bold" style={{ color: 'rgba(255,255,255,0.3)' }}>LIVE</span>
              </div>
            </div>
            <LineChart
              data={chartData}
              valueKey="sales"
              color={BRAND.violet}
              gradStart={BRAND.violet}
              gradEnd={BRAND.cyan}
              height={160}
            />
          </div>
        </div>
      </div>

      {/* ── Recent transactions ── */}
      <div
        className="rounded-3xl overflow-hidden"
        style={{
          background: surface,
          border: `1px solid ${border}`,
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 600ms 350ms, transform 600ms 350ms',
        }}>
        <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: border }}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.12)' }}>
            <ArrowUpRight size={13} className="text-green-500" />
          </div>
          <h3 className="font-bold text-sm" style={{ color: txtPrim }}>
            {lang === 'fr' ? 'Transactions récentes' : 'Recent transactions'}
          </h3>
          <span className="ml-auto text-[10px] font-black px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e' }}>
            {transactions.length}
          </span>
        </div>

        {transactions.length === 0 ? (
          <div className="py-14 text-center">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
              style={{ background: dk ? 'rgba(139,124,255,0.08)' : '#f0eeff' }}>
              <ShoppingCart size={20} style={{ color: txtSub }} />
            </div>
            <p className="text-sm font-medium" style={{ color: txtSub }}>
              {lang === 'fr' ? 'Aucune transaction pour le moment' : 'No transactions yet'}
            </p>
            <p className="text-xs mt-1" style={{ color: dk ? 'rgba(139,124,255,0.3)' : '#d0ccee' }}>
              {lang === 'fr' ? 'Partagez votre lien pour commencer à vendre' : 'Share your link to start selling'}
            </p>
          </div>
        ) : (
          <div>
            {transactions.slice(0, 10).map((tx, i) => {
              const isPos = tx.status === 'completed' || tx.status === 'paid';
              return (
                <div key={tx.id}
                  className="flex items-center gap-3 px-5 py-3.5 border-b last:border-b-0 group transition-colors"
                  style={{
                    borderColor: border,
                    background: 'transparent',
                    animation: `statSlideUp 0.4s ease ${i * 40}ms both`,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = dk ? 'rgba(139,124,255,0.04)' : '#fdfcff'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-black text-white shrink-0 transition-transform duration-200 group-hover:scale-110"
                    style={{ background: `linear-gradient(135deg, ${[BRAND.violet,BRAND.pink,BRAND.cyan,'#22c55e','#f59e0b'][i % 5]}, #FF6B9D)` }}>
                    {(tx.buyer_name || '?').slice(0, 1).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: txtPrim }}>{tx.buyer_name}</p>
                    <p className="text-[11px]" style={{ color: txtSub }}>
                      {new Date(tx.created_at).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                      {' · '}<span className="uppercase font-bold">{tx.payment_method}</span>
                    </p>
                  </div>
                  <span className="text-[9px] font-black px-2.5 py-1 rounded-full shrink-0 hidden sm:inline-flex"
                    style={
                      isPos
                        ? { background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }
                        : tx.status === 'pending'
                          ? { background: 'rgba(251,191,36,0.12)', color: '#f59e0b', border: '1px solid rgba(251,191,36,0.2)' }
                          : { background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.15)' }
                    }>
                    {tx.status}
                  </span>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black" style={{ color: '#22c55e' }}>+{tx.seller_amount.toLocaleString()}</p>
                    <p className="text-[10px] font-medium" style={{ color: txtSub }}>{tx.currency}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
