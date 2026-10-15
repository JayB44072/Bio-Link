import { List, Search, Waves, X } from 'lucide-react';
import { BRAND } from '../../../../lib/theme';
import ViewToggle from '../../../ui/ViewToggle';
import { useServiceTheme } from './useServiceTheme';

export type FilterTab = 'all' | 'active' | 'paused';
export type SortKey = 'recent' | 'name' | 'priceAsc' | 'priceDesc';
export type ViewMode = 'wave' | 'list';

interface ServicesToolbarProps {
  query: string;
  onQuery: (q: string) => void;
  filter: FilterTab;
  onFilter: (f: FilterTab) => void;
  counts: Record<FilterTab, number>;
  sort: SortKey;
  onSort: (s: SortKey) => void;
  view: ViewMode;
  onView: (v: ViewMode) => void;
}

/** Barre d'outils de la liste : recherche, filtres par statut, tri et mode d'affichage. */
export default function ServicesToolbar({ query, onQuery, filter, onFilter, counts, sort, onSort, view, onView }: ServicesToolbarProps) {
  const { fr, dk, surface, border, txtPrim, txtSub, inputBg, inputBorder } = useServiceTheme();

  const tabs: Array<{ key: FilterTab; label: string }> = [
    { key: 'all', label: fr ? 'Tous' : 'All' },
    { key: 'active', label: fr ? 'Actifs' : 'Active' },
    { key: 'paused', label: fr ? 'En pause' : 'Paused' },
  ];
  const sorts: Array<{ key: SortKey; label: string }> = [
    { key: 'recent', label: fr ? 'Plus récents' : 'Newest' },
    { key: 'name', label: fr ? 'Nom (A-Z)' : 'Name (A-Z)' },
    { key: 'priceAsc', label: fr ? 'Prix croissant' : 'Price: low to high' },
    { key: 'priceDesc', label: fr ? 'Prix décroissant' : 'Price: high to low' },
  ];

  return (
    <div className="space-y-3 mb-5">
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} aria-hidden className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: txtSub }} />
          <input
            type="search"
            value={query}
            onChange={e => onQuery(e.target.value)}
            placeholder={fr ? 'Rechercher un service…' : 'Search a service…'}
            aria-label={fr ? 'Rechercher un service' : 'Search a service'}
            className="w-full h-11 pl-10 pr-10 rounded-xl text-sm outline-none transition focus:ring-2 focus:ring-[#6C63FF]/40"
            style={{ background: inputBg, border: `1px solid ${inputBorder}`, color: txtPrim }}
          />
          {query && (
            <button type="button" onClick={() => onQuery('')} aria-label={fr ? 'Effacer la recherche' : 'Clear search'}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C63FF]"
              style={{ color: txtSub }}>
              <X size={15} aria-hidden />
            </button>
          )}
        </div>

        <select value={sort} onChange={e => onSort(e.target.value as SortKey)} aria-label={fr ? 'Trier les services' : 'Sort services'}
          className="h-11 px-3 rounded-xl text-sm font-semibold outline-none cursor-pointer focus:ring-2 focus:ring-[#6C63FF]/40"
          style={{ background: surface, border: `1px solid ${border}`, color: txtPrim }}>
          {sorts.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>

        <ViewToggle
          value={view}
          onChange={onView}
          label={fr ? "Mode d'affichage" : 'Display mode'}
          accent={BRAND.violet}
          palette={{ surface, border, txtSub }}
          options={[
            { value: 'wave', icon: Waves, label: fr ? 'Ruban' : 'Ribbon' },
            { value: 'list', icon: List, label: fr ? 'Liste compacte' : 'Compact list' },
          ]}
        />
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-0.5" role="group" aria-label={fr ? 'Filtrer par statut' : 'Filter by status'}>
        {tabs.map(tab => {
          const on = filter === tab.key;
          return (
            <button key={tab.key} type="button" onClick={() => onFilter(tab.key)} aria-pressed={on}
              className="flex items-center gap-2 h-9 px-3.5 rounded-full text-xs font-bold whitespace-nowrap transition shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C63FF]"
              style={{
                background: on ? 'linear-gradient(135deg,rgba(255,107,157,0.14),rgba(108,99,255,0.14))' : 'transparent',
                color: on ? (dk ? BRAND.pink : BRAND.pinkDark) : txtSub,
                border: `1px solid ${on ? 'rgba(255,107,157,0.35)' : border}`,
              }}>
              {tab.label}
              <span className="min-w-[20px] text-center px-1.5 py-0.5 rounded-full text-[11px] font-black tabular-nums"
                style={{ background: on ? 'rgba(255,107,157,0.2)' : dk ? 'rgba(139,124,255,0.12)' : '#ede9ff' }}>
                {counts[tab.key]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
