import React from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppPrefsProvider, useAppPrefs } from '../../lib/AppPrefsContext';
import { LanguageProvider, useLang } from '../../lib/LanguageContext';

// ── Composants helpers ────────────────────────────────────────────────────────

function AppPrefsDisplay() {
  const { isDark, lang, toggleDark, setLang } = useAppPrefs();
  return (
    <div>
      <span data-testid="isDark">{isDark.toString()}</span>
      <span data-testid="lang">{lang}</span>
      <button onClick={toggleDark}>toggle dark</button>
      <button onClick={() => setLang('en')}>set en</button>
      <button onClick={() => setLang('fr')}>set fr</button>
    </div>
  );
}

function LangDisplay() {
  const { lang, setLang, t } = useLang();
  return (
    <div>
      <span data-testid="lang">{lang}</span>
      <span data-testid="t-login">{t.login}</span>
      <button onClick={() => setLang('en')}>set en</button>
      <button onClick={() => setLang('fr')}>set fr</button>
    </div>
  );
}

function ThrowOutsideProvider() {
  try {
    useAppPrefs();
  } catch (e: any) {
    return <span>{e.message}</span>;
  }
  return null;
}

function ThrowOutsideLangProvider() {
  try {
    useLang();
  } catch (e: any) {
    return <span>{e.message}</span>;
  }
  return null;
}

// ── AppPrefsProvider ──────────────────────────────────────────────────────────

describe('AppPrefsProvider — valeurs par défaut', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('isDark vaut false par défaut (pas de localStorage)', () => {
    render(<AppPrefsProvider><AppPrefsDisplay /></AppPrefsProvider>);
    expect(screen.getByTestId('isDark')).toHaveTextContent('false');
  });

  it('isDark lit "1" dans localStorage (biolinkwd_dark)', () => {
    localStorage.setItem('biolinkwd_dark', '1');
    render(<AppPrefsProvider><AppPrefsDisplay /></AppPrefsProvider>);
    expect(screen.getByTestId('isDark')).toHaveTextContent('true');
  });

  it('isDark vaut false si biolinkwd_dark = "0"', () => {
    localStorage.setItem('biolinkwd_dark', '0');
    render(<AppPrefsProvider><AppPrefsDisplay /></AppPrefsProvider>);
    expect(screen.getByTestId('isDark')).toHaveTextContent('false');
  });

  it('lang vaut "fr" par défaut (pas de localStorage)', () => {
    render(<AppPrefsProvider><AppPrefsDisplay /></AppPrefsProvider>);
    expect(screen.getByTestId('lang')).toHaveTextContent('fr');
  });

  it('lang lit "en" depuis localStorage (biolinkwd_lang)', () => {
    localStorage.setItem('biolinkwd_lang', 'en');
    render(<AppPrefsProvider><AppPrefsDisplay /></AppPrefsProvider>);
    expect(screen.getByTestId('lang')).toHaveTextContent('en');
  });

  it('lang tombe sur "fr" si la valeur localStorage est invalide', () => {
    localStorage.setItem('biolinkwd_lang', 'xx');
    render(<AppPrefsProvider><AppPrefsDisplay /></AppPrefsProvider>);
    expect(screen.getByTestId('lang')).toHaveTextContent('fr');
  });
});

