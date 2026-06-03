// import React, { useEffect, useState } from 'react';
// import { supabase } from '../../lib/supabase';
// import { Profile, Product } from '../../lib/types';
// import { THEMES } from '../../lib/planLimits';
// import { useLang } from '../../lib/LanguageContext';
// import LanguageSelector from '../ui/LanguageSelector';
// import ThemeBackground from '../ui/ThemeBackground';
// import PurchaseModal from './PurchaseModal';
// import {
//   Instagram, Music, Facebook, Twitter, Youtube, Linkedin,
//   MessageCircle, Send, Globe, ShoppingBag, ExternalLink, Link2
// } from 'lucide-react';

// const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
//   Instagram, Music, Facebook, Twitter, Youtube, Linkedin, MessageCircle, Send, Globe,
// };

// interface PublicPageProps {
//   username: string;
// }

// export default function PublicPage({ username }: PublicPageProps) {
//   const { t, lang } = useLang();
//   const [profile, setProfile] = useState<Profile | null>(null);
//   const [products, setProducts] = useState<Product[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
//   const [tab, setTab] = useState<'links' | 'shop'>('links');

//   useEffect(() => {
//     async function load() {
//       const { data: prof } = await supabase
//         .from('profiles')
//         .select('*')
//         .eq('username', username)
//         .maybeSingle();

//       if (prof) {
//         setProfile({ ...prof, social_links: prof.social_links || [] });

//         // Record page view
//         await supabase.from('page_views').insert({ profile_id: prof.id });

//         // Load active products
//         const { data: prods } = await supabase
//           .from('products')
//           .select('*')
//           .eq('user_id', prof.user_id)
//           .eq('is_active', true)
//           .order('created_at', { ascending: false });
//         setProducts(prods || []);
//       }
//       setLoading(false);
//     }
//     load();
//   }, [username]);

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gray-100 flex items-center justify-center">
//         <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
//       </div>
//     );
//   }

//   if (!profile) {
//     return (
//       <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-center px-4">
//         <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
//           <Link2 size={24} className="text-gray-500" />
//         </div>
//         <h1 className="text-white text-xl font-bold mb-2">{t.profileNotFound}</h1>
//         <p className="text-gray-500 text-sm">@{username}</p>
//         <LanguageSelector className="mt-6" />
//       </div>
//     );
//   }

//   const theme = THEMES.find(th => th.id === profile.theme) || THEMES[0];
//   const showBadge = profile.plan_type === 'free';
//   const hasPaidPlan = profile.plan_type !== 'free';
//   const socials = profile.social_links || [];

//   // Determine text colors based on theme
//   const isDark = ['dark', 'ocean', 'forest', 'sunset', 'rose'].includes(profile.theme);
//   const subtextClass = isDark ? 'text-white/60' : 'text-gray-500';
//   const cardBg = isDark ? 'bg-white/10 border-white/10 hover:bg-white/15' : 'bg-gray-50 border-gray-100 hover:bg-gray-100';
//   const cardText = isDark ? 'text-white' : 'text-gray-900';
//   const badgeBg = isDark ? 'bg-white/10 text-white/60' : 'bg-gray-100 text-gray-500';
//   const tabActive = isDark ? 'bg-white text-gray-900' : 'bg-gray-900 text-white';
//   const tabInactive = isDark ? 'text-white/60 hover:text-white' : 'text-gray-500 hover:text-gray-900';

//   return (
//     <div className={`min-h-screen ${theme.bg} flex flex-col relative`}>
//       {/* Theme background */}
//       <ThemeBackground themeId={profile?.theme || 'default'} />

//       {/* Language selector - top right */}
//       <div className="fixed top-3 right-3 z-10">
//         <div className={`${isDark ? 'bg-white/10 backdrop-blur-sm' : 'bg-white/90 backdrop-blur-sm border border-gray-200'} rounded-full px-3 py-1.5`}>
//           <LanguageSelector />
//         </div>
//       </div>

//       <div className="flex-1 max-w-md mx-auto w-full px-4 pt-12 pb-16 relative z-10">
//         {/* Profile header */}
//         <div className="text-center mb-8 pt-4">
//           {/* Avatar */}
//           <div className="relative w-24 h-24 mx-auto mb-4">
//             <div className={`w-24 h-24 rounded-full overflow-hidden border-4 shadow-2xl bg-gray-300 ${
//               profile.theme === 'gold' ? 'border-yellow-200 shadow-yellow-500/30' : 'border-white/20'
//             }`}>
//               {profile.avatar_url ? (
//                 <img src={profile.avatar_url} alt={profile.display_name} className="w-full h-full object-cover" />
//               ) : (
//                 <div className={`w-full h-full flex items-center justify-center text-4xl font-bold ${theme.text}`}>
//                   {(profile.display_name || profile.username)[0].toUpperCase()}
//                 </div>
//               )}
//             </div>
//           </div>

