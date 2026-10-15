import * as THREE from 'three';
import type { Label, ModelDef } from '../types';
import { at, createProduct, cyl, extrude, glass, lathe, mat, mesh, photoTarget, rbox } from '../kit';

const P = (fr: string, en: string): Label => ({ fr, en });
const ACCENT = '#e23b4e';

/** Étiquette qui enveloppe un cylindre (portion de cylindre ouverte). */
const wrapLabel = (r: number, h: number, y: number, m: THREE.Material, arc = Math.PI * 1.7) => {
  const g = new THREE.CylinderGeometry(r, r, h, 48, 1, true, -arc / 2, arc);
  return photoTarget(at(mesh(g, m), 0, y, 0), 'wrap');
};

/* ─────────────── Canette ─────────────── */
const sodaCan: ModelDef = {
  id: 'soda-can', photo: true, category: 'drinks', name: P('Canette', 'Soda can'),
  parts: { body: P('Corps en aluminium', 'Aluminium body'), label: P('Décor imprimé', 'Printed design'), lid: P('Couvercle', 'Lid'), tab: P('Languette', 'Pull tab') },
  keywords: ['canette', 'soda', 'can', 'cola', 'boisson gazeuse', 'energy', 'redbull'],
  build(accent = ACCENT) {
    const p = createProduct(['body', 'label', 'lid', 'tab']);
    const metal = mat('#c9ccd6', 0.28, 0.9);
    p.add('body', mesh(lathe([[0.0, 0.0], [0.55, 0.0], [0.62, 0.1], [0.66, 0.25], [0.66, 2.1], [0.6, 2.25], [0.54, 2.34]], 48), metal), [0, -0.2, 0]);
    p.add('label', wrapLabel(0.672, 1.45, 1.15, mat(accent, 0.45, 0.2), Math.PI * 2), [0, 0.0, 0]);
    p.add('lid', at(mesh(cyl(0.56, 0.56, 0.06, 40), mat('#b5b9c6', 0.3, 0.9)), 0, 2.36, 0), [0, 0.8, 0]);
    const tab = new THREE.Shape();
    tab.moveTo(-0.26, -0.12); tab.lineTo(0.2, -0.12); tab.quadraticCurveTo(0.34, 0, 0.2, 0.12); tab.lineTo(-0.26, 0.12); tab.closePath();
    const t = mesh(extrude(tab, 0.03, 0.01), mat('#d9dbe3', 0.3, 0.9));
    t.rotation.x = -Math.PI / 2;
    p.add('tab', at(t, 0, 2.42, 0), [0, 1.6, 0.0]);
    return p.build();
  },
};

/* ─────────────── Bouteille d'eau ─────────────── */
const waterBottle: ModelDef = {
  id: 'water-bottle', photo: true, category: 'drinks', name: P("Bouteille d'eau", 'Water bottle'),
  parts: { bottle: P('Bouteille', 'Bottle'), water: P('Eau', 'Water'), label: P('Étiquette', 'Label'), cap: P('Bouchon', 'Cap') },
  keywords: ['eau', 'water', 'bouteille', 'bottle', 'mineral', 'minerale'],
  build(accent = '#2a8fe8') {
    const p = createProduct(['bottle', 'water', 'label', 'cap']);
    const prof: Array<[number, number]> = [[0, 0], [0.5, 0], [0.55, 0.1], [0.55, 1.6], [0.5, 1.85], [0.22, 2.15], [0.2, 2.5], [0.0, 2.5]];
    p.add('bottle', mesh(lathe(prof, 48), glass('#cfe9ff', 0.28)), [0, -0.2, 0]);
    const w = lathe([[0, 0.05], [0.48, 0.05], [0.52, 0.12], [0.52, 1.5], [0.47, 1.72], [0.2, 2.0], [0.0, 2.0]], 48);
    p.add('water', mesh(w, glass('#6fc2ff', 0.55)), [0, 0.5, 0]);
    p.add('label', wrapLabel(0.562, 0.7, 0.95, mat(accent, 0.5), Math.PI * 2), [0, 0.2, 0]);
    p.add('cap', at(mesh(cyl(0.24, 0.26, 0.28, 24), mat(accent, 0.5)), 0, 2.64, 0), [0, 1.0, 0]);
    return p.build();
  },
};

/* ─────────────── Bouteille de vin ─────────────── */
const wineBottle: ModelDef = {
  id: 'wine-bottle', photo: true, category: 'drinks', name: P('Bouteille de vin', 'Wine bottle'),
  parts: { bottle: P('Bouteille', 'Bottle'), wine: P('Vin', 'Wine'), label: P('Étiquette', 'Label'), cork: P('Bouchon', 'Cork'), capsule: P('Capsule', 'Capsule') },
  keywords: ['vin', 'wine', 'rouge', 'blanc', 'champagne', 'cave'],
  build(accent = '#c9a14a') {
    const p = createProduct(['bottle', 'wine', 'label', 'cork', 'capsule']);
    const prof: Array<[number, number]> = [[0, 0], [0.5, 0], [0.55, 0.12], [0.55, 1.9], [0.45, 2.3], [0.2, 2.75], [0.18, 3.5], [0.0, 3.5]];
    p.add('bottle', mesh(lathe(prof, 48), glass('#1d3a26', 0.5)), [0, -0.2, 0]);
    p.add('wine', mesh(lathe([[0, 0.08], [0.47, 0.08], [0.5, 0.15], [0.5, 1.85], [0.42, 2.2], [0.17, 2.6], [0.0, 2.6]], 48), glass('#5a0f26', 0.85)), [0, 0.5, 0]);
    p.add('label', wrapLabel(0.562, 0.95, 1.1, mat('#f3eadb', 0.8), Math.PI * 1.7), [0, 0.1, 0]);
    p.add('capsule', at(mesh(cyl(0.2, 0.2, 0.5, 24), mat(accent, 0.35, 0.7)), 0, 3.25, 0), [0, 0.6, 0]);
    p.add('cork', at(mesh(cyl(0.14, 0.14, 0.3, 20), mat('#c9a06a', 0.9)), 0, 3.62, 0), [0, 1.3, 0]);
    return p.build();
  },
};

