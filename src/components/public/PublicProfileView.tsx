import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Profile, Product, Service, Transaction } from '../../lib/types';
import { useLang } from '../../lib/LanguageContext';
import { useAppPrefs } from '../../lib/AppPrefsContext';
import { PLAN_CONFIGS, SHOP_THEMES, ShopThemeConfig } from '../../lib/planLimits';
import { LandingLang } from '../../lib/landingTranslations';
import { supabase } from '../../lib/supabase';
import PurchaseModal, { CartItem } from './PurchaseModal';
import ProductDetailPage from './ProductDetailPage';
import ProductsMap from '../ui/ProductsMap';
import {
  Instagram, Music, Facebook, Twitter, Youtube, Linkedin,
  MessageCircle, Send, Globe, ShoppingBag, Briefcase, ExternalLink, Link2,
  Sparkles, ArrowRight, Star, Clock, Search, ShoppingCart, Plus, Minus, X, Store, Check, Menu, PackageSearch,
  Sun, Moon, Package, Truck, CheckCircle2, Loader2, ShieldCheck, MapPin, LucideIcon,
} from 'lucide-react';

const LANG_OPTIONS: { code: LandingLang; label: string }[] = [
  { code: 'fr', label: '🇫🇷 Français'  },
  { code: 'en', label: '🇬🇧 English'   },
  { code: 'pt', label: '🇵🇹 Português' },
  { code: 'de', label: '🇩🇪 Deutsch'   },
];

const ICON_MAP: Record<string, LucideIcon> = {
  Instagram, Music, Facebook, Twitter, Youtube, Linkedin, MessageCircle, Send, Globe,
};

const PLATFORM_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  instagram: { bg: 'from-purple-500 via-pink-500 to-orange-400', text: 'text-white', border: 'border-transparent' },
  tiktok:    { bg: 'from-black to-gray-800', text: 'text-white', border: 'border-transparent' },
  facebook:  { bg: 'from-blue-600 to-blue-700', text: 'text-white', border: 'border-transparent' },
  twitter:   { bg: 'from-gray-900 to-black', text: 'text-white', border: 'border-transparent' },
  youtube:   { bg: 'from-red-600 to-red-700', text: 'text-white', border: 'border-transparent' },
  linkedin:  { bg: 'from-blue-700 to-blue-800', text: 'text-white', border: 'border-transparent' },
  whatsapp:  { bg: 'from-green-500 to-green-600', text: 'text-white', border: 'border-transparent' },
  telegram:  { bg: 'from-sky-500 to-sky-600', text: 'text-white', border: 'border-transparent' },
  website:   { bg: 'from-gray-700 to-gray-800', text: 'text-white', border: 'border-transparent' },
};

function buildSocialUrl(platform: string, value: string): string {
  if (!value) return '#';
  const v = value.trim();
  if (v.startsWith('http://') || v.startsWith('https://')) return v;
  switch (platform) {
    case 'whatsapp': return `https://wa.me/${v.replace(/[^0-9]/g, '')}`;
    case 'telegram': return `https://t.me/${v.replace('@', '')}`;
    case 'instagram': return `https://instagram.com/${v.replace('@', '')}`;
    case 'tiktok': return `https://tiktok.com/@${v.replace('@', '')}`;
    case 'facebook': return `https://facebook.com/${v}`;
    case 'twitter': return `https://x.com/${v.replace('@', '')}`;
    case 'youtube': return `https://youtube.com/@${v.replace('@', '')}`;
    case 'linkedin': return `https://linkedin.com/in/${v.replace('@', '')}`;
    case 'website': return `https://${v}`;
    default: return v;
  }
}

interface PublicProfileViewProps {
  profile: Partial<Profile>;
  products: Product[];
  services: Service[];
  interactive?: boolean;
  /** Force l'affichage mobile ou desktop indépendamment de la largeur réelle du
   * navigateur — indispensable pour les aperçus en cadre fixe (ex: "Mon lien bio"),
   * où les media-queries Tailwind (md:/lg:) réagissent à la fenêtre du navigateur
   * et non à la largeur du conteneur. Laisser vide sur la vraie page publique. */
  previewMode?: 'mobile' | 'desktop';
}

type TabId = 'links' | 'shop' | 'services' | 'tracking' | 'map';

