import { describe, it, expect } from 'vitest';
import { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { filterByQuery, matchesQuery, normalizeText } from '../../lib/search';
import SearchField from '../../components/ui/SearchField';

const palette = { surfaceAlt: '#fff', border: '#eee', txtPrim: '#111', txtSub: '#666' };
const items = [
  { id: 1, name: 'Sac en cuir', description: 'Fait main à Abidjan', category: 'Mode' },
  { id: 2, name: 'Crème de karité', description: 'Soin naturel', category: 'Beauté' },
  { id: 3, name: 'Collier perles', description: 'Bijou artisanal', category: 'Bijoux' },
];

describe('recherche en direct', () => {
  it('ignore la casse, les accents et les espaces en trop', () => {
    expect(normalizeText('  CRÈME   de  Karité ')).toBe('creme de karite');
    expect(matchesQuery('creme', ['Crème de karité'])).toBe(true);
    expect(matchesQuery('CRÈME', ['creme'])).toBe(true);
  });

  it('exige que tous les mots soient présents, dans n\'importe quel ordre', () => {
    expect(matchesQuery('cuir sac', ['Sac en cuir'])).toBe(true);
    expect(matchesQuery('sac perles', ['Sac en cuir'])).toBe(false);
  });

  it('une requête vide ou blanche renvoie tout', () => {
    expect(filterByQuery(items, '', i => [i.name])).toHaveLength(3);
    expect(filterByQuery(items, '   ', i => [i.name])).toHaveLength(3);
  });

  it('cherche dans plusieurs champs et supporte les valeurs vides', () => {
    expect(filterByQuery(items, 'abidjan', i => [i.name, i.description]).map(i => i.id)).toEqual([1]);
    expect(filterByQuery(items, 'bijoux', i => [i.name, i.category, undefined, null]).map(i => i.id)).toEqual([3]);
  });

  it('se resserre à chaque lettre tapée (aucun bouton à valider)', () => {
    function Demo() {
      const [q, setQ] = useState('');
      const shown = filterByQuery(items, q, i => [i.name, i.description]);
      return (
        <>
          <SearchField value={q} onChange={setQ} palette={palette} placeholder="Rechercher" label="Rechercher" clearLabel="Effacer" />
          <ul>{shown.map(i => <li key={i.id}>{i.name}</li>)}</ul>
        </>
      );
    }
    render(<Demo />);
    const input = screen.getByRole('searchbox', { name: 'Rechercher' });
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    fireEvent.change(input, { target: { value: 'c' } });
    expect(screen.getAllByRole('listitem')).toHaveLength(3); // « c » est dans les trois
    fireEvent.change(input, { target: { value: 'cr' } });
    expect(screen.getAllByRole('listitem').map(li => li.textContent)).toEqual(['Crème de karité']);
    fireEvent.change(input, { target: { value: 'crx' } });
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
    fireEvent.click(screen.getByRole('button', { name: 'Effacer' }));
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });
});