describe('AppPrefsProvider — interactions', () => {
  beforeEach(() => { localStorage.clear(); });
  afterEach(() => { localStorage.clear(); });

  it('toggleDark passe isDark de false à true', async () => {
    const user = userEvent.setup();
    render(<AppPrefsProvider><AppPrefsDisplay /></AppPrefsProvider>);
    expect(screen.getByTestId('isDark')).toHaveTextContent('false');
    await user.click(screen.getByRole('button', { name: /toggle dark/i }));
    expect(screen.getByTestId('isDark')).toHaveTextContent('true');
  });

  it('toggleDark persiste dans localStorage', async () => {
    const user = userEvent.setup();
    render(<AppPrefsProvider><AppPrefsDisplay /></AppPrefsProvider>);
    await user.click(screen.getByRole('button', { name: /toggle dark/i }));
    expect(localStorage.getItem('biolinkwd_dark')).toBe('1');
  });

  it('toggleDark repasse isDark à false au second clic', async () => {
    const user = userEvent.setup();
    render(<AppPrefsProvider><AppPrefsDisplay /></AppPrefsProvider>);
    await user.click(screen.getByRole('button', { name: /toggle dark/i }));
    await user.click(screen.getByRole('button', { name: /toggle dark/i }));
    expect(screen.getByTestId('isDark')).toHaveTextContent('false');
    expect(localStorage.getItem('biolinkwd_dark')).toBe('0');
  });

  it('setLang change la langue et persiste dans localStorage', async () => {
    const user = userEvent.setup();
    render(<AppPrefsProvider><AppPrefsDisplay /></AppPrefsProvider>);
    await user.click(screen.getByRole('button', { name: /set en/i }));
    expect(screen.getByTestId('lang')).toHaveTextContent('en');
    expect(localStorage.getItem('biolinkwd_lang')).toBe('en');
  });

  it('setLang("fr") revient au français', async () => {
    const user = userEvent.setup();
    localStorage.setItem('biolinkwd_lang', 'en');
    render(<AppPrefsProvider><AppPrefsDisplay /></AppPrefsProvider>);
    await user.click(screen.getByRole('button', { name: /set fr/i }));
    expect(screen.getByTestId('lang')).toHaveTextContent('fr');
  });
});

describe('AppPrefsProvider — erreur hors contexte', () => {
  it('useAppPrefs hors Provider lance une erreur', () => {
    render(<ThrowOutsideProvider />);
    expect(screen.getByText(/useAppPrefs must be used inside AppPrefsProvider/i)).toBeInTheDocument();
  });
});

// ── LanguageProvider ──────────────────────────────────────────────────────────

describe('LanguageProvider — valeurs par défaut', () => {
  it('lang vaut "fr" par défaut', () => {
    render(<LanguageProvider><LangDisplay /></LanguageProvider>);
    expect(screen.getByTestId('lang')).toHaveTextContent('fr');
  });

  it('t.login est "Connexion" en français', () => {
    render(<LanguageProvider><LangDisplay /></LanguageProvider>);
    expect(screen.getByTestId('t-login')).toHaveTextContent('Connexion');
  });
});

describe('LanguageProvider — interactions', () => {
  it('setLang("en") change lang à "en"', async () => {
    const user = userEvent.setup();
    render(<LanguageProvider><LangDisplay /></LanguageProvider>);
    await user.click(screen.getByRole('button', { name: /set en/i }));
    expect(screen.getByTestId('lang')).toHaveTextContent('en');
  });

  it('setLang("en") change t.login à "Login"', async () => {
    const user = userEvent.setup();
    render(<LanguageProvider><LangDisplay /></LanguageProvider>);
    await user.click(screen.getByRole('button', { name: /set en/i }));
    expect(screen.getByTestId('t-login')).toHaveTextContent('Login');
  });

  it('setLang("fr") revient à "Connexion"', async () => {
    const user = userEvent.setup();
    render(<LanguageProvider><LangDisplay /></LanguageProvider>);
    await user.click(screen.getByRole('button', { name: /set en/i }));
    await user.click(screen.getByRole('button', { name: /set fr/i }));
    expect(screen.getByTestId('t-login')).toHaveTextContent('Connexion');
  });
});

describe('LanguageProvider — erreur hors contexte', () => {
  it('useLang hors Provider lance une erreur', () => {
    render(<ThrowOutsideLangProvider />);
    expect(screen.getByText(/useLang must be used inside LanguageProvider/i)).toBeInTheDocument();
  });
});
