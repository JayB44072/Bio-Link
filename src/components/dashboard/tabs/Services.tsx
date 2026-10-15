import { useEffect, useMemo, useState } from 'react';
import { Service, Profile } from '../../../lib/types';
import { PLAN_CONFIGS, canAddService, getNextPlan } from '../../../lib/planLimits';
import { useLang } from '../../../lib/LanguageContext';
import { matchesQuery } from '../../../lib/search';
import { useAppPrefs } from '../../../lib/AppPrefsContext';
import ServiceAnalytics from './ServiceAnalytics';
import { BRAND, GRADIENTS } from '../../../lib/theme';
import { dashPalette } from '../../../lib/dashPalette';
import EmptyState from '../../ui/EmptyState';
import Modal from '../../ui/Modal';
import { Plus, Trash2, Lock, Package, ArrowUp, BarChart3 } from 'lucide-react';
import { useServiceForm } from './services/useServiceForm';
import ServiceFormView from './services/ServiceFormView';
import ServiceRow from './services/ServiceRow';
import ServiceWave from './services/ServiceWave';
import ServicesSummary from './services/ServicesSummary';
import ServicesToolbar, { type FilterTab, type SortKey, type ViewMode } from './services/ServicesToolbar';

interface ServicesProps {
  profile: Profile;
  services: Service[];
  onUpdate: (services: Service[]) => void;
}

const VIEW_KEY = 'biolink.services.view';

/** Mode d'affichage mémorisé sur l'appareil (le stockage peut être indisponible : on retombe sur le ruban). */
function useViewMode(): [ViewMode, (v: ViewMode) => void] {
  const [view, setView] = useState<ViewMode>('wave');
  useEffect(() => {
    try { if (localStorage.getItem(VIEW_KEY) === 'list') setView('list'); } catch { /* stockage indisponible */ }
  }, []);
  const update = (v: ViewMode) => {
    setView(v);
    try { localStorage.setItem(VIEW_KEY, v); } catch { /* stockage indisponible */ }
  };
  return [view, update];
}

const SORTERS: Record<SortKey, (a: Service, b: Service) => number> = {
  recent: (a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''),
  name: (a, b) => a.name.localeCompare(b.name),
  priceAsc: (a, b) => a.price - b.price,
  priceDesc: (a, b) => b.price - a.price,
};

