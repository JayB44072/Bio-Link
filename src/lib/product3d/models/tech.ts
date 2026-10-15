import * as THREE from 'three';
import type { Label, ModelDef } from '../types';
import { at, createProduct, cyl, glass, group, mat, mesh, photoTarget, rbox, rot, sphere, torus, tube } from '../kit';

const P = (fr: string, en: string): Label => ({ fr, en });
const ACCENT = '#6C63FF';
const ALU = '#c9ccd6';

/** Écran allumé : dégradé simple (fausse interface) sur une plaque. */
function screenMat(accent: string) {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 256;
  const g = c.getContext('2d');
  if (g && 'createLinearGradient' in g) {
    const grad = g.createLinearGradient(0, 0, 128, 256);
    grad.addColorStop(0, accent); grad.addColorStop(1, '#0b1020');
    g.fillStyle = grad; g.fillRect(0, 0, 128, 256);
    g.fillStyle = 'rgba(255,255,255,0.85)';
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) g.fillRect(14 + j * 38, 60 + i * 44, 26, 26);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const m = mat('#ffffff', 0.25);
  m.map = tex;
  m.emissive = new THREE.Color('#ffffff');
  m.emissiveMap = tex;
  return m;
}

/* ─────────────── Smartphone ─────────────── */
const smartphone: ModelDef = {
  id: 'smartphone', photo: true, category: 'tech', name: P('Smartphone', 'Smartphone'),
  parts: { screen: P('Écran tactile', 'Touchscreen'), frame: P('Châssis', 'Frame'), board: P('Carte mère', 'Logic board'), battery: P('Batterie', 'Battery'), camera: P('Appareil photo', 'Camera'), back: P('Coque arrière', 'Back cover') },
  keywords: ['telephone', 'smartphone', 'phone', 'iphone', 'samsung', 'mobile', 'portable', 'android', 'tecno', 'infinix'],
  build(accent = ACCENT) {
    const p = createProduct(['screen', 'frame', 'board', 'battery', 'camera', 'back']);
    const W = 1.3, H = 2.4, D = 0.22;
    p.add('screen', at(photoTarget(mesh(rbox(W, H, 0.04, 0.12), screenMat(accent))), 0, 0, D / 2 + 0.02), [0, 0, 1.6]);
    p.add('frame', mesh(rbox(W + 0.06, H + 0.06, D, 0.14), mat('#2b2d38', 0.35, 0.8)), [0, 0, 0.8]);
    p.add('board', at(mesh(rbox(W - 0.2, H * 0.55, 0.03, 0.04), mat('#1f6a4a', 0.5)), 0, 0.4, -0.02), [0, 0, 0.1]);
    p.add('battery', at(mesh(rbox(W - 0.22, H * 0.4, 0.05, 0.05), mat('#d9dce8', 0.5)), 0, -0.55, -0.02), [0, -0.1, -0.5]);
    p.add('camera', group(
      at(mesh(rbox(0.46, 0.46, 0.04, 0.1), mat('#1a1c24', 0.3, 0.6)), 0.28, 1.0, -D / 2 - 0.02),
      at(rot(mesh(cyl(0.1, 0.1, 0.05, 24), glass('#2a3a6a', 0.9)), Math.PI / 2, 0, 0), 0.18, 1.08, -D / 2 - 0.05),
      at(rot(mesh(cyl(0.1, 0.1, 0.05, 24), glass('#2a3a6a', 0.9)), Math.PI / 2, 0, 0), 0.38, 0.9, -D / 2 - 0.05),
    ), [0, 0.3, -1.0]);
    p.add('back', at(mesh(rbox(W + 0.02, H + 0.02, 0.03, 0.14), mat(accent, 0.3, 0.4)), 0, 0, -D / 2 - 0.01), [0, 0, -2.0]);
    return p.build();
  },
};

