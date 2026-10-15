import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LogoCropperModal from '../../components/dashboard/tabs/LogoCropperModal';

vi.mock('../../lib/AppPrefsContext', () => ({
  useAppPrefs: () => ({ isDark: false }),
}));

function makeFile(name = 'logo.jpg', type = 'image/jpeg'): File {
  return new File(['fake-image-content'], name, { type });
}

function renderModal(overrides?: { onConfirm?: () => void; onCancel?: () => void }) {
  const onConfirm = overrides?.onConfirm ?? vi.fn();
  const onCancel  = overrides?.onCancel  ?? vi.fn();
  render(
    <LogoCropperModal
      file={makeFile()}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
  return { onConfirm, onCancel };
}

// ── Rendu initial ─────────────────────────────────────────────────────────────

describe('LogoCropperModal — rendu', () => {
  it('affiche le titre "Ajuster le logo"', () => {
    renderModal();
    expect(screen.getByText(/Ajuster le logo/i)).toBeInTheDocument();
  });

  it('affiche les instructions de base', () => {
    renderModal();
    expect(screen.getByText(/Glissez/i)).toBeInTheDocument();
  });

  it('affiche le bouton Annuler', () => {
    renderModal();
    expect(screen.getByRole('button', { name: /annuler/i })).toBeInTheDocument();
  });

  it('affiche le bouton Appliquer', () => {
    renderModal();
    expect(screen.getByRole('button', { name: /appliquer/i })).toBeInTheDocument();
  });

  it('affiche le slider de zoom', () => {
    renderModal();
    const slider = screen.getByRole('slider');
    expect(slider).toBeInTheDocument();
  });

  it('affiche les boutons de rotation', () => {
    renderModal();
    expect(screen.getByRole('button', { name: /−90°/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /\+90°/i })).toBeInTheDocument();
  });
});

// ── Interaction : Annuler ─────────────────────────────────────────────────────

describe('LogoCropperModal — bouton Annuler', () => {
  it('appelle onCancel au clic', async () => {
    const user = userEvent.setup();
    const { onCancel } = renderModal();
    await user.click(screen.getByRole('button', { name: /annuler/i }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('n\'appelle pas onConfirm lors de l\'annulation', async () => {
    const user = userEvent.setup();
    const { onConfirm, onCancel } = renderModal();
    await user.click(screen.getByRole('button', { name: /annuler/i }));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(onCancel).toHaveBeenCalledOnce();
  });
});

// ── Interaction : Zoom slider ─────────────────────────────────────────────────

describe('LogoCropperModal — slider de zoom', () => {
  it('le slider démarre dans une plage valide', () => {
    renderModal();
    const slider = screen.getByRole('slider') as HTMLInputElement;
    const value = parseInt(slider.value, 10);
    expect(value).toBeGreaterThanOrEqual(30);
    expect(value).toBeLessThanOrEqual(500);
  });

  it('changer le slider met à jour l\'affichage du zoom', async () => {
    const user = userEvent.setup();
    renderModal();
    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '200' } });
    expect(screen.getByText(/Zoom 200 %/i)).toBeInTheDocument();
  });
});

// ── Interaction : boutons ZoomIn / ZoomOut ────────────────────────────────────

describe('LogoCropperModal — boutons zoom', () => {
  it('le modal affiche au moins 6 boutons de contrôle', () => {
    renderModal();
    const allButtons = screen.getAllByRole('button');
    // Annuler, Appliquer, -90°, +90°, ZoomIn (icône seule), ZoomOut (icône seule)
    expect(allButtons.length).toBeGreaterThanOrEqual(6);
  });

  it('les boutons ZoomIn et ZoomOut ont des SVG (icônes)', () => {
    renderModal();
    const iconOnlyButtons = screen.getAllByRole('button').filter(
      btn => btn.querySelector('svg') && btn.textContent?.trim() === ''
    );
    // ZoomIn et ZoomOut sont des boutons icône sans texte
    expect(iconOnlyButtons.length).toBeGreaterThanOrEqual(2);
  });
});

// ── Interaction : Appliquer (confirmation) ────────────────────────────────────

describe('LogoCropperModal — bouton Appliquer', () => {
  it('appelle onConfirm avec un Blob après clic sur Appliquer', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <LogoCropperModal
        file={makeFile()}
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />
    );

    // Simuler le chargement de l'image (l'img doit avoir des dimensions)
    const img = document.querySelector('img');
    if (img) {
      Object.defineProperty(img, 'naturalWidth',  { value: 400, configurable: true });
      Object.defineProperty(img, 'naturalHeight', { value: 400, configurable: true });
    }

    await user.click(screen.getByRole('button', { name: /appliquer/i }));

    // Le canvas.toBlob est mocké dans setup.ts pour retourner un Blob immédiatement
    expect(onConfirm).toHaveBeenCalledOnce();
    const calledWith = onConfirm.mock.calls[0][0];
    expect(calledWith).toBeInstanceOf(Blob);
  });
});