/* ─────────────── Gobelet de café ─────────────── */
const coffeeCup: ModelDef = {
  id: 'coffee-cup', category: 'drinks', name: P('Gobelet de café', 'Coffee cup'),
  parts: { cup: P('Gobelet', 'Cup'), coffee: P('Café', 'Coffee'), sleeve: P('Manchon', 'Sleeve'), lid: P('Couvercle', 'Lid') },
  keywords: ['cafe', 'coffee', 'gobelet', 'expresso', 'cappuccino', 'the', 'tea', 'latte'],
  build(accent = '#8a5a30') {
    const p = createProduct(['cup', 'coffee', 'sleeve', 'lid']);
    p.add('cup', mesh(lathe([[0, 0], [0.5, 0], [0.74, 1.9], [0.78, 1.95]], 48), mat('#f4f1ea', 0.8, 0, THREE.DoubleSide)), [0, -0.2, 0]);
    p.add('coffee', at(mesh(cyl(0.72, 0.72, 0.04, 40), mat('#3a2216', 0.3)), 0, 1.6, 0), [0, 0.6, 0]);
    p.add('sleeve', at(mesh(new THREE.CylinderGeometry(0.69, 0.6, 0.85, 48, 1, true), mat(accent, 0.85, 0, THREE.DoubleSide)), 0, 0.85, 0), [0, 0.15, 0]);
    const lid = lathe([[0.0, 0.2], [0.6, 0.2], [0.82, 0.18], [0.84, 0.0], [0.78, 0.0], [0.76, 0.1], [0.0, 0.1]].map(([r, y]) => [r, y] as [number, number]), 48);
    p.add('lid', at(mesh(lid, mat('#2a2a32', 0.5, 0, THREE.DoubleSide)), 0, 1.95, 0), [0, 1.4, 0]);
    return p.build();
  },
};

/* ─────────────── Carton de jus ─────────────── */
const juiceCarton: ModelDef = {
  id: 'juice-carton', photo: true, category: 'drinks', name: P('Carton de jus', 'Juice carton'),
  parts: { box: P('Carton', 'Carton'), label: P('Illustration', 'Artwork'), top: P('Toit du carton', 'Gable top'), cap: P('Bouchon', 'Cap') },
  keywords: ['jus', 'juice', 'carton', 'lait', 'milk', 'orange', 'bissap', 'gingembre'],
  build(accent = '#ff9a2a') {
    const p = createProduct(['box', 'label', 'top', 'cap']);
    p.add('box', at(mesh(rbox(1.2, 2.0, 1.2, 0.05), mat('#f7f2e4', 0.7)), 0, 1.0, 0), [0, -0.2, 0]);
    p.add('label', at(photoTarget(mesh(rbox(1.0, 1.3, 0.04, 0.03), mat(accent, 0.5)), 'plane'), 0, 1.0, 0.62), [0, 0.0, 1.2]);
    const gable = new THREE.Shape();
    gable.moveTo(-0.6, 0); gable.lineTo(0.6, 0); gable.lineTo(0.6, 0.0); gable.lineTo(0.0, 0.7); gable.lineTo(-0.6, 0);
    const g = mesh(extrude(gable, 1.2, 0.02), mat('#efe8d4', 0.7));
    p.add('top', at(g, 0, 2.0, 0), [0, 0.8, 0]);
    p.add('cap', at(mesh(cyl(0.12, 0.12, 0.14, 20), mat(accent, 0.5)), 0.3, 2.6, 0), [0.4, 1.7, 0]);
    return p.build();
  },
};

/* ─────────────── Bouteille de bière ─────────────── */
const beerBottle: ModelDef = {
  id: 'beer-bottle', photo: true, category: 'drinks', name: P('Bouteille de bière', 'Beer bottle'),
  parts: { bottle: P('Bouteille', 'Bottle'), beer: P('Bière', 'Beer'), label: P('Étiquette', 'Label'), cap: P('Capsule', 'Crown cap') },
  keywords: ['biere', 'beer', 'bière', 'brasserie', 'lager', 'alcool'],
  build(accent = '#d9a52a') {
    const p = createProduct(['bottle', 'beer', 'label', 'cap']);
    const prof: Array<[number, number]> = [[0, 0], [0.46, 0], [0.5, 0.1], [0.5, 1.55], [0.4, 1.95], [0.19, 2.35], [0.18, 3.0], [0.0, 3.0]];
    p.add('bottle', mesh(lathe(prof, 48), glass('#6a3d12', 0.55)), [0, -0.2, 0]);
    p.add('beer', mesh(lathe([[0, 0.07], [0.42, 0.07], [0.45, 0.14], [0.45, 1.5], [0.36, 1.88], [0.16, 2.2], [0.0, 2.2]], 48), glass('#e8a82a', 0.8)), [0, 0.5, 0]);
    p.add('label', wrapLabel(0.512, 0.8, 1.0, mat('#f1e7cf', 0.8), Math.PI * 2), [0, 0.1, 0]);
    p.add('cap', at(mesh(cyl(0.22, 0.2, 0.1, 24), mat(accent, 0.3, 0.8)), 0, 3.05, 0), [0, 1.2, 0]);
    return p.build();
  },
};

export const DRINK_MODELS: ModelDef[] = [sodaCan, waterBottle, wineBottle, coffeeCup, juiceCarton, beerBottle];
