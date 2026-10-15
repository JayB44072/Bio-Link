import * as THREE from 'three';
import type { Label, ModelDef } from '../types';
import { at, createProduct, cyl, extrude, group, lathe, mat, mesh, photoTarget, polyShape, rbox, roundedRectShape, rot, sphere, torus, tube } from '../kit';

const P = (fr: string, en: string): Label => ({ fr, en });
const ACCENT = '#6C63FF';

/** Pièce de tissu plate : silhouette 2D extrudée. */
const flat = (pts: Array<[number, number]>, depth: number, m: THREE.Material, bevel = 0.025) => mesh(extrude(polyShape(pts), depth, bevel), m);
const mirror = (pts: Array<[number, number]>): Array<[number, number]> => pts.map(([x, y]) => [-x, y] as [number, number]).reverse();

/* ─────────────── T-shirt ─────────────── */
const tshirt: ModelDef = {
  id: 'tshirt', photo: true, category: 'clothing', name: P('T-shirt', 'T-shirt'),
  parts: { body: P('Corps', 'Body'), sleeves: P('Manches', 'Sleeves'), collar: P('Col', 'Collar'), print: P('Motif imprimé', 'Print') },
  keywords: ['t-shirt', 'tshirt', 'tee shirt', 'teeshirt', 'haut', 'polo'],
  build(accent = ACCENT) {
    const p = createProduct(['body', 'sleeves', 'collar', 'print']);
    const cloth = mat('#f4f4f8', 0.92, 0, THREE.DoubleSide);
    const body: Array<[number, number]> = [[-0.9, 0], [0.9, 0], [0.9, 1.95], [0.62, 2.32], [0.34, 2.4], [0.22, 2.15], [0, 2.08], [-0.22, 2.15], [-0.34, 2.4], [-0.62, 2.32], [-0.9, 1.95]];
    p.add('body', flat(body, 0.16, cloth), [0, -0.1, 0]);
    const sl: Array<[number, number]> = [[0.62, 2.32], [1.42, 1.82], [1.2, 1.36], [0.9, 1.62], [0.9, 1.95]];
    p.add('sleeves', group(flat(sl, 0.16, cloth), flat(mirror(sl), 0.16, cloth)), [0, 0.1, 0]);
    p.add('collar', at(mesh(tube([[0.34, 2.4, 0.08], [0.22, 2.15, 0.08], [0, 2.08, 0.08], [-0.22, 2.15, 0.08], [-0.34, 2.4, 0.08]], 0.05), mat('#d9dbe6', 0.8)), 0, 0, 0), [0, 0.9, 0.2]);
    p.add('print', at(photoTarget(mesh(extrude(roundedRectShape(0.9, 0.9, 0.12), 0.03, 0.01), mat(accent, 0.6)), 'plane', true), 0, 1.25, 0.12), [0, 0.1, 1.1]);
    return p.build();
  },
};

