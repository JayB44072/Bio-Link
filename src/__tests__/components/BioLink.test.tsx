import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BioLink from '../../components/dashboard/tabs/BioLink';
import { mockProfile, mockFreeProfil } from '../fixtures';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const { mockEq, mockUpdate, mockFrom } = vi.hoisted(() => {
  const mockEq     = vi.fn().mockResolvedValue({ error: null });
  const mockUpdate = vi.fn(() => ({ eq: mockEq }));
  const mockFrom   = vi.fn(() => ({ update: mockUpdate }));
  return { mockEq, mockUpdate, mockFrom };
});

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: mockFrom,
    storage: {
      from: vi.fn().mockReturnValue({
        upload:       vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://cdn.test/logo.jpg' } }),
      }),
    },
  },
}));

vi.mock('../../lib/AppPrefsContext', () => ({
  useAppPrefs: () => ({ isDark: false }),
}));

vi.mock('../../lib/LanguageContext', () => ({
  useLang: () => ({
    lang: 'fr',
    t: {
      editProfile: 'Modifier le profil',
      shopName: 'Nom de la boutique',
      shopNamePlaceholder: 'Ma boutique',
      bioPlaceholder: 'Décrivez votre boutique',
      socialLinks: 'Liens sociaux',
      addSocialLink: 'Ajouter un lien',
      socialLimitMsg: 'Limite atteinte',
      saveChanges: 'Enregistrer',
      saving: 'Enregistrement…',
      saved: 'Enregistré !',
      copyLink: 'Copier le lien',
      copied: 'Copié !',
      visitPublicPage: 'Voir ma boutique',
      cancel: 'Annuler',
    },
  }),
}));

// ── Helper de rendu ───────────────────────────────────────────────────────────

function renderBioLink(profile = mockProfile) {
  const onUpdate          = vi.fn();
  const onGoToSubscription = vi.fn();
  render(
    <BioLink
      profile={profile}
      onUpdate={onUpdate}
      onGoToSubscription={onGoToSubscription}
    />
  );
  return { onUpdate, onGoToSubscription };
}

/**
 * Trouve le bouton "Modifier" d'une section par son titre de heading.
 * Remonte le DOM jusqu'à trouver un ancêtre ayant un <button> comme enfant direct.
 * Fonctionne pour les sections SectionHeader (h2 à 2 niveaux) ET la section
 * Liens sociaux qui a un wrapper <div> supplémentaire (h2 à 3 niveaux).
 */
function getSectionModifyBtn(headingText: RegExp): HTMLElement | null {
  const h2 = screen.queryByRole('heading', { name: headingText });
  if (!h2) return null;
  let node: HTMLElement | null = h2.parentElement;
  while (node) {
    const btn = node.querySelector(':scope > button');
    if (btn) return btn as HTMLElement;
    node = node.parentElement;
  }
  return null;
}

// ── Setup global ─────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
});

// ── Rendu initial ─────────────────────────────────────────────────────────────

describe('BioLink — rendu initial', () => {
  it('affiche le lien public de la boutique', () => {
    renderBioLink();
    // L'URL inclut le username
    expect(screen.getByText(new RegExp(mockProfile.username))).toBeInTheDocument();
  });

  it('affiche "Mon lien bio public"', () => {
    renderBioLink();
    expect(screen.getByText(/Mon lien bio public/i)).toBeInTheDocument();
  });

  it('les boutons "Modifier" sont visibles dès le départ', () => {
    renderBioLink();
    const modifyButtons = screen.getAllByRole('button', { name: /modifier/i });
    expect(modifyButtons.length).toBeGreaterThanOrEqual(3); // profil, socials, annonce, whatsapp
  });

  it('les champs de saisie ne sont PAS visibles en mode lecture', () => {
    renderBioLink();
    // Les inputs de texte (mode édition) ne doivent pas être là initialement
    const inputs = screen.queryAllByRole('textbox');
    expect(inputs).toHaveLength(0);
  });

  it('affiche la valeur du nom de la boutique en lecture seule', () => {
    renderBioLink();
    expect(screen.getByText(mockProfile.shop_name)).toBeInTheDocument();
  });

  it('affiche la section Badges de confiance', () => {
    renderBioLink();
    expect(screen.getByText(/Badges de confiance/i)).toBeInTheDocument();
  });
});

// ── Section Profil — mode édition ────────────────────────────────────────────