/* ─────────────── Ordinateur portable ─────────────── */
const laptop: ModelDef = {
  id: 'laptop', photo: true, category: 'tech', name: P('Ordinateur portable', 'Laptop'),
  parts: { lid: P('Capot', 'Lid'), display: P('Écran', 'Display'), keyboard: P('Clavier', 'Keyboard'), base: P('Châssis', 'Base') },
  keywords: ['ordinateur', 'laptop', 'pc portable', 'macbook', 'notebook', 'ordi', 'hp', 'dell', 'lenovo'],
  build(accent = ACCENT) {
    const p = createProduct(['lid', 'display', 'keyboard', 'base']);
    const W = 3.0, D = 2.0;
    p.add('base', at(mesh(rbox(W, 0.14, D, 0.05), mat(ALU, 0.3, 0.85)), 0, 0.07, 0), [0, -0.3, 0]);
    const keys = new THREE.Group();
    for (let r = 0; r < 5; r++) for (let c = 0; c < 12; c++) keys.add(at(mesh(rbox(0.19, 0.04, 0.19, 0.02, 2), mat('#20222c', 0.5)), -1.2 + c * 0.22, 0.16, -0.45 + r * 0.22));
    keys.add(at(mesh(rbox(0.9, 0.02, 0.55, 0.03), mat('#aeb2bf', 0.4, 0.6)), 0, 0.15, 0.66));
    p.add('keyboard', keys, [0, 0.5, 0.2]);
    // écran incliné
    const lid = new THREE.Group();
    lid.add(at(mesh(rbox(W, 1.95, 0.08, 0.05), mat(ALU, 0.3, 0.85)), 0, 0.98, -0.04));
    lid.add(at(mesh(cyl(0.12, 0.12, 0.012, 24), mat(accent, 0.3, 0.5)), 0, 1.0, -0.092));
    lid.children[1].rotation.x = Math.PI / 2;
    lid.position.set(0, 0.14, -D / 2 + 0.05);
    lid.rotation.x = -0.28;
    const disp = new THREE.Group();
    disp.add(at(photoTarget(mesh(rbox(W - 0.18, 1.78, 0.02, 0.03), screenMat(accent))), 0, 0.98, 0.012));
    disp.position.set(0, 0.14, -D / 2 + 0.05);
    disp.rotation.x = -0.28;
    p.add('lid', lid, [0, 0.5, -0.9]);
    p.add('display', disp, [0, 0.6, 0.9]);
    return p.build();
  },
};

/* ─────────────── PC de bureau ─────────────── */
const desktopPc: ModelDef = {
  id: 'desktop-pc', photo: true, category: 'tech', name: P('PC de bureau', 'Desktop PC'),
  parts: { monitor: P('Écran', 'Monitor'), stand: P('Pied', 'Stand'), tower: P('Unité centrale', 'Tower'), keyboard: P('Clavier', 'Keyboard'), mouse: P('Souris', 'Mouse') },
  keywords: ['pc', 'bureau', 'desktop', 'ordinateur de bureau', 'unite centrale', 'gamer', 'imac', 'moniteur', 'ecran'],
  build(accent = ACCENT) {
    const p = createProduct(['monitor', 'stand', 'tower', 'keyboard', 'mouse']);
    const mon = group(
      at(mesh(rbox(3.0, 1.8, 0.14, 0.06), mat('#1c1e26', 0.35, 0.5)), 0, 0, 0),
      at(photoTarget(mesh(rbox(2.84, 1.64, 0.02, 0.03), screenMat(accent))), 0, 0, 0.08),
    );
    mon.position.set(-0.3, 1.9, 0);
    p.add('monitor', mon, [0, 1.0, 0.2]);
    p.add('stand', group(at(mesh(cyl(0.08, 0.08, 0.7, 16), mat(ALU, 0.3, 0.9)), -0.3, 0.7, -0.05), at(mesh(cyl(0.55, 0.6, 0.06, 32), mat(ALU, 0.3, 0.9)), -0.3, 0.03, -0.05)), [0, 0.0, -0.4]);
    p.add('tower', group(
      at(mesh(rbox(0.9, 2.1, 1.7, 0.08), mat('#1c1e26', 0.35, 0.5)), 2.15, 1.05, 0),
      at(mesh(rbox(0.04, 1.6, 1.3, 0.02), glass('#8fb6ff', 0.4)), 2.62, 1.05, 0),
      at(mesh(cyl(0.07, 0.07, 0.02, 20), mat(accent, 0.4, 0.4)), 1.7, 1.8, 0.86),
    ), [0.9, 0, 0]);
    const keys = new THREE.Group();
    keys.add(at(mesh(rbox(1.9, 0.07, 0.62, 0.03), mat('#2a2c36', 0.5)), 0, 0.04, 0));
    for (let r = 0; r < 3; r++) for (let c = 0; c < 11; c++) keys.add(at(mesh(rbox(0.13, 0.04, 0.13, 0.015, 2), mat('#e9ebf2', 0.5)), -0.8 + c * 0.16, 0.1, -0.18 + r * 0.17));
    keys.position.set(-0.3, 0, 1.3);
    p.add('keyboard', keys, [0, 0.0, 0.8]);
    p.add('mouse', at(mesh(rbox(0.28, 0.12, 0.46, 0.08), mat('#2a2c36', 0.4)), 1.0, 0.06, 1.3), [0.5, 0.3, 0.8]);
    return p.build();
  },
};

