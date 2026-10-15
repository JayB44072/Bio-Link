import * as THREE from 'three';
import type { Label, ModelDef } from '../types';
import { at, createProduct, cyl, extrude, glass, group, lathe, mat, mesh, photoTarget, rbox, roundedRectShape, rot, torus, tube } from '../kit';

const P = (fr: string, en: string): Label => ({ fr, en });
const ACCENT = '#6C63FF';

/* ─────────────── Lunettes de soleil ─────────────── */
const sunglasses: ModelDef = {
  id: 'sunglasses', category: 'accessories', name: P('Lunettes de soleil', 'Sunglasses'),
  parts: { frame: P('Monture', 'Frame'), lenses: P('Verres', 'Lenses'), temples: P('Branches', 'Temples'), bridge: P('Pont', 'Bridge') },
  keywords: ['lunettes', 'sunglasses', 'soleil', 'lunette', 'glasses', 'optique'],
  build(accent = ACCENT) {
    const p = createProduct(['frame', 'lenses', 'temples', 'bridge']);
    const ring = (x: number) => at(mesh(torus(0.62, 0.07, 14, 40), mat('#1c1d24', 0.35, 0.2)), x, 0.7, 0);
    p.add('frame', group(ring(-0.8), ring(0.8)), [0, 0, 0.3]);
    const lens = (x: number) => at(rot(mesh(cyl(0.6, 0.6, 0.03, 40), glass('#1a2a52', 0.85)), Math.PI / 2, 0, 0), x, 0.7, 0);
    p.add('lenses', group(lens(-0.8), lens(0.8)), [0, 0, 1.2]);
    p.add('bridge', mesh(tube([[-0.25, 0.85, 0], [0, 0.95, 0], [0.25, 0.85, 0]], 0.06), mat(accent, 0.4, 0.4)), [0, 0.8, 0.6]);
    const temple = (x: number) => mesh(tube([[x, 0.8, 0], [x, 0.8, -0.8], [x * 0.98, 0.55, -1.3]], 0.05), mat('#1c1d24', 0.35, 0.2));
    p.add('temples', group(temple(-1.4), temple(1.4)), [0, 0, -1.2]);
    return p.build();
  },
};

/* ─────────────── Montre ─────────────── */
const watch: ModelDef = {
  id: 'watch', category: 'accessories', name: P('Montre', 'Watch'),
  parts: { strap: P('Bracelet', 'Strap'), case: P('Boîtier', 'Case'), dial: P('Cadran', 'Dial'), hands: P('Aiguilles', 'Hands'), glass: P('Verre', 'Crystal') },
  keywords: ['montre', 'watch', 'horloge', 'chrono', 'bracelet montre'],
  build(accent = '#c9a14a') {
    const p = createProduct(['strap', 'case', 'dial', 'hands', 'glass']);
    const strap = new THREE.Group();
    strap.add(at(mesh(rbox(0.7, 1.6, 0.08, 0.04), mat('#5a3a22', 0.7)), 0, 1.35, 0));
    strap.add(at(mesh(rbox(0.7, 1.6, 0.08, 0.04), mat('#5a3a22', 0.7)), 0, -1.35, 0));
    p.add('strap', strap, [0, 0, -0.7]);
    p.add('case', at(rot(mesh(cyl(0.95, 0.95, 0.22, 56), mat(accent, 0.25, 0.95)), Math.PI / 2, 0, 0), 0, 0, 0), [0, 0, 0.1]);
    p.add('dial', at(rot(mesh(cyl(0.82, 0.82, 0.03, 56), mat('#f5f2ea', 0.5)), Math.PI / 2, 0, 0), 0, 0, 0.12), [0, 0, 0.6]);
    const hands = new THREE.Group();
    hands.add(at(mesh(rbox(0.05, 0.6, 0.02, 0.01), mat('#1c1d24', 0.4)), 0, 0.28, 0.15));
    const h2 = at(mesh(rbox(0.05, 0.42, 0.02, 0.01), mat('#1c1d24', 0.4)), 0.15, 0.1, 0.16); h2.rotation.z = -1.0; hands.add(h2);
    p.add('hands', hands, [0, 0, 1.2]);
    p.add('glass', at(rot(mesh(cyl(0.86, 0.86, 0.03, 56), glass('#cfe3ff', 0.25)), Math.PI / 2, 0, 0), 0, 0, 0.2), [0, 0, 1.9]);
    return p.build();
  },
};