describe('BioLink — section Profil', () => {
  it('cliquer "Modifier" active le mode édition (champs deviennent visibles)', async () => {
    const user = userEvent.setup();
    renderBioLink();

    const modifyBtn = getSectionModifyBtn(/Profil de la boutique/i);
    expect(modifyBtn).not.toBeNull();
    await user.click(modifyBtn!);

    // Après le clic, les champs de texte doivent apparaître
    const textboxes = screen.getAllByRole('textbox');
    expect(textboxes.length).toBeGreaterThan(0);
  });

  it('le bouton "Annuler" ferme le mode édition', async () => {
    const user = userEvent.setup();
    renderBioLink();

    const modifyBtn = getSectionModifyBtn(/Profil de la boutique/i);
    await user.click(modifyBtn!);

    // Mode édition actif → trouver "Annuler"
    const cancelBtn = screen.getAllByRole('button', { name: /annuler/i })[0];
    await user.click(cancelBtn);

    // Les inputs doivent disparaître
    expect(screen.queryAllByRole('textbox')).toHaveLength(0);
  });

  it('"Annuler" restaure la valeur initiale après modification', async () => {
    const user = userEvent.setup();
    renderBioLink();

    const modifyBtn = getSectionModifyBtn(/Profil de la boutique/i);
    await user.click(modifyBtn!);

    // Modifier le champ display_name
    const nameInput = screen.getAllByRole('textbox')[0];
    await user.clear(nameInput);
    await user.type(nameInput, 'Nouveau nom temporaire');
    expect(nameInput).toHaveValue('Nouveau nom temporaire');

    // Annuler → la valeur revient
    const cancelBtn = screen.getAllByRole('button', { name: /annuler/i })[0];
    await user.click(cancelBtn);

    // La valeur initiale doit être visible à nouveau
    expect(screen.getByText(mockProfile.display_name)).toBeInTheDocument();
  });

  it('"Enregistrer" appelle supabase.from("profiles").update()', async () => {
    const user = userEvent.setup();
    renderBioLink();

    const modifyBtn = getSectionModifyBtn(/Profil de la boutique/i);
    await user.click(modifyBtn!);

    const saveButtons = screen.getAllByRole('button', { name: /enregistrer/i });
    await user.click(saveButtons[0]);

    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('profiles');
      expect(mockUpdate).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith('user_id', mockProfile.user_id);
    });
  });
});

// ── Section Liens sociaux ────────────────────────────────────────────────────

describe('BioLink — liens sociaux', () => {
  it('en mode lecture, affiche "Aucun lien social" quand la liste est vide', () => {
    renderBioLink({ ...mockProfile, social_links: [] });
    expect(screen.getByText(/Aucun lien social/i)).toBeInTheDocument();
  });

  it('en mode édition, "Ajouter un lien" ajoute une ligne', async () => {
    const user = userEvent.setup();
    renderBioLink({ ...mockProfile, social_links: [] });

    const modifyBtn = getSectionModifyBtn(/Liens sociaux/i);
    await user.click(modifyBtn!);

    // Avant l'ajout : 0 combobox
    expect(screen.queryAllByRole('combobox')).toHaveLength(0);

    // Cliquer sur Ajouter un lien
    await user.click(screen.getByRole('button', { name: /ajouter un lien/i }));

    // Après l'ajout : 1 select de plateforme visible
    expect(screen.getAllByRole('combobox')).toHaveLength(1);
  });

  it('supprimer un lien existant réduit le nombre de lignes', async () => {
    const user = userEvent.setup();
    const profile = {
      ...mockProfile,
      social_links: [
        { platform: 'instagram', url: '@boutique', icon: 'Instagram' },
        { platform: 'tiktok',    url: '@boutique', icon: 'Music' },
      ],
    };
    renderBioLink(profile);

    const modifyBtn = getSectionModifyBtn(/Liens sociaux/i);
    await user.click(modifyBtn!);

    // 2 combobox de plateforme
    expect(screen.getAllByRole('combobox')).toHaveLength(2);

    // Trouver les boutons de suppression DANS la section sociale (Trash2 = style rouge)
    // On remonte depuis le h2 jusqu'au conteneur rounded-3xl pour rester dans la section
    const h2 = screen.getByRole('heading', { name: /Liens sociaux/i });
    let sectionRoot: HTMLElement | null = h2.parentElement;
    while (sectionRoot && !sectionRoot.className.includes('rounded-3xl')) {
      sectionRoot = sectionRoot.parentElement;
    }
    const deleteButtons = sectionRoot
      ? Array.from(sectionRoot.querySelectorAll('button')).filter(
          btn => btn.querySelector('svg') && (btn as HTMLElement).textContent?.trim() === ''
        )
      : [];

    expect(deleteButtons.length).toBeGreaterThan(0);
    await user.click(deleteButtons[0] as HTMLElement);
    expect(screen.getAllByRole('combobox')).toHaveLength(1);
  });

  it('n\'affiche pas le bouton "Ajouter" quand la limite est atteinte (forfait free)', async () => {
    const user = userEvent.setup();
    const profile = {
      ...mockFreeProfil,
      social_links: [
        { platform: 'instagram', url: '@a', icon: 'Instagram' },
        { platform: 'tiktok',    url: '@b', icon: 'Music' },
      ],
    };
    renderBioLink(profile);

    const modifyBtn = getSectionModifyBtn(/Liens sociaux/i);
    await user.click(modifyBtn!);

    expect(screen.queryByRole('button', { name: /ajouter un lien/i })).toBeNull();
  });
});

