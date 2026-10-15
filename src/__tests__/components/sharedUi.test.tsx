import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Package } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import { CenteredSpinner } from '../../components/ui/Spinner';
import { FeedbackProvider } from '../../components/ui/FeedbackProvider';
import { useFeedback } from '../../lib/feedbackContext';
import { dashPalette } from '../../lib/dashPalette';

vi.mock('../../lib/AppPrefsContext', () => ({
  useAppPrefs: () => ({ isDark: false, lang: 'fr', t: {}, toggleDark: vi.fn(), setLang: vi.fn() }),
}));

describe('Modal', () => {
  it('est une boîte de dialogue modale et donne le focus au premier bouton', () => {
    render(<Modal><button>Premier</button><button>Second</button></Modal>);
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByText('Premier')).toHaveFocus();
  });

  it('se ferme avec la touche Échap', async () => {
    const onClose = vi.fn();
    render(<Modal onClose={onClose}><button>OK</button></Modal>);
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('garde le focus à l\'intérieur (Tab boucle sur les éléments de la fenêtre)', async () => {
    render(<><button>Dehors</button><Modal><button>A</button><button>B</button></Modal></>);
    const user = userEvent.setup();
    expect(screen.getByText('A')).toHaveFocus();
    await user.tab();
    expect(screen.getByText('B')).toHaveFocus();
    await user.tab();
    expect(screen.getByText('A')).toHaveFocus();
    await user.tab({ shift: true });
    expect(screen.getByText('B')).toHaveFocus();
  });

  it('ne se ferme pas au clic sur le fond par défaut, mais le fait si demandé', async () => {
    const onClose = vi.fn();
    const { rerender } = render(<Modal onClose={onClose}><button>OK</button></Modal>);
    await userEvent.click(screen.getByRole('dialog'));
    expect(onClose).not.toHaveBeenCalled();
    rerender(<Modal onClose={onClose} closeOnBackdrop><button>OK</button></Modal>);
    await userEvent.click(screen.getByRole('dialog'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('rend le focus à l\'élément précédent à la fermeture', () => {
    const { rerender } = render(<><button>Ouvrir</button></>);
    screen.getByText('Ouvrir').focus();
    rerender(<><button>Ouvrir</button><Modal><button>Dans</button></Modal></>);
    expect(screen.getByText('Dans')).toHaveFocus();
    rerender(<><button>Ouvrir</button></>);
    expect(screen.getByText('Ouvrir')).toHaveFocus();
  });
});

describe('EmptyState', () => {
  it('affiche le message et l\'action', () => {
    render(
      <EmptyState icon={Package} message="Rien ici" palette={dashPalette(false)}>
        <button>Tout voir</button>
      </EmptyState>,
    );
    expect(screen.getByText('Rien ici')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tout voir' })).toBeInTheDocument();
  });
});

describe('Spinner', () => {
  it('annonce un chargement', () => {
    render(<CenteredSpinner />);
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
  });
});

function Probe({ onResult }: { onResult: (ok: boolean) => void }) {
  const { notify, confirm } = useFeedback();
  return (
    <>
      <button onClick={() => notify('Enregistré', 'success')}>notifier</button>
      <button onClick={async () => onResult(await confirm({ title: 'Supprimer ?', message: 'Action définitive.', danger: true }))}>demander</button>
    </>
  );
}

describe('FeedbackProvider', () => {
  it('affiche un message qui disparaît seul', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<FeedbackProvider><Probe onResult={() => {}} /></FeedbackProvider>);
    await userEvent.setup({ advanceTimers: vi.advanceTimersByTime }).click(screen.getByText('notifier'));
    expect(screen.getByText('Enregistré')).toBeInTheDocument();
    await act(async () => { vi.advanceTimersByTime(5000); });
    expect(screen.queryByText('Enregistré')).toBeNull();
    vi.useRealTimers();
  });

  it('renvoie true à la confirmation et false à l\'annulation', async () => {
    const onResult = vi.fn();
    render(<FeedbackProvider><Probe onResult={onResult} /></FeedbackProvider>);
    const user = userEvent.setup();

    await user.click(screen.getByText('demander'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Confirmer' }));
    await waitFor(() => expect(onResult).toHaveBeenLastCalledWith(true));
    expect(screen.queryByRole('dialog')).toBeNull();

    await user.click(screen.getByText('demander'));
    await user.click(screen.getByRole('button', { name: 'Annuler' }));
    await waitFor(() => expect(onResult).toHaveBeenLastCalledWith(false));
  });

  it('annule avec la touche Échap', async () => {
    const onResult = vi.fn();
    render(<FeedbackProvider><Probe onResult={onResult} /></FeedbackProvider>);
    await userEvent.click(screen.getByText('demander'));
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(onResult).toHaveBeenCalledWith(false));
  });

  it('sans fournisseur, retombe sur les boîtes du navigateur', async () => {
    const spy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const onResult = vi.fn();
    render(<Probe onResult={onResult} />);
    await userEvent.click(screen.getByText('demander'));
    await waitFor(() => expect(onResult).toHaveBeenCalledWith(true));
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe('dashPalette', () => {
  it('fournit deux jeux de couleurs distincts avec les mêmes clés', () => {
    const light = dashPalette(false);
    const dark = dashPalette(true);
    expect(Object.keys(light)).toEqual(Object.keys(dark));
    expect(light.surface).not.toBe(dark.surface);
    expect(light.surface).toBe('#ffffff');
    expect(dark.surface).toBe('#12122b');
  });
});
