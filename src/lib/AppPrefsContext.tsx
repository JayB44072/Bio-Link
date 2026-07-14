import React, { createContext, useContext, useState, useCallback } from 'react';
import { landingTranslations, LandingLang, LandingT } from './landingTranslations';

interface AppPrefs {
  isDark: boolean;
  lang: LandingLang;
  t: LandingT;
  toggleDark: () => void;
  setLang: (l: LandingLang) => void;
}

const Ctx = createContext<AppPrefs | null>(null);

function readBool(key: string, def: boolean): boolean {
  try { const v = localStorage.getItem(key); return v === null ? def : v === '1'; } catch { return def; }
}
function readLang(): LandingLang {
  try {
    const v = localStorage.getItem('biolinkwd_lang') as LandingLang;
    return ['fr','en','pt','de'].includes(v) ? v : 'fr';
  } catch { return 'fr'; }
}

export function AppPrefsProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(() => readBool('biolinkwd_dark', false));
  const [lang, setLangState] = useState<LandingLang>(readLang);

  const toggleDark = useCallback(() => {
    setIsDark(v => {
      const next = !v;
      try { localStorage.setItem('biolinkwd_dark', next ? '1' : '0'); } catch {}
      return next;
    });
  }, []);

  const setLang = useCallback((l: LandingLang) => {
    setLangState(l);
    try { localStorage.setItem('biolinkwd_lang', l); } catch {}
  }, []);

  return (
    <Ctx.Provider value={{ isDark, lang, t: landingTranslations[lang], toggleDark, setLang }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAppPrefs() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAppPrefs must be used inside AppPrefsProvider');
  return ctx;
}
