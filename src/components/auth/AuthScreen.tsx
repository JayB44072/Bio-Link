import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useLang } from '../../lib/LanguageContext';
import LanguageSelector from '../ui/LanguageSelector';
import { Duck, Zap, ShoppingBag, Link2, BarChart3 } from 'lucide-react';

interface AuthScreenProps {
  onAuth: () => void;
}

export default function AuthScreen({ onAuth }: AuthScreenProps) {
  const { t } = useLang();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const sanitizeUsername = (v: string) => v.toLowerCase().replace(/[^a-z0-9-]/g, '');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (mode === 'register' && password !== confirmPassword) {
      setError(t.passwordMismatch);
      return;
    }
    setLoading(true);
    try {
      if (mode === 'login') {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        onAuth();
      } else {
        // Check username availability
        const { data: existing } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', username)
          .maybeSingle();
        if (existing) {
          setError(t.usernameTaken);
          setLoading(false);
          return;
        }
        const { data, error: err } = await supabase.auth.signUp({ email, password });
        if (err) throw err;
        if (data.user) {
          await supabase.from('profiles').insert({
            user_id: data.user.id,
            username: username,
            display_name: displayName,
            plan_type: 'free',
          });
        }
        onAuth();
      }
    } catch (err: any) {
      setError(err.message || t.error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Link2 size={16} className="text-white" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">BioLinkWD</span>
        </div>
        <LanguageSelector />
      </header>

      <div className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Hero */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-blue-600/10 border border-blue-600/20 rounded-full px-4 py-1.5 mb-6">
              <Zap size={12} className="text-blue-400" />
              <span className="text-blue-400 text-xs font-medium">WhiteDukeSaaS Micro-Boutiques</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">{t.welcome}</h1>
            <p className="text-gray-400 text-sm">{t.tagline}</p>
          </div>

          {/* Features pills */}
          <div className="flex flex-wrap gap-2 justify-center mb-8">
            {[
              { icon: ShoppingBag, label: mode === 'login' ? 'Boutique' : 'Shop' },
              { icon: Link2, label: 'Bio Link' },
              { icon: BarChart3, label: mode === 'login' ? 'Analytics' : 'Analytics' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5 bg-gray-800 rounded-full px-3 py-1">
                <Icon size={12} className="text-gray-400" />
                <span className="text-gray-300 text-xs">{label}</span>
              </div>
            ))}
          </div>

          {/* Card */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl">
            {/* Tabs */}
            <div className="flex bg-gray-800 rounded-xl p-1 mb-6">
              {(['login', 'register'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setError(''); }}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                    mode === m
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {m === 'login' ? t.login : t.register}
                </button>
              ))}
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 mb-4">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <>
                  <div>
                    <label className="block text-gray-300 text-sm mb-1.5">{t.displayName}</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={e => setDisplayName(e.target.value)}
                      required
                      placeholder="Nom"
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm mb-1.5">{t.username}</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">@</span>
                      <input
                        type="text"
                        value={username}
                        onChange={e => setUsername(sanitizeUsername(e.target.value))}
                        required
                        placeholder="nom d'utilisateur"
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-8 pr-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
                      />
                    </div>
                    <p className="text-gray-500 text-xs mt-1">{t.usernameHelper}</p>
                  </div>
                </>
              )}
              <div>
                <label className="block text-gray-300 text-sm mb-1.5">{t.email}</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm mb-1.5">{t.password}</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
                />
              </div>
              {mode === 'register' && (
                <div>
                  <label className="block text-gray-300 text-sm mb-1.5">{t.confirmPassword}</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-blue-600/20 mt-2"
              >
                {loading
                  ? (mode === 'login' ? t.loggingIn : t.registering)
                  : (mode === 'login' ? t.loginAction : t.registerAction)
                }
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );  
}
