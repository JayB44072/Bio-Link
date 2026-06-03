import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Profile, Product } from '../../lib/types';
import { THEMES } from '../../lib/planLimits';
import { useLang } from '../../lib/LanguageContext';
import LanguageSelector from '../ui/LanguageSelector';
import ThemeBackground from '../ui/ThemeBackground';
import PurchaseModal from './PurchaseModal';
import {
  Instagram, Music, Facebook, Twitter, Youtube, Linkedin,
  MessageCircle, Send, Globe, ShoppingBag, ExternalLink, Link2
} from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Instagram, Music, Facebook, Twitter, Youtube, Linkedin, MessageCircle, Send, Globe,
};

interface PublicPageProps {
  username: string;
}

export default function PublicPage({ username }: PublicPageProps) {
  const { t, lang } = useLang();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [tab, setTab] = useState<'links' | 'shop'>('links');

  useEffect(() => {
    async function load() {
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .maybeSingle();

      if (prof) {
        setProfile({ ...prof, social_links: prof.social_links || [] });

        // Record page view
        await supabase.from('page_views').insert({ profile_id: prof.id });

        // Load active products
        const { data: prods } = await supabase
          .from('products')
          .select('*')
          .eq('user_id', prof.user_id)
          .eq('is_active', true)
          .order('created_at', { ascending: false });
        setProducts(prods || []);
      }
      setLoading(false);
    }
    load();
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-center px-4">
        <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
          <Link2 size={24} className="text-gray-500" />
        </div>
        <h1 className="text-white text-xl font-bold mb-2">{t.profileNotFound}</h1>
        <p className="text-gray-500 text-sm">@{username}</p>
        <LanguageSelector className="mt-6" />
      </div>
    );
  }

  const theme = THEMES.find(th => th.id === profile.theme) || THEMES[0];
  const showBadge = profile.plan_type === 'free';
  const hasPaidPlan = profile.plan_type !== 'free';
  const socials = profile.social_links || [];

  // Determine text colors based on theme
  const isDark = ['dark', 'ocean', 'forest', 'sunset', 'rose'].includes(profile.theme);
  const subtextClass = isDark ? 'text-white/60' : 'text-gray-500';
  const cardBg = isDark ? 'bg-white/10 border-white/10 hover:bg-white/15' : 'bg-gray-50 border-gray-100 hover:bg-gray-100';
  const cardText = isDark ? 'text-white' : 'text-gray-900';
  const badgeBg = isDark ? 'bg-white/10 text-white/60' : 'bg-gray-100 text-gray-500';
  const tabActive = isDark ? 'bg-white text-gray-900' : 'bg-gray-900 text-white';
  const tabInactive = isDark ? 'text-white/60 hover:text-white' : 'text-gray-500 hover:text-gray-900';

  return (
    <div className={`min-h-screen ${theme.bg} flex flex-col relative`}>
      {/* Theme background */}
      <ThemeBackground themeId={profile?.theme || 'default'} />

      {/* Language selector - top right */}
      <div className="fixed top-3 right-3 z-10">
        <div className={`${isDark ? 'bg-white/10 backdrop-blur-sm' : 'bg-white/90 backdrop-blur-sm border border-gray-200'} rounded-full px-3 py-1.5`}>
          <LanguageSelector />
        </div>
      </div>

      <div className="flex-1 max-w-md mx-auto w-full px-4 pt-12 pb-16 relative z-10">
        {/* Profile header */}
        <div className="text-center mb-8 pt-4">
          {/* Avatar */}
          <div className="relative w-24 h-24 mx-auto mb-4">
            <div className={`w-24 h-24 rounded-full overflow-hidden border-4 shadow-2xl bg-gray-300 ${
              profile.theme === 'gold' ? 'border-yellow-200 shadow-yellow-500/30' : 'border-white/20'
            }`}>
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.display_name} className="w-full h-full object-cover" />
              ) : (
                <div className={`w-full h-full flex items-center justify-center text-4xl font-bold ${theme.text}`}>
                  {(profile.display_name || profile.username)[0].toUpperCase()}
                </div>
              )}
            </div>
          </div>

          <h1 className={`text-2xl font-bold ${theme.text} mb-1`}>
            {profile.display_name || profile.username}
          </h1>
          <p className={`text-sm ${subtextClass} mb-1`}>@{profile.username}</p>
          {profile.bio && (
            <p className={`text-sm ${subtextClass} leading-relaxed max-w-xs mx-auto mt-3`}>
              {profile.bio}
            </p>
          )}
        </div>

        {/* Social links */}
        {socials.length > 0 && (
          <div className="flex flex-wrap gap-3 justify-center mb-8">
            {socials.map((social, i) => {
              const Icon = ICON_MAP[social.icon] || Globe;
              return (
                <a
                  key={i}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all ${cardBg} ${cardText}`}
                >
                  <Icon size={16} />
                  <span className="capitalize">{social.platform}</span>
                </a>
              );
            })}
          </div>
        )}

        {/* Tabs */}
        {products.length > 0 && (
          <>
            <div className={`flex ${isDark ? 'bg-white/10' : 'bg-gray-100'} rounded-2xl p-1 mb-6`}>
              <button
                onClick={() => setTab('links')}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${tab === 'links' ? tabActive : tabInactive}`}
              >
                {lang === 'fr' ? 'Liens' : 'Links'}
              </button>
              <button
                onClick={() => setTab('shop')}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${tab === 'shop' ? tabActive : tabInactive}`}
              >
                <ShoppingBag size={14} />
                {lang === 'fr' ? 'Boutique' : 'Shop'} ({products.length})
              </button>
            </div>

            {/* Shop tab */}
            {tab === 'shop' && (
              <div className="grid grid-cols-2 gap-3">
                {products.map(product => (
                  <button
                    key={product.id}
                    onClick={() => setSelectedProduct(product)}
                    className={`border rounded-2xl overflow-hidden text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${cardBg}`}
                  >
                    <div className="aspect-square overflow-hidden bg-gray-200">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag size={28} className="text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className={`text-xs font-semibold ${cardText} truncate`}>{product.name}</p>
                      <p className={`text-xs ${subtextClass} mt-0.5 line-clamp-1`}>{product.description}</p>
                      <div className={`mt-2 inline-flex items-center gap-1 ${theme.accent} text-white text-xs font-bold px-2.5 py-1 rounded-full`}>
                        {product.price.toLocaleString()} {product.currency}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Links tab */}
            {tab === 'links' && socials.length === 0 && (
              <p className={`text-center text-sm ${subtextClass}`}>
                {lang === 'fr' ? 'Aucun lien pour le moment' : 'No links yet'}
              </p>
            )}
          </>
        )}

        {/* No tabs, just a shop section if products exist */}
        {products.length > 0 && !socials.length && (
          <div className="mt-6">
            <h2 className={`text-lg font-bold ${theme.text} mb-4 flex items-center gap-2`}>
              <ShoppingBag size={18} />
              {lang === 'fr' ? 'Ma Boutique' : 'My Shop'}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {products.map(product => (
                <button
                  key={product.id}
                  onClick={() => setSelectedProduct(product)}
                  className={`border rounded-2xl overflow-hidden text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${cardBg}`}
                >
                  <div className="aspect-square overflow-hidden bg-gray-200">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag size={28} className="text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className={`text-xs font-semibold ${cardText} truncate`}>{product.name}</p>
                    <div className={`mt-2 inline-flex ${theme.accent} text-white text-xs font-bold px-2.5 py-1 rounded-full`}>
                      {product.price.toLocaleString()} {product.currency}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* WhiteDuckSaas badge - only for free plan */}
      {showBadge && (
        <div className="fixed bottom-0 left-0 right-0 flex justify-center pb-4 z-10">
          <a
            href={window.location.origin}
            className="flex items-center gap-2 bg-gray-900/90 backdrop-blur-sm text-white text-xs px-4 py-2 rounded-full shadow-lg border border-white/10 hover:bg-gray-800 transition"
          >
            <div className="w-4 h-4 bg-blue-600 rounded flex items-center justify-center">
              <Link2 size={8} className="text-white" />
            </div>
            <span>{t.poweredBy}</span>
            <span className="text-blue-400 font-medium">— {t.createYourShop}</span>
            <ExternalLink size={10} className="text-gray-400" />
          </a>
        </div>
      )}

      {/* Purchase modal */}
      {selectedProduct && (
        <PurchaseModal
          product={selectedProduct}
          seller={profile}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
}
