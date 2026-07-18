import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { LanguageProvider } from './lib/LanguageContext';
import { AppPrefsProvider } from './lib/AppPrefsContext';
import LandingPage from './components/landing/LandingPage';
import AuthScreen from './components/auth/AuthScreen';
import Dashboard from './components/dashboard/Dashboard';
import PublicPage from './components/public/PublicPage';
import BuyerOrderPage from './components/public/BuyerOrderPage';
import OrderLookupPage from './components/public/OrderLookupPage';
import PrivacyPage from './components/legal/PrivacyPage';
import { Session } from '@supabase/supabase-js';

type AuthMode = null | 'login' | 'register';

function Router({ session }: { session: Session | null }) {
  const path = window.location.pathname;
  const [authMode, setAuthMode] = useState<AuthMode>(null);

  // Privacy policy page
  if (path === '/privacy') return <PrivacyPage />;

  // Order tracking page: /commande/:id
  const orderMatch = path.match(/^\/commande\/([^/]+)\/?$/);
  if (orderMatch) return <BuyerOrderPage orderId={orderMatch[1]} />;

  // Retrouver sa commande par numéro de téléphone (en cas de lien perdu)
  if (path === '/suivi') return <OrderLookupPage />;

  // Public profile page: /u/:username
  const publicMatch = path.match(/^\/u\/([^/]+)\/?$/);
  if (publicMatch) return <PublicPage username={publicMatch[1]} />;

  // Logged in → dashboard
  if (session) return <Dashboard />;

  // Show auth screen when requested
  if (authMode) {
    return (
      <AuthScreen
        defaultMode={authMode}
        onAuth={() => window.location.reload()}
        onBack={() => setAuthMode(null)}
      />
    );
  }

  // Landing page (not logged in)
  return (
    <LandingPage
      onLogin={() => setAuthMode('login')}
      onRegister={() => setAuthMode('register')}
    />
  );
}

export default function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setSession(session));
    const onPop = () => setSession(s => s);
    window.addEventListener('popstate', onPop);
    return () => { subscription.unsubscribe(); window.removeEventListener('popstate', onPop); };
  }, []);

  if (session === undefined) {
    return (
      <div className="min-h-screen" style={{ background: 'linear-gradient(160deg,#F8F6FF,#EDF7FF)' }}>
        {/* Nav skeleton */}
        <div className="border-b border-white/40 backdrop-blur bg-white/60">
          <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-100 animate-pulse" />
              <div className="h-4 w-24 rounded bg-purple-100 animate-pulse" />
            </div>
            <div className="hidden md:flex items-center gap-6">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-3 w-16 rounded bg-purple-100 animate-pulse" />)}
            </div>
            <div className="flex items-center gap-2">
              <div className="h-9 w-20 rounded-full bg-purple-100 animate-pulse" />
              <div className="h-9 w-24 rounded-full bg-purple-200 animate-pulse" />
            </div>
          </div>
        </div>
        {/* Hero skeleton */}
        <div className="max-w-6xl mx-auto px-4 md:px-6 pt-16 md:pt-24 pb-16 grid md:grid-cols-2 gap-10 items-center">
          <div className="space-y-5">
            <div className="h-6 w-40 rounded-full bg-purple-100 animate-pulse" />
            <div className="space-y-3">
              <div className="h-10 md:h-14 w-full rounded-2xl bg-purple-100 animate-pulse" />
              <div className="h-10 md:h-14 w-3/4 rounded-2xl bg-purple-100 animate-pulse" />
            </div>
            <div className="h-4 w-full rounded bg-purple-100 animate-pulse" />
            <div className="h-4 w-5/6 rounded bg-purple-100 animate-pulse" />
            <div className="flex gap-3 pt-2">
              <div className="h-12 w-40 rounded-full bg-purple-200 animate-pulse" />
              <div className="h-12 w-36 rounded-full bg-purple-100 animate-pulse" />
            </div>
          </div>
          <div className="h-80 md:h-96 rounded-3xl bg-purple-100 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <AppPrefsProvider>
      <LanguageProvider>
        <Router session={session} />
      </LanguageProvider>
    </AppPrefsProvider>
  );
}
