import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AuthScreen from '../../components/auth/AuthScreen';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const { mockSignInWithPassword, mockSignUp, mockMaybeSingle, mockAuthFrom } = vi.hoisted(() => {
  const mockMaybeSingle = vi.fn().mockResolvedValue({ data: null });
  const mockEqAuth = vi.fn(() => ({ maybeSingle: mockMaybeSingle }));
  const mockSelectAuth = vi.fn(() => ({ eq: mockEqAuth }));
  const mockInsert = vi.fn().mockResolvedValue({ error: null });
  const mockAuthFrom = vi.fn(() => ({ select: mockSelectAuth, insert: mockInsert }));
  const mockSignInWithPassword = vi.fn().mockResolvedValue({ error: null });
  const mockSignUp = vi.fn().mockResolvedValue({
    data: { user: { id: 'new-user-id' } },
    error: null,
  });
  return { mockSignInWithPassword, mockSignUp, mockMaybeSingle, mockAuthFrom };
});

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: mockSignInWithPassword,
      signUp: mockSignUp,
      signInWithOAuth: vi.fn().mockResolvedValue({ error: null }),
    },
    from: mockAuthFrom,
  },
}));

vi.mock('../../lib/LanguageContext', () => ({
  useLang: () => ({
    lang: 'fr',
    t: {
      displayName: 'Nom affiché',
      username: "Nom d'utilisateur",
      password: 'Mot de passe',
      confirmPassword: 'Confirmer le mot de passe',
      email: 'Email',
      loginAction: 'Se connecter',
      registerAction: 'Créer mon compte',
      loggingIn: 'Connexion...',
      registering: 'Création...',
      passwordMismatch: 'Les mots de passe ne correspondent pas',
      usernameTaken: "Ce nom d'utilisateur est déjà pris",
      usernameHelper: 'Lettres, chiffres et tirets uniquement',
      error: 'Une erreur est survenue',
    },
  }),
}));

