import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Language } from './types';
import { translations } from './translations';

interface LanguageContextType {
  lang: Language;
  setLang: (l: Language) => void;
  t: typeof translations.fr;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>('fr');
  const t = translations[lang];
  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang must be used inside LanguageProvider');
  return ctx;
}
