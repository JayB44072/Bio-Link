import React, { useEffect, useState } from 'react';
import { Profile, Transaction, PageView } from '../../../lib/types';
import { useLang } from '../../../lib/LanguageContext';
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
  const hasAccess = profile.plan_type === 'business' || profile.plan_type === 'premium';
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

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
              { label: t.totalViews, value: '2,847', icon: Eye, color: 'text-blue-400' },
              { label: t.totalSales, value: '142', icon: ShoppingCart, color: 'text-green-400' },
              { label: t.totalRevenue, value: '284,000 FCFA', icon: DollarSign, color: 'text-amber-400' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-gray-800 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={16} className={color} />
                  <span className="text-gray-400 text-xs">{label}</span>
                </div>
                <p className="text-white text-xl font-bold">{value}</p>
              </div>
            ))}
          </div>
          <div className="bg-gray-800 rounded-2xl p-4 h-32 flex items-center justify-center">
            <BarChart2 size={48} className="text-gray-600" />
          </div>
        </div>

        {/* Lock overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-gray-900/95 border border-gray-700 rounded-2xl p-8 text-center max-w-sm mx-4 shadow-2xl backdrop-blur-sm">
            <div className="w-14 h-14 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock size={24} className="text-amber-400" />
            </div>
            <h3 className="text-white font-bold text-lg mb-2">{t.statsLocked}</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">{t.statsLockedMsg}</p>
            <div className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-1.5">
              <TrendingUp size={14} className="text-amber-400" />
              <span className="text-amber-400 text-xs font-medium">Business / Premium</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  const s = stats!;
  const conversionRate = s.totalViews > 0 ? ((s.totalSales / s.totalViews) * 100).toFixed(1) : '0';

  return (
    <div>
      <h2 className="text-white text-xl font-bold mb-6">{t.statistics}</h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: t.totalViews, value: s.totalViews.toLocaleString(), icon: Eye, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: t.totalSales, value: s.totalSales.toLocaleString(), icon: ShoppingCart, color: 'text-green-400', bg: 'bg-green-500/10' },
          { label: t.totalRevenue, value: `${s.totalRevenue.toLocaleString()} FCFA`, icon: DollarSign, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: t.conversionRate, value: `${conversionRate}%`, icon: TrendingUp, color: 'text-rose-400', bg: 'bg-rose-500/10' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-gray-800/60 border border-gray-700/50 rounded-2xl p-4">
            <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-3`}>
              <Icon size={16} className={color} />
            </div>
            <p className="text-white text-xl font-bold">{value}</p>
            <p className="text-gray-400 text-xs mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* This month */}
      <div className="bg-gray-800/60 border border-gray-700/50 rounded-2xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity size={16} className="text-blue-400" />
          <h3 className="text-white font-semibold text-sm">{t.last30Days}</h3>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: t.viewsThisMonth, value: s.viewsThisMonth, color: 'text-blue-400' },
            { label: t.salesThisMonth, value: s.salesThisMonth, color: 'text-green-400' },
            { label: t.revenueThisMonth || 'Revenus du mois', value: `${s.revenueThisMonth.toLocaleString()} FCFA`, color: 'text-amber-400' },
          ].map(({ label, value, color }) => (
            <div key={label}>
              <p className={`text-lg font-bold ${color}`}>{value}</p>
              <p className="text-gray-500 text-xs mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent transactions */}
      <div className="bg-gray-800/60 border border-gray-700/50 rounded-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-700/50">
          <ArrowUpRight size={16} className="text-green-400" />
          <h3 className="text-white font-semibold text-sm">{t.recentTransactions}</h3>
        </div>
        {s.recentTransactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">{t.noTransactions}</div>
        ) : (
          <div className="divide-y divide-gray-700/30">
            {s.recentTransactions.map(tx => (
              <div key={tx.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-white text-sm font-medium">{tx.buyer_name}</p>
                  <p className="text-gray-500 text-xs">{new Date(tx.created_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-green-400 text-sm font-semibold">+{tx.seller_amount.toLocaleString()} {tx.currency}</p>
                  <p className="text-gray-500 text-xs uppercase">{tx.payment_method}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
