import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Profile, Product, Service } from '../../lib/types';
import { useLang } from '../../lib/LanguageContext';
import LanguageSelector from '../ui/LanguageSelector';
import PublicProfileView from './PublicProfileView';
import { Skeleton, SkeletonProductCard } from '../ui/Skeleton';
import { Link2 } from 'lucide-react';

interface PublicPageProps {
  username: string;
}

export default function PublicPage({ username }: PublicPageProps) {
  const { t } = useLang();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .maybeSingle();

      if (prof) {
        setProfile({ ...prof, social_links: prof.social_links || [] });

        await supabase.from('page_views').insert({ profile_id: prof.id });

        const [{ data: prods }, { data: svcs }] = await Promise.all([
          supabase.from('products').select('*').eq('user_id', prof.user_id).eq('is_active', true).order('created_at', { ascending: false }),
          supabase.from('services').select('*').eq('user_id', prof.user_id).eq('is_active', true).order('created_at', { ascending: false }),
        ]);
        setProducts(prods || []);
        setServices(svcs || []);
      }
      setLoading(false);
    }
    load();
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: '#fbfaff' }}>
        {/* Header skeleton */}
        <header className="sticky top-0 z-40 backdrop-blur-md border-b bg-white/95 border-gray-200">
          <div className="max-w-5xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-2.5">
            <Skeleton className="w-9 h-9 rounded-xl" />
            <Skeleton className="h-4 w-24" />
            <div className="flex-1"><Skeleton className="h-8 w-full rounded-full" /></div>
            <Skeleton className="w-9 h-9 rounded-full" />
          </div>
        </header>
        {/* Products grid skeleton */}
        <div className="max-w-5xl mx-auto w-full px-4 pt-6 pb-20">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonProductCard key={i} />)}
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-center px-4 relative overflow-hidden">
        <div className="w-20 h-20 bg-gray-900 border border-gray-800 rounded-3xl flex items-center justify-center mb-6 shadow-2xl relative z-10">
          <Link2 size={32} className="text-gray-600" />
        </div>
        <h1 className="text-white text-2xl font-black mb-2 relative z-10">{t.profileNotFound}</h1>
        <p className="text-gray-500 text-sm max-w-xs relative z-10">
          La micro-boutique de <span className="text-blue-400">@{username}</span> n'est pas encore disponible ou a changé d'adresse.
        </p>
        <LanguageSelector className="mt-8 relative z-10" />
      </div>
    );
  }

  return <PublicProfileView profile={profile} products={products} services={services} interactive />;
}