//           <h1 className={`text-2xl font-bold ${theme.text} mb-1`}>
//             {profile.display_name || profile.username}
//           </h1>
//           <p className={`text-sm ${subtextClass} mb-1`}>@{profile.username}</p>
//           {profile.bio && (
//             <p className={`text-sm ${subtextClass} leading-relaxed max-w-xs mx-auto mt-3`}>
//               {profile.bio}
//             </p>
//           )}
//         </div>

//         {/* Social links */}
//         {socials.length > 0 && (
//           <div className="flex flex-wrap gap-3 justify-center mb-8">
//             {socials.map((social, i) => {
//               const Icon = ICON_MAP[social.icon] || Globe;
//               return (
//                 <a
//                   key={i}
//                   href={social.url}
//                   target="_blank"
//                   rel="noopener noreferrer"
//                   className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all ${cardBg} ${cardText}`}
//                 >
//                   <Icon size={16} />
//                   <span className="capitalize">{social.platform}</span>
//                 </a>
//               );
//             })}
//           </div>
//         )}

//         {/* Tabs */}
//         {products.length > 0 && (
//           <>
//             <div className={`flex ${isDark ? 'bg-white/10' : 'bg-gray-100'} rounded-2xl p-1 mb-6`}>
//               <button
//                 onClick={() => setTab('links')}
//                 className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${tab === 'links' ? tabActive : tabInactive}`}
//               >
//                 {lang === 'fr' ? 'Liens' : 'Links'}
//               </button>
//               <button
//                 onClick={() => setTab('shop')}
//                 className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${tab === 'shop' ? tabActive : tabInactive}`}
//               >
//                 <ShoppingBag size={14} />
//                 {lang === 'fr' ? 'Boutique' : 'Shop'} ({products.length})
//               </button>
//             </div>

//             {/* Shop tab */}
//             {tab === 'shop' && (
//               <div className="grid grid-cols-2 gap-3">
//                 {products.map(product => (
//                   <button
//                     key={product.id}
//                     onClick={() => setSelectedProduct(product)}
//                     className={`border rounded-2xl overflow-hidden text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${cardBg}`}
//                   >
//                     <div className="aspect-square overflow-hidden bg-gray-200">
//                       {product.image_url ? (
//                         <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
//                       ) : (
//                         <div className="w-full h-full flex items-center justify-center">
//                           <ShoppingBag size={28} className="text-gray-400" />
//                         </div>
//                       )}
//                     </div>
//                     <div className="p-3">
//                       <p className={`text-xs font-semibold ${cardText} truncate`}>{product.name}</p>
//                       <p className={`text-xs ${subtextClass} mt-0.5 line-clamp-1`}>{product.description}</p>
//                       <div className={`mt-2 inline-flex items-center gap-1 ${theme.accent} text-white text-xs font-bold px-2.5 py-1 rounded-full`}>
//                         {product.price.toLocaleString()} {product.currency}
//                       </div>
//                     </div>
//                   </button>
//                 ))}
//               </div>
//             )}

//             {/* Links tab */}
//             {tab === 'links' && socials.length === 0 && (
//               <p className={`text-center text-sm ${subtextClass}`}>
//                 {lang === 'fr' ? 'Aucun lien pour le moment' : 'No links yet'}
//               </p>
//             )}
//           </>
//         )}

//         {/* No tabs, just a shop section if products exist */}
//         {products.length > 0 && !socials.length && (
//           <div className="mt-6">
//             <h2 className={`text-lg font-bold ${theme.text} mb-4 flex items-center gap-2`}>
//               <ShoppingBag size={18} />
//               {lang === 'fr' ? 'Ma Boutique' : 'My Shop'}
//             </h2>
//             <div className="grid grid-cols-2 gap-3">
//               {products.map(product => (
//                 <button
//                   key={product.id}
//                   onClick={() => setSelectedProduct(product)}
//                   className={`border rounded-2xl overflow-hidden text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${cardBg}`}
//                 >
//                   <div className="aspect-square overflow-hidden bg-gray-200">
//                     {product.image_url ? (
//                       <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
//                     ) : (
//                       <div className="w-full h-full flex items-center justify-center">
//                         <ShoppingBag size={28} className="text-gray-400" />
//                       </div>
//                     )}
//                   </div>
//                   <div className="p-3">
//                     <p className={`text-xs font-semibold ${cardText} truncate`}>{product.name}</p>
//                     <div className={`mt-2 inline-flex ${theme.accent} text-white text-xs font-bold px-2.5 py-1 rounded-full`}>
//                       {product.price.toLocaleString()} {product.currency}
//                     </div>
//                   </div>
//                 </button>
//               ))}
//             </div>
//           </div>
//         )}
//       </div>

