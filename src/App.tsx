import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { LanguageProvider } from './lib/LanguageContext';
import AuthScreen from './components/auth/AuthScreen';
import Dashboard from './components/dashboard/Dashboard';
import PublicPage from './components/public/PublicPage';
import { Session } from '@supabase/supabase-js';

function Router({ session }: { session: Session | null }) {
  const path = window.location.pathname;

  // Public page route: /u/:username
  const publicMatch = path.match(/^\/u\/([^/]+)\/?$/);
  if (publicMatch) {
    return <PublicPage username={publicMatch[1]} />;
  }

  // Auth / Dashboard
  if (!session) {
    return <AuthScreen onAuth={() => window.location.reload()} />;
  }

  return <Dashboard />;
}

export default function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    // Handle browser navigation
    const handlePopState = () => setSession(s => s);
    window.addEventListener('popstate', handlePopState);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  if (session === undefined) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <LanguageProvider>
      <Router session={session} />
    </LanguageProvider>
  );
}