/* ─────────────── Parfum ─────────────── */
const perfume: ModelDef = {
  id: 'perfume', photo: true, category: 'accessories', name: P('Parfum', 'Perfume'),
  parts: { bottle: P('Flacon', 'Bottle'), liquid: P('Parfum', 'Fragrance'), cap: P('Bouchon', 'Cap'), label: P('Étiquette', 'Label') },
  keywords: ['parfum', 'perfume', 'fragrance', 'eau de toilette', 'cologne', 'senteur'],
  build(accent = '#c9a14a') {
    const p = createProduct(['bottle', 'liquid', 'cap', 'label']);
    p.add('bottle', at(mesh(rbox(1.5, 1.7, 0.9, 0.12), glass('#f0f4ff', 0.3)), 0, 0.85, 0), [0, -0.2, 0]);
    p.add('liquid', at(mesh(rbox(1.34, 1.2, 0.74, 0.1), glass('#e8a0c0', 0.8)), 0, 0.75, 0), [0, 0.4, 0]);
    p.add('label', at(photoTarget(mesh(extrude(roundedRectShape(0.8, 0.5, 0.05), 0.02, 0.005), mat('#f7f2e4', 0.6)), 'plane', true), 0, 0.85, 0.47), [0, 0.0, 1.0]);
    p.add('cap', group(at(mesh(cyl(0.22, 0.26, 0.18, 24), mat(accent, 0.25, 0.9)), 0, 1.8, 0), at(mesh(rbox(0.8, 0.7, 0.55, 0.08), mat(accent, 0.25, 0.9)), 0, 2.2, 0)), [0, 1.2, 0]);
    return p.build();
  },
};

/* ─────────────── Portefeuille ─────────────── */
const wallet: ModelDef = {
  id: 'wallet', category: 'accessories', name: P('Portefeuille', 'Wallet'),
  parts: { shell: P('Cuir extérieur', 'Leather shell'), cards: P('Cartes', 'Cards'), notes: P('Billets', 'Banknotes'), stitching: P('Coutures', 'Stitching') },
  keywords: ['portefeuille', 'wallet', 'porte monnaie', 'porte-cartes', 'maroquinerie', 'cuir'],
  build(accent = '#e23b4e') {
    const p = createProduct(['shell', 'cards', 'notes', 'stitching']);
    p.add('shell', at(mesh(rbox(2.3, 0.28, 1.5, 0.1), mat('#5a3a22', 0.55)), 0, 0.14, 0), [0, -0.4, 0]);
    p.add('notes', at(mesh(rbox(2.1, 0.06, 1.2, 0.02), mat('#9bd0a0', 0.8)), 0, 0.31, -0.05), [0, 0.5, -0.3]);
    const card = (x: number, c: string) => at(mesh(rbox(1.0, 0.03, 0.64, 0.05), mat(c, 0.4, 0.3)), x, 0.34, 0.2);
    p.add('cards', group(card(-0.5, accent), card(0.2, '#2a8fe8'), card(0.8, '#1c1d24')), [0, 1.0, 0.9]);
    p.add('stitching', at(mesh(tube([[-1.05, 0.29, -0.65], [1.05, 0.29, -0.65], [1.05, 0.29, 0.65], [-1.05, 0.29, 0.65]], 0.01, true, 60), mat('#e8dcc6', 0.6)), 0, 0, 0), [0, 1.6, 0]);
    return p.build();
  },
};

/* ─────────────── Rouge à lèvres ─────────────── */
const lipstick: ModelDef = {
  id: 'lipstick', category: 'accessories', name: P('Rouge à lèvres', 'Lipstick'),
  parts: { cap: P('Capuchon', 'Cap'), bullet: P('Bâton', 'Bullet'), tube: P('Tube', 'Tube'), base: P('Base', 'Base') },
  keywords: ['rouge a levres', 'lipstick', 'maquillage', 'makeup', 'cosmetique', 'beaute', 'gloss'],
  build(accent = '#c4204a') {
    const p = createProduct(['cap', 'bullet', 'tube', 'base']);
    p.add('base', at(mesh(cyl(0.42, 0.45, 0.8, 32), mat('#1c1d24', 0.3, 0.7)), 0, 0.4, 0), [0, -0.3, 0]);
    p.add('tube', at(mesh(cyl(0.38, 0.38, 0.8, 32), mat('#c9a14a', 0.25, 0.95)), 0, 1.2, 0), [0, 0.2, 0]);
    const bullet = lathe([[0, 0], [0.3, 0], [0.3, 0.7], [0.18, 0.95], [0, 1.0]], 32);
    p.add('bullet', at(mesh(bullet, mat(accent, 0.35)), 0, 1.55, 0), [0, 0.9, 0]);
    p.add('cap', at(mesh(cyl(0.4, 0.4, 1.6, 32), mat('#1c1d24', 0.3, 0.7)), 0, 2.3, 0), [0, 2.2, 0]);
    return p.build();
  },
};

export const ACCESSORY_MODELS: ModelDef[] = [sunglasses, watch, perfume, wallet, lipstick];