/* ─────────────── Tablette ─────────────── */
const tablet: ModelDef = {
  id: 'tablet', photo: true, category: 'tech', name: P('Tablette', 'Tablet'),
  parts: { screen: P('Écran', 'Screen'), body: P('Boîtier', 'Body'), battery: P('Batterie', 'Battery'), pen: P('Stylet', 'Stylus') },
  keywords: ['tablette', 'tablet', 'ipad', 'galaxy tab'],
  build(accent = ACCENT) {
    const p = createProduct(['screen', 'body', 'battery', 'pen']);
    const W = 2.6, H = 1.8;
    p.add('screen', at(photoTarget(mesh(rbox(W - 0.1, H - 0.1, 0.03, 0.08), screenMat(accent))), 0, 0, 0.1), [0, 0, 1.4]);
    p.add('body', mesh(rbox(W, H, 0.16, 0.14), mat('#2b2d38', 0.35, 0.8)), [0, 0, 0.3]);
    p.add('battery', mesh(rbox(W - 0.5, H - 0.5, 0.06, 0.06), mat('#d9dce8', 0.5)), [0, 0, -0.5]);
    p.add('pen', at(rot(mesh(cyl(0.04, 0.04, 2.2, 14), mat('#e9ebf2', 0.4)), 0, 0, Math.PI / 2), 0, -0.95, 0.14), [0.4, -0.3, 0.9]);
    return p.build();
  },
};

/* ─────────────── Casque audio ─────────────── */
const headphones: ModelDef = {
  id: 'headphones', category: 'tech', name: P('Casque audio', 'Headphones'),
  parts: { band: P('Arceau', 'Headband'), cups: P('Écouteurs', 'Ear cups'), cushions: P('Coussinets', 'Ear cushions'), cable: P('Câble', 'Cable') },
  keywords: ['casque', 'headphones', 'audio', 'headset', 'ecouteurs', 'beats', 'jbl'],
  build(accent = ACCENT) {
    const p = createProduct(['band', 'cups', 'cushions', 'cable']);
    const arc = new THREE.TorusGeometry(1.15, 0.07, 14, 40, Math.PI);
    p.add('band', at(mesh(arc, mat('#262833', 0.4, 0.5)), 0, 0.9, 0), [0, 0.9, 0]);
    const cup = (x: number) => at(rot(mesh(cyl(0.5, 0.5, 0.36, 40), mat(accent, 0.35, 0.4)), 0, 0, Math.PI / 2), x, 0.9, 0);
    p.add('cups', group(cup(-1.15), cup(1.15)), [0, 0, 0]);
    const cushion = (x: number) => at(rot(mesh(torus(0.4, 0.12, 14, 40), mat('#1d1f28', 0.9)), 0, Math.PI / 2, 0), x, 0.9, 0);
    p.add('cushions', group(cushion(-0.98), cushion(0.98)), [0, -0.6, 0.0]);
    p.add('cable', mesh(tube([[1.15, 0.5, 0], [1.2, 0.0, 0.1], [1.0, -0.3, 0.3], [0.7, -0.5, 0.5]], 0.04, false, 30), mat('#262833', 0.6)), [0.9, -0.6, 0.6]);
    return p.build();
  },
};

