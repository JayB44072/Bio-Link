import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LayoutGrid, List } from 'lucide-react';
import { LanguageProvider } from '../../lib/LanguageContext';
import { AppPrefsProvider } from '../../lib/AppPrefsContext';
import Switch from '../../components/ui/Switch';
import ViewToggle from '../../components/ui/ViewToggle';
import StatTile from '../../components/ui/StatTile';
import ServiceWave from '../../components/dashboard/tabs/services/ServiceWave';
import { waveLayout, sineEdgePath } from '../../lib/waveLayout';
import PublicServiceWave from '../../components/public/PublicServiceWave';
import ServiceRow from '../../components/dashboard/tabs/services/ServiceRow';
import ServicesToolbar from '../../components/dashboard/tabs/services/ServicesToolbar';
import type { Service } from '../../lib/types';

const wrap = (ui: React.ReactNode) => render(<AppPrefsProvider><LanguageProvider>{ui}</LanguageProvider></AppPrefsProvider>);

const service = {
  id: 's1', user_id: 'u1', name: 'Coiffure à domicile', description: 'Tresses et soins', price: 15000, currency: 'XAF',
  image_url: '', images: [], duration: '2h', is_active: true, created_at: '', updated_at: '',
} as unknown as Service;

describe('Switch', () => {
  it('est un interrupteur accessible qui reflète son état', () => {
    const onChange = vi.fn();
    render(<Switch checked label="Activer" onChange={onChange} offColor="#ccc" />);
    const sw = screen.getByRole('switch', { name: 'Activer' });
    expect(sw).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(sw);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('est inactif pendant une opération en cours', () => {
    const onChange = vi.fn();
    render(<Switch checked={false} busy label="Activer" onChange={onChange} offColor="#ccc" />);
    const sw = screen.getByRole('switch');
    expect(sw).toBeDisabled();
    fireEvent.click(sw);
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('ViewToggle', () => {
  it('propose les modes avec un nom accessible et signale le mode actif', () => {
    const onChange = vi.fn();
    render(<ViewToggle value="grid" onChange={onChange} label="Affichage" accent="#6C63FF" palette={{ surface: '#fff', border: '#eee', txtSub: '#888' }}
      options={[{ value: 'grid', icon: LayoutGrid, label: 'Cartes' }, { value: 'list', icon: List, label: 'Liste' }]} />);
    expect(screen.getByRole('radio', { name: 'Cartes' })).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(screen.getByRole('radio', { name: 'Liste' }));
    expect(onChange).toHaveBeenCalledWith('list');
  });
});

describe('StatTile', () => {
  it('affiche la valeur et le libellé', () => {
    render(<StatTile icon={LayoutGrid} label="Actifs" value={3} tone="#22c55e" palette={{ surface: '#fff', border: '#eee', txtPrim: '#111', txtSub: '#888' }} />);
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Actifs')).toBeInTheDocument();
  });
});

describe.each([['ServiceRow', ServiceRow]] as const)('%s', (_name, Component) => {
  it('affiche le nom, le prix, la durée et le statut', () => {
    wrap(<Component service={service} toggling={false} onToggle={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText('Coiffure à domicile')).toBeInTheDocument();
    // le séparateur de milliers dépend de la langue du système : on ne compare que les chiffres
    expect(screen.getByText(content => content.replace(/\D/g, '') === '15000')).toBeInTheDocument();
    expect(screen.getByText('XAF')).toBeInTheDocument();
    expect(screen.getByText('2h')).toBeInTheDocument();
    expect(screen.getByText('Actif')).toBeInTheDocument();
  });

  it('déclenche modifier, supprimer et activer/mettre en pause', () => {
    const onEdit = vi.fn(), onDelete = vi.fn(), onToggle = vi.fn();
    wrap(<Component service={service} toggling={false} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} />);
    fireEvent.click(screen.getByRole('button', { name: /Modifier Coiffure/ }));
    expect(onEdit).toHaveBeenCalledWith(service);
    fireEvent.click(screen.getByRole('button', { name: /Supprimer Coiffure/ }));
    expect(onDelete).toHaveBeenCalledWith('s1');
    fireEvent.click(screen.getByRole('switch', { name: /pause/i }));
    expect(onToggle).toHaveBeenCalledWith(service);
  });

  it('montre un service en pause comme tel, avec le texte (pas seulement la couleur)', () => {
    wrap(<Component service={{ ...service, is_active: false }} toggling={false} onToggle={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText('En pause')).toBeInTheDocument();
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
  });
});

describe('ServicesToolbar', () => {
  const props = {
    query: '', onQuery: vi.fn(), filter: 'all' as const, onFilter: vi.fn(), counts: { all: 4, active: 3, paused: 1 },
    sort: 'recent' as const, onSort: vi.fn(), view: 'wave' as const, onView: vi.fn(),
  };

  it('recherche, filtre par statut et change de vue', () => {
    wrap(<ServicesToolbar {...props} />);
    fireEvent.change(screen.getByRole('searchbox', { name: /Rechercher/ }), { target: { value: 'tre' } });
    expect(props.onQuery).toHaveBeenCalledWith('tre');
    fireEvent.click(screen.getByRole('button', { name: /En pause/ }));
    expect(props.onFilter).toHaveBeenCalledWith('paused');
    fireEvent.click(screen.getByRole('radio', { name: 'Liste compacte' }));
    expect(props.onView).toHaveBeenCalledWith('list');
  });

  it('affiche les compteurs et marque le filtre actif', () => {
    wrap(<ServicesToolbar {...props} filter="active" />);
    expect(screen.getByRole('button', { name: /Actifs/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /Tous/ })).toHaveAttribute('aria-pressed', 'false');
  });

  it('permet d\'effacer la recherche', () => {
    const onQuery = vi.fn();
    wrap(<ServicesToolbar {...props} query="abc" onQuery={onQuery} />);
    fireEvent.click(screen.getByRole('button', { name: /Effacer/ }));
    expect(onQuery).toHaveBeenCalledWith('');
  });
});

describe('ruban sinusoïdal', () => {
  const services = [
    { ...service, id: 'a', name: 'Premier service' },
    { ...service, id: 'b', name: 'Deuxième service', is_active: false },
    { ...service, id: 'c', name: 'Troisième service' },
  ] as Service[];

  it('place une station par service, du côté droit puis gauche en alternance', () => {
    const l = waveLayout({ rows: 3, rowHeight: 200, cx: 400, amplitude: 150, top: 30 });
    expect(l.nodes).toHaveLength(3);
    expect(l.nodes.map(n => n.side)).toEqual(['right', 'left', 'right']);
    expect(l.nodes.map(n => n.x)).toEqual([550, 250, 550]);
    expect(l.nodes.map(n => n.y)).toEqual([130, 330, 530]);
    expect(l.height).toBe(630);
  });

  it('le tracé est une vraie sinusoïde : il passe par les stations et reste dans l\'amplitude', () => {
    const l = waveLayout({ rows: 2, rowHeight: 100, cx: 100, amplitude: 40, step: 5 });
    const xs = [...l.path.matchAll(/[ML]([\d.-]+) /g)].map(m => Number(m[1]));
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(59);
    expect(Math.max(...xs)).toBeLessThanOrEqual(141);
    expect(xs[0]).toBeCloseTo(100, 0); // à y = 0 la vague est à mi-course
    expect(l.companion).not.toBe(l.path);
  });

  it('sans service, pas de tracé', () => {
    expect(waveLayout({ rows: 0, rowHeight: 200, cx: 0, amplitude: 10 })).toMatchObject({ path: '', nodes: [] });
  });

  it('le bord ondulé des cartes est un chemin fermé', () => {
    const d = sineEdgePath(240, 14, 7, 3);
    expect(d.startsWith('M0 0')).toBe(true);
    expect(d.endsWith('Z')).toBe(true);
    expect((d.match(/Q/g) ?? []).length).toBe(6);
  });

  it('affiche chaque service avec ses actions, et la station « ajouter »', () => {
    const onAdd = vi.fn(), onEdit = vi.fn(), onToggle = vi.fn(), onDelete = vi.fn();
    wrap(<ServiceWave services={services} togglingId={null} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} onAdd={onAdd} addLabel="Ajouter un service" />);
    expect(screen.getAllByRole('listitem')).toHaveLength(4);
    expect(screen.getByText('Deuxième service')).toBeInTheDocument();
    expect(screen.getByText('En pause')).toBeInTheDocument(); // le statut est écrit, pas seulement coloré
    fireEvent.click(screen.getAllByRole('button', { name: /Modifier Troisième service/ })[0]);
    expect(onEdit).toHaveBeenCalledWith(services[2]);
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter un service' }));
    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  it('n\'affiche pas la station « ajouter » quand elle n\'est pas permise', () => {
    wrap(<ServiceWave services={services} togglingId={null} onToggle={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} addLabel="Ajouter un service" />);
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(screen.queryByRole('button', { name: 'Ajouter un service' })).toBeNull();
  });
});
describe('ruban sur la page publique', () => {
  const theme = { dark: true, pageBg: '#000', text: '#fff', subtext: '#aaa', cardBg: '#111', cardBorder: '#333', accent: '#C9A96E', priceColor: '#C9A96E', buttonGradient: 'linear-gradient(135deg,#C9A96E,#a8894e)', cardRadius: 'rounded-3xl' };
  const list = [
    { ...service, id: 'a', name: 'Premier service' },
    { ...service, id: 'b', name: 'Deuxième service', images: ['https://youtu.be/abc'] },
  ] as Service[];

  it('affiche les services du vendeur et ouvre la fiche au clic (médaillon ou bouton)', () => {
    const onOpen = vi.fn();
    render(<PublicServiceWave services={list} lang="fr" theme={theme} onOpen={onOpen} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByText('Deuxième service')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Voir Premier service' }));
    expect(onOpen).toHaveBeenCalledWith(list[0]);
    fireEvent.click(screen.getAllByRole('button', { name: 'Voir le service' })[1]);
    expect(onOpen).toHaveBeenCalledWith(list[1]);
  });

  it('signale les services avec vidéo', () => {
    render(<PublicServiceWave services={list} lang="fr" theme={theme} onOpen={vi.fn()} />);
    expect(screen.getAllByText('Vidéo')).toHaveLength(1);
  });

  it('utilise la couleur du thème pour le prix', () => {
    render(<PublicServiceWave services={[list[0]]} lang="fr" theme={theme} onOpen={vi.fn()} />);
    const price = screen.getByText(content => content.replace(/\D/g, '') === '15000');
    expect(price).toHaveStyle({ color: '#C9A96E' });
  });
});