// ── Section Annonce ───────────────────────────────────────────────────────────

describe('BioLink — section Annonce', () => {
  it('affiche "Inactive" en mode lecture quand announcement_active = false', () => {
    renderBioLink({ ...mockProfile, announcement_active: false });
    expect(screen.getByText(/Inactive/i)).toBeInTheDocument();
  });

  it('affiche "Active" en mode lecture quand announcement_active = true', () => {
    renderBioLink({
      ...mockProfile,
      announcement_active: true,
      announcement_text: 'Promo 20% ce week-end !',
    });
    // Exact match to avoid matching "activer" in the trust badges section
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Promo 20% ce week-end !')).toBeInTheDocument();
  });

  it('mode édition : le toggle et les champs texte sont visibles', async () => {
    const user = userEvent.setup();
    renderBioLink();

    const modifyBtn = getSectionModifyBtn(/Afficher une annonce/i);
    await user.click(modifyBtn!);

    // Le toggle doit être là (role=switch)
    expect(screen.getByRole('switch')).toBeInTheDocument();
  });
});

// ── Section WhatsApp ──────────────────────────────────────────────────────────

describe('BioLink — section WhatsApp', () => {
  it('affiche "Forfait Premium requis" pour les forfaits non-premium', () => {
    renderBioLink(mockFreeProfil);
    expect(screen.getByText(/Forfait Premium requis/i)).toBeInTheDocument();
  });

  it('n\'affiche pas "Forfait Premium requis" pour le forfait premium', () => {
    renderBioLink(mockProfile); // mockProfile est premium
    expect(screen.queryByText(/Forfait Premium requis/i)).not.toBeInTheDocument();
  });
});

// ── Logo ──────────────────────────────────────────────────────────────────────

describe('BioLink — logo', () => {
  it('forfait free : affiche le message d\'upgrade logo', () => {
    renderBioLink(mockFreeProfil);
    expect(screen.getByText(/Logo réservé aux forfaits payants/i)).toBeInTheDocument();
  });

  it('forfait premium : affiche le bouton "Changer le logo"', () => {
    renderBioLink(mockProfile);
    expect(screen.getByRole('button', { name: /changer le logo/i })).toBeInTheDocument();
  });

  it('forfait premium : cliquer "Changer le logo" déclenche l\'input fichier', async () => {
    const user = userEvent.setup();
    renderBioLink(mockProfile);

    const changeLogoBtn = screen.getByRole('button', { name: /changer le logo/i });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const clickSpy = vi.spyOn(fileInput, 'click');

    await user.click(changeLogoBtn);
    expect(clickSpy).toHaveBeenCalledOnce();
  });
});

// ── Cas d'erreur Supabase ─────────────────────────────────────────────────────

describe('BioLink — erreurs Supabase', () => {
  beforeEach(() => {
    // Réinitialise les mocks avant chaque test de ce bloc
    mockEq.mockResolvedValue({ error: null });
  });

  it('si la sauvegarde échoue (erreur réseau), le composant ne crashe pas', async () => {
    mockEq.mockResolvedValueOnce({ error: { message: 'Network error' } });

    const user = userEvent.setup();
    renderBioLink();

    const modifyBtn = getSectionModifyBtn(/Profil de la boutique/i);
    await user.click(modifyBtn!);

    const saveButtons = screen.getAllByRole('button', { name: /enregistrer/i });
    await user.click(saveButtons[0]);

    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('profiles');
    });

    expect(document.body).toBeTruthy();
  });

  it('une erreur Supabase n\'appelle pas onUpdate', async () => {
    mockEq.mockResolvedValueOnce({ error: { message: 'Unauthorized' } });

    const user = userEvent.setup();
    const { onUpdate } = renderBioLink();

    const modifyBtn = getSectionModifyBtn(/Profil de la boutique/i);
    await user.click(modifyBtn!);

    const saveButtons = screen.getAllByRole('button', { name: /enregistrer/i });
    await user.click(saveButtons[0]);

    await waitFor(() => {
      expect(mockEq).toHaveBeenCalled();
    });

    expect(onUpdate).not.toHaveBeenCalled();
  });
});

// ── Copier le lien ────────────────────────────────────────────────────────────

describe('BioLink — copier le lien', () => {
  it('le bouton "Copier le lien" appelle navigator.clipboard.writeText', async () => {
    const user = userEvent.setup();
    renderBioLink();
    await user.click(screen.getByRole('button', { name: /copier le lien/i }));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining(mockProfile.username)
    );
  });
});
