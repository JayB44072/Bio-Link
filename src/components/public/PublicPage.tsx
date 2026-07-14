import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Profile, Product, Service } from '../../lib/types';
import { useLang } from '../../lib/LanguageContext';
import LanguageSelector from '../ui/LanguageSelector';
import PublicProfileView from './PublicProfileView';
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
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        <span className="text-gray-400 text-xs font-medium tracking-wider animate-pulse">L'univers de @{username} charge...</span>
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