//       {/* WhiteDukeSaas badge - only for free plan */}
//       {showBadge && (
//         <div className="fixed bottom-0 left-0 right-0 flex justify-center pb-4 z-10">
//           <a
//             href={window.location.origin}
//             className="flex items-center gap-2 bg-gray-900/90 backdrop-blur-sm text-white text-xs px-4 py-2 rounded-full shadow-lg border border-white/10 hover:bg-gray-800 transition"
//           >
//             <div className="w-4 h-4 bg-blue-600 rounded flex items-center justify-center">
//               <Link2 size={8} className="text-white" />
//             </div>
//             <span>{t.poweredBy}</span>
//             <span className="text-blue-400 font-medium">— {t.createYourShop}</span>
//             <ExternalLink size={10} className="text-gray-400" />
//           </a>
//         </div>
//       )}

//       {/* Purchase modal */}
//       {selectedProduct && (
//         <PurchaseModal
//           product={selectedProduct}
//           seller={profile}
//           onClose={() => setSelectedProduct(null)}
//         />
//       )}
//     </div>
//   );
// }





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
  MessageCircle, Send, Globe, ShoppingBag, ExternalLink, Link2,
  Sparkles, ShieldCheck, ArrowRight, Star,
  LucideIcon // <--- Ajoute l'import du type ici
} from 'lucide-react';

