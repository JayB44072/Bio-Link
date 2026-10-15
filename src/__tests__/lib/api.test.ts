import { describe, it, expect, vi, beforeEach } from 'vitest';

/* Faux client Supabase : chaque appel de méthode enchaînable est enregistré, `await` renvoie `result`. */
const { calls, state, from, storage } = vi.hoisted(() => {
  const calls: Array<[string, unknown[]]> = [];
  const state = { result: { data: null as unknown, error: null as unknown }, uploadError: null as unknown };
  const chain: Record<string, unknown> = {};
  const record = (name: string) => (...args: unknown[]) => { calls.push([name, args]); return chain; };
  for (const m of ['select', 'insert', 'update', 'delete', 'eq', 'in', 'order', 'limit', 'maybeSingle']) chain[m] = record(m);
  chain.then = (resolve: (v: unknown) => void) => resolve(state.result);
  const from = vi.fn((table: string) => { calls.push(['from', [table]]); return chain; });
  const storage = {
    from: vi.fn(() => ({
      upload: vi.fn(async (...args: unknown[]) => { calls.push(['upload', args]); return { error: state.uploadError }; }),
      getPublicUrl: vi.fn((path: string) => ({ data: { publicUrl: `https://cdn.test/${path}` } })),
    })),
  };
  return { calls, state, from, storage };
});

vi.mock('../../lib/supabase', () => ({ supabase: { from, storage } }));

import { createProduct, updateProduct, deleteProduct, setProductQuantity, listProducts } from '../../lib/api/products';
import { setServiceActive, createService } from '../../lib/api/services';
import { listSellerTransactions, markTransactionShipped, cancelTransaction } from '../../lib/api/transactions';
import { markNotificationsRead, listNotifications } from '../../lib/api/notifications';
import { updateProfile } from '../../lib/api/profiles';
import { uploadPublicFile } from '../../lib/api/storage';

const names = () => calls.map(c => c[0]);
const argsOf = (name: string) => calls.find(c => c[0] === name)?.[1];

beforeEach(() => {
  calls.length = 0;
  state.result = { data: null, error: null };
  state.uploadError = null;
});

describe('lib/api — produits', () => {
  it('liste les produits d\'un vendeur, du plus récent au plus ancien', async () => {
    await listProducts('u1');
    expect(argsOf('from')).toEqual(['products']);
    expect(argsOf('eq')).toEqual(['user_id', 'u1']);
    expect(argsOf('order')).toEqual(['created_at', { ascending: false }]);
  });

  it('crée un produit puis relit la ligne insérée', async () => {
    await createProduct({ name: 'Basket' });
    expect(names()).toEqual(['from', 'insert', 'select', 'maybeSingle']);
    expect(argsOf('insert')).toEqual([{ name: 'Basket' }]);
  });

  it('met à jour et supprime par identifiant', async () => {
    await updateProduct('p1', { name: 'Neuf' });
    expect(argsOf('eq')).toEqual(['id', 'p1']);
    calls.length = 0;
    await deleteProduct('p1');
    expect(names()).toEqual(['from', 'delete', 'eq']);
  });

  it('change la quantité en stock', async () => {
    await setProductQuantity('p1', 7);
    expect(argsOf('update')).toEqual([{ quantity: 7 }]);
  });
});

describe('lib/api — services', () => {
  it('active ou met en pause un service avec une date de mise à jour', async () => {
    await setServiceActive('s1', false);
    const patch = argsOf('update')?.[0] as { is_active: boolean; updated_at: string };
    expect(patch.is_active).toBe(false);
    expect(new Date(patch.updated_at).getTime()).not.toBeNaN();
    expect(argsOf('eq')).toEqual(['id', 's1']);
  });

  it('crée un service', async () => {
    await createService({ name: 'Logo' });
    expect(argsOf('from')).toEqual(['services']);
  });
});

describe('lib/api — ventes', () => {
  it('limite la liste quand une limite est donnée', async () => {
    await listSellerTransactions('u1', 300);
    expect(argsOf('limit')).toEqual([300]);
    calls.length = 0;
    await listSellerTransactions('u1');
    expect(names()).not.toContain('limit');
  });

  it('marque une commande expédiée avec la date d\'expédition', async () => {
    await markTransactionShipped('t1');
    const patch = argsOf('update')?.[0] as { status: string; shipped_at: string };
    expect(patch.status).toBe('shipped');
    expect(patch.shipped_at).toBeTruthy();
  });

  it('annule une commande', async () => {
    await cancelTransaction('t1');
    expect(argsOf('update')).toEqual([{ status: 'cancelled' }]);
  });
});

describe('lib/api — notifications et profils', () => {
  it('lit 20 notifications au plus', async () => {
    await listNotifications('u1');
    expect(argsOf('limit')).toEqual([20]);
  });

  it('marque des notifications comme lues', async () => {
    await markNotificationsRead(['a', 'b']);
    expect(argsOf('update')).toEqual([{ is_read: true }]);
    expect(argsOf('in')).toEqual(['id', ['a', 'b']]);
  });

  it('met à jour le profil d\'un utilisateur', async () => {
    await updateProfile('u1', { bio: 'Salut' });
    expect(argsOf('from')).toEqual(['profiles']);
    expect(argsOf('eq')).toEqual(['user_id', 'u1']);
  });
});

describe('lib/api — stockage', () => {
  it('renvoie l\'adresse publique du fichier envoyé', async () => {
    const url = await uploadPublicFile('avatars', 'u1/logo.jpg', new Blob(['x']), { contentType: 'image/jpeg' });
    expect(url).toBe('https://cdn.test/u1/logo.jpg');
    const options = argsOf('upload')?.[2] as Record<string, unknown>;
    expect(options.contentType).toBe('image/jpeg');
    expect(options.upsert).toBe(true);
  });

  it('n\'ajoute pas de type de contenu quand il n\'est pas fourni', async () => {
    await uploadPublicFile('product-images', 'u1/a.png', new Blob(['x']));
    expect(argsOf('upload')?.[2]).not.toHaveProperty('contentType');
  });

  it('lève l\'erreur de Supabase si l\'envoi échoue', async () => {
    state.uploadError = new Error('quota');
    await expect(uploadPublicFile('avatars', 'u1/x.jpg', new Blob(['x']))).rejects.toThrow('quota');
  });
});
