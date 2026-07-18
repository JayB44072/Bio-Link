import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { LandingLang } from '../../lib/landingTranslations';
import { ShoppingBag } from 'lucide-react';

interface LiveSalesToastProps {
  sellerId: string;
  interactive: boolean;
  lang: LandingLang;
}

interface RecentSale {
  id: string;
  buyer_name: string | null;
  delivery_address: string | null;
  amount: number;
  currency: string;
  created_at: string;
  product_name?: string | null;
}

interface RawTransaction {
  id: string;
  buyer_name: string | null;
  delivery_address: string | null;
  amount: number;
  currency: string;
  created_at: string;
  product_id: string | null;
}

interface ProductRow {
  id: string;
  name: string;
}

function anonymizeName(name: string | null | undefined, lang: LandingLang): string {
  const fallback =
    lang === 'fr' ? 'un client'
    : lang === 'en' ? 'a customer'
    : lang === 'pt' ? 'um cliente'
    : 'ein Kunde';
  if (!name || !name.trim()) return fallback;
  const first = name.trim().split(/\s+/)[0];
  if (first.length <= 1) return `${first.toUpperCase()}***`;
  // First name only if it's short enough — else first letter + ***
  if (first.length <= 12) return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
  return `${first.charAt(0).toUpperCase()}***`;
}

function extractCity(address: string | null | undefined, lang: LandingLang): string {
  const fallback =
    lang === 'fr' ? 'ville inconnue'
    : lang === 'en' ? 'unknown city'
    : lang === 'pt' ? 'cidade desconhecida'
    : 'unbekannte Stadt';
  if (!address || !address.trim()) return fallback;
  const first = address.split(',')[0].trim();
  return first || fallback;
}

function timeAgo(iso: string, lang: LandingLang): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.max(1, Math.floor(diffMs / 60000));
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);

  if (lang === 'fr') {
    if (days > 0) return `il y a ${days}j`;
    if (hours > 0) return `il y a ${hours}h`;
    return `il y a ${mins} min`;
  }
  if (lang === 'en') {
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return `${mins} min ago`;
  }
  if (lang === 'pt') {
    if (days > 0) return `há ${days}d`;
    if (hours > 0) return `há ${hours}h`;
    return `há ${mins} min`;
  }
  // de
  if (days > 0) return `vor ${days} T.`;
  if (hours > 0) return `vor ${hours} Std.`;
  return `vor ${mins} Min.`;
}

function verbBought(lang: LandingLang): string {
  if (lang === 'fr') return "vient d'acheter";
  if (lang === 'en') return 'just bought';
  if (lang === 'pt') return 'acabou de comprar';
  return 'hat gerade gekauft';
}

export default function LiveSalesToast({ sellerId, interactive, lang }: LiveSalesToastProps) {
  const [sales, setSales] = useState<RecentSale[] | null>(null);
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!interactive || !sellerId) return;
    let cancelled = false;

    async function load() {
      const { data: txs } = await supabase
        .from('transactions')
        .select('id, buyer_name, delivery_address, amount, currency, created_at, product_id')
        .eq('seller_id', sellerId)
        .in('status', ['pending', 'completed'])
        .order('created_at', { ascending: false })
        .limit(10);

      if (cancelled) return;
      const list = (txs as RawTransaction[] | null) ?? [];
      if (list.length === 0) {
        setSales([]);
        return;
      }

      // Fetch product names in a single query
      const productIds = Array.from(
        new Set(list.map(t => t.product_id).filter((id): id is string => !!id)),
      );
      const productNameById = new Map<string, string>();
      if (productIds.length > 0) {
        const { data: prods } = await supabase
          .from('products')
          .select('id, name')
          .in('id', productIds);
        for (const p of (prods as ProductRow[] | null) ?? []) {
          productNameById.set(p.id, p.name);
        }
      }

      const enriched: RecentSale[] = list.map(t => ({
        id: t.id,
        buyer_name: t.buyer_name,
        delivery_address: t.delivery_address,
        amount: t.amount,
        currency: t.currency,
        created_at: t.created_at,
        product_name: t.product_id ? productNameById.get(t.product_id) ?? null : null,
      }));

      if (!cancelled) setSales(enriched);
    }

    load();
    return () => { cancelled = true; };
  }, [sellerId, interactive]);

  // Rotation loop: show 6s, hide 2s, next.
  useEffect(() => {
    if (!sales || sales.length === 0) return;
    let showTimer: number | undefined;
    let hideTimer: number | undefined;

    setVisible(true);
    showTimer = window.setTimeout(() => setVisible(false), 6000);
    hideTimer = window.setTimeout(() => {
      setIndex(i => (i + 1) % sales.length);
    }, 8000);

    return () => {
      if (showTimer) window.clearTimeout(showTimer);
      if (hideTimer) window.clearTimeout(hideTimer);
    };
  }, [sales, index]);

  if (!interactive) return null;
  if (!sales || sales.length === 0) return null;

  const current = sales[index];
  const buyer = anonymizeName(current.buyer_name, lang);
  const city = extractCity(current.delivery_address, lang);
  const product = current.product_name
    ?? (lang === 'fr' ? 'un produit' : lang === 'en' ? 'a product' : lang === 'pt' ? 'um produto' : 'ein Produkt');
  const ago = timeAgo(current.created_at, lang);
  const bought = verbBought(lang);

  return (
    <div
      className="fixed z-40 pointer-events-none bottom-4 left-4 sm:left-4 max-w-[280px]"
      style={{
        transition: 'transform 0.4s cubic-bezier(0.4,0,0.2,1), opacity 0.4s ease',
        transform: visible ? 'translateX(0)' : 'translateX(-120%)',
        opacity: visible ? 1 : 0,
      }}
    >
      <div
        className="pointer-events-auto flex items-start gap-2.5 px-3 py-2.5 rounded-2xl shadow-xl backdrop-blur-md"
        style={{
          background: 'rgba(17,17,32,0.92)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <div
          className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)' }}
        >
          <ShoppingBag size={14} className="text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] leading-snug text-white">
            <span aria-hidden="true">🎉 </span>
            <span className="font-bold">{buyer}</span>
            {' '}
            <span className="opacity-80">({city})</span>
            {' '}
            <span className="opacity-90">{bought}</span>
            {' '}
            <span className="font-semibold">{product}</span>
          </p>
          <p className="text-[10px] mt-0.5 text-white/60">{ago}</p>
        </div>
      </div>
    </div>
  );
}