export default function Services({ profile, services, onUpdate }: ServicesProps) {
  const { t, lang } = useLang();
  const { isDark: dk } = useAppPrefs();
  const state = useServiceForm(profile, services, onUpdate, lang);
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('recent');
  const [view, setView] = useViewMode();
  const { surface, surfaceAlt, border, txtPrim, txtSub } = dashPalette(dk);
  const fr = lang === 'fr';

  /* ── Limites du forfait ── */
  const plan = profile.plan_type;
  const maxServices = PLAN_CONFIGS[plan].max_services;
  const canAdd = canAddService(plan, services.length);
  const nextPlan = getNextPlan(plan);

  /* ── Filtres, recherche et tri ── */
  const activeCount = services.filter(s => s.is_active).length;
  const pausedCount = services.length - activeCount;
  const visible = useMemo(() => {
    return services
      .filter(s => (filterTab === 'active' ? s.is_active : filterTab === 'paused' ? !s.is_active : true))
      .filter(s => matchesQuery(query, [s.name, s.description]))
      .sort(SORTERS[sort]);
  }, [services, filterTab, query, sort]);

  /* ══════════════════ FORMULAIRE ══════════════════ */
  if (state.view === 'form') return <ServiceFormView state={state} />;

  const resetFilters = () => { setFilterTab('all'); setQuery(''); };
  const emptyMessage = services.length === 0
    ? t.noServices
    : query
      ? (fr ? `Aucun service ne correspond à « ${query} »` : `No service matches “${query}”`)
      : filterTab === 'active'
        ? (fr ? 'Aucun service actif' : 'No active services')
        : (fr ? 'Aucun service en pause' : 'No paused services');

  /* ══════════════════ LISTE ══════════════════ */
  return (
    <div>
      {/* En-tête */}
      <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
        <div>
          <h2 className="font-black text-2xl" style={{ color: txtPrim }}>{t.myServices}</h2>
          <p className="text-sm mt-0.5" style={{ color: txtSub }}>{t.servicesCount(services.length, maxServices)}</p>
        </div>
        {canAdd ? (
          <button onClick={state.openAdd}
            className="flex items-center gap-2 text-white text-sm font-bold px-5 h-11 rounded-2xl transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#FF6B9D]"
            style={{ background: GRADIENTS.pinkViolet, boxShadow: '0 8px 20px rgba(255,107,157,0.25)' }}>
            <Plus size={17} aria-hidden />{t.addService}
          </button>
        ) : (
          <div className="flex items-center gap-1.5 rounded-2xl px-3.5 h-11"
            style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)' }}>
            <Lock size={14} aria-hidden className="text-amber-500" />
            <span className="text-amber-500 text-xs font-semibold">{t.serviceLimitReached}</span>
          </div>
        )}
      </div>

      {/* Bandeau de mise à niveau */}
      {!canAdd && nextPlan && (
        <div className="rounded-2xl p-4 mb-5 flex items-center gap-3"
          style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(251,191,36,0.18)' }}>
            <ArrowUp size={17} aria-hidden className="text-amber-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-amber-500">{t.serviceLimitReached}</p>
            <p className="text-xs" style={{ color: dk ? 'rgba(251,191,36,0.7)' : '#b45309' }}>
              {t.upgradeToAddService(PLAN_CONFIGS[nextPlan].name.fr)}
            </p>
          </div>
        </div>
      )}

      {services.length > 0 && (
        <>
          <ServicesSummary total={services.length} active={activeCount} paused={pausedCount} max={maxServices ?? null} />
          {/* Diagrammes : au-dessus de la liste */}
          <section className="mb-6" aria-labelledby="services-stats-title">
            <h3 id="services-stats-title" className="flex items-center gap-2 font-bold text-base mb-3" style={{ color: txtPrim }}>
              <BarChart3 size={17} aria-hidden style={{ color: BRAND.violet }} />{fr ? 'Statistiques' : 'Statistics'}
            </h3>
            <ServiceAnalytics transactions={state.transactions} services={services} dk={dk} txtPrim={txtPrim} txtSub={txtSub}
              surface={surface} surfaceAlt={surfaceAlt} border={border} lang={lang} />
          </section>          <ServicesToolbar
            query={query} onQuery={setQuery}
            filter={filterTab} onFilter={setFilterTab}
            counts={{ all: services.length, active: activeCount, paused: pausedCount }}
            sort={sort} onSort={setSort}
            view={view} onView={setView}
          />
        </>
      )}

      {/* Liste */}
      {visible.length === 0 ? (
        <EmptyState icon={Package} iconSize={38} iconOpacity={0.35} palette={{ surfaceAlt, border, txtSub }} message={emptyMessage}>
          {services.length > 0 && (
            <button onClick={resetFilters} className="mt-3 text-sm font-semibold underline-offset-2 hover:underline" style={{ color: BRAND.pinkDark }}>
              {fr ? 'Voir tous les services' : 'View all services'}
            </button>
          )}
        </EmptyState>
      ) : view === 'wave' ? (
        <ServiceWave services={visible} togglingId={state.togglingId} onToggle={state.toggleActive} onEdit={state.openEdit} onDelete={state.setDeleteId}
          onAdd={canAdd && filterTab === 'all' && !query ? state.openAdd : undefined} addLabel={t.addService} />
      ) : (
        <div className="space-y-3">
          {visible.map(service => (
            <ServiceRow key={service.id} service={service} toggling={state.togglingId === service.id}
              onToggle={state.toggleActive} onEdit={state.openEdit} onDelete={state.setDeleteId} />
          ))}
        </div>
      )}

      {/* Confirmation de suppression */}
      {state.deleteId && (
        <Modal onClose={() => state.setDeleteId(null)} labelledBy="service-delete-title">
          <div className="w-full max-w-sm rounded-3xl shadow-2xl p-6 text-center" style={{ background: surface, border: `1px solid ${border}` }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: dk ? 'rgba(255,107,157,0.12)' : '#fff1f6' }}>
              <Trash2 size={20} aria-hidden style={{ color: BRAND.pink }} />
            </div>
            <h3 id="service-delete-title" className="font-bold mb-1" style={{ color: txtPrim }}>{t.confirmDeleteService}</h3>
            <p className="text-xs mb-5" style={{ color: txtSub }}>
              {fr ? 'Cette action est irréversible.' : 'This action cannot be undone.'}
            </p>
            <div className="flex gap-3">
              <button onClick={() => state.setDeleteId(null)}
                className="flex-1 text-sm font-semibold h-11 rounded-xl transition"
                style={{ background: surfaceAlt, color: txtSub }}>
                {t.cancel}
              </button>
              <button onClick={state.handleDelete} disabled={state.saving}
                className="flex-1 text-white text-sm font-bold h-11 rounded-xl transition disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#FF6B9D,#e94f85)' }}>
                {state.saving ? '…' : t.deleteService}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
