import * as THREE from 'three';
import { BRAND } from '../../../lib/theme';

/**
 * Chaussure construite entièrement en code (aucun modèle externe).
 * Repère : longueur le long de X (pointe vers +X), hauteur Y, largeur Z.
 */

export type PartKey = 'outsole' | 'midsole' | 'insole' | 'upper' | 'tongue' | 'laces' | 'caps';

/** Ordre de présentation. */
export const PART_ORDER: PartKey[] = ['outsole', 'midsole', 'insole', 'upper', 'tongue', 'laces', 'caps'];

export interface ShoeItem {
  group: PartKey;
  object: THREE.Object3D;
  /** Déplacement en vue éclatée. */
  explode: THREE.Vector3;
  materials: THREE.MeshStandardMaterial[];
}

/** Couleurs de chaque pièce (coloris). */
export interface ShoePalette {
  outsole: string; midsole: string; insole: string; upper: string;
  panel: string; collar: string; tongue: string; laces: string; caps: string;
}

export const DEFAULT_PALETTE: ShoePalette = {
  outsole: '#a9a9bb', midsole: '#f4f4f8', insole: '#c9c9d6', upper: '#efeff4',
  panel: BRAND.violet, collar: '#d3d3df', tongue: '#dcdce6', laces: BRAND.violetLight, caps: BRAND.violet,
};

/** Coloris proposés dans les cartes produits de la landing. */
export const COLORWAYS: Record<string, ShoePalette> = {
  violet: DEFAULT_PALETTE,
  noir: { ...DEFAULT_PALETTE, upper: '#2b2b36', panel: '#8a8a9c', collar: '#4a4a58', tongue: '#3a3a46', laces: '#f4f4f8', caps: '#8a8a9c', midsole: '#f4f4f8', outsole: '#d9d9e4' },
  sable: { ...DEFAULT_PALETTE, upper: '#eadfca', panel: '#b88a4a', collar: '#d8c7a6', tongue: '#e0d3b8', laces: '#8a6a3a', caps: '#b88a4a', outsole: '#c9b48e' },
  corail: { ...DEFAULT_PALETTE, upper: '#ffffff', panel: '#ff7a59', collar: '#ffd6c9', tongue: '#fff0eb', laces: '#ff7a59', caps: '#ff7a59' },
  ciel: { ...DEFAULT_PALETTE, upper: '#f2f8ff', panel: BRAND.cyan, collar: '#cfeaff', tongue: '#e3f3ff', laces: BRAND.cyan, caps: BRAND.cyan },
};

export interface Shoe {
  root: THREE.Group;
  items: ShoeItem[];
  dispose: () => void;
}

const LENGTH = 3;
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (a: number, b: number, x: number) => {
  const k = clamp01((x - a) / (b - a));
  return k * k * (3 - 2 * k);
};
const xAt = (t: number) => (t - 0.5) * LENGTH;

/** Demi-largeur du pied (t : 0 talon → 1 pointe). */
function halfWidth(t: number) {
  const e = Math.pow(Math.sin(Math.PI * clamp01(t)), 0.55);
  return 0.5 * e * (0.78 + 0.22 * smooth(0.05, 0.65, t)) * (1 - 0.1 * smooth(0.8, 1, t));
}

/** Hauteur de la tige. */
function upperHeight(t: number) {
  const h = 1.08 - 0.4 * smooth(0, 0.38, t) - 0.3 * smooth(0.45, 1, t);
  return h * (1 - 0.55 * smooth(0.9, 1, t));
}

/** Angle retiré au sommet (ouverture de la cheville et de l'empeigne). */
function gapAngle(t: number) {
  const ankle = 0.5 - 0.12 * smooth(0.2, 0.36, t);
  return ankle * (1 - smooth(0.7, 0.8, t));
}

const SIDE_POWER = 1;

function edgePoint(t: number, side: 1 | -1, lift = 0): THREE.Vector3 {
  const a = Math.PI / 2 - gapAngle(t);
  return new THREE.Vector3(
    xAt(t),
    upperHeight(t) * Math.pow(Math.sin(a), SIDE_POWER) + lift,
    side * halfWidth(t) * 0.97 * Math.cos(a),
  );
}

const clusteredT = (i: number, n: number, t0 = 0, t1 = 1) =>
  t0 + (t1 - t0) * (0.5 - 0.5 * Math.cos((Math.PI * i) / n));