/* ─────────────── Montre connectée ─────────────── */
const smartwatch: ModelDef = {
  id: 'smartwatch', category: 'tech', name: P('Montre connectée', 'Smartwatch'),
  parts: { strap: P('Bracelet', 'Strap'), case: P('Boîtier', 'Case'), screen: P('Écran', 'Display'), crown: P('Couronne', 'Crown') },
  keywords: ['montre connectee', 'smartwatch', 'apple watch', 'bracelet connecte', 'fitness', 'tracker'],
  build(accent = ACCENT) {
    const p = createProduct(['strap', 'case', 'screen', 'crown']);
    const strap = new THREE.Group();
    strap.add(at(mesh(rbox(0.8, 1.5, 0.08, 0.04), mat('#23252e', 0.8)), 0, 1.15, -0.05));
    strap.add(at(mesh(rbox(0.8, 1.5, 0.08, 0.04), mat('#23252e', 0.8)), 0, -1.15, -0.05));
    p.add('strap', strap, [0, 0, -0.9]);
    p.add('case', mesh(rbox(1.1, 1.3, 0.3, 0.26), mat(ALU, 0.3, 0.9)), [0, 0, 0.1]);
    p.add('screen', at(mesh(rbox(0.9, 1.1, 0.04, 0.2), screenMat(accent)), 0, 0, 0.17), [0, 0, 1.1]);
    p.add('crown', at(rot(mesh(cyl(0.08, 0.08, 0.14, 20), mat(accent, 0.3, 0.6)), 0, 0, Math.PI / 2), 0.62, 0.25, 0), [0.7, 0.2, 0]);
    return p.build();
  },
};

/* ─────────────── Appareil photo ─────────────── */
const camera: ModelDef = {
  id: 'camera', category: 'tech', name: P('Appareil photo', 'Camera'),
  parts: { body: P('Boîtier', 'Body'), lens: P('Objectif', 'Lens'), flash: P('Flash', 'Flash'), dial: P('Molette et déclencheur', 'Dial and shutter') },
  keywords: ['appareil photo', 'camera', 'photo', 'reflex', 'canon', 'nikon', 'gopro', 'camescope'],
  build(accent = ACCENT) {
    const p = createProduct(['body', 'lens', 'flash', 'dial']);
    p.add('body', at(mesh(rbox(2.4, 1.4, 0.9, 0.14), mat('#24262f', 0.5, 0.4)), 0, 0.7, 0), [0, -0.1, -0.4]);
    const lens = new THREE.Group();
    lens.add(at(rot(mesh(cyl(0.62, 0.66, 0.7, 40), mat('#14151b', 0.4, 0.6)), Math.PI / 2, 0, 0), 0, 0.7, 0.75));
    lens.add(at(rot(mesh(cyl(0.5, 0.5, 0.2, 40), glass('#274a8a', 0.85)), Math.PI / 2, 0, 0), 0, 0.7, 1.15));
    lens.add(at(rot(mesh(torus(0.55, 0.05, 12, 40), mat(accent, 0.3, 0.7)), 0, 0, 0), 0, 0.7, 1.1));
    p.add('lens', lens, [0, 0, 1.6]);
    p.add('flash', at(mesh(rbox(0.5, 0.3, 0.3, 0.06), glass('#f4f4ff', 0.8)), -0.7, 1.55, 0.1), [-0.4, 1.0, 0]);
    p.add('dial', group(at(mesh(cyl(0.2, 0.2, 0.16, 24), mat(ALU, 0.3, 0.9)), 0.8, 1.48, 0), at(mesh(cyl(0.1, 0.1, 0.1, 20), mat('#e23b4e', 0.4)), 1.0, 1.45, 0.2)), [0.4, 1.0, 0.3]);
    return p.build();
  },
};