/* ─────────────── Sweat à capuche ─────────────── */
const hoodie: ModelDef = {
  id: 'hoodie', category: 'clothing', name: P('Sweat à capuche', 'Hoodie'),
  parts: { body: P('Corps', 'Body'), sleeves: P('Manches', 'Sleeves'), hood: P('Capuche', 'Hood'), pocket: P('Poche kangourou', 'Kangaroo pocket'), strings: P('Cordons', 'Drawstrings') },
  keywords: ['sweat', 'hoodie', 'capuche', 'pull', 'sweatshirt'],
  build(accent = ACCENT) {
    const p = createProduct(['body', 'sleeves', 'hood', 'pocket', 'strings']);
    const cloth = mat('#4a4f66', 0.95, 0, THREE.DoubleSide);
    const body: Array<[number, number]> = [[-1.0, 0], [1.0, 0], [1.0, 2.05], [0.66, 2.38], [0.36, 2.42], [0, 2.2], [-0.36, 2.42], [-0.66, 2.38], [-1.0, 2.05]];
    p.add('body', flat(body, 0.2, cloth), [0, -0.1, 0]);
    const sl: Array<[number, number]> = [[0.66, 2.38], [1.62, 1.2], [1.38, 0.8], [1.0, 1.4], [1.0, 2.05]];
    p.add('sleeves', group(flat(sl, 0.2, cloth), flat(mirror(sl), 0.2, cloth)), [0, 0.0, 0]);
    const hoodShape = new THREE.Shape();
    hoodShape.moveTo(-0.46, 2.3); hoodShape.quadraticCurveTo(-0.7, 3.1, 0, 3.15); hoodShape.quadraticCurveTo(0.7, 3.1, 0.46, 2.3);
    hoodShape.quadraticCurveTo(0.2, 2.16, 0, 2.18); hoodShape.quadraticCurveTo(-0.2, 2.16, -0.46, 2.3);
    p.add('hood', at(mesh(extrude(hoodShape, 0.3, 0.05), cloth), 0, 0, -0.08), [0, 0.6, -0.5]);
    p.add('pocket', at(mesh(extrude(roundedRectShape(1.2, 0.55, 0.1), 0.05, 0.015), mat('#3d4156', 0.95)), 0, 0.55, 0.14), [0, -0.1, 1.0]);
    p.add('strings', group(
      at(mesh(tube([[0.18, 2.1, 0.16], [0.2, 1.7, 0.18], [0.16, 1.3, 0.18]], 0.025), mat(accent, 0.6)), 0, 0, 0),
      at(mesh(tube([[-0.18, 2.1, 0.16], [-0.2, 1.7, 0.18], [-0.16, 1.3, 0.18]], 0.025), mat(accent, 0.6)), 0, 0, 0),
    ), [0, 0.7, 1.0]);
    return p.build();
  },
};

/* ─────────────── Jean ─────────────── */
const jeans: ModelDef = {
  id: 'jeans', category: 'clothing', name: P('Jean', 'Jeans'),
  parts: { waist: P('Ceinture', 'Waistband'), legs: P('Jambes', 'Legs'), pockets: P('Poches', 'Pockets'), rivets: P('Boutons et rivets', 'Button and rivets') },
  keywords: ['jean', 'jeans', 'pantalon', 'denim', 'trousers', 'pants'],
  build() {
    const p = createProduct(['waist', 'legs', 'pockets', 'rivets']);
    const denim = mat('#2f4a7c', 0.9, 0, THREE.DoubleSide);
    const legR: Array<[number, number]> = [[0.0, 2.0], [0.95, 2.0], [0.82, 0], [0.12, 0]];
    p.add('legs', group(flat(legR, 0.22, denim), flat(mirror(legR), 0.22, denim)), [0, -0.4, 0]);
    p.add('waist', at(mesh(extrude(roundedRectShape(1.9, 0.34, 0.03), 0.26, 0.02), mat('#243a63', 0.85)), 0, 2.08, 0), [0, 0.9, 0]);
    const pocket = (x: number) => at(mesh(extrude(polyShape([[-0.26, 0.2], [0.26, 0.2], [0.26, -0.2], [0, -0.34], [-0.26, -0.2]]), 0.03, 0.01), mat('#3a5a92', 0.85)), x, 1.5, 0.13);
    p.add('pockets', group(pocket(0.5), pocket(-0.5)), [0, 0.2, 1.0]);
    const rivet = (x: number, y: number) => at(mesh(sphere(0.05, 12, 10), mat('#c9a14a', 0.3, 0.9)), x, y, 0.15);
    p.add('rivets', group(rivet(0, 1.88), rivet(0.72, 1.62), rivet(-0.72, 1.62)), [0, 0.5, 1.2]);
    return p.build();
  },
};

