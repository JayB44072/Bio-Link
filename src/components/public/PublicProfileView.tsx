import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { Profile, Product, Service, Transaction } from '../../lib/types';
import { useLang } from '../../lib/LanguageContext';
import { useAppPrefs } from '../../lib/AppPrefsContext';
import { PLAN_CONFIGS } from '../../lib/planLimits';
import { resolveHero } from '../../lib/shopTheme';
import { heroStyleFor } from '../../lib/heroStyles';
import ShopHero from './ShopHero';
import PublicServiceWave, { type ServiceWaveTheme } from './PublicServiceWave';
import ProductBlurb from './ProductBlurb';
import SubscribeBox from './SubscribeBox';
import ShareMenu from './ShareMenu';
import Modal from '../ui/Modal';
import OrderDetailsCard from './OrderDetailsCard';
import { confirmDelivery, lookupOrders, sellerRecentOrders, type OrderSummary } from '../../lib/api/orders';
import { useOrderDetails } from '../../lib/useOrderDetails';
import { filterByQuery } from '../../lib/search';
import { shareMessage } from '../../lib/seoCore';
import { getSubscriberDeliveries, routeFromDetails, type OrderRoute } from '../../lib/api/orderRoutes';
import { guessModelId } from '../../lib/product3d/catalog';
import { LandingLang } from '../../lib/landingTranslations';
import { supabase } from '../../lib/supabase';
import { weightedRating } from '../../lib/ratingUtils';
import PurchaseModal, { CartItem, buildWhatsAppOrderUrl } from './PurchaseModal';
import ServiceDetailModal from './ServiceDetailModal';
import ProductDetailPage from './ProductDetailPage';
import ProductsMap from '../ui/ProductsMap';
import LiveSalesToast from './LiveSalesToast';
import { computeSellerBadges, ComputedBadge } from '../../lib/trustBadges';
import LanguageMenu from '../ui/LanguageMenu';
import ThemeToggle from '../ui/ThemeToggle';
import { BRAND, GRADIENTS } from '../../lib/theme';
import {
  Instagram, Music, Facebook, Twitter, Youtube, Linkedin,
  MessageCircle, Send, Globe, ShoppingBag, Briefcase, ExternalLink, Link2,
  Sparkles, ArrowRight, Star, Search, ShoppingCart, Plus, Minus, X, Store, Check, Menu, PackageSearch,
  Sun, Moon, Package, Truck, CheckCircle2, Loader2, ShieldCheck, MapPin, LucideIcon,
  Eye, Megaphone, Award, RefreshCw, Zap, Smartphone, CreditCard,
  BellRing,
} from 'lucide-react';

// three.js n'est téléchargé que pour les boutiques dont le thème a un héros 3D
const ProductHero3D = lazy(() => import('./ProductHero3D'));
const ProductHeroScroll = lazy(() => import('./ProductHeroScroll'));

const BADGE_ICON_MAP: Record<string, LucideIcon> = {
  shield: ShieldCheck,
  truck: Truck,
  award: Award,
  refresh: RefreshCw,
  sparkles: Sparkles,
  zap: Zap,
};

function BadgeIcon({ icon, size = 12 }: { icon: string; size?: number }) {
  const Ico = BADGE_ICON_MAP[icon] || Sparkles;
  return <Ico size={size} />;
}

function formatCountdown(iso: string, lang: LandingLang): string | null {
  const diffMs = new Date(iso).getTime() - Date.now();
  if (diffMs <= 0) return null;
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  const h = hours % 24;
  const m = mins % 60;
  if (lang === 'fr') {
    if (days > 0) return `Se termine dans ${days}j ${h}h`;
    if (hours > 0) return `Se termine dans ${hours}h ${m}min`;
    return `Se termine dans ${mins} min`;
  }
  if (lang === 'en') {
    if (days > 0) return `Ends in ${days}d ${h}h`;
    if (hours > 0) return `Ends in ${hours}h ${m}min`;
    return `Ends in ${mins} min`;
  }
  if (lang === 'pt') {
    if (days > 0) return `Termina em ${days}d ${h}h`;
    if (hours > 0) return `Termina em ${hours}h ${m}min`;
    return `Termina em ${mins} min`;
  }
  if (days > 0) return `Endet in ${days} T. ${h} Std.`;
  if (hours > 0) return `Endet in ${hours} Std. ${m} Min.`;
  return `Endet in ${mins} Min.`;
}

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
  /** Produit à ouvrir d'emblée (lien direct `/u/<boutique>/p/<produit>`). */
  initialProductId?: string | null;
  /** Prévenu quand le visiteur ouvre ou ferme une fiche produit (sert au référencement de la page). */
  onProductChange?: (id: string | null) => void;
}

type TabId = 'links' | 'shop' | 'services' | 'tracking';

