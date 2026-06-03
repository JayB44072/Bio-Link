import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Profile, Product, PlanType } from '../../lib/types';
import { PLAN_CONFIGS } from '../../lib/planLimits';
import { useLang } from '../../lib/LanguageContext';
import LanguageSelector from '../ui/LanguageSelector';
import BioLink from './tabs/BioLink';
import Products from './tabs/Products';
import Statistics from './tabs/Statistics';
import Wallet from './tabs/Wallet';
import Subscription from './tabs/Subscription';
import { Link2, ShoppingBag, BarChart3, Wallet as WalletIcon, Crown, LogOut, Menu, X } from 'lucide-react';

const TABS = [
  { id: 'biolink', icon: Link2 },
  { id: 'products', icon: ShoppingBag },
  { id: 'statistics', icon: BarChart3 },
  { id: 'wallet', icon: WalletIcon },
  { id: 'subscription', icon: Crown },
] as const;

type TabId = typeof TABS[number]['id'];

export default function Dashboard() {
  const { t, lang } = useLang();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState<TabId>('biolink');
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const TAB_LABELS: Record<TabId, string> = {
    biolink: t.bioLink,
    products: t.products,
    statistics: t.statistics,
    wallet: t.wallet,
    subscription: t.subscription,
  };

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (prof) {
        setProfile({ ...prof, social_links: prof.social_links || [] });
        const { data: prods } = await supabase
          .from('products')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        setProducts(prods || []);
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">{t.loading}</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400">{t.error}</p>
      </div>
    );
  }

  const planConfig = PLAN_CONFIGS[profile.plan_type];
  const planLabel = planConfig.name[lang as 'fr' | 'en'];

  const planBadgeColors: Record<PlanType, string> = {
    free: 'bg-gray-700 text-gray-300',
    starter: 'bg-blue-600 text-white',
    business: 'bg-emerald-600 text-white',
    premium: 'bg-amber-500 text-white',
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Top bar */}
      <header className="bg-gray-900 border-b border-gray-800 px-4 md:px-6 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-400 hover:text-white transition"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <Link2 size={14} className="text-white" />
            </div>
            <span className="text-white font-bold tracking-tight hidden sm:block">BioLinkWD</span>
          </div>

          <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full hidden sm:inline-flex ${planBadgeColors[profile.plan_type]}`}>
            {planLabel}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <LanguageSelector />

          <div className="flex items-center gap-2 pl-3 border-l border-gray-700">
            <div className="w-7 h-7 bg-gray-700 rounded-full flex items-center justify-center text-xs font-bold text-white">
              {(profile.display_name || profile.username || 'U')[0].toUpperCase()}
            </div>
            <span className="text-gray-300 text-sm hidden sm:block">@{profile.username}</span>
            <button onClick={handleLogout} className="p-1.5 text-gray-400 hover:text-red-400 transition" title={t.logout}>
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - desktop */}
        <aside className="hidden md:flex w-56 bg-gray-900 border-r border-gray-800 flex-col py-4 shrink-0">
          <nav className="flex-1 px-3 space-y-1">
            {TABS.map(({ id, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === id
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <Icon size={17} />
                {TAB_LABELS[id]}
              </button>
            ))}
          </nav>

          <div className="px-3 pt-4 border-t border-gray-800">
            <div className="bg-gray-800 rounded-xl p-3">
              <p className="text-gray-400 text-xs mb-1">Solde</p>
              <p className="text-white font-bold text-sm">{profile.wallet_balance.toLocaleString()} FCFA</p>
            </div>
          </div>
        </aside>

        {/* Mobile sidebar overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-black/60" onClick={() => setMobileMenuOpen(false)} />
            <aside className="absolute left-0 top-0 bottom-0 w-64 bg-gray-900 border-r border-gray-800 flex flex-col py-4">
              <div className="flex items-center justify-between px-4 mb-4">
                <span className="text-white font-bold">Menu</span>
                <button onClick={() => setMobileMenuOpen(false)} className="text-gray-400"><X size={20} /></button>
              </div>
              <nav className="flex-1 px-3 space-y-1">
                {TABS.map(({ id, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => { setActiveTab(id); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      activeTab === id
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`}
                  >
                    <Icon size={17} />
                    {TAB_LABELS[id]}
                  </button>
                ))}
              </nav>
            </aside>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {activeTab === 'biolink' && (
            <BioLink
              profile={profile}
              productCount={products.length}
              onUpdate={updates => setProfile(prev => prev ? { ...prev, ...updates } : prev)}
            />
          )}
          {activeTab === 'products' && (
            <Products
              profile={profile}
              products={products}
              onUpdate={setProducts}
            />
          )}
          {activeTab === 'statistics' && (
            <Statistics profile={profile} />
          )}
          {activeTab === 'wallet' && (
            <Wallet
              profile={profile}
              onBalanceUpdate={balance => setProfile(prev => prev ? { ...prev, wallet_balance: balance } : prev)}
            />
          )}
          {activeTab === 'subscription' && (
            <Subscription
              profile={profile}
              onPlanChange={(plan: PlanType) => setProfile(prev => prev ? { ...prev, plan_type: plan } : prev)}
            />
          )}
        </main>
      </div>
    </div>
  );
}