/* ─────────────── Robe ─────────────── */
const dress: ModelDef = {
  id: 'dress', category: 'clothing', name: P('Robe', 'Dress'),
  parts: { bodice: P('Corsage', 'Bodice'), skirt: P('Jupe', 'Skirt'), straps: P('Bretelles', 'Straps'), belt: P('Ceinture', 'Belt') },
  keywords: ['robe', 'dress', 'jupe', 'tenue', 'gown'],
  build(accent = '#d94f7a') {
    const p = createProduct(['bodice', 'skirt', 'straps', 'belt']);
    const cloth = mat(accent, 0.8, 0, THREE.DoubleSide);
    const bodice: Array<[number, number]> = [[-0.62, 1.6], [0.62, 1.6], [0.56, 2.45], [0.22, 2.55], [0, 2.4], [-0.22, 2.55], [-0.56, 2.45]];
    p.add('bodice', flat(bodice, 0.2, cloth), [0, 0.6, 0]);
    const sk = lathe([[0.64, 1.62], [0.9, 1.0], [1.2, 0.0], [1.22, -0.03], [0.0, -0.03]].map(([r, y]) => [r, y] as [number, number]), 56);
    p.add('skirt', mesh(sk, mat(accent, 0.85, 0, THREE.DoubleSide)), [0, -0.5, 0]);
    p.add('straps', group(
      mesh(tube([[0.4, 2.5, 0.05], [0.34, 2.9, 0.0], [0.22, 2.55, 0.05]], 0.03), mat('#2a2a34', 0.7)),
      mesh(tube([[-0.4, 2.5, 0.05], [-0.34, 2.9, 0.0], [-0.22, 2.55, 0.05]], 0.03), mat('#2a2a34', 0.7)),
    ), [0, 1.1, 0]);
    p.add('belt', at(mesh(torus(0.64, 0.06, 12, 48), mat('#2a2a34', 0.5)), 0, 1.62, 0), [0, 0.3, 0]);
    (p.root.children[3] as THREE.Object3D).rotation.x = Math.PI / 2;
    return p.build();
  },
};

/* ─────────────── Veste ─────────────── */
const jacket: ModelDef = {
  id: 'jacket', category: 'clothing', name: P('Veste', 'Jacket'),
  parts: { body: P('Corps', 'Body'), sleeves: P('Manches', 'Sleeves'), collar: P('Col', 'Collar'), zip: P('Fermeture', 'Zip') },
  keywords: ['veste', 'jacket', 'blouson', 'manteau', 'coat', 'blazer'],
  build(accent = '#c9a14a') {
    const p = createProduct(['body', 'sleeves', 'collar', 'zip']);
    const cloth = mat('#22242c', 0.55, 0, THREE.DoubleSide);
    const body: Array<[number, number]> = [[-1.0, 0], [1.0, 0], [1.0, 2.0], [0.7, 2.4], [0.3, 2.45], [0, 2.05], [-0.3, 2.45], [-0.7, 2.4], [-1.0, 2.0]];
    p.add('body', flat(body, 0.22, cloth), [0, -0.2, 0]);
    const sl: Array<[number, number]> = [[0.7, 2.4], [1.55, 1.1], [1.3, 0.7], [1.0, 1.3], [1.0, 2.0]];
    p.add('sleeves', group(flat(sl, 0.22, cloth), flat(mirror(sl), 0.22, cloth)), [0, 0.0, 0]);
    const col = new THREE.Shape();
    col.moveTo(-0.5, 2.38); col.lineTo(-0.2, 2.7); col.lineTo(0, 2.1); col.lineTo(0.2, 2.7); col.lineTo(0.5, 2.38); col.lineTo(0.3, 2.45); col.lineTo(0, 2.2); col.lineTo(-0.3, 2.45); col.closePath();
    p.add('collar', at(mesh(extrude(col, 0.26, 0.03), mat('#2e3039', 0.6)), 0, 0, 0), [0, 0.8, 0.2]);
    p.add('zip', at(mesh(cyl(0.025, 0.025, 2.1, 12), mat(accent, 0.3, 0.9)), 0, 1.05, 0.15), [0, -0.1, 1.2]);
    return p.build();
  },
};

/* ─────────────── Casquette ─────────────── */
const cap: ModelDef = {
  id: 'cap', category: 'clothing', name: P('Casquette', 'Cap'),
  parts: { crown: P('Calotte', 'Crown'), visor: P('Visière', 'Visor'), button: P('Bouton', 'Button'), band: P('Bandeau', 'Band') },
  keywords: ['casquette', 'cap', 'bonnet', 'chapeau', 'hat'],
  build(accent = ACCENT) {
    const p = createProduct(['crown', 'visor', 'button', 'band']);
    const cloth = mat('#2a2f4a', 0.9);
    const crown = new THREE.SphereGeometry(1, 40, 24, 0, Math.PI * 2, 0, Math.PI / 2);
    p.add('crown', at(mesh(crown, cloth), 0, 0.12, 0), [0, 0.4, 0]);
    p.add('band', at(mesh(cyl(1.02, 1.02, 0.16, 48), mat(accent, 0.7)), 0, 0.08, 0), [0, -0.3, 0]);
    const visor = new THREE.Shape();
    visor.absarc(0, 0, 1.0, -Math.PI * 0.62, Math.PI * 0.62, false);
    visor.absarc(0, 0, 0.7, Math.PI * 0.62, -Math.PI * 0.62, true);
    const v = mesh(extrude(new THREE.Shape([new THREE.Vector2(0.9, -0.7), new THREE.Vector2(1.9, -0.55), new THREE.Vector2(2.05, 0), new THREE.Vector2(1.9, 0.55), new THREE.Vector2(0.9, 0.7)]), 0.06, 0.02), mat('#1f2338', 0.85));
    p.add('visor', at(rot(v, Math.PI / 2, 0, 0), 0, 0.1, 0), [0.7, -0.1, 0]);
    p.add('button', at(mesh(sphere(0.1, 16, 12), mat(accent, 0.6)), 0, 1.1, 0), [0, 1.0, 0]);
    return p.build();
  },
};