/* ─────────────── Enceinte Bluetooth ─────────────── */
const speaker: ModelDef = {
  id: 'speaker', category: 'tech', name: P('Enceinte Bluetooth', 'Bluetooth speaker'),
  parts: { body: P('Coque', 'Housing'), grille: P('Grille', 'Grille'), woofer: P('Haut-parleur', 'Speaker driver'), buttons: P('Commandes', 'Controls') },
  keywords: ['enceinte', 'speaker', 'bluetooth', 'haut parleur', 'sono', 'boombox', 'soundbar'],
  build(accent = ACCENT) {
    const p = createProduct(['body', 'grille', 'woofer', 'buttons']);
    p.add('body', at(rot(mesh(cyl(0.9, 0.9, 2.2, 48), mat('#23252e', 0.5, 0.2)), 0, 0, Math.PI / 2), 0, 0.9, 0), [0, -0.1, -0.5]);
    p.add('grille', at(rot(mesh(new THREE.CylinderGeometry(0.93, 0.93, 1.9, 48, 1, true, -1.0, 2.0), mat('#4a4d5c', 0.8, 0.3, THREE.DoubleSide)), 0, 0, Math.PI / 2), 0, 0.9, 0), [0, 0.0, 1.0]);
    p.add('woofer', at(rot(mesh(cyl(0.5, 0.42, 0.18, 40), mat('#1a1b21', 0.6)), Math.PI / 2, 0, 0), 0, 0.9, 0.82), [0, 0.2, 1.8]);
    p.add('buttons', group(
      at(mesh(cyl(0.1, 0.1, 0.06, 20), mat(accent, 0.4)), -0.5, 1.8, 0),
      at(mesh(cyl(0.1, 0.1, 0.06, 20), mat('#e9ebf2', 0.4)), 0, 1.8, 0),
      at(mesh(cyl(0.1, 0.1, 0.06, 20), mat('#e9ebf2', 0.4)), 0.5, 1.8, 0),
    ), [0, 1.0, 0]);
    return p.build();
  },
};

/* ─────────────── Écouteurs sans fil ─────────────── */
const earbuds: ModelDef = {
  id: 'earbuds', category: 'tech', name: P('Écouteurs sans fil', 'Wireless earbuds'),
  parts: { case: P('Boîtier de charge', 'Charging case'), lid: P('Couvercle', 'Lid'), buds: P('Écouteurs', 'Earbuds'), led: P('Voyant', 'Indicator') },
  keywords: ['airpods', 'earbuds', 'ecouteurs sans fil', 'ecouteur', 'oreillette', 'buds'],
  build(accent = ACCENT) {
    const p = createProduct(['case', 'lid', 'buds', 'led']);
    p.add('case', at(mesh(rbox(1.8, 0.8, 0.9, 0.34), mat('#f2f3f8', 0.35)), 0, 0.4, 0), [0, -0.3, 0]);
    p.add('lid', at(mesh(rbox(1.8, 0.45, 0.9, 0.3), mat('#e7e9f1', 0.35)), 0, 1.05, 0), [0, 0.9, -0.2]);
    const bud = (x: number) => group(at(mesh(sphere(0.2, 20, 16), mat('#ffffff', 0.3)), x, 0.7, 0), at(mesh(cyl(0.05, 0.05, 0.5, 12), mat('#ffffff', 0.3)), x, 0.4, 0));
    p.add('buds', group(bud(-0.4), bud(0.4)), [0, 0.7, 0.6]);
    p.add('led', at(mesh(sphere(0.05, 12, 10), mat(accent, 0.2)), 0, 0.5, 0.46), [0, 0.0, 1.2]);
    return p.build();
  },
};

export const TECH_MODELS: ModelDef[] = [smartphone, laptop, desktopPc, tablet, headphones, smartwatch, camera, speaker, earbuds];
