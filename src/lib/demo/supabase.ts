/**
 * Faux client Supabase du MODE DÉMO : même interface que `supabase` pour les appels utilisés par l'application,
 * mais lit et écrit en mémoire à partir de `demoData.ts`. Activé uniquement avec `VITE_DEMO=1` (voir vite.config.ts).
 */
import { DEMO_TABLES, DEMO_USER_ID, demoProfile, demoTransactions, demoTrackingEvents, demoProducts } from './demoData';

type Row = Record<string, unknown>;
const store: Record<string, Row[]> = Object.fromEntries(Object.entries(DEMO_TABLES).map(([k, v]) => [k, v.map(r => ({ ...r }))]));
let counter = 1000;

class Query implements PromiseLike<{ data: unknown; error: null; count?: number }> {
  private filters: Array<(r: Row) => boolean> = [];
  private mode: 'select' | 'insert' | 'update' | 'delete' = 'select';
  private payload: Row | Row[] | null = null;
  private orderBy: { col: string; asc: boolean } | null = null;
  private max = Infinity;
  private head = false;
  private wantCount = false;
  private single: 'none' | 'one' | 'maybe' = 'none';
  private returning = false;

  constructor(private table: string) {}

  select(_cols?: string, opts?: { count?: string; head?: boolean }) {
    if (this.mode === 'select') this.returning = true;
    else this.returning = true;
    if (opts?.count) this.wantCount = true;
    if (opts?.head) this.head = true;
    return this;
  }
  insert(p: Row | Row[]) { this.mode = 'insert'; this.payload = p; return this; }
  upsert(p: Row | Row[]) { this.mode = 'insert'; this.payload = p; return this; }
  update(p: Row) { this.mode = 'update'; this.payload = p; return this; }
  delete() { this.mode = 'delete'; return this; }
  eq(c: string, v: unknown) { this.filters.push(r => r[c] === v); return this; }
  neq(c: string, v: unknown) { this.filters.push(r => r[c] !== v); return this; }
  is(c: string, v: unknown) { this.filters.push(r => (v === null ? r[c] == null : r[c] === v)); return this; }
  in(c: string, vs: unknown[]) { this.filters.push(r => vs.includes(r[c])); return this; }
  gte(c: string, v: unknown) { this.filters.push(r => String(r[c]) >= String(v)); return this; }
  lte(c: string, v: unknown) { this.filters.push(r => String(r[c]) <= String(v)); return this; }
  order(col: string, o?: { ascending?: boolean }) { this.orderBy = { col, asc: o?.ascending !== false }; return this; }
  limit(n: number) { this.max = n; return this; }
  single_() { return this; }
  maybeSingle() { this.single = 'maybe'; return this; }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  singleRow() { this.single = 'one'; return this; }

  private run() {
    const rows = store[this.table] ?? (store[this.table] = []);
    let out: Row[];
    if (this.mode === 'insert') {
      const list = Array.isArray(this.payload) ? this.payload : [this.payload as Row];
      out = list.map(p => ({ id: `demo-${++counter}`, created_at: new Date().toISOString(), ...p }));
      rows.unshift(...out);
    } else if (this.mode === 'update') {
      out = rows.filter(r => this.filters.every(f => f(r)));
      out.forEach(r => Object.assign(r, this.payload));
    } else if (this.mode === 'delete') {
      out = rows.filter(r => this.filters.every(f => f(r)));
      store[this.table] = rows.filter(r => !out.includes(r));
    } else {
      out = rows.filter(r => this.filters.every(f => f(r)));
    }
    if (this.orderBy) {
      const { col, asc } = this.orderBy;
      out = [...out].sort((a, b) => (String(a[col]) < String(b[col]) ? -1 : 1) * (asc ? 1 : -1));
    }
    const total = out.length;
    out = out.slice(0, this.max);
    if (this.head) return { data: null, error: null, count: total };
    if (this.single !== 'none') return { data: out[0] ?? null, error: null };
    return { data: this.mode === 'select' || this.returning ? out : null, error: null, ...(this.wantCount ? { count: total } : {}) };
  }

  then<T1 = unknown, T2 = never>(ok?: ((v: { data: unknown; error: null; count?: number }) => T1 | PromiseLike<T1>) | null, ko?: ((e: unknown) => T2 | PromiseLike<T2>) | null) {
    return Promise.resolve().then(() => this.run()).then(ok ?? undefined, ko ?? undefined);
  }
}
// `single()` est un nom réservé par certains outils : on l'expose proprement
(Query.prototype as unknown as { single: () => Query }).single = function (this: Query) { return this.singleRow(); };

const demoUser = { id: DEMO_USER_ID, email: 'demo@biolinkwd.test', user_metadata: { full_name: 'Mama Josiane' }, app_metadata: {}, aud: 'authenticated', created_at: new Date().toISOString() };
const demoSession = { access_token: 'demo', refresh_token: 'demo', expires_in: 3600, token_type: 'bearer', user: demoUser };

function rpc(name: string, args: Record<string, unknown> = {}) {
  const ok = (data: unknown) => Promise.resolve({ data, error: null });
  switch (name) {
    case 'public_stats': return ok({ shops: 8, sales: 142, rating: 4.7, reviews: 63 });
    case 'seller_recent_orders': return ok(demoTransactions.map(t => ({ id: t.id, status: t.status, created_at: t.created_at, shipped_at: t.shipped_at })));
    case 'get_order_tracking': {
      const t = demoTransactions.find(x => x.id === args.p_order_id);
      const p = demoProducts.find(x => x.id === t?.product_id);
      return ok(t ? {
        plan_map: true, origin: p?.location_lat ? { lat: p.location_lat, lng: p.location_lng, label: p.location_address } : null,
        destination: { lat: t.delivery_lat, lng: t.delivery_lng, label: t.delivery_address }, events: demoTrackingEvents.filter(e => e.transaction_id === t.id),
      } : null);
    }
    case 'add_tracking_event': return ok({ ok: true });
    default: return ok(null);
  }
}

const channel = () => { const ch = { on: () => ch, subscribe: () => ch, unsubscribe: () => undefined }; return ch; };

export const supabase = {
  from: (table: string) => new Query(table),
  rpc,
  channel,
  removeChannel: () => undefined,
  functions: { invoke: () => Promise.resolve({ data: null, error: null }) },
  storage: {
    from: () => ({
      upload: () => Promise.resolve({ data: { path: 'demo.png' }, error: null }),
      getPublicUrl: () => ({ data: { publicUrl: demoProfile.shop_logo_url } }),
      remove: () => Promise.resolve({ data: null, error: null }),
    }),
  },
  auth: {
    getSession: () => Promise.resolve({ data: { session: demoSession }, error: null }),
    getUser: () => Promise.resolve({ data: { user: demoUser }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => undefined } } }),
    signOut: () => Promise.resolve({ error: null }),
    signInWithPassword: () => Promise.resolve({ data: { session: demoSession, user: demoUser }, error: null }),
    signUp: () => Promise.resolve({ data: { session: demoSession, user: demoUser }, error: null }),
  },
};