export default function PublicProfileView({ profile, products, services, interactive = true, previewMode }: PublicProfileViewProps) {
  const { t } = useLang();
  const { isDark: dk, toggleDark, lang, setLang } = useAppPrefs();
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const forceMobile = previewMode === 'mobile';
  const forceDesktop = previewMode === 'desktop';
  const [localProducts, setLocalProducts] = useState<Product[]>(products);
  const [viewingProductId, setViewingProductId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [checkoutItem, setCheckoutItem] = useState<Product | null>(null);
  const [checkoutSource, setCheckoutSource] = useState<'buyNow' | 'cart' | null>(null);
  const [addedId, setAddedId] = useState<string | null>(null);
  const viewingProduct = viewingProductId ? localProducts.find(p => p.id === viewingProductId) ?? null : null;

  useEffect(() => { setLocalProducts(products); }, [products]);

  const cartKey = `biolinkwd_cart_${profile.username || 'preview'}`;
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (!interactive) return [];
    try {
      const raw = localStorage.getItem(cartKey);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });

  useEffect(() => {
    if (!interactive) return;
    try { localStorage.setItem(cartKey, JSON.stringify(cart)); } catch {}
  }, [cart, cartKey, interactive]);

  const socials = profile.social_links || [];
  const activeProducts = localProducts.filter(p => p.is_active);
  const activeServices = services.filter(s => s.is_active);

  const hasMapAccess = PLAN_CONFIGS[profile.plan_type ?? 'free'].map_access;
  const availableTabs: TabId[] = [
    ...(activeProducts.length > 0 ? (['shop'] as TabId[]) : []),
    'links',
    ...(activeServices.length > 0 ? (['services'] as TabId[]) : []),
    ...(hasMapAccess ? (['map'] as TabId[]) : []),
  ];
  const [tab, setTab] = useState<TabId>(activeProducts.length > 0 ? 'shop' : 'links');
  const currentTab = tab === 'tracking' ? 'tracking' : (availableTabs.includes(tab) ? tab : availableTabs[0]);

  /* ══ Suivi de commande — recherche par téléphone + détail, tout en ligne ══ */
  const [trackingPhone, setTrackingPhone] = useState('');
  const [trackingOrders, setTrackingOrders] = useState<Transaction[] | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingSearched, setTrackingSearched] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [confirmingDelivery, setConfirmingDelivery] = useState(false);

  const selectedOrder = trackingOrders?.find(o => o.id === selectedOrderId) ?? null;

  async function searchOrders(e: React.FormEvent) {
    e.preventDefault();
    if (!trackingPhone.trim()) return;
    setTrackingLoading(true);
    setTrackingSearched(true);
    setSelectedOrderId(null);
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('buyer_phone', trackingPhone.trim())
      .eq('seller_id', profile.user_id || '')
      .order('created_at', { ascending: false });
    setTrackingOrders((data as Transaction[]) || []);
    setTrackingLoading(false);
  }

  async function confirmOrderDelivery() {
    if (!selectedOrder) return;
    setConfirmingDelivery(true);
    const { data: sellerProf } = await supabase.from('profiles').select('*').eq('user_id', selectedOrder.seller_id).maybeSingle();
    if (sellerProf) {
      const newBalance = (sellerProf.wallet_balance || 0) + selectedOrder.seller_amount;
      await supabase.from('profiles').update({ wallet_balance: newBalance }).eq('user_id', selectedOrder.seller_id);
    }
    await supabase.from('transactions').update({
      status: 'completed',
      delivery_confirmed_at: new Date().toISOString(),
    }).eq('id', selectedOrder.id);
    setTrackingOrders(prev => prev?.map(o => o.id === selectedOrder.id
      ? { ...o, status: 'completed', delivery_confirmed_at: new Date().toISOString() } : o) ?? null);
    setConfirmingDelivery(false);
  }

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return activeProducts;
    const q = search.toLowerCase();
    return activeProducts.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
  }, [activeProducts, search]);

  const filteredServices = useMemo(() => {
    if (!search.trim()) return activeServices;
    const q = search.toLowerCase();
    return activeServices.filter(s => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q));
  }, [activeServices, search]);

  const showBadge = (profile.plan_type ?? 'free') === 'free';

  /* ══ Shop theme resolution ══ */
  const shopTheme: ShopThemeConfig = SHOP_THEMES[profile.theme ?? 'default'] ?? SHOP_THEMES.default;
  /* For themes with inherentlyDark=true, the visitor's dark/light toggle has no effect.
     For themes with separate light values (pageBgLight != null), the toggle picks the variant.
     For themes where light values are null (elegance, modern, nature, luxury, neon),
     the theme is self-contained — its own colors are used regardless of toggle. */
  const themeDark = shopTheme.inherentlyDark ? true : (shopTheme.pageBgLight === null ? false : dk);
  const pick = (dark: string, light: string | null) => light === null ? dark : (themeDark ? dark : light);

  const stPageBg = pick(shopTheme.pageBg, shopTheme.pageBgLight);
  const stCardBg = pick(shopTheme.cardBg, shopTheme.cardBgLight);
  const stCardBorder = pick(shopTheme.cardBorder, shopTheme.cardBorderLight);
  const stText = pick(shopTheme.textColor, shopTheme.textColorLight);
  const stSubtext = pick(shopTheme.subtextColor, shopTheme.subtextColorLight);
  const stHeaderBg = pick(shopTheme.headerBg, shopTheme.headerBgLight);

  const cardBgStyle: React.CSSProperties = { background: stCardBg, borderColor: stCardBorder };
  const headerBg = '';

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const TAB_LABEL: Record<TabId, string> = {
    links: lang === 'fr' ? 'Réseaux' : 'Social',
    shop: lang === 'fr' ? 'Produits' : 'Products',
    services: lang === 'fr' ? 'Services' : 'Services',
    tracking: lang === 'fr' ? 'Suivi' : 'Track',
    map: lang === 'fr' ? 'Carte' : 'Map',
  };

  const shopDisplayName = profile.shop_name || profile.display_name || profile.username || 'Boutique';
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);

  /* Ajouter au panier ne baisse le stock QUE localement, pour ce visiteur.
     Le tableau de bord et les autres visiteurs ne voient rien tant que la
     commande n'est pas validée (voir handleOrderSuccess). */
  function addToCart(product: Product) {
    if (!interactive || product.quantity <= 0) return;
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { id: product.id, name: product.name, price: product.price, currency: product.currency, image_url: product.image_url, qty: 1 }];
    });
    setLocalProducts(prev => prev.map(p => p.id === product.id ? { ...p, quantity: p.quantity - 1 } : p));
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1200);
  }

  function changeQty(id: string, delta: number) {
    if (delta > 0) {
      const prod = localProducts.find(p => p.id === id);
      if (!prod || prod.quantity <= 0) return;
    }
    setCart(prev => prev
      .map(i => i.id === id ? { ...i, qty: i.qty + delta } : i)
      .filter(i => i.qty > 0));
    setLocalProducts(prev => prev.map(p => p.id === id ? { ...p, quantity: p.quantity - delta } : p));
  }

  function removeFromCart(id: string) {
    const item = cart.find(i => i.id === id);
    setCart(prev => prev.filter(i => i.id !== id));
    if (item) {
      setLocalProducts(prev => prev.map(p => p.id === id ? { ...p, quantity: p.quantity + item.qty } : p));
    }
  }

  function handleRated(productId: string, avgRating: number, ratingsCount: number) {
    setLocalProducts(prev => prev.map(p => p.id === productId ? { ...p, avg_rating: avgRating, ratings_count: ratingsCount } : p));
  }

  function handleBuyNow(product: Product) {
    setCheckoutItem(product);
    setCheckoutSource('buyNow');
  }

  function handleCheckout() {
    if (cart.length === 0) return;
    const synthetic: Product = {
      id: 'cart-checkout',
      user_id: profile.user_id || '',
      name: lang === 'fr' ? `Panier (${cartCount} article${cartCount > 1 ? 's' : ''})` : `Cart (${cartCount} item${cartCount > 1 ? 's' : ''})`,
      description: cart.map(i => `${i.name} x${i.qty}`).join(', '),
      price: cartTotal,
      quantity: 1,
      image_url: cart[0]?.image_url || '',
      images: [],
      currency: cart[0]?.currency || 'FCFA',
      location_lat: null,
      location_lng: null,
      location_address: '',
      is_active: true,
      avg_rating: 0,
      ratings_count: 0,
      created_at: '', updated_at: '',
    };
    setCheckoutItem(synthetic);
    setCheckoutSource('cart');
    setCartOpen(false);
  }

  /* Commande validée — on persiste enfin la vraie baisse de stock en base,
     visible désormais dans le tableau de bord et pour les autres visiteurs. */
  async function handleOrderSuccess() {
    if (checkoutSource === 'buyNow' && checkoutItem) {
      const current = localProducts.find(p => p.id === checkoutItem.id);
      if (current) {
        const newQty = Math.max(0, current.quantity - 1);
        setLocalProducts(prev => prev.map(p => p.id === current.id ? { ...p, quantity: newQty } : p));
        await supabase.from('products').update({ quantity: newQty }).eq('id', current.id);
      }
    } else if (checkoutSource === 'cart') {
      await Promise.all(cart.map(item => {
        const current = localProducts.find(p => p.id === item.id);
        if (!current) return Promise.resolve();
        return supabase.from('products').update({ quantity: current.quantity }).eq('id', current.id);
      }));
      setCart([]);
    }
  }

  /* Paiement — page complète qui remplace tout le reste (plus un modal flottant) */
  if (interactive && checkoutItem) {
    return (
      <PurchaseModal
        product={checkoutItem}
        seller={profile as Profile}
        cartItems={checkoutSource === 'cart' ? cart : undefined}
        onSuccess={handleOrderSuccess}
        onClose={() => { setCheckoutItem(null); setCheckoutSource(null); }}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden font-sans antialiased"
      style={{ background: stPageBg }}>

      {/* ══ Header façon marketplace ══ */}
      <header className={`sticky top-0 z-40 backdrop-blur-md border-b ${headerBg}`} style={{ background: stHeaderBg }}>
        <div className="max-w-5xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-2.5">

          {/* Logo + nom — toujours à gauche */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden flex items-center justify-center shrink-0" style={{ background: themeDark ? 'rgba(139,124,255,0.12)' : `${stCardBorder}` }}>
              {profile.shop_logo_url ? (
                <img src={profile.shop_logo_url} alt={shopDisplayName} className="w-full h-full object-cover" />
              ) : (profile.plan_type ?? 'free') === 'free' ? (
                <img src="/logo.png" alt="BioLinkWD" className="w-full h-full object-contain p-1"
                  onError={e => { e.currentTarget.style.display = 'none'; }} />
              ) : (
                <Store size={16} style={{ color: stSubtext }} />
              )}
            </div>
            <span className={`font-black text-xs sm:text-sm truncate ${forceDesktop ? 'max-w-none' : forceMobile ? 'max-w-[64px]' : 'max-w-[64px] sm:max-w-[140px] md:max-w-none'}`} style={{ color: stText }}>
              {shopDisplayName}
            </span>
          </div>

          {/* Nav inline — desktop uniquement */}
          <nav className={`${forceDesktop ? 'flex' : forceMobile ? 'hidden' : 'hidden md:flex'} items-center gap-1.5 shrink-0`}>
            {availableTabs.map(tb => (
              <button key={tb} onClick={() => setTab(tb)}
                className="px-3.5 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-all flex items-center gap-1.5"
                style={currentTab === tb
                  ? { background: shopTheme.buttonGradient, color: '#fff' }
                  : { color: stSubtext, background: 'transparent' }}>
                {tb === 'shop' && <ShoppingBag size={12} />}
                {tb === 'services' && <Briefcase size={12} />}
                {tb === 'links' && <Link2 size={12} />}
                {tb === 'map' && <MapPin size={12} />}
                {TAB_LABEL[tb]}
              </button>
            ))}
            <button onClick={() => setTab('tracking')}
              className="px-3.5 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-all flex items-center gap-1.5"
              style={currentTab === 'tracking'
                ? { background: shopTheme.buttonGradient, color: '#fff' }
                : { color: stSubtext, background: 'transparent' }}>
              <PackageSearch size={12} />
              {TAB_LABEL.tracking}
            </button>
          </nav>

          {/* Recherche */}
          {(activeProducts.length > 0 || activeServices.length > 0) && (
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 rounded-full px-2.5 sm:px-3.5 py-1.5 sm:py-2" style={{ background: themeDark ? 'rgba(139,124,255,0.08)' : 'rgba(0,0,0,0.04)' }}>
                <Search size={13} className="shrink-0" style={{ color: stSubtext }} />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder={lang === 'fr' ? 'Rechercher...' : 'Search...'}
                  className="flex-1 min-w-0 w-full bg-transparent text-xs font-medium outline-none"
                  style={{ color: stText }}
                />
              </div>
            </div>
          )}

          {/* Desktop : mode clair/sombre + langue + panier */}
          <div className={`${forceDesktop ? 'flex' : forceMobile ? 'hidden' : 'hidden md:flex'} items-center gap-1.5`}>
            <button onClick={toggleDark}
              className="shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition"
              style={{ background: dk ? 'rgba(139,124,255,0.1)' : '#f3f4f6', color: dk ? '#fbbf24' : '#6b7280' }}>
              {dk ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <div className="relative shrink-0" ref={langRef}>
              <button onClick={() => setLangOpen(v => !v)}
                className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 sm:py-2 rounded-full text-[11px] font-bold transition-colors"
                style={{ background: dk ? 'rgba(139,124,255,0.1)' : '#f3f4f6', color: dk ? '#c7c5e8' : '#6b7280' }}>
                <Globe size={12} />{lang.toUpperCase()}
              </button>
              {langOpen && (
                <div className="absolute right-0 top-full mt-2 rounded-xl shadow-xl border py-1 min-w-[140px] z-50"
                  style={{ background: dk ? '#111128' : '#fff', borderColor: dk ? 'rgba(139,124,255,0.2)' : '#e5e7eb' }}>
                  {LANG_OPTIONS.map(({ code, label }) => (
                    <button key={code} onClick={() => { setLang(code); setLangOpen(false); }}
                      className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 transition-colors"
                      style={{
                        color: lang === code ? '#6C63FF' : (dk ? '#c0c0e0' : '#374151'),
                        background: lang === code ? (dk ? 'rgba(108,99,255,0.15)' : '#f5f3ff') : 'transparent',
                      }}>
                      {label}
                      {lang === code && <Check size={11} className="ml-auto text-brand-violet" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Panier — desktop uniquement (sur mobile il est dans le hamburger) */}
          <button onClick={() => interactive && setCartOpen(true)}
            className={`${forceDesktop ? 'flex' : forceMobile ? 'hidden' : 'hidden md:flex'} relative shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-full items-center justify-center transition ${dk ? 'bg-[rgba(139,124,255,0.1)] hover:bg-[rgba(139,124,255,0.2)]' : 'bg-gray-100 hover:bg-gray-200'}`}>
            <ShoppingCart size={15} className={dk ? 'text-[#f2f1ff]' : 'text-gray-700'} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-pink-600 text-white text-[9px] font-black flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>

          {/* Hamburger — mobile uniquement, à l'extrême droite */}
          <button onClick={() => setMenuOpen(true)}
            className={`${forceDesktop ? 'hidden' : forceMobile ? 'flex' : 'flex md:hidden'} shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-full items-center justify-center transition ${dk ? 'bg-[rgba(139,124,255,0.1)] hover:bg-[rgba(139,124,255,0.2)]' : 'bg-gray-100 hover:bg-gray-200'}`}>
            <Menu size={16} className={dk ? 'text-[#f2f1ff]' : 'text-gray-700'} />
          </button>
        </div>
      </header>

      {/* ══ Menu hamburger — glisse de la droite ══ */}
      <div className="fixed inset-0 z-50 pointer-events-none">
        <div className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0'}`}
          onClick={() => setMenuOpen(false)} />
        <div className="absolute right-0 top-0 bottom-0 w-full max-w-[280px] flex flex-col shadow-2xl pointer-events-auto"
          style={{ background: stCardBg, transition: 'transform 0.32s cubic-bezier(0.4,0,0.2,1)', transform: menuOpen ? 'translateX(0)' : 'translateX(100%)' }}>
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: stCardBorder }}>
            <h3 className="font-black" style={{ color: stText }}>{lang === 'fr' ? 'Menu' : 'Menu'}</h3>
            <button onClick={() => setMenuOpen(false)} style={{ color: stSubtext }}><X size={20} /></button>
          </div>
          <nav className="flex-1 p-3 space-y-1.5">
            {availableTabs.map(tb => (
              <button key={tb} onClick={() => { setTab(tb); setMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all"
                style={currentTab === tb
                  ? { background: shopTheme.buttonGradient, color: '#fff' }
                  : { color: stSubtext, background: 'transparent' }}>
                {tb === 'shop' && <ShoppingBag size={16} />}
                {tb === 'services' && <Briefcase size={16} />}
                {tb === 'links' && <Link2 size={16} />}
                {tb === 'map' && <MapPin size={16} />}
                {TAB_LABEL[tb]}
              </button>
            ))}
            <button onClick={() => { setTab('tracking'); setMenuOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all"
              style={currentTab === 'tracking'
                ? { background: shopTheme.buttonGradient, color: '#fff' }
                : { color: stSubtext, background: 'transparent' }}>
              <PackageSearch size={16} />
              {lang === 'fr' ? 'Suivi de commande' : 'Track my order'}
            </button>

            {/* Séparateur */}
            <div className="my-2 border-t" style={{ borderColor: stCardBorder }} />

            {/* Panier */}
            <button onClick={() => { interactive && setCartOpen(true); setMenuOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all"
              style={{ color: stSubtext }}>
              <ShoppingCart size={16} />
              {lang === 'fr' ? 'Panier' : 'Cart'}
              {cartCount > 0 && (
                <span className="ml-auto min-w-[20px] h-[20px] px-1.5 rounded-full bg-pink-600 text-white text-[10px] font-black flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Mode clair/sombre */}
            <button onClick={toggleDark}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all"
              style={{ color: stSubtext }}>
              {dk ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} />}
              {dk ? (lang === 'fr' ? 'Mode clair' : 'Light mode') : (lang === 'fr' ? 'Mode sombre' : 'Dark mode')}
            </button>

            {/* Langue — sélecteur compact */}
            <div className="flex items-center gap-3 px-4 py-3">
              <Globe size={16} style={{ color: stSubtext }} className="shrink-0" />
              <span className="text-sm font-bold" style={{ color: stSubtext }}>
                {lang === 'fr' ? 'Langue' : 'Language'}
              </span>
              <select
                value={lang}
                onChange={e => setLang(e.target.value as LandingLang)}
                className="ml-auto text-sm font-bold rounded-xl px-3 py-1.5 outline-none cursor-pointer"
                style={{
                  background: dk ? 'rgba(139,124,255,0.12)' : '#f5f3ff',
                  color: dk ? '#c7c5e8' : '#6C63FF',
                  border: `1px solid ${dk ? 'rgba(139,124,255,0.2)' : '#e5e7eb'}`,
                }}>
                {LANG_OPTIONS.map(({ code, label }) => (
                  <option key={code} value={code}>{label}</option>
                ))}
              </select>
            </div>
          </nav>
        </div>
      </div>

      {viewingProduct ? (
        <div className="relative z-10 pt-6">
          <ProductDetailPage
            product={viewingProduct}
            seller={profile}
            interactive={interactive}
            previewMode={previewMode}
            onBack={() => setViewingProductId(null)}
            onAddToCart={addToCart}
            onBuyNow={handleBuyNow}
            onRated={handleRated}
          />
        </div>
      ) : (
      <div className="flex-1 max-w-5xl mx-auto w-full px-4 pt-6 pb-20 relative z-10">

        {/* Liens sociaux — état vide */}
        {currentTab === 'links' && socials.length === 0 && (
          <div className="text-center py-16 rounded-2xl border border-dashed border-gray-500/30">
            <Link2 size={24} className="mx-auto text-gray-500 mb-2" />
            <p className="text-sm font-medium" style={{ color: stSubtext }}>
              {lang === 'fr' ? 'Aucun réseau social ajouté pour le moment.' : 'No social link added yet.'}
            </p>
          </div>
        )}

        {/* Liens sociaux */}
        {currentTab === 'links' && socials.length > 0 && (
          <div className="grid sm:grid-cols-2 gap-3 max-w-2xl">
            {socials.map((social, i) => {
              const Icon = ICON_MAP[social.icon] || Globe;
              const href = buildSocialUrl(social.platform, social.url);
              const colors = PLATFORM_COLORS[social.platform];
              const platformLabel = social.platform.charAt(0).toUpperCase() + social.platform.slice(1);
              return (
                <a key={i} href={href} target="_blank" rel="noopener noreferrer"
                  className="group flex items-center gap-4 p-3.5 rounded-2xl border transition-all duration-300 transform hover:-translate-y-0.5 active:scale-[0.98] shadow-sm hover:shadow-md"
                  style={cardBgStyle}
                  onClick={e => { if (href === '#' || !interactive) e.preventDefault(); }}>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br ${colors?.bg || (themeDark ? 'from-gray-700 to-gray-800' : 'from-gray-100 to-gray-200')} shadow-md`}>
                    <Icon size={22} className={colors?.text || (themeDark ? 'text-white' : 'text-gray-700')} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-base font-bold" style={{ color: stText }}>
                      {platformLabel === 'Twitter' ? 'X / Twitter' : platformLabel}
                    </span>
                    {social.url && (
                      <p className="text-xs truncate mt-0.5" style={{ color: stSubtext }}>
                        {href === '#' ? '' : href.replace('https://', '')}
                      </p>
                    )}
                  </div>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 group-hover:translate-x-0.5" style={{ background: stCardBorder }}>
                    <ArrowRight size={14} style={{ color: stSubtext }} />
                  </div>
                </a>
              );
            })}
          </div>
        )}

        {/* Boutique produits */}
        {currentTab === 'shop' && activeProducts.length > 0 && (
          <div className={`grid ${shopTheme.gridCols} gap-4`}>
            {filteredProducts.map((product, i) => (
              <div key={product.id}
                className={`group flex flex-col border ${shopTheme.cardRadius} overflow-hidden text-left transition-all duration-300 transform hover:-translate-y-1.5`}
                style={{ ...cardBgStyle, boxShadow: shopTheme.cardShadow }}>
                <button
                  onClick={() => setViewingProductId(product.id)}
                  className={`aspect-square overflow-hidden relative w-full text-left ${shopTheme.imageRadius === 'rounded-full' ? 'p-4' : ''}`}
                  style={{ background: themeDark ? '#1a1a2e' : '#f3f4f6' }}>
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name}
                      className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${shopTheme.imageRadius}`} />
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center ${shopTheme.imageRadius}`}
                      style={{ background: themeDark ? 'linear-gradient(135deg,#1a1a2e,#0d0d1a)' : 'linear-gradient(135deg,#e5e7eb,#f3f4f6)' }}>
                      <ShoppingBag size={32} style={{ color: stSubtext }} />
                    </div>
                  )}
                  {product.quantity <= 0 && (
                    <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md shadow-md">
                      {lang === 'fr' ? 'Épuisé' : 'Sold out'}
                    </div>
                  )}
                  {i === 0 && product.quantity > 0 && (
                    <div className="absolute top-2 left-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md shadow-md flex items-center gap-0.5">
                      <Sparkles size={10} /><span>New</span>
                    </div>
                  )}
                </button>
                <div className="p-3.5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold line-clamp-1 transition-colors" style={{ color: stText }}>{product.name}</h3>
                    <p className="text-[11px] mt-1 line-clamp-2 leading-relaxed h-8" style={{ color: stSubtext }}>
                      {product.description || (lang === 'fr' ? 'Aucune description fournie.' : 'No description provided.')}
                    </p>
                  </div>
                  <div className="mt-4 flex flex-col gap-2">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map(n => (
                        <Star key={n} size={10}
                          className={n <= Math.round(product.avg_rating || 0) ? 'text-amber-500 fill-current' : 'text-gray-300 fill-current'} />
                      ))}
                      <span className="text-[9px] ml-1 font-semibold" style={{ color: stSubtext }}>
                        {(product.avg_rating || 0).toFixed(1)} ({product.ratings_count || 0})
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-sm font-extrabold tracking-tight" style={{ color: shopTheme.priceColor }}>
                        {product.price.toLocaleString()} <span className="text-[10px]">{product.currency}</span>
                      </span>
                    </div>
                    <button
                      onClick={() => addToCart(product)}
                      disabled={product.quantity <= 0 || !interactive}
                      className={`mt-1 w-full flex items-center justify-center gap-1.5 py-2 ${shopTheme.cardRadius} text-xs font-bold transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed`}
                      style={{
                        background: addedId === product.id ? '#22c55e' : shopTheme.buttonGradient,
                        color: '#fff',
                        transform: addedId === product.id ? 'scale(1.04)' : 'scale(1)',
                      }}>
                      {addedId === product.id ? <Check size={13} /> : <ShoppingCart size={13} />}
                      {addedId === product.id
                        ? (lang === 'fr' ? 'Ajouté !' : 'Added!')
                        : (lang === 'fr' ? 'Ajouter au panier' : 'Add to cart')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Services — carte horizontale, l'absence de photo ne se remarque pas */}
        {currentTab === 'services' && activeServices.length > 0 && (
          <div className="grid sm:grid-cols-2 gap-3 max-w-2xl">
            {filteredServices.map(service => (
              <div key={service.id}
                className="group flex items-center gap-3.5 p-3.5 rounded-2xl border transition-all duration-300 transform hover:-translate-y-0.5 shadow-sm hover:shadow-md"
                style={cardBgStyle}>
                <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 flex items-center justify-center bg-gradient-to-br from-pink-500 to-violet-500">
                  {service.image_url ? (
                    <img src={service.image_url} alt={service.name} className="w-full h-full object-cover" />
                  ) : (
                    <Briefcase size={20} className="text-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold truncate" style={{ color: stText }}>{service.name}</h3>
                    {service.duration && (
                      <span className="shrink-0 flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-500">
                        <Clock size={9} />{service.duration}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] mt-0.5 line-clamp-1" style={{ color: stSubtext }}>
                    {service.description || (lang === 'fr' ? 'Aucune description fournie.' : 'No description provided.')}
                  </p>
                  <span className="text-sm font-extrabold tracking-tight" style={{ color: shopTheme.priceColor }}>
                    {service.price.toLocaleString()} <span className="text-[10px]">{service.currency}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Suivi de commande — liste à gauche, détail de la commande à droite */}
        {currentTab === 'tracking' && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-6">

            {/* ══ Colonne gauche — recherche + liste des commandes ══ */}
            <div>
              <div className="rounded-2xl border p-4 mb-4" style={{ borderColor: stCardBorder, background: stCardBg }}>
                <p className="text-xs font-bold mb-2" style={{ color: stText }}>
                  {lang === 'fr' ? 'Retrouver mes commandes' : 'Find my orders'}
                </p>
                <p className="text-[11px] mb-3" style={{ color: stSubtext }}>
                  {lang === 'fr'
                    ? 'Entrez le numéro de téléphone utilisé lors du paiement.'
                    : 'Enter the phone number used at checkout.'}
                </p>
                <form onSubmit={searchOrders} className="flex gap-2">
                  <input
                    type="tel" value={trackingPhone} onChange={e => setTrackingPhone(e.target.value)} required
                    placeholder="+225 07 00 00 00"
                    className="flex-1 rounded-xl px-3 py-2.5 text-sm outline-none"
                    style={{
                      background: stPageBg,
                      border: `1px solid ${stCardBorder}`,
                      color: stText,
                    }}
                  />
                  <button type="submit" disabled={trackingLoading}
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0 disabled:opacity-50"
                    style={{ background: shopTheme.buttonGradient }}>
                    {trackingLoading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                  </button>
                </form>
              </div>

              {trackingSearched && !trackingLoading && trackingOrders?.length === 0 && (
                <div className="text-center py-10 rounded-2xl border border-dashed" style={{ borderColor: stCardBorder }}>
                  <Package size={26} className="mx-auto mb-2" style={{ color: stSubtext }} />
                  <p className="text-sm" style={{ color: stSubtext }}>{lang === 'fr' ? 'Aucune commande trouvée.' : 'No orders found.'}</p>
                </div>
              )}

              {trackingOrders && trackingOrders.length > 0 && (
                <div className="space-y-2">
                  {trackingOrders.map(order => {
                    const statusMeta = {
                      pending:   { label: lang === 'fr' ? "En attente d'envoi" : 'Awaiting shipment', color: '#f59e0b', icon: Package },
                      shipped:   { label: lang === 'fr' ? 'Expédiée' : 'Shipped', color: '#6C63FF', icon: Truck },
                      completed: { label: lang === 'fr' ? 'Livrée · payée' : 'Delivered · paid', color: '#22c55e', icon: CheckCircle2 },
                      cancelled: { label: lang === 'fr' ? 'Annulée' : 'Cancelled', color: '#ef4444', icon: X },
                    }[order.status] ?? { label: order.status, color: '#9ca3af', icon: Package };
                    const StatusIcon = statusMeta.icon;
                    const active = selectedOrderId === order.id;
                    return (
                      <button key={order.id} onClick={() => setSelectedOrderId(order.id)}
                        className="w-full text-left rounded-2xl p-3.5 border transition"
                        style={{
                          background: active ? (themeDark ? 'rgba(108,99,255,0.12)' : '#f5f3ff') : stCardBg,
                          borderColor: active ? shopTheme.priceColor : stCardBorder,
                        }}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${statusMeta.color}1f` }}>
                              <StatusIcon size={15} color={statusMeta.color} />
                            </div>
                            <div>
                              <p className="text-sm font-bold" style={{ color: stText }}>{order.amount.toLocaleString()} {order.currency}</p>
                              <p className="text-xs font-semibold" style={{ color: statusMeta.color }}>{statusMeta.label}</p>
                            </div>
                          </div>
                          <p className="text-[11px]" style={{ color: stSubtext }}>{new Date(order.created_at).toLocaleDateString()}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ══ Colonne droite — détail de la commande sélectionnée ══ */}
            <div>
              {!selectedOrder ? (
                <div className="h-full flex items-center justify-center text-center py-16 rounded-2xl border border-dashed" style={{ borderColor: stCardBorder }}>
                  <div>
                    <PackageSearch size={28} className="mx-auto mb-2" style={{ color: stSubtext }} />
                    <p className="text-sm" style={{ color: stSubtext }}>
                      {lang === 'fr' ? 'Sélectionnez une commande pour voir son suivi.' : 'Select an order to see its tracking.'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border p-5" style={{ borderColor: stCardBorder, background: stCardBg }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: stSubtext }}>{lang === 'fr' ? 'Suivi de commande' : 'Order tracking'}</p>
                  <h3 className="text-lg font-black mb-4" style={{ color: stText }}>{selectedOrder.amount.toLocaleString()} {selectedOrder.currency}</h3>

                  {/* Étapes */}
                  <div className="flex items-center justify-between mb-6">
                    {(['pending', 'shipped', 'completed'] as const).map((step, i, arr) => {
                      const stepIndex = ['pending', 'shipped', 'completed'].indexOf(selectedOrder.status);
                      const currentStep = stepIndex === -1 ? 0 : stepIndex;
                      const StepIcon = step === 'pending' ? Package : step === 'shipped' ? Truck : CheckCircle2;
                      return (
                        <React.Fragment key={step}>
                          <div className="flex flex-col items-center gap-1.5">
                            <div className="w-9 h-9 rounded-full flex items-center justify-center"
                              style={{
                                background: i <= currentStep ? shopTheme.buttonGradient : (themeDark ? '#191938' : '#f3f4f6'),
                                color: i <= currentStep ? '#fff' : stSubtext,
                              }}>
                              <StepIcon size={15} />
                            </div>
                            <span className="text-[10px] font-semibold text-center max-w-[64px]" style={{ color: stSubtext }}>
                              {step === 'pending' ? (lang === 'fr' ? 'Paiement reçu' : 'Payment received')
                                : step === 'shipped' ? (lang === 'fr' ? 'Expédiée' : 'Shipped')
                                : (lang === 'fr' ? 'Livrée' : 'Delivered')}
                            </span>
                          </div>
                          {i < arr.length - 1 && (
                            <div className="flex-1 h-0.5 mx-1" style={{ background: i < currentStep ? '#6C63FF' : (themeDark ? '#191938' : '#e5e7eb') }} />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>

                  {selectedOrder.status === 'completed' ? (
                    <div className="rounded-2xl p-4 flex items-start gap-2.5" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)' }}>
                      <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                      <p className="text-emerald-500 text-xs leading-relaxed">
                        {lang === 'fr'
                          ? 'Commande confirmée comme livrée. Le vendeur a été payé. Merci !'
                          : 'Order confirmed as delivered. The seller has been paid. Thank you!'}
                      </p>
                    </div>
                  ) : selectedOrder.status === 'cancelled' ? (
                    <div className="rounded-2xl p-4 flex items-start gap-2.5" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
                      <X size={18} className="text-red-500 shrink-0 mt-0.5" />
                      <p className="text-red-500 text-xs leading-relaxed">
                        {lang === 'fr' ? 'Cette commande a été annulée par le vendeur.' : 'This order was cancelled by the seller.'}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="rounded-2xl p-4 mb-4 flex items-start gap-2.5" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
                        <ShieldCheck size={18} className="text-blue-500 shrink-0 mt-0.5" />
                        <p className="text-blue-500 text-xs leading-relaxed">
                          {lang === 'fr'
                            ? "Votre argent reste protégé jusqu'à ce que vous confirmiez avoir bien reçu votre colis."
                            : "Your money stays protected until you confirm you've received your package."}
                        </p>
                      </div>
                      <button onClick={confirmOrderDelivery} disabled={confirmingDelivery}
                        className="w-full text-white font-bold py-3 rounded-2xl transition disabled:opacity-50 flex items-center justify-center gap-2"
                        style={{ background: shopTheme.buttonGradient }}>
                        {confirmingDelivery
                          ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          : <CheckCircle2 size={16} />}
                        {lang === 'fr' ? "J'ai bien reçu ma commande" : "I've received my order"}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Carte — emplacement des produits, réservée aux vendeurs Business/Premium */}
        {currentTab === 'map' && (
          <div>
            <div className="flex items-center gap-2 mb-1">
              <MapPin size={16} style={{ color: '#6C63FF' }} />
              <h2 className="text-base font-black" style={{ color: stText }}>
                {lang === 'fr' ? 'Où trouver les produits' : 'Where to find the products'}
              </h2>
            </div>
            <p className="text-xs mb-4" style={{ color: stSubtext }}>
              {lang === 'fr'
                ? 'Basculez entre vue simple et vue satellite.'
                : 'Switch between simple and satellite view.'}
            </p>
            <ProductsMap
              isDark={themeDark}
              height={460}
              pins={activeProducts
                .filter(p => p.location_lat != null && p.location_lng != null)
                .map(p => ({
                  id: p.id, name: p.name, price: p.price, currency: p.currency,
                  image_url: p.image_url, lat: p.location_lat as number, lng: p.location_lng as number,
                }))}
              emptyLabel={lang === 'fr' ? 'Aucun emplacement renseigné pour le moment.' : 'No location added yet.'}
              searchPlaceholder={lang === 'fr' ? 'Rechercher un produit...' : 'Search a product...'}
              noResultsLabel={lang === 'fr' ? 'Aucun produit trouvé.' : 'No product found.'}
            />
          </div>
        )}
      </div>
      )}

      {/* Badge WhiteDuckSaaS */}
      {showBadge && (
        <div className="flex justify-center pb-6 pt-4 relative z-10">
          <a href={interactive ? window.location.origin : undefined}
            className="flex items-center gap-2 bg-gray-900/90 backdrop-blur-md text-white text-xs px-5 py-2.5 rounded-full shadow-2xl border border-white/10 hover:border-blue-500/50 hover:bg-gray-800 transition duration-300">
            <div className="w-5 h-5 bg-blue-600 rounded-lg flex items-center justify-center">
              <Link2 size={10} className="text-white" />
            </div>
            <span className="text-gray-300 font-medium">{t.poweredBy}</span>
            <span className="text-blue-400 font-extrabold">— {t.createYourShop}</span>
            <ExternalLink size={10} className="text-gray-500" />
          </a>
        </div>
      )}

      {/* ══ Tiroir panier ══ */}
      <div className="fixed inset-0 z-50 pointer-events-none">
        <div className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${cartOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0'}`}
          onClick={() => setCartOpen(false)} />
        <div className="absolute right-0 top-0 bottom-0 w-full max-w-sm flex flex-col shadow-2xl transition-transform duration-300 pointer-events-auto"
          style={{ background: stCardBg, transform: cartOpen ? 'translateX(0)' : 'translateX(100%)' }}>
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: stCardBorder }}>
            <h3 className="font-black flex items-center gap-2" style={{ color: stText }}>
              <ShoppingCart size={16} />{lang === 'fr' ? 'Mon panier' : 'My cart'}
            </h3>
            <button onClick={() => setCartOpen(false)} style={{ color: stSubtext }}><X size={20} /></button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            {cart.length === 0 ? (
              <div className="text-center py-16 text-sm" style={{ color: stSubtext }}>
                {lang === 'fr' ? 'Votre panier est vide.' : 'Your cart is empty.'}
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="flex items-center gap-3 rounded-2xl p-2.5" style={{ border: `1px solid ${stCardBorder}` }}>
                  <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0" style={{ background: stPageBg }}>
                    {item.image_url && <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate" style={{ color: stText }}>{item.name}</p>
                    <p className="text-xs font-bold mt-0.5" style={{ color: shopTheme.priceColor }}>{item.price.toLocaleString()} {item.currency}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <button onClick={() => changeQty(item.id, -1)} className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: stPageBg, color: stText }}><Minus size={11} /></button>
                      <span className="text-xs font-bold w-4 text-center" style={{ color: stText }}>{item.qty}</span>
                      <button onClick={() => changeQty(item.id, 1)} className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: stPageBg, color: stText }}><Plus size={11} /></button>
                    </div>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="shrink-0 hover:text-pink-500" style={{ color: stSubtext }}><X size={16} /></button>
                </div>
              ))
            )}
          </div>

          {cart.length > 0 && (
            <div className="p-5 border-t" style={{ borderColor: stCardBorder }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium" style={{ color: stSubtext }}>{lang === 'fr' ? 'Total' : 'Total'}</span>
                <span className="text-lg font-black" style={{ color: stText }}>{cartTotal.toLocaleString()} {cart[0]?.currency}</span>
              </div>
              <button onClick={handleCheckout}
                className="w-full text-white font-bold py-3 rounded-2xl transition"
                style={{ background: shopTheme.buttonGradient }}>
                {lang === 'fr' ? 'Commander' : 'Checkout'}
              </button>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