vi.mock('../../lib/AppPrefsContext', () => ({
  useAppPrefs: () => ({
    isDark: false,
    lang: 'fr',
    t: {
      navLogin: 'Connexion',
      navRegister: "S'inscrire",
      feat2Tag: 'Commerce',
      feat3Tag: 'Analytics',
    },
    toggleDark: vi.fn(),
    setLang: vi.fn(),
  }),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderAuth(mode: 'login' | 'register' = 'login') {
  const onAuth = vi.fn();
  render(<AuthScreen onAuth={onAuth} defaultMode={mode} />);
  return { onAuth };
}

const emailInput   = () => document.querySelector('input[type="email"]') as HTMLInputElement;
const passwordInputs = () => Array.from(document.querySelectorAll('input[type="password"]')) as HTMLInputElement[];
const textboxes    = () => Array.from(document.querySelectorAll('input[type="text"]')) as HTMLInputElement[];

// ── Rendu initial ─────────────────────────────────────────────────────────────

describe('AuthScreen — rendu initial (login)', () => {
  it('s\'affiche sans crash', () => {
    renderAuth();
    expect(document.body).toBeTruthy();
  });

  it('affiche le champ email (input type=email)', () => {
    renderAuth();
    expect(emailInput()).not.toBeNull();
  });

  it('affiche un champ mot de passe', () => {
    renderAuth();
    expect(passwordInputs().length).toBeGreaterThanOrEqual(1);
  });

  it('affiche le bouton "Se connecter"', () => {
    renderAuth();
    expect(screen.getByRole('button', { name: /Se connecter/i })).toBeInTheDocument();
  });

  it('n\'affiche pas les champs register en mode login', () => {
    renderAuth('login');
    // En login, pas de champ "Nom affiché" (type=text)
    expect(textboxes().length).toBe(0);
  });

  it('un seul champ password en mode login', () => {
    renderAuth('login');
    expect(passwordInputs().length).toBe(1);
  });
});

// ── Mode register ─────────────────────────────────────────────────────────────

describe('AuthScreen — mode register', () => {
  it("ne demande que l'email et le mot de passe (aucun champ texte)", () => {
    renderAuth('register');
    expect(emailInput()).not.toBeNull();
    expect(textboxes().length).toBe(0);
  });

  it('affiche un seul champ mot de passe (pas de confirmation)', () => {
    renderAuth('register');
    expect(passwordInputs().length).toBe(1);
  });

  it('affiche le bouton "Créer mon compte"', () => {
    renderAuth('register');
    expect(screen.getByRole('button', { name: /Créer mon compte/i })).toBeInTheDocument();
  });
});

// ── Bascule de mode ───────────────────────────────────────────────────────────

describe('AuthScreen — bascule login / register', () => {
  it('passer en mode register affiche le bouton "Créer mon compte" sans champ texte', async () => {
    const user = userEvent.setup();
    renderAuth('login');

    expect(screen.queryByRole('button', { name: /Créer mon compte/i })).toBeNull();

    const registerButtons = screen.getAllByRole('button', { name: /s'inscrire/i });
    await user.click(registerButtons[0]);

    expect(screen.getByRole('button', { name: /Créer mon compte/i })).toBeInTheDocument();
    expect(textboxes().length).toBe(0);
    expect(passwordInputs().length).toBe(1);
  });
});

// ── Connexion réussie ─────────────────────────────────────────────────────────

describe('AuthScreen — connexion réussie', () => {
  it('appelle signInWithPassword avec les bons paramètres', async () => {
    const user = userEvent.setup();
    renderAuth('login');

    await user.type(emailInput(), 'test@example.com');
    await user.type(passwordInputs()[0], 'monmotdepasse');
    await user.click(screen.getByRole('button', { name: /Se connecter/i }));

    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'monmotdepasse',
      });
    });
  });

  it('appelle onAuth après connexion réussie', async () => {
    const user = userEvent.setup();
    const { onAuth } = renderAuth('login');

    await user.type(emailInput(), 'test@example.com');
    await user.type(passwordInputs()[0], 'monmotdepasse');
    await user.click(screen.getByRole('button', { name: /Se connecter/i }));

    await waitFor(() => {
      expect(onAuth).toHaveBeenCalledOnce();
    });
  });
});

// ── Connexion échouée ─────────────────────────────────────────────────────────

describe('AuthScreen — erreurs de connexion', () => {
  it('affiche le message d\'erreur Supabase et n\'appelle pas onAuth', async () => {
    mockSignInWithPassword.mockResolvedValueOnce({
      error: { message: 'Invalid login credentials' },
    });

    const user = userEvent.setup();
    const { onAuth } = renderAuth('login');

    await user.type(emailInput(), 'wrong@test.com');
    await user.type(passwordInputs()[0], 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /Se connecter/i }));

    await waitFor(() => {
      expect(screen.getByText(/Invalid login credentials/i)).toBeInTheDocument();
    });
    expect(onAuth).not.toHaveBeenCalled();
  });
});

// ── Inscription ───────────────────────────────────────────────────────────────

describe('AuthScreen — inscription', () => {
  it('inscription réussie (email + mot de passe) appelle signUp puis onAuth', async () => {
    const user = userEvent.setup();
    const { onAuth } = renderAuth('register');

    await user.type(emailInput(), 'new@test.com');
    await user.type(passwordInputs()[0], 'password123');
    await user.click(screen.getByRole('button', { name: /Créer mon compte/i }));

    await waitFor(() => {
      expect(onAuth).toHaveBeenCalledOnce();
    }, { timeout: 5000 });
    expect(mockSignUp).toHaveBeenCalledWith({ email: 'new@test.com', password: 'password123' });
  });

  it('identifiant déjà pris → un autre identifiant est cherché, sans erreur affichée', async () => {
    mockMaybeSingle.mockClear();
    mockMaybeSingle.mockResolvedValueOnce({ data: { id: 'existing-profile' } });

    const user = userEvent.setup();
    const { onAuth } = renderAuth('register');

    await user.type(emailInput(), 'taken@test.com');
    await user.type(passwordInputs()[0], 'password123');
    await user.click(screen.getByRole('button', { name: /Créer mon compte/i }));

    await waitFor(() => {
      expect(onAuth).toHaveBeenCalledOnce();
    }, { timeout: 5000 });
    expect(mockMaybeSingle.mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