export default function PublicProfileView({ profile, products, services, interactive = true, previewMode, initialProductId = null, onProductChange }: PublicProfileViewProps) {
  const { t } = useLang();
  const { isDark: dk, toggleDark, lang, setLang } = useAppPrefs();
  const forceMobile = previewMode === 'mobile';
  const forceDesktop = previewMode === 'desktop';
  const [localProducts, setLocalProducts] = useState<Product[]>(products);
  const [computedBadges, setComputedBadges] = useState<ComputedBadge[]>([]);

  useEffect(() => {
    if (!profile.user_id) return;
    (async () => {
      const data = await sellerRecentOrders(profile.user_id ?? '');
      const txs = (data || []) as Transaction[];
      setComputedBadges(computeSellerBadges(profile as Profile, txs));
    })();
  }, [profile.user_id, profile.plan_type, profile.updated_at]);
  const [viewingProductId, setViewingProductId] = useState<string | null>(initialProductId);
  const [search, setSearch] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const [checkoutItem, setCheckoutItem] = useState<Product | null>(null);
  const [checkoutSource, setCheckoutSource] = useState<'buyNow' | 'cart' | null>(null);

  // Mode démo uniquement : `?buy=<id produit>` ouvre directement le paiement (captures d'écran de présentation)
  useEffect(() => {
    if (!import.meta.env.VITE_DEMO) return;
    const wanted = new URLSearchParams(window.location.search).get('buy');
    const found = wanted ? products.find(p => p.id === wanted) : undefined;
    if (found) { setCheckoutItem(found); setCheckoutSource('buyNow'); }
  }, [products]);
  const [addedId, setAddedId] = useState<string | null>(null);
  const [viewingService, setViewingService] = useState<Service | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const viewingProduct = viewingProductId ? localProducts.find(p => p.id === viewingProductId) ?? null : null;

  useEffect(() => { setLocalProducts(products); }, [products]);

  // Chaque fiche produit a sa propre adresse (`/u/<boutique>/p/<id>`) : partageable et référençable.
  useEffect(() => {
    onProductChange?.(viewingProductId);
    if (!interactive || !profile.username || !window.location.pathname.startsWith('/u/')) return;
    const target = viewingProductId ? `/u/${profile.username}/p/${viewingProductId}` : `/u/${profile.username}`;
    if (window.location.pathname.replace(/\/$/, '') !== target) window.history.pushState(null, '', target + window.location.search);
    // seule l'ouverture / fermeture d'une fiche doit modifier l'adresse
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewingProductId]);

  // Bouton « précédent » du navigateur : referme la fiche
  useEffect(() => {
    if (!interactive) return;
    const onPop = () => {
      const m = window.location.pathname.match(/^\/u\/[^/]+\/p\/([0-9a-fA-F-]{36})\/?$/);
      setViewingProductId(m ? m[1] : null);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [interactive]);

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
  ];
  const [tab, setTab] = useState<TabId>(activeProducts.length > 0 ? 'shop' : 'links');
  const currentTab = tab === 'tracking' ? 'tracking' : (availableTabs.includes(tab) ? tab : availableTabs[0]);

  /* ══ Suivi de commande — recherche par téléphone + détail, tout en ligne ══ */
  const [trackingPhone, setTrackingPhone] = useState('');
  const [trackingCardLast4, setTrackingCardLast4] = useState('');
  const [trackingMethod, setTrackingMethod] = useState<'mobile' | 'card'>('mobile');
  const [trackingOrders, setTrackingOrders] = useState<OrderSummary[] | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingSearched, setTrackingSearched] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const { details: orderDetails, loading: orderLoading, reload: reloadOrder } = useOrderDetails(selectedOrderId);

  /* ── Livraisons d'un abonné : le jeton reçu dans les e-mails de la boutique remplace la saisie du téléphone ── */
  const [subDeliveries, setSubDeliveries] = useState<OrderRoute[]>([]);
  const [mapRouteId, setMapRouteId] = useState<string | null>(null);
  useEffect(() => {
    if (!interactive || !profile.username) return;
    const key = `biolinkwd_abo_${profile.username}`;
    let token = '';
    try {
      const url = new URL(window.location.href);
      const fromLink = url.searchParams.get('abo');
      if (fromLink) {
        localStorage.setItem(key, fromLink);
        url.searchParams.delete('abo');
        window.history.replaceState(null, '', url.pathname + (url.search || '') + url.hash);
        setTab('tracking');
      }
      token = localStorage.getItem(key) ?? '';
    } catch { /* stockage indisponible : pas de livraisons enregistrées */ }
    if (!token) return;
    let alive = true;
    getSubscriberDeliveries(token).then(r => { if (alive) setSubDeliveries(r); });
    return () => { alive = false; };
  }, [interactive, profile.username]);

  const openedRoute = orderDetails ? routeFromDetails(orderDetails) : null;
  const mapRoutes = openedRoute ? [openedRoute, ...subDeliveries.filter(d => d.id !== openedRoute.id)] : subDeliveries;

  async function searchOrders(e: React.FormEvent) {
    e.preventDefault();
    if (trackingMethod === 'mobile' && !trackingPhone.trim()) return;
    if (trackingMethod === 'card' && trackingCardLast4.replace(/\D/g, '').length !== 4) return;
    setTrackingLoading(true);
    setTrackingSearched(true);
    setSelectedOrderId(null);
    const found = await lookupOrders({
      sellerId: profile.user_id || null,
      ...(trackingMethod === 'mobile' ? { phone: trackingPhone.trim() } : { cardLast4: trackingCardLast4.replace(/\D/g, '') }),
    });
    setTrackingOrders(found);
    // Une seule commande : on l'ouvre directement, sans clic de plus
    if (found.length === 1) setSelectedOrderId(found[0].id);
    setTrackingLoading(false);
  }

  /** Confirme la réception (le crédit du vendeur est fait côté serveur). Renvoie un message d'erreur, ou null. */
  async function confirmOrderDelivery(): Promise<string | null> {
    if (!selectedOrderId) return null;
    const r = await confirmDelivery(selectedOrderId);
    if (!r.ok) {
      if (r.error === 'not_shipped') return lang === 'fr' ? "Le vendeur n'a pas encore expédié cette commande." : 'The seller has not shipped this order yet.';
      return lang === 'fr' ? 'La confirmation est momentanément indisponible. Réessayez dans un instant.' : 'Confirmation is temporarily unavailable. Please try again shortly.';
    }
    await reloadOrder();
    setTrackingOrders(prev => prev?.map(o => o.id === selectedOrderId ? { ...o, status: 'completed' } : o) ?? null);
    return null;
  }

  const distinctCategories = useMemo(() => {
    const seen = new Set<string>();
    for (const p of activeProducts) {
      const c = (p.category || '').trim();
      if (c) seen.add(c);
    }
    return Array.from(seen);
  }, [activeProducts]);

  const filteredProducts = useMemo(() => {
    let list = activeProducts;
    if (activeCategory) {
      list = list.filter(p => (p.category || '').trim() === activeCategory);
    }
    return filterByQuery(list, search, p => [p.name, p.description, p.category]);
  }, [activeProducts, search, activeCategory]);

  const filteredServices = useMemo(
    () => filterByQuery(activeServices, search, s => [s.name, s.description]),
    [activeServices, search],
  );

  /** Saisie dans la barre de recherche : on bascule sur l'onglet qui contient les résultats. */
  function onSearchChange(value: string) {
    setSearch(value);
    if (value.trim() && currentTab !== 'shop' && currentTab !== 'services') {
      setTab(activeProducts.length > 0 ? 'shop' : 'services');
    }
  }

  const showBadge = (profile.plan_type ?? 'free') === 'free';

  /* ══ Shop theme resolution ══ */
  const hero = resolveHero(profile.theme, profile.plan_type);
  const scrollHero = hero.mode === '3d' && hero.scroll;
  const scrollToProducts = () => document.getElementById('shop-products')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const { themeId, modelId: themeModelId, config: shopTheme } = hero;
  /* Dark/light toggle respected on every theme.
     Only inherently-dark themes (luxury) ignore the toggle and stay dark. */
  const themeDark = shopTheme.inherentlyDark ? true : dk;
  const pick = (dark: string, light: string | null) => light === null ? dark : (themeDark ? dark : light);

  const stPageBg = pick(shopTheme.pageBg, shopTheme.pageBgLight);
  const stCardBg = pick(shopTheme.cardBg, shopTheme.cardBgLight);
  const stCardBorder = pick(shopTheme.cardBorder, shopTheme.cardBorderLight);
  const stText = pick(shopTheme.textColor, shopTheme.textColorLight);
  const stSubtext = pick(shopTheme.subtextColor, shopTheme.subtextColorLight);
  const stHeaderBg = pick(shopTheme.headerBg, shopTheme.headerBgLight);

  /* Couleurs et formes de la boutique pour les services (ruban de la liste et fiche d'un service) */
  const serviceTheme: ServiceWaveTheme = {
    dark: themeDark, pageBg: stPageBg, text: stText, subtext: stSubtext, cardBg: stCardBg, cardBorder: stCardBorder,
    accent: shopTheme.accentColor ?? BRAND.violet, priceColor: shopTheme.priceColor,
    buttonGradient: shopTheme.buttonGradient || GRADIENTS.pinkViolet,
    cardRadius: shopTheme.cardRadius === 'rounded-none' ? 'rounded-none' : 'rounded-3xl',
  };
  const moreLabel = lang === 'fr' ? 'Voir plus' : 'See more';
  const cardBgStyle: React.CSSProperties = { background: stCardBg, borderColor: stCardBorder };
  const headerBg = '';

  const TAB_LABEL: Record<TabId, string> = {
    links: lang === 'fr' ? 'Réseaux' : 'Social',
    shop: lang === 'fr' ? 'Produits' : 'Products',
    services: lang === 'fr' ? 'Services' : 'Services',
    tracking: lang === 'fr' ? 'Carte & suivi' : 'Map & tracking',
  };

  const shopDisplayName = profile.shop_name || profile.display_name || profile.username || 'Boutique';
  // Message d'invitation du bouton « Partager » : les produits phares de la boutique (sinon ses services)
  const shareText = shareMessage(shopDisplayName, (activeProducts.length ? activeProducts : activeServices).map(i => i.name), lang);
  // Produit du héros : choix du vendeur, sinon deviné d'après ses produits
  const heroModelId = useMemo(
    () => themeModelId ?? guessModelId(...activeProducts.slice(0, 12).flatMap(p => [p.name, p.category])),
    [themeModelId, activeProducts],
  );
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

  function openProduct(product: Product) {
    if (!interactive) return;
    setViewingProductId(product.id);
    // Fire-and-forget view counter — never blocks navigation
    supabase.rpc('increment_product_view', { p_id: product.id }).then(
      () => {},
      () => {},
    );
    // Reflect the +1 locally so the badge stays in sync
    setLocalProducts(prev => prev.map(p =>
      p.id === product.id ? { ...p, view_count: (p.view_count || 0) + 1 } : p,
    ));
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
    <div className={`min-h-screen flex flex-col relative ${scrollHero ? 'overflow-x-clip' : 'overflow-x-hidden'} font-sans antialiased`}
      style={{ background: stPageBg }}>

      {/* ══ Formes décoratives d'arrière-plan selon le thème ══ */}
      {(themeId === 'luxury') && (
        <>
          <div className="absolute top-0 left-0 w-full h-[300px] pointer-events-none z-0" style={{ background: 'linear-gradient(180deg,rgba(201,169,110,0.08) 0%,transparent 100%)' }} />
          <div className="absolute bottom-0 right-0 w-[200px] h-[200px] rounded-full pointer-events-none z-0" style={{ background: 'radial-gradient(circle,rgba(201,169,110,0.06) 0%,transparent 70%)' }} />
        </>
      )}
      {(themeId === 'vintage') && (
        <div
          className="absolute inset-0 pointer-events-none z-0 opacity-40"
          style={{
            backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(139,90,43,0.06) 0, transparent 40%), radial-gradient(circle at 80% 60%, rgba(139,90,43,0.05) 0, transparent 40%), radial-gradient(circle at 40% 80%, rgba(139,90,43,0.05) 0, transparent 40%)',
          }}
        />
      )}
      {(themeId === 'modern') && (
        <>
          <div className="absolute top-0 right-0 w-[45%] h-[280px] pointer-events-none z-0 opacity-70" style={{ background: 'radial-gradient(ellipse at top right, #e8c99b 0%, transparent 65%)' }} />
          <div className="absolute top-[120px] left-0 w-[35%] h-[220px] pointer-events-none z-0 opacity-50" style={{ background: 'radial-gradient(ellipse at bottom left, #d4a574 0%, transparent 60%)' }} />
        </>
      )}

      {/* ══ Header façon marketplace ══ */}
      <header className={`sticky top-0 z-40 backdrop-blur-md border-b ${headerBg}`} style={{ background: stHeaderBg }}>
        <div className="max-w-5xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-2.5">

          {/* Logo + nom — toujours à gauche */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden flex items-center justify-center shrink-0" style={{ background: themeDark ? 'rgba(139,124,255,0.12)' : `${stCardBorder}` }}>
              {profile.shop_logo_url ? (
                <img src={profile.shop_logo_url} alt={shopDisplayName} className="w-full h-full object-cover" />
              ) : (profile.plan_type ?? 'free') === 'free' ? (
                <img src="/logo-sm.png" alt="BioLinkWD" className="w-full h-full object-contain p-1"
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
                {TAB_LABEL[tb]}
              </button>
            ))}
            <button onClick={() => setTab('tracking')}
              className="px-3.5 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-all flex items-center gap-1.5"
              style={currentTab === 'tracking'
                ? { background: shopTheme.buttonGradient, color: '#fff' }
                : { color: stSubtext, background: 'transparent' }}>
              <MapPin size={12} />
              {TAB_LABEL.tracking}
            </button>
            {profile.username && (
              <button onClick={() => setSubscribeOpen(true)}
                className="ml-1 px-3.5 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-all flex items-center gap-1.5 text-white hover:-translate-y-0.5"
                style={{ background: shopTheme.buttonGradient }}>
                <BellRing size={12} />
                {lang === 'fr' ? "S'abonner" : 'Subscribe'}
              </button>
            )}
          </nav>

          {/* Recherche */}
          {(activeProducts.length > 0 || activeServices.length > 0) && (
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 rounded-full px-2.5 sm:px-3.5 py-1.5 sm:py-2" style={{ background: themeDark ? 'rgba(139,124,255,0.08)' : 'rgba(0,0,0,0.04)' }}>
                <Search size={13} className="shrink-0" style={{ color: stSubtext }} />
                <input
                  type="search"
                  value={search}
                  onChange={e => onSearchChange(e.target.value)}
                  aria-label={lang === 'fr' ? 'Rechercher un produit ou un service' : 'Search a product or service'}
                  autoComplete="off"
                  placeholder={lang === 'fr' ? 'Rechercher...' : 'Search...'}
                  className="flex-1 min-w-0 w-full bg-transparent text-xs font-medium outline-none"
                  style={{ color: stText }}
                />
              </div>
            </div>
          )}

          {/* Desktop : mode clair/sombre + langue + panier */}
          <div className={`${forceDesktop ? 'flex' : forceMobile ? 'hidden' : 'hidden md:flex'} items-center gap-1.5`}>
            <ThemeToggle isDark={themeDark} onToggle={toggleDark} iconSize={15}
              className="shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition"
              style={{ background: themeDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)', color: stSubtext }} />
            <LanguageMenu value={lang} onChange={setLang} iconSize={12} className="shrink-0"
              buttonClassName="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 sm:py-2 rounded-full text-[11px] font-bold transition-colors"
              buttonStyle={{ background: themeDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)', color: stSubtext }}
              menuClassName="absolute right-0 top-full mt-2 rounded-xl shadow-xl border py-1 min-w-[140px] z-50"
              menuStyle={{ background: stCardBg, borderColor: stCardBorder }}
              itemStyle={a => ({
                color: a ? shopTheme.priceColor : stSubtext,
                background: a ? (themeDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)') : 'transparent',
              })}
              checkSize={11} checkClassName="ml-auto text-brand-violet" />
          </div>

          {interactive && (
            <div className={`${forceDesktop ? 'flex' : forceMobile ? 'hidden' : 'hidden md:flex'} shrink-0`}>
              <ShareMenu title={shopDisplayName} lang={lang} message={shareText}
                colors={{ text: stText, subtext: stSubtext, cardBg: stCardBg, border: stCardBorder, hover: themeDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' }} />
            </div>
          )}

          {/* Panier — desktop uniquement (sur mobile il est dans le hamburger) */}
          <button onClick={() => interactive && setCartOpen(true)}
            className={`${forceDesktop ? 'flex' : forceMobile ? 'hidden' : 'hidden md:flex'} relative shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-full items-center justify-center transition`}
            style={{ background: themeDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' }}>
            <ShoppingCart size={15} style={{ color: stText }} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-brand-pinkDark text-white text-[9px] font-black flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>

          {/* Hamburger — mobile uniquement, à l'extrême droite */}
          <button onClick={() => setMenuOpen(true)}
            className={`${forceDesktop ? 'hidden' : forceMobile ? 'flex' : 'flex md:hidden'} shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-full items-center justify-center transition`}
            style={{ background: themeDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' }}>
            <Menu size={16} style={{ color: stText }} />
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
                {TAB_LABEL[tb]}
              </button>
            ))}
            <button onClick={() => { setTab('tracking'); setMenuOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all"
              style={currentTab === 'tracking'
                ? { background: shopTheme.buttonGradient, color: '#fff' }
                : { color: stSubtext, background: 'transparent' }}>
              <MapPin size={16} />
              {TAB_LABEL.tracking}
            </button>
            {profile.username && (
              <button onClick={() => { setSubscribeOpen(true); setMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all text-white"
                style={{ background: shopTheme.buttonGradient }}>
                <BellRing size={16} />
                {lang === 'fr' ? "S'abonner" : 'Subscribe'}
              </button>
            )}

            {interactive && (
              <ShareMenu variant="row" title={shopDisplayName} lang={lang} message={shareText}
                colors={{ text: stText, subtext: stSubtext, cardBg: stCardBg, border: stCardBorder, hover: 'transparent' }} />
            )}

            {/* Séparateur */}
            <div className="my-2 border-t" style={{ borderColor: stCardBorder }} />

            {/* Panier */}
            <button onClick={() => { interactive && setCartOpen(true); setMenuOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all"
              style={{ color: stSubtext }}>
              <ShoppingCart size={16} />
              {lang === 'fr' ? 'Panier' : 'Cart'}
              {cartCount > 0 && (
                <span className="ml-auto min-w-[20px] h-[20px] px-1.5 rounded-full bg-brand-pinkDark text-white text-[10px] font-black flex items-center justify-center">
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
                  background: themeDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
                  color: shopTheme.priceColor,
                  border: `1px solid ${stCardBorder}`,
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
      <>
      {/* ══ Hero Cinéma — plein écran, hors du conteneur centré ══ */}
      {scrollHero && currentTab === 'shop' && activeProducts.length > 0 && (
        <Suspense fallback={<div className="w-full" style={{ background: hero.style3d.stage, height: 'clamp(420px, 80vh, 900px)' }} />}>
          <ProductHeroScroll
            modelId={heroModelId}
            style={hero.style3d}
            lang={lang}
            shopName={shopDisplayName}
            ownerId={profile.user_id}
            onCta={scrollToProducts}
            products={activeProducts}
            onOpenProduct={openProduct}
          />
        </Suspense>
      )}
      <div className="flex-1 max-w-5xl mx-auto w-full px-4 pt-6 pb-20 relative z-10">

        {/* ══ Bannière d'annonce (Feature 5) — tout en haut de l'onglet Boutique ══ */}
        {currentTab === 'shop' && profile.announcement_active && profile.announcement_text
          && (!profile.announcement_expires_at || new Date(profile.announcement_expires_at) > new Date()) && (
          <div
            className="mb-4 rounded-2xl px-4 py-3 flex items-start gap-3 shadow-sm"
            style={{ background: shopTheme.buttonGradient, color: '#fff' }}
          >
            <Megaphone size={16} className="shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-snug">{profile.announcement_text}</p>
              {profile.announcement_expires_at && (
                <p className="text-[11px] mt-0.5 opacity-90">
                  {formatCountdown(profile.announcement_expires_at, lang)}
                </p>
              )}
            </div>
          </div>
        )}

        {/* ══ Hero — 3D (option Premium) ou photos des produits, selon le thème ══ */}
        {currentTab === 'shop' && activeProducts.length > 0 && (
          scrollHero ? null : hero.mode === '3d' ? (
            <Suspense fallback={<div className="w-full rounded-3xl mb-6" style={{ background: hero.style3d.stage, height: 'clamp(300px, 52vw, 420px)' }} />}>
              <ProductHero3D
                modelId={heroModelId}
                style={hero.style3d}
                lang={lang}
                shopName={shopDisplayName}
                ownerId={profile.user_id}
              />
            </Suspense>
          ) : (
            <ShopHero
              style={heroStyleFor(themeId)}
              shopName={shopDisplayName}
              bio={profile.bio}
              logoUrl={profile.shop_logo_url || profile.avatar_url}
              products={activeProducts}
              categories={distinctCategories}
              lang={lang}
              onCta={scrollToProducts}
              onCategory={setActiveCategory}
            />
          )
        )}
        {/* ══ Badges de confiance — calculés automatiquement depuis les stats du vendeur ══ */}
        {currentTab === 'shop' && computedBadges.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {computedBadges.map((b, i) => (
              <span
                key={i}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border"
                style={{ background: stCardBg, borderColor: stCardBorder, color: stText }}
                title={lang === 'fr' ? 'Badge attribué automatiquement selon les performances du vendeur' : 'Badge automatically awarded based on seller performance'}
              >
                <BadgeIcon icon={b.icon} size={12} />
                {lang === 'fr' ? b.labelFr : b.labelEn}
              </span>
            ))}
          </div>
        )}

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

        {/* ══ Filtre par catégorie (Feature 6) — visible si ≥ 2 catégories distinctes ══ */}
        {currentTab === 'shop' && activeProducts.length > 0 && distinctCategories.length >= 2 && (
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setActiveCategory(null)}
              className="px-3 py-1.5 rounded-full text-xs font-bold transition"
              style={activeCategory === null
                ? { background: shopTheme.buttonGradient, color: '#fff' }
                : { background: stCardBg, color: stSubtext, border: `1px solid ${stCardBorder}` }}
            >
              {lang === 'fr' ? 'Tout' : lang === 'en' ? 'All' : lang === 'pt' ? 'Tudo' : 'Alle'}
            </button>
            {distinctCategories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className="px-3 py-1.5 rounded-full text-xs font-bold transition"
                style={activeCategory === cat
                  ? { background: shopTheme.buttonGradient, color: '#fff' }
                  : { background: stCardBg, color: stSubtext, border: `1px solid ${stCardBorder}` }}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Résultat de la recherche en direct (annoncé aux lecteurs d'écran) */}
        {(currentTab === 'shop' || currentTab === 'services') && search.trim() && (() => {
          const n = currentTab === 'shop' ? filteredProducts.length : filteredServices.length;
          return (
            <p role="status" aria-live="polite" className="mb-4 text-xs font-semibold" style={{ color: stSubtext }}>
              {n === 0
                ? (lang === 'fr' ? `Aucun résultat pour « ${search.trim()} »` : `No results for “${search.trim()}”`)
                : (lang === 'fr' ? `${n} résultat${n > 1 ? 's' : ''} pour « ${search.trim()} »` : `${n} result${n > 1 ? 's' : ''} for “${search.trim()}”`)}
              {' · '}
              <button type="button" onClick={() => setSearch('')} className="underline underline-offset-2" style={{ color: serviceTheme.accent }}>
                {lang === 'fr' ? 'Effacer' : 'Clear'}
              </button>
            </p>
          );
        })()}

        {/* Boutique produits */}
        {currentTab === 'shop' && activeProducts.length > 0 && (
          <div id="shop-products" className={`grid grid-cols-2 ${forceMobile ? '' : shopTheme.gridCols.replace(/^grid-cols-\d+\s*/, '')} gap-4`}>
            {filteredProducts.map((product, i) => {
              const isLuxury = themeId === 'luxury';
              const isMarketplace = themeId === 'marketplace';
              const isTech = themeId === 'tech';
              const isCoral = themeId === 'coral';
              const isModern = themeId === 'modern';
              const isVintage = themeId === 'vintage';
              const isBurgundy = themeId === 'burgundy';
              const isElegance = themeId === 'elegance';

              // Marketplace: no card background/border, price on top-left
              if (isMarketplace) {
                return (
                  <div key={product.id}
                    onClick={() => openProduct(product)}
                    className="group flex flex-col text-left h-full cursor-pointer">
                    <div className="aspect-square overflow-hidden relative w-full text-left rounded-lg bg-gray-200">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag size={32} style={{ color: stSubtext }} />
                        </div>
                      )}
                      {product.quantity <= 0 && (
                        <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md shadow-md">
                          {lang === 'fr' ? 'Épuisé' : 'Sold out'}
                        </div>
                      )}
                    </div>
                    <div className="pt-2 flex-1 flex flex-col">
                      <p className="text-base font-black" style={{ color: stText }}>
                        {product.price.toLocaleString()} {product.currency}
                      </p>
                      <p className="text-sm mt-0.5 line-clamp-1" style={{ color: stText }}>{product.name}</p>
                      <ProductBlurb text={product.description} fallback={product.location_address || (lang === 'fr' ? 'Boutique en ligne' : 'Online shop')}
                        color={stSubtext} accent={serviceTheme.accent} moreLabel={moreLabel} />
                      <button
                        onClick={e => { e.stopPropagation(); addToCart(product); }}
                        disabled={product.quantity <= 0 || !interactive}
                        className="mt-auto w-full flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-bold transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{
                          background: addedId === product.id ? '#22c55e' : '#e4e6eb',
                          color: addedId === product.id ? '#fff' : '#050505',
                        }}>
                        {addedId === product.id ? <Check size={12} /> : <ShoppingCart size={12} />}
                        {addedId === product.id
                          ? (lang === 'fr' ? 'Ajouté !' : 'Added!')
                          : (lang === 'fr' ? 'Ajouter au panier' : 'Add to cart')}
                      </button>
                    </div>
                  </div>
                );
              }

              // Luxury: circular product image with gold ring
              if (isLuxury) {
                return (
                  <div key={product.id}
                    onClick={() => openProduct(product)}
                    className={`group flex flex-col h-full ${shopTheme.cardRadius} overflow-hidden text-left transition-all duration-300 transform hover:-translate-y-1.5 p-4 items-center cursor-pointer`}
                    style={{ ...cardBgStyle, borderWidth: 1, borderStyle: 'solid', boxShadow: shopTheme.cardShadow }}>
                    <div
                      className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-full overflow-hidden shrink-0"
                      style={{ boxShadow: '0 0 0 3px #0a0a0a, 0 0 0 5px #C9A96E, 0 8px 24px rgba(0,0,0,0.5)' }}
                    >
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-black">
                          <ShoppingBag size={28} style={{ color: '#C9A96E' }} />
                        </div>
                      )}
                      {product.quantity <= 0 && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <span className="text-[10px] font-black text-white uppercase tracking-wider">
                            {lang === 'fr' ? 'Épuisé' : 'Sold out'}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="mt-4 flex-1 w-full flex flex-col items-center text-center">
                      <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: stText }}>{product.name}</h3>
                      <div className="max-w-[88%]">
                        <ProductBlurb text={product.description} fallback={lang === 'fr' ? 'Aucune description.' : 'No description.'}
                          color={stSubtext} accent={serviceTheme.accent} align="center" moreLabel={moreLabel} />
                      </div>
                      <div className="flex items-center gap-0.5 mt-2">
                        {[1, 2, 3, 4, 5].map(n => (
                          <Star key={n} size={9}
                            className={n <= Math.round(weightedRating(product.avg_rating, product.ratings_count)) ? 'text-amber-500 fill-current' : 'text-gray-600 fill-current'} />
                        ))}
                      </div>
                      <span className="text-base font-black tracking-tight mt-2" style={{ color: shopTheme.priceColor }}>
                        {product.price.toLocaleString()} <span className="text-[10px]">{product.currency}</span>
                      </span>
                      <button
                        onClick={e => { e.stopPropagation(); addToCart(product); }}
                        disabled={product.quantity <= 0 || !interactive}
                        className="mt-auto w-full flex items-center justify-center gap-1.5 py-2 rounded-full text-[10px] font-black uppercase tracking-wider transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{
                          background: addedId === product.id ? '#22c55e' : shopTheme.buttonGradient,
                          color: '#fff',
                        }}>
                        {addedId === product.id ? <Check size={12} /> : <ShoppingCart size={12} />}
                        {addedId === product.id
                          ? (lang === 'fr' ? 'Ajouté' : 'Added')
                          : (lang === 'fr' ? 'Ajouter' : 'Add')}
                      </button>
                    </div>
                  </div>
                );
              }

              // Default & other themes: shared card layout with theme-specific decorations
              const showStrike = shopTheme.priceStyle === 'strikethrough-sale' && i % 3 === 0; // decorative: mark first-of-three as sale
              const strikePrice = showStrike ? Math.round(product.price * 1.35) : null;

              return (
                <div key={product.id}
                  onClick={() => openProduct(product)}
                  className={`group flex flex-col border ${shopTheme.cardRadius} overflow-hidden text-left transition-all duration-300 transform hover:-translate-y-1 relative cursor-pointer`}
                  style={{ ...cardBgStyle, boxShadow: shopTheme.cardShadow }}>

                  {/* Modern (theme2): curved beige shape behind image */}
                  {isModern && (
                    <div className="absolute top-0 left-0 right-0 h-[55%] pointer-events-none rounded-t-3xl overflow-hidden">
                      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 100%, #f0dcc0 0%, #fbe6c9 40%, #fff3dc 90%)' }} />
                      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-50" style={{ background: 'radial-gradient(circle, #e8c99b 0%, transparent 70%)' }} />
                    </div>
                  )}

                  {/* Vintage (theme9): tan bottom section */}
                  {isVintage && (
                    <div className="absolute bottom-0 left-0 right-0 h-[42%] pointer-events-none" style={{ background: '#f0e6d0' }} />
                  )}

                  <div
                    className="aspect-square overflow-hidden relative w-full text-left z-10"
                    style={{
                      background: isModern ? 'transparent'
                        : isVintage ? 'transparent'
                        : themeDark ? BRAND.navy : '#f3f4f6',
                    }}>
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name}
                        className={`w-full h-full transition-transform duration-500 group-hover:scale-105 ${isElegance || isMarketplace ? 'object-cover' : 'object-contain p-3'}`} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag size={32} style={{ color: stSubtext }} />
                      </div>
                    )}

                    {product.quantity <= 0 && (
                      <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md shadow-md z-20">
                        {lang === 'fr' ? 'Épuisé' : 'Sold out'}
                      </div>
                    )}

                    {/* Coral (theme6): green/red sale badge circle top-right */}
                    {isCoral && product.quantity > 0 && i % 4 === 0 && (
                      <div className="absolute top-2 right-2 w-11 h-11 rounded-full flex items-center justify-center shadow-md z-20"
                        style={{ background: '#5cbf7a' }}>
                        <div className="text-white text-[9px] font-black leading-none text-center">
                          20%<br />OFF
                        </div>
                      </div>
                    )}
                    {isCoral && product.quantity > 0 && i % 5 === 0 && i % 4 !== 0 && (
                      <div className="absolute top-2 right-2 w-11 h-11 rounded-full flex items-center justify-center shadow-md z-20"
                        style={{ background: '#ff7a5c' }}>
                        <span className="text-white text-[9px] font-black uppercase">SALE</span>
                      </div>
                    )}

                    {/* Vintage (theme9): dark rounded discount badge */}
                    {isVintage && product.quantity > 0 && i % 4 === 0 && (
                      <div className="absolute top-2 right-2 w-10 h-10 rounded-full flex items-center justify-center shadow-md z-20"
                        style={{ background: '#2b1a0a' }}>
                        <span className="text-white text-[9px] font-black">-15%</span>
                      </div>
                    )}

                    {/* Burgundy ribbon */}
                    {isBurgundy && product.quantity > 0 && i === 0 && (
                      <div className="absolute top-3 -left-1 px-3 py-1 shadow-md z-20"
                        style={{ background: '#7a1a29', color: 'white', clipPath: 'polygon(0 0, 100% 0, 92% 50%, 100% 100%, 0 100%)' }}>
                        <span className="text-[9px] font-black uppercase tracking-wider">New</span>
                      </div>
                    )}

                    {i === 0 && product.quantity > 0 && !isCoral && !isVintage && !isBurgundy && (
                      <div className="absolute top-2 left-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md shadow-md flex items-center gap-0.5 z-20">
                        <Sparkles size={10} /><span>New</span>
                      </div>
                    )}
                  </div>

                  <div className="p-3.5 flex-1 flex flex-col justify-between relative z-10">
                    <div>
                      <h3 className={`text-sm font-bold line-clamp-1 transition-colors ${isElegance ? 'text-center' : ''}`} style={{ color: stText }}>{product.name}</h3>
                      <ProductBlurb text={product.description} fallback={lang === 'fr' ? 'Aucune description fournie.' : 'No description provided.'}
                        color={stSubtext} accent={serviceTheme.accent} align={isElegance ? 'center' : 'left'} moreLabel={moreLabel} />
                    </div>
                    <div className="mt-auto pt-3 flex flex-col gap-2">
                      <div className={`flex items-center gap-0.5 ${isElegance ? 'justify-center' : ''}`}>
                        {[1, 2, 3, 4, 5].map(n => (
                          <Star key={n} size={10}
                            className={n <= Math.round(weightedRating(product.avg_rating, product.ratings_count))
                              ? 'text-amber-500 fill-current'
                              : (themeDark ? 'text-gray-700 fill-current' : 'text-gray-300 fill-current')} />
                        ))}
                        <span className="text-[9px] ml-1 font-semibold" style={{ color: stSubtext }}>
                          ({product.ratings_count || 0})
                        </span>
                        {(product.view_count ?? 0) >= 10 && (
                          <span className="text-[9px] ml-2 font-semibold flex items-center gap-0.5" style={{ color: stSubtext }}>
                            <Eye size={9} /> {product.view_count} {lang === 'fr' ? 'vues' : lang === 'en' ? 'views' : lang === 'pt' ? 'visualizações' : 'Aufrufe'}
                          </span>
                        )}
                      </div>

                      <div className={`flex items-center ${shopTheme.cartButtonStyle === 'floating-circle' ? 'justify-between' : ''} ${isElegance ? 'justify-center' : ''} gap-2 mt-0.5`}>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-sm font-extrabold tracking-tight" style={{ color: shopTheme.priceColor }}>
                            {product.price.toLocaleString()} <span className="text-[10px]">{product.currency}</span>
                          </span>
                          {strikePrice && (
                            <span className="text-[10px] line-through" style={{ color: stSubtext }}>
                              {strikePrice.toLocaleString()}
                            </span>
                          )}
                        </div>

                        {/* Tech (theme7): floating orange cart button */}
                        {shopTheme.cartButtonStyle === 'floating-circle' && (
                          <button
                            onClick={e => { e.stopPropagation(); addToCart(product); }}
                            disabled={product.quantity <= 0 || !interactive}
                            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-md transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-110"
                            style={{
                              background: addedId === product.id ? '#22c55e' : shopTheme.buttonGradient,
                              color: '#fff',
                            }}>
                            {addedId === product.id ? <Check size={14} /> : <ShoppingCart size={14} />}
                          </button>
                        )}

                        {/* Coral (theme6): small orange cart button inline */}
                        {shopTheme.cartButtonStyle === 'inline' && (
                          <button
                            onClick={e => { e.stopPropagation(); addToCart(product); }}
                            disabled={product.quantity <= 0 || !interactive}
                            className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 shadow-sm transition disabled:opacity-40"
                            style={{
                              background: addedId === product.id ? '#22c55e' : '#ff7a5c',
                              color: '#fff',
                            }}>
                            {addedId === product.id ? <Check size={11} /> : <ShoppingCart size={11} />}
                          </button>
                        )}
                      </div>

                      {/* Standard below-card cart button */}
                      {shopTheme.cartButtonStyle !== 'floating-circle' && shopTheme.cartButtonStyle !== 'inline' && (
                        <button
                          onClick={e => { e.stopPropagation(); addToCart(product); }}
                          disabled={product.quantity <= 0 || !interactive}
                          className={`mt-1 w-full flex items-center justify-center gap-1.5 py-2 ${shopTheme.cardRadius === 'rounded-none' ? 'rounded-none' : 'rounded-xl'} text-xs font-bold transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed`}
                          style={{
                            background: addedId === product.id ? '#22c55e' : shopTheme.buttonGradient,
                            color: '#fff',
                            transform: addedId === product.id ? 'scale(1.04)' : 'scale(1)',
                          }}>
                          {addedId === product.id ? <Check size={13} /> : <ShoppingCart size={13} />}
                          {addedId === product.id
                            ? (lang === 'fr' ? 'Ajouté !' : 'Added!')
                            : isBurgundy
                              ? (lang === 'fr' ? 'Sélectionner' : 'Select options')
                              : (lang === 'fr' ? 'Ajouter au panier' : 'Add to cart')}
                        </button>
                      )}

                      {/* When floating/inline cart is used, also add a subtle full-width add button for accessibility on non-tech themes */}
                      {shopTheme.cartButtonStyle === 'inline' && (
                        <button
                          onClick={() => addToCart(product)}
                          disabled={product.quantity <= 0 || !interactive}
                          className="text-[10px] font-bold text-center py-1 rounded-md transition disabled:opacity-40"
                          style={{ color: shopTheme.priceColor, background: 'transparent' }}>
                          {addedId === product.id
                            ? (lang === 'fr' ? 'Ajouté !' : 'Added!')
                            : (lang === 'fr' ? 'Voir plus' : 'Quick view')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ════ Services — ruban sinusoïdal, même univers que le tableau de bord, aux couleurs du thème ════ */}
        {currentTab === 'services' && activeServices.length > 0 && (
          <div className="w-full">
            <div className="flex flex-col items-center text-center mb-6 gap-1">
              <div className="flex items-center gap-3 mb-1.5">
                <span className="inline-block w-8 h-px rounded-full" style={{ background: `linear-gradient(90deg,transparent,${shopTheme.accentColor ?? BRAND.pink})` }} />
                <span className="text-[11px] font-black uppercase tracking-[0.22em]" style={{ color: shopTheme.accentColor ?? BRAND.pink }}>
                  {lang === 'fr' ? 'Nos prestations' : 'Our services'}
                </span>
                <span className="inline-block w-8 h-px rounded-full" style={{ background: `linear-gradient(90deg,${shopTheme.accentColor ?? BRAND.pink},transparent)` }} />
              </div>
              <p className="text-xs" style={{ color: stSubtext }}>
                {filteredServices.length} {lang === 'fr'
                  ? (filteredServices.length > 1 ? 'prestations disponibles' : 'prestation disponible')
                  : (filteredServices.length > 1 ? 'services available' : 'service available')}
              </p>
            </div>
            <PublicServiceWave
              services={filteredServices}
              lang={lang}
              onOpen={setViewingService}
              theme={serviceTheme}
            />
          </div>
        )}
        {/* Carte & suivi réunis : où trouver les produits, puis le suivi de ma commande */}
        {currentTab === 'tracking' && (
          <div className="space-y-10">
            {hasMapAccess && (
              <section aria-labelledby="shop-map-title">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin size={16} style={{ color: BRAND.violet }} />
                  <h2 id="shop-map-title" className="text-base font-black" style={{ color: stText }}>
                    {lang === 'fr' ? 'Où trouver les produits' : 'Where to find the products'}
                  </h2>
                </div>
                <p className="text-xs mb-4" style={{ color: stSubtext }}>
                  {lang === 'fr' ? 'Basculez entre vue simple et vue satellite.' : 'Switch between simple and satellite view.'}
                </p>
                <ProductsMap
                  isDark={themeDark}
                  height={420}
                  lang={lang}
                  routes={mapRoutes}
                  selectedRouteId={openedRoute ? openedRoute.id : mapRouteId}
                  onSelectRoute={setMapRouteId}
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
                {subDeliveries.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-bold mb-2" style={{ color: stText }}>
                      {lang === 'fr' ? `Mes livraisons (${subDeliveries.length})` : `My deliveries (${subDeliveries.length})`}
                    </p>
                    <ul className="flex gap-2 overflow-x-auto pb-1" aria-label={lang === 'fr' ? 'Mes livraisons' : 'My deliveries'}>
                      {subDeliveries.map(d => {
                        const on = (openedRoute ? openedRoute.id : mapRouteId) === d.id;
                        return (
                          <li key={d.id} className="shrink-0">
                            <button type="button" aria-pressed={on} onClick={() => { setMapRouteId(on ? null : d.id); setSelectedOrderId(d.id); }}
                              className="flex items-center gap-2 rounded-full pl-1 pr-3 py-1 text-xs font-bold transition"
                              style={{ background: on ? serviceTheme.accent : stCardBg, color: on ? '#fff' : stText, border: `1px solid ${on ? 'transparent' : stCardBorder}` }}>
                              <span className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.08)' }}>
                                {d.productImage ? <img src={d.productImage} alt="" className="w-full h-full object-cover" /> : <Truck size={13} />}
                              </span>
                              <span className="max-w-[140px] truncate">{d.productName || (lang === 'fr' ? 'Commande' : 'Order')}</span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </section>
            )}
            <section aria-labelledby="order-lookup-title">
              <div className="flex items-center gap-2 mb-4">
                <PackageSearch size={16} style={{ color: BRAND.violet }} />
                <h2 id="order-lookup-title" className="text-base font-black" style={{ color: stText }}>
                  {lang === 'fr' ? 'Suivre ma commande' : 'Track my order'}
                </h2>
              </div>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-6">

            {/* ══ Colonne gauche — recherche + liste des commandes ══ */}
            <div>
              <div className="rounded-2xl border p-4 mb-4" style={{ borderColor: stCardBorder, background: stCardBg }}>
                <p className="text-xs font-bold mb-2" style={{ color: stText }}>
                  {lang === 'fr' ? 'Retrouver mes commandes' : 'Find my orders'}
                </p>
                <p className="text-[11px] mb-3" style={{ color: stSubtext }}>
                  {lang === 'fr'
                    ? 'Choisissez le moyen de paiement utilisé lors de la commande.'
                    : 'Choose the payment method you used at checkout.'}
                </p>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <button type="button" onClick={() => setTrackingMethod('mobile')}
                    className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition"
                    style={{
                      background: trackingMethod === 'mobile' ? shopTheme.buttonGradient : 'transparent',
                      color: trackingMethod === 'mobile' ? '#fff' : stSubtext,
                      border: `1px solid ${trackingMethod === 'mobile' ? 'transparent' : stCardBorder}`,
                    }}>
                    <Smartphone size={13} />
                    {lang === 'fr' ? 'Mobile Money' : 'Mobile Money'}
                  </button>
                  <button type="button" onClick={() => setTrackingMethod('card')}
                    className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition"
                    style={{
                      background: trackingMethod === 'card' ? shopTheme.buttonGradient : 'transparent',
                      color: trackingMethod === 'card' ? '#fff' : stSubtext,
                      border: `1px solid ${trackingMethod === 'card' ? 'transparent' : stCardBorder}`,
                    }}>
                    <CreditCard size={13} />
                    {lang === 'fr' ? 'Carte' : 'Card'}
                  </button>
                </div>
                <form onSubmit={searchOrders} className="flex gap-2">
                  {trackingMethod === 'mobile' ? (
                    <input
                      type="tel" value={trackingPhone} onChange={e => setTrackingPhone(e.target.value)} required
                      placeholder="+225 07 00 00 00"
                      className="flex-1 rounded-xl px-3 py-2.5 text-sm outline-none"
                      style={{ background: stPageBg, border: `1px solid ${stCardBorder}`, color: stText }}
                    />
                  ) : (
                    <input
                      type="text" inputMode="numeric" maxLength={4}
                      value={trackingCardLast4}
                      onChange={e => setTrackingCardLast4(e.target.value.replace(/\D/g, ''))}
                      required
                      placeholder={lang === 'fr' ? '4 derniers chiffres de la carte' : 'Last 4 digits of card'}
                      className="flex-1 rounded-xl px-3 py-2.5 text-sm outline-none font-mono"
                      style={{ background: stPageBg, border: `1px solid ${stCardBorder}`, color: stText }}
                    />
                  )}
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
                      shipped:   { label: lang === 'fr' ? 'Expédiée' : 'Shipped', color: BRAND.violet, icon: Truck },
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
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 flex items-center justify-center" style={{ background: `${statusMeta.color}1f` }}>
                              {order.product_image
                                ? <img src={order.product_image} alt="" loading="lazy" className="w-full h-full object-cover" />
                                : <StatusIcon size={16} color={statusMeta.color} />}
                            </div>
                            <div>
                              <p className="text-sm font-bold line-clamp-1" style={{ color: stText }}>{order.product_name ?? (lang === 'fr' ? 'Commande' : 'Order')}</p>
                              <p className="text-xs" style={{ color: stSubtext }}>{order.amount.toLocaleString()} {order.currency}</p>
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

            {/* ══ Colonne droite — la commande en entier : produit, suivi et carte ══ */}
            <div>
              {!selectedOrderId ? (
                <div className="h-full flex items-center justify-center text-center py-16 rounded-2xl border border-dashed" style={{ borderColor: stCardBorder }}>
                  <div>
                    <PackageSearch size={28} className="mx-auto mb-2" style={{ color: stSubtext }} />
                    <p className="text-sm" style={{ color: stSubtext }}>
                      {lang === 'fr' ? 'Sélectionnez une commande pour voir son suivi.' : 'Select an order to see its tracking.'}
                    </p>
                  </div>
                </div>
              ) : orderLoading ? (
                <div className="flex items-center justify-center py-20" role="status" aria-label={lang === 'fr' ? 'Chargement' : 'Loading'}>
                  <Loader2 size={24} className="animate-spin" style={{ color: stSubtext }} />
                </div>
              ) : orderDetails ? (
                <OrderDetailsCard details={orderDetails} lang={lang} theme={serviceTheme} onConfirm={confirmOrderDelivery} />
              ) : (
                <p className="text-sm text-center py-16" style={{ color: stSubtext }}>{lang === 'fr' ? 'Commande introuvable.' : 'Order not found.'}</p>
              )}
            </div>
          </div>
            </section>
          </div>
        )}
      </div>
      </>
      )}

      {viewingService && (
        <ServiceDetailModal
          service={viewingService}
          profile={profile}
          theme={serviceTheme}
          onClose={() => setViewingService(null)}
        />
      )}

      {/* ══ Toast ventes en direct (Feature 3) — uniquement onglet Boutique et interactive ══ */}
      {currentTab === 'shop' && !viewingProduct && profile.user_id && (
        <LiveSalesToast
          sellerId={profile.user_id}
          interactive={interactive}
          lang={lang}
        />
      )}

      {/* Suivre la boutique : e-mail pour être prévenu des nouveautés (bouton « S'abonner » de la barre de navigation) */}
      {subscribeOpen && profile.username && (
        <Modal onClose={() => setSubscribeOpen(false)} closeOnBackdrop>
          <div className="w-full max-w-[460px] max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain rounded-[2rem]">
            <SubscribeBox username={profile.username} shopName={shopDisplayName} lang={lang} theme={serviceTheme} interactive={interactive} onClose={() => setSubscribeOpen(false)} />
          </div>
        </Modal>
      )}
      {/* Badge WhiteDuckSaaS */}
      {showBadge && (
        <div className="flex justify-center pb-6 pt-4 relative z-10">
          <a href={interactive ? `${window.location.origin}/${profile.referral_code ? `?ref=${encodeURIComponent(profile.referral_code)}` : ''}` : undefined}
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
              {profile.whatsapp_enabled && profile.whatsapp_number && profile.plan_type === 'premium' && (
                <a
                  href={buildWhatsAppOrderUrl(
                    profile.whatsapp_number,
                    profile.whatsapp_greeting || '',
                    cart.map(i => ({ name: i.name, qty: i.qty, price: i.price, currency: i.currency })),
                    cartTotal,
                    cart[0]?.currency || 'FCFA',
                    lang,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => interactive && setCartOpen(false)}
                  className="w-full mb-2 flex items-center justify-center gap-2 text-white font-bold py-3 rounded-2xl transition"
                  style={{ background: '#25D366' }}
                >
                  <MessageCircle size={16} />
                  {lang === 'fr' ? 'Commander via WhatsApp' : 'Order via WhatsApp'}
                </a>
              )}
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