/** Dalle (semelle) extrudée selon le contour du pied. */
function makeSlab(scale: number, depth: number, bevel: number) {
  const pts: THREE.Vector2[] = [];
  const n = 70;
  for (let i = 0; i <= n; i++) {
    const t = clusteredT(i, n);
    pts.push(new THREE.Vector2(xAt(t) * scale, halfWidth(t) * scale));
  }
  for (let i = n - 1; i > 0; i--) {
    const t = clusteredT(i, n);
    pts.push(new THREE.Vector2(xAt(t) * scale, -halfWidth(t) * scale));
  }
  const geo = new THREE.ExtrudeGeometry(new THREE.Shape(pts), {
    depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 1,
  });
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, bevel, 0);
  geo.computeVertexNormals();
  return { geo, height: depth + bevel * 2 };
}

interface ShellOptions {
  t0?: number; t1?: number;
  /** Fractions de l'angle disponible (0 = bas de la paroi, 1 = bord supérieur). */
  a0?: number; a1?: number;
  offset?: number;
}

/** Coque de la tige (deux parois symétriques, ouvertes sur le dessus). */
function makeShell({ t0 = 0, t1 = 1, a0 = 0, a1 = 1, offset = 0 }: ShellOptions = {}) {
  const nx = 56;
  const na = 16;
  const positions: number[] = [];
  const indices: number[] = [];
  let base = 0;
  for (const side of [1, -1] as const) {
    for (let i = 0; i <= nx; i++) {
      const t = clusteredT(i, nx, t0, t1);
      const aMax = Math.PI / 2 - gapAngle(t);
      const w = halfWidth(t) * 0.97 + offset;
      const h = upperHeight(t) + offset;
      for (let j = 0; j <= na; j++) {
        const a = aMax * (a0 + (a1 - a0) * (j / na));
        positions.push(
          xAt(t),
          h * Math.pow(Math.sin(a), SIDE_POWER),
          side * w * Math.cos(a),
        );
      }
    }
    for (let i = 0; i < nx; i++) {
      for (let j = 0; j < na; j++) {
        const p = base + i * (na + 1) + j;
        const q = p + na + 1;
        if (side === 1) indices.push(p, q, p + 1, q, q + 1, p + 1);
        else indices.push(p, p + 1, q, q, p + 1, q + 1);
      }
    }
    base += (nx + 1) * (na + 1);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/** Languette : bande bombée qui dépasse au-dessus de l'empeigne. */
function makeTongue() {
  const nu = 30;
  const nv = 12;
  const t0 = 0.24;
  const t1 = 0.74;
  const positions: number[] = [];
  const indices: number[] = [];
  for (let i = 0; i <= nu; i++) {
    const u = i / nu;
    const t = t0 + (t1 - t0) * u;
    const edge = edgePoint(t, 1);
    const w = edge.z + 0.045;
    const rise = 0.07 + 0.3 * Math.pow(1 - u, 2.2);
    for (let j = 0; j <= nv; j++) {
      const v = (j / nv) * 2 - 1;
      positions.push(xAt(t) - 0.12 * Math.pow(1 - u, 2), edge.y + rise - 0.05 * v * v, v * w);
    }
  }
  for (let i = 0; i < nu; i++) {
    for (let j = 0; j < nv; j++) {
      const p = i * (nv + 1) + j;
      const q = p + nv + 1;
      indices.push(p, q, p + 1, q, q + 1, p + 1);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/** Lacets croisés. */
function makeLaces(material: THREE.Material) {
  const group = new THREE.Group();
  const rows = [0.34, 0.41, 0.48, 0.55, 0.62, 0.69];
  const lift = 0.1;
  for (let i = 0; i < rows.length - 1; i++) {
    for (const side of [1, -1] as const) {
      const from = edgePoint(rows[i], side, 0.01);
      const to = edgePoint(rows[i + 1], -side as 1 | -1, 0.01);
      const mid = from.clone().lerp(to, 0.5);
      mid.y += lift;
      mid.z = 0;
      const c = new THREE.CatmullRomCurve3([
        from,
        from.clone().lerp(mid, 0.55).add(new THREE.Vector3(0, 0.035, 0)),
        mid,
        to.clone().lerp(mid, 0.55).add(new THREE.Vector3(0, 0.035, 0)),
        to,
      ]);
      group.add(new THREE.Mesh(new THREE.TubeGeometry(c, 20, 0.017, 8), material));
    }
  }
  // Nœud
  const knotAt = edgePoint(0.72, 1, 0.12);
  knotAt.z = 0;
  for (const s of [1, -1] as const) {
    const c = new THREE.CatmullRomCurve3([
      knotAt.clone(),
      knotAt.clone().add(new THREE.Vector3(0.12, 0.12, s * 0.12)),
      knotAt.clone().add(new THREE.Vector3(0.28, 0.04, s * 0.2)),
      knotAt.clone().add(new THREE.Vector3(0.2, -0.02, s * 0.05)),
      knotAt.clone(),
    ]);
    group.add(new THREE.Mesh(new THREE.TubeGeometry(c, 24, 0.02, 8), material));
  }
  return group;
}

function mat(color: string, roughness: number, metalness = 0, side: THREE.Side = THREE.FrontSide) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness, side, emissive: '#ffffff', emissiveIntensity: 0 });
}

export function buildShoe(palette: ShoePalette = DEFAULT_PALETTE): Shoe {
  const root = new THREE.Group();
  const items: ShoeItem[] = [];
  const disposables: { dispose: () => void }[] = [];

  const add = (group: PartKey, object: THREE.Object3D, explode: THREE.Vector3, materials: THREE.MeshStandardMaterial[]) => {
    root.add(object);
    items.push({ group, object, explode, materials });
  };
  const keep = <T extends { dispose: () => void }>(x: T) => { disposables.push(x); return x; };

  // Semelle extérieure
  const outsole = makeSlab(1, 0.04, 0.025);
  const mOutsole = mat(palette.outsole, 0.9);
  const outsoleMesh = new THREE.Mesh(keep(outsole.geo), mOutsole);
  add('outsole', outsoleMesh, new THREE.Vector3(0, -1.2, 0), [mOutsole]);

  // Semelle intermédiaire
  const midsole = makeSlab(0.985, 0.14, 0.03);
  const mMid = mat(palette.midsole, 0.5);
  const midMesh = new THREE.Mesh(keep(midsole.geo), mMid);
  midMesh.position.y = outsole.height - 0.02;
  add('midsole', midMesh, new THREE.Vector3(0, -0.7, 0), [mMid]);

  const baseY = midMesh.position.y + midsole.height - 0.02;

  // Semelle de confort
  const insole = makeSlab(0.9, 0.012, 0.012);
  const mIn = mat(palette.insole, 0.85);
  const inMesh = new THREE.Mesh(keep(insole.geo), mIn);
  inMesh.position.y = baseY - 0.05;
  add('insole', inMesh, new THREE.Vector3(0, -0.25, 0), [mIn]);

  // Tige (+ panneau latéral aux couleurs de la marque)
  const upper = new THREE.Group();
  const mUpper = mat(palette.upper, 0.78, 0, THREE.DoubleSide);
  const mPanel = mat(palette.panel, 0.6, 0, THREE.DoubleSide);
  upper.add(new THREE.Mesh(keep(makeShell()), mUpper));
  upper.add(new THREE.Mesh(keep(makeShell({ t0: 0.3, t1: 0.62, a0: 0.2, a1: 0.62, offset: 0.012 })), mPanel));
  const collarPts: THREE.Vector3[] = [];
  for (let i = 0; i <= 14; i++) collarPts.push(edgePoint(0.3 - 0.3 * (i / 14), 1, 0.005));
  for (let i = 1; i <= 14; i++) collarPts.push(edgePoint(0.3 * (i / 14), -1, 0.005));
  const mCollar = mat(palette.collar, 0.8);
  upper.add(new THREE.Mesh(keep(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(collarPts), 80, 0.05, 10)), mCollar));
  upper.position.y = baseY;
  add('upper', upper, new THREE.Vector3(0, 0.3, 0), [mUpper, mPanel, mCollar]);

  // Languette
  const mTongue = mat(palette.tongue, 0.85, 0, THREE.DoubleSide);
  const tongue = new THREE.Mesh(keep(makeTongue()), mTongue);
  tongue.position.y = baseY;
  add('tongue', tongue, new THREE.Vector3(0, 1.55, 0), [mTongue]);

  // Lacets
  const mLace = mat(palette.laces, 0.55);
  const laces = makeLaces(mLace);
  laces.traverse(o => { if ((o as THREE.Mesh).geometry) keep((o as THREE.Mesh).geometry); });
  laces.position.y = baseY;
  add('laces', laces, new THREE.Vector3(0, 2.05, 0), [mLace]);

  // Renforts : embout et contrefort
  const mCap = mat(palette.caps, 0.55, 0, THREE.DoubleSide);
  const toe = new THREE.Mesh(keep(makeShell({ t0: 0.77, t1: 1, offset: 0.014 })), mCap);
  toe.position.y = baseY;
  add('caps', toe, new THREE.Vector3(0.45, 0.95, 0), [mCap]);
  const mCap2 = mat(palette.caps, 0.55, 0, THREE.DoubleSide);
  const heel = new THREE.Mesh(keep(makeShell({ t0: 0, t1: 0.25, a1: 0.7, offset: 0.014 })), mCap2);
  heel.position.y = baseY;
  add('caps', heel, new THREE.Vector3(-0.45, 0.95, 0), [mCap2]);

  root.position.y = 0;

  return {
    root,
    items,
    dispose() {
      disposables.forEach(d => d.dispose());
      items.forEach(i => i.materials.forEach(m => m.dispose()));
    },
  };
}