// Utilise-le directement pour typer ton dictionnaire
const ICON_MAP: Record<string, LucideIcon> = {
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
        
        // Si le créateur a des produits mais pas de réseaux, on ouvre directement la boutique
        if (prods && prods.length > 0 && (!prof.social_links || prof.social_links.length === 0)) {
          setTab('shop');
        }
      }
      setLoading(false);
    }
    load();
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        <span className="text-gray-400 text-xs font-medium tracking-wider animate-pulse">L'univers de @{username} charge...</span>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-center px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.05)_0,transparent_100%)]" />
        <div className="w-20 h-20 bg-gray-900 border border-gray-800 rounded-3xl flex items-center justify-center mb-6 shadow-2xl relative z-10 animate-bounce">
          <Link2 size={32} className="text-gray-600" />
        </div>
        <h1 className="text-white text-2xl font-black mb-2 relative z-10">{t.profileNotFound}</h1>
        <p className="text-gray-500 text-sm max-w-xs relative z-10">La micro-boutique de <span className="text-blue-400">@{username}</span> n'est pas encore disponible ou a changé d'adresse.</p>
        <LanguageSelector className="mt-8 relative z-10" />
      </div>
    );
  }

  const theme = THEMES.find(th => th.id === profile.theme) || THEMES[0];
  const showBadge = profile.plan_type === 'free';
  const socials = profile.social_links || [];

  // Détermination des couleurs selon le thème avec un polish Shopify
  const isDark = ['dark', 'ocean', 'forest', 'sunset', 'rose'].includes(profile.theme);
  const subtextClass = isDark ? 'text-white/70' : 'text-gray-600';
  
  // Cartes style Shopify/Amazon : effet de verre, bordures fines, ombres prononcées au survol
  const cardBg = isDark 
    ? 'bg-white/[0.06] backdrop-blur-md border-white/[0.08] hover:bg-white/[0.12] hover:border-white/[0.2] shadow-[0_4px_30px_rgba(0,0,0,0.2)]' 
    : 'bg-white border-gray-200/80 hover:border-gray-300 hover:shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05)] shadow-sm';
  
  const cardText = isDark ? 'text-white' : 'text-gray-900';
  const tabActive = isDark ? 'bg-white text-gray-950 shadow-xl font-bold' : 'bg-gray-950 text-white shadow-xl font-bold';
  const tabInactive = isDark ? 'text-white/60 hover:text-white hover:bg-white/5' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50';

  return (
    <div className={`min-h-screen ${theme.bg} flex flex-col relative overflow-x-hidden font-sans antialiased pb-24`}>
      {/* Arrière-plan dynamique fourni par l'application */}
      <ThemeBackground themeId={profile?.theme || 'default'} />

      {/* Sélecteur de Langue Flottant Premium */}
      <div className="fixed top-4 right-4 z-50 transition-all duration-300 transform hover:scale-105">
        <div className={`shadow-lg rounded-full px-4 py-2 flex items-center backdrop-blur-md border ${
          isDark ? 'bg-black/40 border-white/10' : 'bg-white/80 border-gray-200'
        }`}>
          <LanguageSelector />
        </div>
      </div>

      <div className="flex-1 max-w-md mx-auto w-full px-4 pt-16 relative z-10">
        
        {/* HEADER PROFIL STYLE SHOPIFY CRÉATEUR */}
        <div className="text-center mb-10 flex flex-col items-center">
          {/* Conteneur Avatar animé */}
          <div className="relative mb-5 group">
            <div className={`absolute inset-0 rounded-full blur-xl opacity-40 animate-pulse bg-gradient-to-r ${
              profile.theme === 'gold' ? 'from-yellow-400 to-amber-600' : 'from-blue-500 to-purple-600'
            }`} />
            
            <div className={`relative w-26 h-26 rounded-full overflow-hidden border-4 shadow-2xl bg-gray-800 transform transition duration-500 group-hover:scale-105 ${
              profile.theme === 'gold' ? 'border-yellow-400' : 'border-white'
            }`}>
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.display_name} className="w-full h-full object-cover transition duration-700 group-hover:scale-110" />
              ) : (
                <div className={`w-full h-full flex items-center justify-center text-4xl font-black bg-gradient-to-br from-gray-700 to-gray-900 text-white`}>
                  {(profile.display_name || profile.username)[0].toUpperCase()}
                </div>
              )}
            </div>

            {/* Badge Vérifié pour les comptes payants (Preuve sociale type Amazon/Shopify) */}
            {profile.plan_type !== 'free' && (
              <div className="absolute bottom-1 right-1 bg-blue-500 text-white rounded-full p-1.5 shadow-lg border-2 border-white animate-fade-in-up">
                <ShieldCheck size={14} className="fill-current" />
              </div>
            )}
          </div>

          <h1 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-gray-900'} mb-1 flex items-center gap-1.5 justify-center`}>
            {profile.display_name || profile.username}
          </h1>
          
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md mb-3 ${
            isDark ? 'bg-white/10 text-blue-300' : 'bg-blue-50 text-blue-700 border border-blue-100'
          }`}>
            <span>@{profile.username}</span>
          </div>

          {profile.bio && (
            <p className={`text-sm ${subtextClass} font-medium leading-relaxed max-w-xs mx-auto px-2`}>
              {profile.bio}
            </p>
          )}
        </div>

        {/* ONGLES DE NAVIGATION ANIMÉS STYLE NAVIGATION MARKETPLACE */}
        {products.length > 0 && socials.length > 0 && (
          <div className={`flex ${isDark ? 'bg-black/30 border-white/[0.05]' : 'bg-gray-200/60 border-gray-300/30'} border rounded-2xl p-1 mb-8 shadow-inner`}>
            <button
              onClick={() => setTab('links')}
              className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 ${tab === 'links' ? tabActive : tabInactive}`}
            >
              {lang === 'fr' ? 'Mes Liens' : 'Links'}
            </button>
            <button
              onClick={() => setTab('shop')}
              className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 ${tab === 'shop' ? tabActive : tabInactive}`}
            >
              <ShoppingBag size={14} />
              <span>{lang === 'fr' ? 'Boutique' : 'Shop'}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${tab === 'shop' ? (isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-950') : 'bg-blue-600 text-white'}`}>
                {products.length}
              </span>
            </button>
          </div>
        )}

        {/* SECTION 1 : LES LIENS RÉSEAUX SOCIAUX (STYLE LINKTREE PREMIUM) */}
        {tab === 'links' && socials.length > 0 && (
          <div className="space-y-3.5 animate-fade-in">
            {socials.map((social, i) => {
              const Icon = ICON_MAP[social.icon] || Globe;
              return (
                <a
                  key={i}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center justify-between p-4 rounded-2xl border text-sm font-bold tracking-wide transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 ${cardBg} ${cardText}`}
                  style={{ animationDelay: `${i * 75}ms` }}
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-inner ${
                      isDark ? 'bg-white/5 text-white' : 'bg-gray-100 text-gray-900'
                    }`}>
                      <Icon size={20} />
                    </div>
                    <span className="capitalize text-base font-semibold">{social.platform}</span>
                  </div>
                  <ArrowRight size={16} className="opacity-40 group-hover:opacity-100 transition-opacity" />
                </a>
              );
            })}
          </div>
        )}

        {/* SECTION 2 : LA BOUTIQUE E-COMMERCE (STYLE GRILLE AMAZON / GRID SHOPIFY) */}
        {tab === 'shop' && products.length > 0 && (
          <div className="grid grid-cols-2 gap-4 animate-fade-in">
            {products.map((product, i) => (
              <button
                key={product.id}
                onClick={() => setSelectedProduct(product)}
                className={`group flex flex-col border rounded-3xl overflow-hidden text-left transition-all duration-300 transform hover:-translate-y-1.5 ${cardBg}`}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                {/* Conteneur Image avec survol à la Shopify */}
                <div className="aspect-square overflow-hidden bg-gray-900 relative">
                  {product.image_url ? (
                    <img 
                      src={product.image_url} 
                      alt={product.name} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-950">
                      <ShoppingBag size={32} className="text-gray-600 group-hover:animate-bounce" />
                    </div>
                  )}

                  {/* Badge "Nouveau" ou "Top" style Amazon */}
                  {i === 0 && (
                    <div className="absolute top-2 left-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md shadow-md flex items-center gap-0.5">
                      <Sparkles size={10} />
                      <span>New</span>
                    </div>
                  )}
                </div>

                {/* Détails du Produit */}
                <div className="p-3.5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className={`text-sm font-bold ${cardText} line-clamp-1 group-hover:text-blue-500 transition-colors`}>
                      {product.name}
                    </h3>
                    <p className={`text-[11px] ${subtextClass} mt-1 line-clamp-2 leading-relaxed h-8`}>
                      {product.description || "Aucune description fournie."}
                    </p>
                  </div>

                  <div className="mt-4 flex flex-col gap-2">
                    {/* Fausse note de confiance (Standard Amazon) */}
                    <div className="flex items-center gap-0.5 text-amber-500">
                      {[...Array(5)].map((_, idx) => (
                        <Star key={idx} size={10} className="fill-current" />
                      ))}
                      <span className={`text-[9px] ${subtextClass} ml-1 font-semibold`}>5.0</span>
                    </div>

                    {/* Prix Premium en Évidence */}
                    <div className="flex items-center justify-between mt-0.5">
                      <span className={`text-sm font-extrabold tracking-tight ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                        {product.price.toLocaleString()} <span className="text-[10px]">{product.currency}</span>
                      </span>
                      <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center opacity-0 transform translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 shadow-md shadow-blue-600/30">
                        <ArrowRight size={14} />
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Messages d'états vides */}
        {tab === 'links' && socials.length === 0 && (
          <div className="text-center py-12 rounded-2xl border border-dashed border-gray-700/50 backdrop-blur-sm">
            <Link2 size={24} className="mx-auto text-gray-600 mb-2" />
            <p className={`text-sm ${subtextClass} font-medium`}>
              {lang === 'fr' ? 'Aucun lien disponible.' : 'No links available yet.'}
            </p>
          </div>
        )}
      </div>

      {/* FOOTER / BADGE WHITEDUKeSAAS (MONÉTISATION FREEMIUM) */}
      {showBadge && (
        <div className="fixed bottom-0 left-0 right-0 flex justify-center pb-5 pt-10 z-30 bg-gradient-to-t from-gray-950 via-gray-950/80 to-transparent pointer-events-none">
          <a
            href={window.location.origin}
            className="pointer-events-auto flex items-center gap-2 bg-gray-900/90 backdrop-blur-md text-white text-xs px-5 py-2.5 rounded-full shadow-2xl border border-white/10 hover:border-blue-500/50 hover:bg-gray-800 transition duration-300 transform hover:scale-102 group"
          >
            <div className="w-5 h-5 bg-blue-600 rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform">
              <Link2 size={10} className="text-white" />
            </div>
            <span className="text-gray-300 font-medium">{t.poweredBy}</span>
            <span className="text-blue-400 font-extrabold group-hover:text-blue-300 transition-colors">— {t.createYourShop}</span>
            <ExternalLink size={10} className="text-gray-500" />
          </a>
        </div>
      )}

      {/* POPUP DE PAIEMENT MOBILE MONEY / CARTE */}
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