/* ─────────────── Sac à dos ─────────────── */
const backpack: ModelDef = {
  id: 'backpack', category: 'clothing', name: P('Sac à dos', 'Backpack'),
  parts: { body: P('Corps', 'Main body'), pocket: P('Poche avant', 'Front pocket'), straps: P('Bretelles', 'Shoulder straps'), zip: P('Fermeture', 'Zip') },
  keywords: ['sac a dos', 'backpack', 'cartable', 'sac de sport', 'rucksack'],
  build(accent = ACCENT) {
    const p = createProduct(['body', 'pocket', 'straps', 'zip']);
    const cloth = mat('#2d3250', 0.85);
    p.add('body', at(mesh(rbox(1.7, 2.4, 0.9, 0.3, 6), cloth), 0, 1.2, 0), [0, -0.1, -0.2]);
    p.add('pocket', at(mesh(rbox(1.3, 1.0, 0.35, 0.16, 5), mat(accent, 0.75)), 0, 0.8, 0.62), [0, -0.1, 1.2]);
    const strap = (x: number) => mesh(tube([[x, 2.1, -0.45], [x * 1.1, 1.0, -0.62], [x, 0.2, -0.45]], 0.1, false, 30), mat('#1f2238', 0.8));
    p.add('straps', group(strap(0.5), strap(-0.5)), [0, 0.2, -1.3]);
    p.add('zip', at(mesh(cyl(0.03, 0.03, 1.3, 12), mat('#cfcfd8', 0.3, 0.9)), 0, 2.05, 0.46), [0, 1.0, 0.4]);
    (p.root.children[3] as THREE.Object3D).rotation.z = Math.PI / 2;
    return p.build();
  },
};

/* ─────────────── Sac à main ─────────────── */
const handbag: ModelDef = {
  id: 'handbag', category: 'clothing', name: P('Sac à main', 'Handbag'),
  parts: { body: P('Corps', 'Body'), flap: P('Rabat', 'Flap'), handle: P('Anse', 'Handle'), clasp: P('Fermoir', 'Clasp') },
  keywords: ['sac a main', 'handbag', 'sac', 'bag', 'pochette', 'purse'],
  build(accent = '#c9a14a') {
    const p = createProduct(['body', 'flap', 'handle', 'clasp']);
    const leather = mat('#8a2f3d', 0.5);
    p.add('body', at(mesh(rbox(2.2, 1.4, 0.8, 0.14, 5), leather), 0, 0.7, 0), [0, -0.3, 0]);
    p.add('flap', at(mesh(rbox(2.2, 0.55, 0.86, 0.12, 5), mat('#74252f', 0.5)), 0, 1.35, 0), [0, 0.3, 0]);
    p.add('handle', mesh(tube([[-0.8, 1.55, 0], [-0.7, 2.5, 0], [0.7, 2.5, 0], [0.8, 1.55, 0]], 0.07, false, 40), mat('#5a1c26', 0.5)), [0, 1.0, 0]);
    p.add('clasp', at(mesh(rbox(0.3, 0.26, 0.1, 0.04), mat(accent, 0.25, 0.9)), 0, 1.2, 0.46), [0, 0.2, 1.1]);
    return p.build();
  },
};

export const CLOTHING_MODELS: ModelDef[] = [tshirt, hoodie, jeans, dress, jacket, cap, backpack, handbag];
