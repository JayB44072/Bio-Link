import React, { useState, useEffect } from 'react';
import { Profile, Product, ProductReview } from '../../lib/types';
import { useLang } from '../../lib/LanguageContext';
import { supabase } from '../../lib/supabase';
import {
  ArrowLeft, ArrowLeft as PrevIcon, ArrowRight as NextIcon, ShoppingBag, ShoppingCart, Star, Store,
  ShieldCheck, Check, Package, Truck, RotateCcw, Lock, CreditCard, MessageSquareText,
} from 'lucide-react';

interface ProductDetailPageProps {
  product: Product;
  seller: Partial<Profile>;
  interactive: boolean;
  /** Voir PublicProfileViewProps.previewMode — force la mise en page 1 colonne
   * (mobile) ou 3 colonnes (desktop) indépendamment de la largeur réelle du navigateur. */
  previewMode?: 'mobile' | 'desktop';
  onBack: () => void;
  onAddToCart: (product: Product) => void;
  onBuyNow: (product: Product) => void;
  onRated: (productId: string, avgRating: number, ratingsCount: number) => void;
}

export default function ProductDetailPage({
  product, seller, interactive, previewMode, onBack, onAddToCart, onBuyNow, onRated,
}: ProductDetailPageProps) {
  const { lang } = useLang();
  const forceMobile = previewMode === 'mobile';
  const forceDesktop = previewMode === 'desktop';
  const gridClass = forceDesktop
    ? 'grid grid-cols-[auto_1fr_280px] gap-8'
    : forceMobile
      ? 'grid grid-cols-1 gap-6'
      : 'grid grid-cols-1 lg:grid-cols-[auto_1fr_280px] gap-6 lg:gap-8';
  const galleryWrapClass = forceDesktop ? 'flex gap-2.5 w-[340px]' : forceMobile ? 'flex gap-2.5' : 'flex gap-2.5 lg:w-[340px]';
  const thumbColClass = forceMobile
    ? 'hidden'
    : forceDesktop
      ? 'flex flex-col gap-2 w-16 shrink-0 max-h-[420px] overflow-y-auto'
      : 'hidden sm:flex flex-col gap-2 w-16 shrink-0 max-h-[420px] overflow-y-auto';
  const gallery = product.images?.length ? product.images : (product.image_url ? [product.image_url] : []);
  const [activeImg, setActiveImg] = useState(0);
  const [added, setAdded] = useState(false);

  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [pendingRating, setPendingRating] = useState(0);
  const [hoverStar, setHoverStar] = useState(0);
  const [authorName, setAuthorName] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [myReviewSubmitted, setMyReviewSubmitted] = useState(false);

  const shopDisplayName = seller.shop_name || seller.display_name || seller.username || 'Boutique';
  const isFree = (seller.plan_type ?? 'free') === 'free';
  const outOfStock = product.quantity <= 0;
  const displayAvg = product.avg_rating || 0;
  const displayCount = product.ratings_count || 0;

  useEffect(() => {
    let cancelled = false;
    async function loadReviews() {
      setLoadingReviews(true);
      const { data } = await supabase
        .from('product_reviews')
        .select('*')
        .eq('product_id', product.id)
        .order('created_at', { ascending: false });
      if (!cancelled) {
        setReviews((data as ProductReview[]) || []);
        setLoadingReviews(false);
      }
    }
    loadReviews();
    return () => { cancelled = true; };
  }, [product.id]);

  function goPrev() {
    setActiveImg(i => (i - 1 + gallery.length) % gallery.length);
  }
  function goNext() {
    setActiveImg(i => (i + 1) % gallery.length);
  }

  function openReviewForm(stars: number) {
    if (!interactive || myReviewSubmitted) return;
    setPendingRating(stars);
    setShowReviewForm(true);
  }

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!interactive || pendingRating === 0 || submitting) return;
    setSubmitting(true);

    const { data: reviewData, error: reviewErr } = await supabase
      .from('product_reviews')
      .insert({
        product_id: product.id,
        author_name: authorName.trim() || (lang === 'fr' ? 'Client anonyme' : 'Anonymous customer'),
        rating: pendingRating,
        comment: comment.trim(),
      })
      .select()
      .maybeSingle();

    if (!reviewErr && reviewData) {
      const prevCount = product.ratings_count || 0;
      const prevAvg = product.avg_rating || 0;
      const newCount = prevCount + 1;
      const newAvg = Math.round(((prevAvg * prevCount + pendingRating) / newCount) * 10) / 10;

      await supabase.from('products').update({ avg_rating: newAvg, ratings_count: newCount }).eq('id', product.id);
      onRated(product.id, newAvg, newCount);

      setReviews(prev => [reviewData as ProductReview, ...prev]);
      setMyReviewSubmitted(true);
      setShowReviewForm(false);
      setAuthorName('');
      setComment('');
    }
    setSubmitting(false);
  }

  function handleAddToCart() {
    onAddToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  }

  return (
    <div className="max-w-6xl mx-auto w-full px-4 pt-2 pb-16">
      <button onClick={onBack}
        className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800 mb-5">
        <ArrowLeft size={14} />
        {lang === 'fr' ? 'Retour à la boutique' : 'Back to shop'}
      </button>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4 md:p-6">
        <div className={gridClass}>

          {/* ══ Galerie — miniatures à gauche, photo principale avec flèches ══ */}
          <div className={galleryWrapClass}>
            {gallery.length > 1 && (
              <div className={thumbColClass}>
                {gallery.map((img, i) => (
                  <button key={i} onClick={() => setActiveImg(i)}
                    className="aspect-square rounded-xl overflow-hidden border-2 transition shrink-0"
                    style={{ borderColor: activeImg === i ? '#6C63FF' : '#e5e7eb' }}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            <div className="relative flex-1 aspect-square rounded-2xl overflow-hidden bg-gray-100 flex items-center justify-center">
              {gallery[activeImg] ? (
                <img src={gallery[activeImg]} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <ShoppingBag size={48} className="text-gray-300" />
              )}

              {gallery.length > 1 && (
                <>
                  <button onClick={goPrev}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow-md flex items-center justify-center hover:bg-white transition">
                    <PrevIcon size={16} className="text-gray-700" />
                  </button>
                  <button onClick={goNext}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow-md flex items-center justify-center hover:bg-white transition">
                    <NextIcon size={16} className="text-gray-700" />
                  </button>
                  <div className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {activeImg + 1}/{gallery.length}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ══ Section infos produit ══ */}
          <div>
            <h1 className="text-xl font-black text-gray-900 leading-snug mb-2">{product.name}</h1>

            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map(n => (
                  <Star key={n} size={16}
                    className={n <= Math.round(displayAvg) ? 'text-amber-400 fill-current' : 'text-gray-200 fill-current'} />
                ))}
              </div>
              <span className="text-sm font-bold text-gray-700">{displayAvg.toFixed(1)}</span>
              <span className="text-xs text-gray-400">
                ({displayCount} {lang === 'fr' ? 'avis' : displayCount > 1 ? 'reviews' : 'review'})
              </span>
            </div>

            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-3xl font-black text-red-600">{product.price.toLocaleString()}</span>
              <span className="text-sm font-bold text-red-500">{product.currency}</span>
            </div>

            <div className="mb-5">
              {outOfStock ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-full">
                  {lang === 'fr' ? 'Rupture de stock' : 'Out of stock'}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                  <Package size={11} />{lang === 'fr' ? `${product.quantity} en stock` : `${product.quantity} in stock`}
                </span>
              )}
            </div>

            <p className="text-sm text-gray-600 leading-relaxed mb-6">
              {product.description || (lang === 'fr' ? 'Aucune description fournie.' : 'No description provided.')}
            </p>

            {/* Vendeur */}
            <div className="rounded-2xl border border-gray-100 p-4 flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center shrink-0">
                {seller.shop_logo_url ? (
                  <img src={seller.shop_logo_url} alt={shopDisplayName} className="w-full h-full object-cover" />
                ) : isFree ? (
                  <img src="/logo.png" alt="BioLinkWD" className="w-full h-full object-contain p-1.5"
                    onError={e => { e.currentTarget.style.display = 'none'; }} />
                ) : (
                  <Store size={20} className="text-gray-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-bold text-gray-900 truncate">{shopDisplayName}</p>
                  {!isFree && <ShieldCheck size={13} className="text-blue-500 shrink-0" />}
                </div>
                <p className="text-xs text-gray-400">@{seller.username}</p>
              </div>
            </div>

            {/* ══ Avis clients ══ */}
            <div className="rounded-2xl border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <MessageSquareText size={15} />
                  {lang === 'fr' ? 'Avis clients' : 'Customer reviews'} ({displayCount})
                </p>
              </div>

              {/* Noter */}
              {!myReviewSubmitted && interactive && !showReviewForm && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-500 mb-1.5">
                    {lang === 'fr' ? 'Noter ce produit' : 'Rate this product'}
                  </p>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button key={n}
                        onMouseEnter={() => setHoverStar(n)}
                        onMouseLeave={() => setHoverStar(0)}
                        onClick={() => openReviewForm(n)}>
                        <Star size={22}
                          className={n <= hoverStar ? 'text-amber-400 fill-current' : 'text-gray-300 fill-current'} />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {showReviewForm && (
                <form onSubmit={submitReview} className="mb-4 space-y-2.5 bg-gray-50 rounded-xl p-3.5">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button key={n} type="button" onClick={() => setPendingRating(n)}>
                        <Star size={18} className={n <= pendingRating ? 'text-amber-400 fill-current' : 'text-gray-300 fill-current'} />
                      </button>
                    ))}
                  </div>
                  <input value={authorName} onChange={e => setAuthorName(e.target.value)}
                    placeholder={lang === 'fr' ? 'Votre nom (optionnel)' : 'Your name (optional)'}
                    className="w-full rounded-lg px-3 py-2 text-xs border border-gray-200 outline-none focus:border-brand-violet" />
                  <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3}
                    placeholder={lang === 'fr' ? 'Votre avis sur ce produit...' : 'Your feedback on this product...'}
                    className="w-full rounded-lg px-3 py-2 text-xs border border-gray-200 outline-none resize-none focus:border-brand-violet" />
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setShowReviewForm(false)}
                      className="flex-1 text-xs font-semibold py-2 rounded-lg bg-white border border-gray-200 text-gray-500">
                      {lang === 'fr' ? 'Annuler' : 'Cancel'}
                    </button>
                    <button type="submit" disabled={submitting}
                      className="flex-1 text-xs font-bold py-2 rounded-lg text-white disabled:opacity-50"
                      style={{ background: 'linear-gradient(135deg,#6C63FF,#00C2FF)' }}>
                      {submitting ? '...' : (lang === 'fr' ? 'Publier' : 'Submit')}
                    </button>
                  </div>
                </form>
              )}

              {myReviewSubmitted && (
                <p className="text-xs font-semibold text-emerald-600 mb-4">
                  {lang === 'fr' ? 'Merci pour votre avis !' : 'Thanks for your review!'}
                </p>
              )}

              {/* Liste des avis */}
              {loadingReviews ? (
                <div className="py-6 flex justify-center">
                  <div className="w-5 h-5 border-2 border-gray-200 border-t-brand-violet rounded-full animate-spin" />
                </div>
              ) : reviews.length === 0 ? (
                <p className="text-xs text-gray-400 py-2">
                  {lang === 'fr' ? 'Aucun avis pour le moment. Soyez le premier à en laisser un !' : 'No reviews yet. Be the first!'}
                </p>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {reviews.map(r => (
                    <div key={r.id} className="border-t border-gray-100 pt-3 first:border-t-0 first:pt-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-gray-900">{r.author_name}</span>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map(n => (
                            <Star key={n} size={10} className={n <= r.rating ? 'text-amber-400 fill-current' : 'text-gray-200 fill-current'} />
                          ))}
                        </div>
                      </div>
                      {r.comment && <p className="text-xs text-gray-600 leading-relaxed">{r.comment}</p>}
                      <p className="text-[10px] text-gray-400 mt-0.5">{new Date(r.created_at).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ══ Colonne latérale — expédition, paiement sécurisé, actions ══ */}
          <div className="space-y-4">
            {/* Actions */}
            <div className="space-y-2.5">
              <button onClick={() => onBuyNow(product)} disabled={outOfStock || !interactive}
                className="w-full py-3 rounded-2xl text-sm font-bold text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg,#6C63FF,#00C2FF)' }}>
                {lang === 'fr' ? 'Commander maintenant' : 'Buy now'}
              </button>
              <button onClick={handleAddToCart} disabled={outOfStock || !interactive}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold border-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ borderColor: '#6C63FF', color: added ? '#fff' : '#6C63FF', background: added ? '#22c55e' : 'transparent' }}>
                {added ? <Check size={15} /> : <ShoppingCart size={15} />}
                {added ? (lang === 'fr' ? 'Ajouté !' : 'Added!') : (lang === 'fr' ? 'Ajouter au panier' : 'Add to cart')}
              </button>
            </div>

            {/* Expédition */}
            <div className="rounded-2xl border border-gray-100 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Truck size={15} className="text-gray-500" />
                <p className="text-sm font-bold text-gray-900">{lang === 'fr' ? 'Expédition' : 'Shipping'}</p>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                {lang === 'fr'
                  ? 'Frais de livraison et date à négocier directement avec le vendeur après votre commande.'
                  : 'Shipping fees and delivery date to arrange directly with the seller after your order.'}
              </p>
            </div>

            {/* Paiement sécurisé */}
            <div className="rounded-2xl border border-gray-100 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Lock size={15} className="text-emerald-600" />
                <p className="text-sm font-bold text-gray-900">{lang === 'fr' ? 'Paiements sécurisés' : 'Secure payments'}</p>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <CreditCard size={16} className="text-gray-400" />
                <span className="text-[11px] font-semibold text-gray-500">Visa · Mastercard · MTN · Orange</span>
              </div>
              <div className="flex items-start gap-2 mb-2.5">
                <ShieldCheck size={14} className="text-emerald-600 mt-0.5 shrink-0" />
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  {lang === 'fr' ? 'Protection des commandes garantie sur BioLinkWD.' : 'Order protection guaranteed on BioLinkWD.'}
                </p>
              </div>
              <div className="flex items-start gap-2">
                <RotateCcw size={14} className="text-emerald-600 mt-0.5 shrink-0" />
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  {lang === 'fr' ? 'Protection de remboursement si la commande n\'est pas livrée.' : 'Refund protection if your order isn\'t delivered.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
