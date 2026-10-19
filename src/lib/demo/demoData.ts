/**
 * Données fictives du MODE DÉMO (`VITE_DEMO=1`, voir vite.config.ts) : permet d'afficher le vrai tableau de bord
 * sans compte ni base de données, par exemple pour filmer l'application. Jamais utilisé en production.
 */
export const DEMO_USER_ID = 'demo-user';
export const DEMO_PROFILE_ID = 'demo-profile';

/** Identifiants au format UUID (les liens `/u/<boutique>/p/<id>` n'acceptent que ce format). */
export const PID = (n: number) => `00000000-0000-4000-8000-00000000000${n}`;

const day = 86400000;
const ago = (days: number, hours = 0) => new Date(Date.now() - days * day - hours * 3600000).toISOString();

/** Illustration de produit : tissu wax stylisé (SVG intégré, aucun fichier externe). */
function art(c1: string, c2: string, c3: string, shape: 'circle' | 'diamond' | 'wave' | 'bag'): string {
  const motif = shape === 'circle'
    ? Array.from({ length: 30 }, (_, i) => `<circle cx="${(i % 6) * 110 + 30}" cy="${Math.floor(i / 6) * 110 + 30}" r="38" fill="${i % 2 ? c2 : c3}"/><circle cx="${(i % 6) * 110 + 30}" cy="${Math.floor(i / 6) * 110 + 30}" r="16" fill="${c1}"/>`).join('')
    : shape === 'diamond'
      ? Array.from({ length: 30 }, (_, i) => `<path d="M${(i % 6) * 110 + 30} ${Math.floor(i / 6) * 110 - 12} l42 42 l-42 42 l-42 -42z" fill="${i % 2 ? c2 : c3}"/>`).join('')
      : shape === 'wave'
        ? Array.from({ length: 12 }, (_, i) => `<path d="M0 ${i * 52 + 20} q70 -40 140 0 t140 0 t140 0 t140 0" stroke="${i % 2 ? c2 : c3}" stroke-width="22" fill="none"/>`).join('')
        : `<circle cx="300" cy="300" r="170" fill="${c2}"/><rect x="190" y="260" width="220" height="190" rx="30" fill="${c3}"/><path d="M240 270 q60 -130 120 0" stroke="${c1}" stroke-width="22" fill="none"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600"><rect width="600" height="600" fill="${c1}"/>${motif}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const AWA_LOGO = art('#ff8c14', '#ffffff', '#d63078', 'circle');

export const demoProfile = {
  id: DEMO_PROFILE_ID, user_id: DEMO_USER_ID, username: 'mama-josiane', display_name: 'Mama Josiane', bio: 'Pagnes wax et bijoux faits main. Livraison dans toute la ville.',
  shop_name: 'Chez Mama Josiane', shop_logo_url: AWA_LOGO, contact_phone: '+237 6 70 00 00 00', mtn_number: '670000000', orange_number: '690000000',
  whatsapp_number: '+237670000000', whatsapp_enabled: true, whatsapp_greeting: 'Bonjour ! Je suis intéressé(e) par vos produits.',
  trust_badges: [{ icon: 'truck', label: 'Livraison rapide' }, { icon: 'shield', label: 'Paiement sécurisé' }], announcement_text: 'Nouvelle collection de pagnes disponible !', announcement_active: true,
  announcement_expires_at: null, product_categories: ['Pagnes', 'Bijoux', 'Accessoires'], is_admin: false, avatar_url: AWA_LOGO, theme: 'marketplace', plan_type: 'premium',
  social_links: [{ platform: 'instagram', url: 'https://instagram.com/mama.josiane', icon: 'instagram' }, { platform: 'tiktok', url: 'https://tiktok.com/@mama.josiane', icon: 'tiktok' },
    { platform: 'facebook', url: 'https://facebook.com/mama.josiane', icon: 'facebook' }],
  wallet_balance: 184500, referral_code: 'MAMA2026', referred_by: null, affiliate_balance: 12600, lifetime_affiliate_earned: 38400, created_at: ago(120), updated_at: ago(1),
};

export const demoProducts = [
  { id: PID(1), name: 'Pagne wax « Soleil »', description: 'Six yards de wax 100 % coton, couleurs éclatantes, idéal pour vos tenues de fête.', price: 15000, quantity: 24, category: 'Pagnes', art: art('#ff8c14', '#d63078', '#ffd23f', 'circle'), views: 412, rating: 4.8, reviews: 19, loc: [4.0511, 9.7679, 'Marché Mokolo, Douala'] },
  { id: PID(2), name: 'Pagne « Vagues de l\'océan »', description: 'Motif vagues bleu et turquoise, tissu doux et résistant.', price: 12500, quantity: 18, category: 'Pagnes', art: art('#1b8ea6', '#0a4d68', '#9be3f0', 'wave'), views: 301, rating: 4.6, reviews: 11, loc: [4.0511, 9.7679, 'Marché Mokolo, Douala'] },
  { id: PID(3), name: 'Collier perles dorées', description: 'Collier artisanal en perles dorées, fermoir réglable.', price: 8500, quantity: 9, category: 'Bijoux', art: art('#2b1a3a', '#f2b632', '#ffe08a', 'diamond'), views: 268, rating: 4.9, reviews: 24, loc: [3.848, 11.5021, 'Quartier Bastos, Yaoundé'] },
  { id: PID(4), name: 'Boucles d\'oreilles cauris', description: 'Boucles légères ornées de cauris, fait main.', price: 4500, quantity: 30, category: 'Bijoux', art: art('#7a2e5c', '#f5e6d3', '#d98cb3', 'circle'), views: 190, rating: 4.7, reviews: 8, loc: [3.848, 11.5021, 'Quartier Bastos, Yaoundé'] },
  { id: PID(5), name: 'Sac en pagne', description: 'Sac épaule doublé, fermeture zippée, assorti à vos pagnes.', price: 11000, quantity: 7, category: 'Accessoires', art: art('#e2603a', '#fff1d6', '#3a7d44', 'bag'), views: 156, rating: 4.5, reviews: 6, loc: [4.0511, 9.7679, 'Marché Mokolo, Douala'] },
  { id: PID(6), name: 'Foulard en soie', description: 'Foulard léger et brillant, plusieurs façons de le porter.', price: 6000, quantity: 0, category: 'Accessoires', art: art('#5b3a9d', '#e7d9ff', '#ff9ec4', 'wave'), views: 98, rating: 4.4, reviews: 4, loc: null },
].map((p, i) => ({
  id: p.id, user_id: DEMO_USER_ID, name: p.name, description: p.description, price: p.price, quantity: p.quantity, image_url: p.art, images: [p.art], currency: 'FCFA',
  is_active: true, avg_rating: p.rating, ratings_count: p.reviews, location_lat: p.loc ? p.loc[0] : null, location_lng: p.loc ? p.loc[1] : null,
  location_address: p.loc ? String(p.loc[2]) : '', view_count: p.views, category: p.category, created_at: ago(90 - i * 9), updated_at: ago(2 + i),
}));

export const demoServices = [
  { id: 's1', name: 'Confection sur mesure', description: 'Robes, chemises et ensembles cousus à vos mesures dans vos pagnes.', price: 20000, duration: '5 jours', art: art('#d63078', '#ffd23f', '#ffffff', 'diamond') },
  { id: 's2', name: 'Retouches et ajustements', description: 'Raccourcir, ajuster ou réparer vos vêtements rapidement.', price: 3000, duration: '1 jour', art: art('#3a7d44', '#cfe8cf', '#ffffff', 'wave') },
  { id: 's3', name: 'Conseil en style', description: 'Une heure pour composer vos tenues et choisir vos accessoires.', price: 7500, duration: '1 heure', art: art('#5b3a9d', '#ff9ec4', '#ffffff', 'circle') },
].map((s, i) => ({ id: s.id, user_id: DEMO_USER_ID, name: s.name, description: s.description, price: s.price, currency: 'FCFA', image_url: s.art, images: [s.art], duration: s.duration, is_active: true, created_at: ago(60 - i * 5), updated_at: ago(3 + i) }));

const buyers = [
  ['Awa Mballa', 'awa@example.com', '677112233', 'Akwa, Douala', 4.0556, 9.7085],
  ['Bertrand Ngono', 'bertrand@example.com', '699445566', 'Bastos, Yaoundé', 3.8996, 11.5167],
  ['Carine Fotso', 'carine@example.com', '655778899', 'Bonapriso, Douala', 4.0255, 9.6937],
  ['Didier Ewane', 'didier@example.com', '670223344', 'Mvog-Mbi, Yaoundé', 3.8393, 11.5226],
  ['Estelle Njoya', 'estelle@example.com', '691556677', 'Bonamoussadi, Douala', 4.0902, 9.7351],
  ['Fabrice Tala', 'fabrice@example.com', '680889900', 'Odza, Yaoundé', 3.8087, 11.5436],
  ['Grace Mekongo', 'grace@example.com', '652334455', 'Deido, Douala', 4.0633, 9.7140],
  ['Hervé Biya', 'herve@example.com', '677990011', 'Nlongkak, Yaoundé', 3.8732, 11.5214],
];
const orderSpec: Array<[number, string, 'mtn' | 'orange' | 'card', string, number]> = [
  [0, PID(1), 'mtn', 'completed', 1], [1, PID(3), 'orange', 'shipped', 0], [2, PID(5), 'card', 'pending', 0], [3, PID(2), 'mtn', 'completed', 3],
  [4, PID(4), 'orange', 'shipped', 1], [5, PID(1), 'mtn', 'completed', 6], [6, PID(3), 'card', 'cancelled', 8], [7, PID(2), 'orange', 'completed', 12],
  [0, PID(5), 'mtn', 'completed', 15], [3, PID(1), 'orange', 'completed', 21], [2, PID(4), 'mtn', 'completed', 27], [5, PID(3), 'card', 'completed', 33],
];
export const demoTransactions = orderSpec.map(([b, pid, method, status, d], i) => {
  const prod = demoProducts.find(p => p.id === pid)!;
  const [name, email, phone, addr, lat, lng] = buyers[b] as [string, string, string, string, number, number];
  const amount = prod.price * (i % 3 === 0 ? 2 : 1);
  const fee = Math.round(amount * 0.02);
  return {
    id: `t${i + 1}`.padEnd(8, '0') + '-0000-4000-8000-000000000000', product_id: pid, seller_id: DEMO_USER_ID, buyer_name: name, buyer_email: email, buyer_phone: phone, amount, quantity: i % 3 === 0 ? 2 : 1,
    platform_fee: fee, seller_amount: amount - fee, payment_method: method, status, currency: 'FCFA',
    shipped_at: status === 'shipped' || status === 'completed' ? ago(d, 6) : null, delivery_confirmed_at: status === 'completed' ? ago(d) : null,
    delivery_lat: lat, delivery_lng: lng, delivery_address: addr, created_at: ago(d + 1, i),
  };
});

export const demoTrackingEvents = [
  { id: 'e1', transaction_id: demoTransactions[1].id, stage: 'preparing', lat: 4.0511, lng: 9.7679, place_label: 'Atelier, Douala', note: 'Commande préparée', created_at: ago(0, 8) },
  { id: 'e2', transaction_id: demoTransactions[1].id, stage: 'in_transit', lat: 3.9586, lng: 10.4, place_label: 'Édéa', note: 'En route vers Yaoundé', created_at: ago(0, 4) },
  { id: 'e3', transaction_id: demoTransactions[4].id, stage: 'shipped', lat: 4.0511, lng: 9.7679, place_label: 'Atelier, Douala', note: 'Colis remis au livreur', created_at: ago(1, 3) },
  { id: 'e4', transaction_id: demoTransactions[4].id, stage: 'out_for_delivery', lat: 4.08, lng: 9.74, place_label: 'Bonamoussadi', note: 'Livreur dans votre quartier', created_at: ago(0, 1) },
];

export const demoNotifications = [
  { id: 'n1', user_id: DEMO_USER_ID, type: 'order', title: 'Nouvelle commande !', message: 'Carine Fotso a commandé « Sac en pagne » pour 11 000 FCFA (CARD).', is_read: false, metadata: null, created_at: ago(0, 1) },
  { id: 'n2', user_id: DEMO_USER_ID, type: 'delivery', title: 'Livraison confirmée', message: 'Awa Mballa a confirmé la réception de sa commande. Votre solde a été crédité.', is_read: false, metadata: null, created_at: ago(1) },
  { id: 'n3', user_id: DEMO_USER_ID, type: 'system', title: 'Bienvenue sur BioLinkWD', message: 'Votre boutique est en ligne. Partagez votre lien pour recevoir vos premières commandes.', is_read: true, metadata: null, created_at: ago(30) },
];

export const demoPageViews = Array.from({ length: 360 }, (_, i) => ({ id: `v${i}`, profile_id: DEMO_PROFILE_ID, viewed_at: ago((i * 7919) % 28, (i * 13) % 24), referrer: ['instagram', 'whatsapp', 'tiktok', 'direct', 'facebook'][i % 5], country: 'CM' }));

export const demoSubscribers = [
  'awa.mballa@gmail.com', 'carine.fotso@yahoo.fr', 'didier.ewane@gmail.com', 'estelle.njoya@outlook.com', 'fabrice.tala@gmail.com', 'grace.mekongo@gmail.com',
  'herve.biya@yahoo.fr', 'inès.kamga@gmail.com', 'joel.nkenga@gmail.com', 'laure.atangana@gmail.com', 'martin.owona@outlook.com', 'nadine.simo@gmail.com',
].map((email, i) => ({ id: `sub${i}`, seller_id: DEMO_USER_ID, email, token: `00000000-0000-4000-8000-0000000000${String(i).padStart(2, '0')}`, created_at: ago(i * 3 + 1), unsubscribed_at: i === 9 ? ago(2) : null }));

export const demoWithdrawals = [
  { id: 'w1', user_id: DEMO_USER_ID, amount: 50000, payment_method: 'mtn', phone_number: '670000000', status: 'completed', is_priority: false, created_at: ago(14) },
  { id: 'w2', user_id: DEMO_USER_ID, amount: 30000, payment_method: 'orange', phone_number: '690000000', status: 'pending', is_priority: true, created_at: ago(2) },
];

export const demoCommissions = [
  { id: 'c1', referrer_id: DEMO_PROFILE_ID, referred_id: 'r1', subscription_amount: 5000, commission_amount: 250, commission_rate: 0.05, currency: 'FCFA', plan_type: 'business', earned_at: ago(5), paid_out: false, level: 1 },
  { id: 'c2', referrer_id: DEMO_PROFILE_ID, referred_id: 'r2', subscription_amount: 10000, commission_amount: 500, commission_rate: 0.05, currency: 'FCFA', plan_type: 'premium', earned_at: ago(12), paid_out: false, level: 1 },
  { id: 'c3', referrer_id: DEMO_PROFILE_ID, referred_id: 'r3', subscription_amount: 2000, commission_amount: 40, commission_rate: 0.02, currency: 'FCFA', plan_type: 'starter', earned_at: ago(20), paid_out: true, level: 2 },
];

export const demoReviews = demoProducts.slice(0, 3).map((p, i) => ({ id: `rv${i}`, product_id: p.id, author_name: ['Awa', 'Carine', 'Didier'][i], rating: 5 - (i % 2), comment: ['Superbe qualité, livraison rapide !', 'Très beau tissu, je recommande.', 'Conforme à la photo, merci.'][i], created_at: ago(6 + i * 4) }));

export const DEMO_TABLES: Record<string, Array<Record<string, unknown>>> = {
  profiles: [demoProfile], products: demoProducts, services: demoServices, transactions: demoTransactions, order_tracking_events: demoTrackingEvents,
  notifications: demoNotifications, page_views: demoPageViews, page_subscribers: demoSubscribers, withdrawal_requests: demoWithdrawals, affiliate_commissions: demoCommissions,
  reviews: demoReviews, page_notifications: [],
};
