import React, { useEffect, useState } from 'react';
import { Profile, Transaction, PageView } from '../../../lib/types';
import { useLang } from '../../../lib/LanguageContext';
import { useAppPrefs } from '../../../lib/AppPrefsContext';
import { supabase } from '../../../lib/supabase';
import { Lock, Eye, ShoppingCart, TrendingUp, DollarSign, BarChart2, Activity, ArrowUpRight } from 'lucide-react';

interface StatisticsProps {
  profile: Profile;
}

interface Stats {
  totalViews: number;
  totalSales: number;
  totalRevenue: number;
  viewsThisMonth: number;
  salesThisMonth: number;
  revenueThisMonth: number;
  recentTransactions: Transaction[];
}

export default function Statistics({ profile }: StatisticsProps) {
  const { t } = useLang();
  const { isDark: dk } = useAppPrefs();
  const hasAccess = profile.plan_type === 'business' || profile.plan_type === 'premium';
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  /* ── Theme tokens ── */
  const surface    = dk ? '#12122b' : '#ffffff';
  const surfaceAlt = dk ? '#191938' : '#faf9ff';
  const border     = dk ? 'rgba(139,124,255,0.16)' : '#eeebfb';
  const txtPrim    = dk ? '#f2f1ff' : '#16162e';
  const txtSub     = dk ? '#8c8ab0' : '#8a87a3';

  useEffect(() => {
    if (!hasAccess) { setLoading(false); return; }
    async function load() {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const [viewsRes, txRes] = await Promise.all([
        supabase.from('page_views').select('*').eq('profile_id', profile.id),
        supabase.from('transactions').select('*').eq('seller_id', profile.user_id).order('created_at', { ascending: false }),
      ]);

      const views = (viewsRes.data || []) as PageView[];
      const txs = (txRes.data || []) as Transaction[];

      setStats({
        totalViews: views.length,
        totalSales: txs.length,
        totalRevenue: txs.reduce((s, t) => s + t.seller_amount, 0),
        viewsThisMonth: views.filter(v => v.viewed_at >= monthStart).length,
        salesThisMonth: txs.filter(tx => tx.created_at >= monthStart).length,
        revenueThisMonth: txs.filter(tx => tx.created_at >= monthStart).reduce((s, t) => s + t.seller_amount, 0),
        recentTransactions: txs.slice(0, 8),
      });
      setLoading(false);
    }
    load();
  }, [hasAccess, profile]);

  if (!hasAccess) {
    return (
      <div className="relative">
        {/* Blurred preview */}
        <div className="blur-sm pointer-events-none select-none">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            {[
              { label: t.totalViews, value: '2,847', icon: Eye, color: '#6C63FF' },
              { label: t.totalSales, value: '142', icon: ShoppingCart, color: '#00C2FF' },
              { label: t.totalRevenue, value: '284,000 FCFA', icon: DollarSign, color: '#FF6B9D' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="rounded-2xl p-4" style={{ background: surfaceAlt, border: `1px solid ${border}` }}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={16} color={color} />
                  <span className="text-xs" style={{ color: txtSub }}>{label}</span>
                </div>
                <p className="text-xl font-bold" style={{ color: txtPrim }}>{value}</p>
              </div>
            ))}
          </div>
          <div className="rounded-2xl p-4 h-32 flex items-center justify-center" style={{ background: surfaceAlt, border: `1px solid ${border}` }}>
            <BarChart2 size={48} style={{ color: txtSub }} />
          </div>
        </div>

        {/* Lock overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="rounded-2xl p-8 text-center max-w-sm mx-4 shadow-2xl backdrop-blur-sm"
            style={{ background: dk ? 'rgba(18,18,43,0.97)' : 'rgba(255,255,255,0.97)', border: `1px solid ${border}` }}>
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(251,191,36,0.12)' }}>
              <Lock size={24} className="text-amber-500" />
            </div>
            <h3 className="font-bold text-lg mb-2" style={{ color: txtPrim }}>{t.statsLocked}</h3>
            <p className="text-sm leading-relaxed mb-6" style={{ color: txtSub }}>{t.statsLockedMsg}</p>
            <div className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5"
              style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)' }}>
              <TrendingUp size={14} className="text-amber-500" />
              <span className="text-amber-500 text-xs font-semibold">Business / Premium</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 rounded-full animate-spin" style={{ border: '3px solid rgba(108,99,255,0.15)', borderTopColor: '#6C63FF' }} />
      </div>
    );
  }

  const s = stats!;
  const conversionRate = s.totalViews > 0 ? ((s.totalSales / s.totalViews) * 100).toFixed(1) : '0';

  return (
    <div>
      <h2 className="font-black text-xl mb-6" style={{ color: txtPrim }}>{t.statistics}</h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: t.totalViews, value: s.totalViews.toLocaleString(), icon: Eye, color: '#6C63FF' },
          { label: t.totalSales, value: s.totalSales.toLocaleString(), icon: ShoppingCart, color: '#22c55e' },
          { label: t.totalRevenue, value: `${s.totalRevenue.toLocaleString()} FCFA`, icon: DollarSign, color: '#f59e0b' },
          { label: t.conversionRate, value: `${conversionRate}%`, icon: TrendingUp, color: '#FF6B9D' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl p-4" style={{ background: surface, border: `1px solid ${border}`, boxShadow: dk ? 'none' : '0 2px 16px rgba(108,99,255,0.06)' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: `${color}1f` }}>
              <Icon size={16} color={color} />
            </div>
            <p className="text-xl font-black" style={{ color: txtPrim }}>{value}</p>
            <p className="text-xs mt-0.5" style={{ color: txtSub }}>{label}</p>
          </div>
        ))}
      </div>

      {/* This month */}
      <div className="rounded-2xl p-5 mb-6" style={{ background: surface, border: `1px solid ${border}`, boxShadow: dk ? 'none' : '0 2px 16px rgba(108,99,255,0.06)' }}>
        <div className="flex items-center gap-2 mb-4">
          <Activity size={16} style={{ color: '#6C63FF' }} />
          <h3 className="font-bold text-sm" style={{ color: txtPrim }}>{t.last30Days}</h3>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: t.viewsThisMonth, value: s.viewsThisMonth, color: '#6C63FF' },
            { label: t.salesThisMonth, value: s.salesThisMonth, color: '#22c55e' },
            { label: t.revenueThisMonth || 'Revenus du mois', value: `${s.revenueThisMonth.toLocaleString()} FCFA`, color: '#f59e0b' },
          ].map(({ label, value, color }) => (
            <div key={label}>
              <p className="text-lg font-bold" style={{ color }}>{value}</p>
              <p className="text-xs mt-0.5" style={{ color: txtSub }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent transactions */}
      <div className="rounded-2xl overflow-hidden" style={{ background: surface, border: `1px solid ${border}`, boxShadow: dk ? 'none' : '0 2px 16px rgba(108,99,255,0.06)' }}>
        <div className="flex items-center gap-2 px-5 py-4 border-b" style={{ borderColor: border }}>
          <ArrowUpRight size={16} className="text-green-500" />
          <h3 className="font-bold text-sm" style={{ color: txtPrim }}>{t.recentTransactions}</h3>
        </div>
        {s.recentTransactions.length === 0 ? (
          <div className="text-center py-8 text-sm" style={{ color: txtSub }}>{t.noTransactions}</div>
        ) : (
          <div>
            {s.recentTransactions.map(tx => (
              <div key={tx.id} className="flex items-center justify-between px-5 py-3 border-b last:border-b-0" style={{ borderColor: border }}>
                <div>
                  <p className="text-sm font-semibold" style={{ color: txtPrim }}>{tx.buyer_name}</p>
                  <p className="text-xs" style={{ color: txtSub }}>{new Date(tx.created_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-green-500">+{tx.seller_amount.toLocaleString()} {tx.currency}</p>
                  <p className="text-xs uppercase" style={{ color: txtSub }}>{tx.payment_method}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
