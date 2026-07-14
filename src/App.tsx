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
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(160deg,#F8F6FF,#EDF7FF)' }}>
        <div className="w-10 h-10 border-4 border-purple-200 border-t-brand-violet rounded-full animate-spin" />
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
