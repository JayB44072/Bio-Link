import * as THREE from 'three';
import { at, createProduct, cyl, group, mat, mesh, rbox, sphere, torus, tube } from '../kit';
import type { Product3D } from '../types';

/* ──────────────────────────────────────────────────────────────────────────
   Générateur de chaussures paramétrable.
   Repère : longueur le long de X (pointe vers +X), hauteur Y, largeur Z.
   ────────────────────────────────────────────────────────────────────────── */

export type ToeShape = 'round' | 'point' | 'square';
export type HeelKind = 'flat' | 'block' | 'stiletto' | 'wedge' | 'platform' | 'kitten';
export type UpperStyle = 'shell' | 'straps' | 'slide' | 'thong' | 'clog';
export type Closure = 'laces' | 'velcro' | 'buckle' | 'none' | 'zip' | 'elastic' | 'bow' | 'tassel' | 'strap';
export type Detail = 'toecap' | 'heelcounter' | 'panel' | 'tab' | 'stitch' | 'cleats' | 'lugs' | 'brogue' | 'fringe' | 'bandline' | 'fur' | 'platformSole';

export interface FootwearColors {
  upper: string; accent: string; outsole: string; midsole: string; insole: string; lace: string; lining: string;
}

export interface FootwearSpec {
  upper: UpperStyle;
  /** Hauteur de la tige (1 = basket basse). */
  height: number;
  toe: ToeShape;
  /** Épaisseur de la semelle (1 = basket). */
  sole: number;
  heel: HeelKind;
  /** Hauteur du talon (unités de scène) pour les talons. */
  heelH: number;
  closure: Closure;
  details: Detail[];
  /** Ouverture au cou-de-pied en radians (0 = fermé, 0.7 = très ouvert). */
  collarGap: number;
  /** Où commence l'empeigne fermée (0.5 = mocassin, 0.72 = lacets). */
  vampStart: number;
  /** Largeur relative du pied. */
  width: number;
  colors: FootwearColors;
  /** Noms des pièces (facultatif, sinon génériques). */
  labels?: Partial<Record<'outsole' | 'midsole' | 'insole' | 'upper' | 'closure' | 'details', { fr: string; en: string }>>;
}

const L = 3;
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (a: number, b: number, x: number) => { const k = clamp01((x - a) / (b - a)); return k * k * (3 - 2 * k); };
const xAt = (t: number) => (t - 0.5) * L;
const clustered = (i: number, n: number, t0 = 0, t1 = 1) => t0 + (t1 - t0) * (0.5 - 0.5 * Math.cos((Math.PI * i) / n));

export const DEFAULT_SPEC: Omit<FootwearSpec, 'colors'> = {
  upper: 'shell', height: 1, toe: 'round', sole: 1, heel: 'flat', heelH: 0, closure: 'laces',
  details: [], collarGap: 0.5, vampStart: 0.72, width: 1,
};

/** Forme du pied et de la tige déduite d'une fiche. */
function shapeOf(s: FootwearSpec) {
  const toeExp = s.toe === 'square' ? 0.17 : s.toe === 'point' ? 0.8 : 0.36;
  const heelExp = s.heel === 'stiletto' || s.heel === 'kitten' ? 0.6 : 0.42;
  const taper = s.toe === 'point' ? 0.35 : 0;
  const halfWidth = (t: number) => {
    const e = Math.pow(Math.sin(Math.PI * clamp01(t)), t < 0.5 ? heelExp : toeExp);
    return 0.5 * s.width * e * (0.78 + 0.22 * smooth(0.05, 0.65, t)) * (1 - 0.1 * smooth(0.8, 1, t)) * (1 - taper * smooth(0.55, 1, t));
  };
  const upperHeight = (t: number) => {
    const base = 1.08 - 0.4 * smooth(0, 0.38, t) - 0.3 * smooth(0.45, 1, t);
    // les bottes gardent la tige haute jusqu'à la cheville
    const shaft = s.height > 1.2 ? (s.height - 1) * 0.9 * (1 - smooth(0.0, 0.42, t)) : 0;
    return (base * s.height + shaft) * (1 - 0.55 * smooth(0.9, 1, t));
  };
  const gap = (t: number) => {
    const ankle = s.collarGap - 0.12 * smooth(0.2, 0.36, t) * (s.collarGap > 0.3 ? 1 : 0);
    return ankle * (1 - smooth(s.vampStart - 0.02, s.vampStart + 0.1, t));
  };
  return { halfWidth, upperHeight, gap };
}

type Shape = ReturnType<typeof shapeOf>;

function slab(shape: Shape, scale: number, depth: number, bevel: number) {
  const pts: THREE.Vector2[] = [];
  const n = 64;
  for (let i = 0; i <= n; i++) { const t = clustered(i, n); pts.push(new THREE.Vector2(xAt(t) * scale, shape.halfWidth(t) * scale)); }
  for (let i = n - 1; i > 0; i--) { const t = clustered(i, n); pts.push(new THREE.Vector2(xAt(t) * scale, -shape.halfWidth(t) * scale)); }
  const geo = new THREE.ExtrudeGeometry(new THREE.Shape(pts), { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 1 });
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, bevel, 0);
  geo.computeVertexNormals();
  return { geo, height: depth + bevel * 2 };
}

interface ShellOptions { t0?: number; t1?: number; a0?: number; a1?: number; offset?: number; closeTop?: boolean }

/** Coque de tige : deux parois symétriques ouvertes au sommet (ou bande si `closeTop`). */
function shell(shape: Shape, { t0 = 0, t1 = 1, a0 = 0, a1 = 1, offset = 0, closeTop = false }: ShellOptions = {}) {
  const nx = 48, na = 14;
  const pos: number[] = [];
  const idx: number[] = [];
  let base = 0;
  for (const side of [1, -1] as const) {
    for (let i = 0; i <= nx; i++) {
      const t = clustered(i, nx, t0, t1);
      const aMax = Math.PI / 2 - (closeTop ? 0 : shape.gap(t));
      const w = shape.halfWidth(t) * 0.97 + offset;
      const h = shape.upperHeight(t) + offset;
      for (let j = 0; j <= na; j++) {
        const a = aMax * (a0 + (a1 - a0) * (j / na));
        pos.push(xAt(t), h * Math.sin(a), side * w * Math.cos(a));
      }
    }
    for (let i = 0; i < nx; i++) for (let j = 0; j < na; j++) {
      const p = base + i * (na + 1) + j, q = p + na + 1;
      if (side === 1) idx.push(p, q, p + 1, q, q + 1, p + 1); else idx.push(p, p + 1, q, q, p + 1, q + 1);
    }
    base += (nx + 1) * (na + 1);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

function edgePoint(shape: Shape, t: number, side: 1 | -1, lift = 0) {
  const a = Math.PI / 2 - shape.gap(t);
  return new THREE.Vector3(xAt(t), shape.upperHeight(t) * Math.sin(a) + lift, side * shape.halfWidth(t) * 0.97 * Math.cos(a));
}

/** Languette. */
function tongue(shape: Shape, t0: number, t1: number) {
  const nu = 26, nv = 10;
  const pos: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i <= nu; i++) {
    const u = i / nu;
    const t = t0 + (t1 - t0) * u;
    const e = edgePoint(shape, t, 1);
    const w = e.z + 0.045;
    const rise = 0.07 + 0.3 * Math.pow(1 - u, 2.2);
    for (let j = 0; j <= nv; j++) {
      const v = (j / nv) * 2 - 1;
      pos.push(xAt(t) - 0.12 * Math.pow(1 - u, 2), e.y + rise - 0.05 * v * v, v * w);
    }
  }
  for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) { const p = i * (nv + 1) + j, q = p + nv + 1; idx.push(p, q, p + 1, q, q + 1, p + 1); }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

function laces(shape: Shape, rows: number[], material: THREE.Material, lift = 0.1) {
  const g = new THREE.Group();
  for (let i = 0; i < rows.length - 1; i++) for (const side of [1, -1] as const) {
    const from = edgePoint(shape, rows[i], side, 0.01);
    const to = edgePoint(shape, rows[i + 1], -side as 1 | -1, 0.01);
    const mid = from.clone().lerp(to, 0.5); mid.y += lift; mid.z = 0;
    const c = new THREE.CatmullRomCurve3([from, from.clone().lerp(mid, 0.55).add(new THREE.Vector3(0, 0.035, 0)), mid, to.clone().lerp(mid, 0.55).add(new THREE.Vector3(0, 0.035, 0)), to]);
    g.add(mesh(new THREE.TubeGeometry(c, 16, 0.017, 6), material));
  }
  return g;
}

/** Bande qui enjambe le pied (sangle). */
function strap(shape: Shape, t: number, width: number, material: THREE.Material, lift = 0.02, thick = 0.03) {
  return mesh(shell(shape, { t0: t, t1: t + width, closeTop: true, offset: thick + lift }), material);
}

/** Une fermeture n'est présentée que si la chaussure en a une. */
const hasClosure = (spec: FootwearSpec) => (spec.upper === 'shell' ? spec.closure !== 'none' : true);

/** Pièces présentées pour une fiche donnée, dans l'ordre. */
export function footwearGroups(spec: FootwearSpec): string[] {
  const g = ['outsole', 'midsole', 'insole', 'upper'];
  if (hasClosure(spec)) g.push('closure');
  if (spec.details.length > 0) g.push('details');
  return g;
}

/** Construit une chaussure d'après sa fiche. Les pièces sont : outsole, midsole, insole, upper, closure, details. */
export function buildFootwear(spec: FootwearSpec): Product3D {
  const c = spec.colors;
  const shape = shapeOf(spec);
  const p = createProduct(footwearGroups(spec));

  const heeled = spec.heel !== 'flat' && spec.heel !== 'platform';
  const soleK = spec.sole;
  const outsole = slab(shape, 1, 0.035 * soleK, 0.022);
  const midDepth = spec.heel === 'platform' ? 0.3 : spec.upper === 'slide' || spec.upper === 'thong' ? 0.07 : 0.13 * soleK;
  const midsole = slab(shape, 0.985, midDepth, 0.028);

  const mOut = mat(c.outsole, 0.9);
  const mMid = mat(c.midsole, 0.55);
  const outsoleMesh = mesh(outsole.geo, mOut);
  const midMesh = mesh(midsole.geo, mMid);
  midMesh.position.y = outsole.height - 0.02;
  const baseY = midMesh.position.y + midsole.height - 0.02;

  const mIn = mat(c.insole, 0.85);
  const insole = slab(shape, 0.9, 0.012, 0.012);
  const inMesh = mesh(insole.geo, mIn);
  inMesh.position.y = baseY - 0.05;

  const mUpper = mat(c.upper, 0.72, 0, THREE.DoubleSide);
  const mAccent = mat(c.accent, 0.55, 0, THREE.DoubleSide);
  const mLace = mat(c.lace, 0.6);
  const mLining = mat(c.lining, 0.8, 0, THREE.DoubleSide);

  const upperG = new THREE.Group();
  const closureG = new THREE.Group();
  const detailsG = new THREE.Group();

  if (spec.upper === 'shell') {
    upperG.add(mesh(shell(shape), mUpper));
    // doublure visible à l'intérieur de la cheville
    const collar = [] as Array<[number, number, number]>;
    for (let i = 0; i <= 12; i++) { const e = edgePoint(shape, 0.28 - 0.28 * (i / 12), 1, 0.005); collar.push([e.x, e.y, e.z]); }
    for (let i = 1; i <= 12; i++) { const e = edgePoint(shape, 0.28 * (i / 12), -1, 0.005); collar.push([e.x, e.y, e.z]); }
    upperG.add(mesh(tube(collar, spec.closure === 'elastic' ? 0.03 : 0.045, false, 70), mLining));
  } else if (spec.upper === 'straps') {
    // sandale : bandes sur l'avant-pied et le cou-de-pied
    upperG.add(strap(shape, 0.56, 0.07, mUpper));
    upperG.add(strap(shape, 0.4, 0.06, mUpper));
  } else if (spec.upper === 'slide') {
    upperG.add(strap(shape, 0.5, 0.22, mUpper, 0.0, 0.05));
  } else if (spec.upper === 'thong') {
    const post = [[xAt(0.78), 0.02, 0], [xAt(0.66), 0.17, 0], [xAt(0.55), 0.2, 0]] as Array<[number, number, number]>;
    upperG.add(mesh(tube(post, 0.035, false, 20), mUpper));
    for (const side of [1, -1] as const) {
      const w = shape.halfWidth(0.5) * 0.95;
      upperG.add(mesh(tube([[xAt(0.55), 0.2, 0], [xAt(0.5), 0.14, side * w * 0.6], [xAt(0.46), 0.02, side * w]], 0.035, false, 20), mUpper));
    }
  } else if (spec.upper === 'clog') {
    upperG.add(mesh(shell(shape, { t0: 0.25, t1: 1 }), mUpper));
  }

  // Fermeture
  if (spec.upper === 'shell') {
    if (spec.closure === 'laces') {
      closureG.add(mesh(tongue(shape, 0.24, 0.74), mAccent));
      const rows = spec.height > 1.2 ? [0.3, 0.37, 0.44, 0.51, 0.58, 0.65, 0.72] : [0.34, 0.41, 0.48, 0.55, 0.62, 0.69];
      closureG.add(laces(shape, rows, mLace));
    } else if (spec.closure === 'velcro') {
      closureG.add(mesh(tongue(shape, 0.3, 0.7), mAccent));
      for (const t of [0.4, 0.52, 0.64]) closureG.add(strap(shape, t, 0.07, mLace, 0.015, 0.02));
    } else if (spec.closure === 'buckle') {
      closureG.add(strap(shape, 0.48, 0.08, mAccent, 0.02, 0.025));
      const e = edgePoint(shape, 0.52, 1, 0.05);
      closureG.add(at(mesh(torus(0.07, 0.014), mat('#cfcfd8', 0.25, 0.9)), e.x, e.y + 0.06, e.z + 0.05));
    } else if (spec.closure === 'zip') {
      const pts: Array<[number, number, number]> = [];
      for (let i = 0; i <= 14; i++) { const t = 0.46 - 0.4 * (i / 14); const e = edgePoint(shape, t, 1, 0.02); pts.push([e.x, e.y * 0.8, e.z + 0.03]); }
      closureG.add(mesh(tube(pts, 0.018), mat('#cfcfd8', 0.3, 0.9)));
    } else if (spec.closure === 'elastic') {
      for (const side of [1, -1] as const) {
        closureG.add(mesh(shell(shape, { t0: 0.18, t1: 0.34, a0: 0.2, a1: 0.8, offset: 0.012 }), mAccent));
        void side;
      }
    } else if (spec.closure === 'bow') {
      const e = edgePoint(shape, 0.7, 1, 0.1);
      for (const s of [1, -1] as const) closureG.add(at(mesh(sphere(0.085, 20, 14), mAccent), e.x, e.y + 0.02, 0.1 * s));
      closureG.add(at(mesh(sphere(0.05, 16, 12), mAccent), e.x, e.y + 0.02, 0));
    } else if (spec.closure === 'tassel') {
      const e = edgePoint(shape, 0.6, 1, 0.08);
      closureG.add(at(mesh(cyl(0.03, 0.05, 0.16, 16), mAccent), e.x, e.y, 0.1));
      closureG.add(at(mesh(cyl(0.03, 0.05, 0.16, 16), mAccent), e.x, e.y, -0.1));
    } else if (spec.closure === 'strap') {
      closureG.add(strap(shape, 0.2, 0.06, mAccent, 0.02, 0.025));
    }
  } else if (spec.upper === 'straps') {
    // sangle de cheville + boucle
    closureG.add(strap(shape, 0.12, 0.05, mAccent, 0.03, 0.025));
    const e = edgePoint(shape, 0.14, 1, 0.1);
    closureG.add(at(mesh(torus(0.06, 0.012), mat('#cfcfd8', 0.25, 0.9)), e.x, e.y + 0.05, e.z + 0.04));
  } else if (spec.upper === 'slide' || spec.upper === 'thong') {
    closureG.add(at(mesh(sphere(0.05, 16, 12), mAccent), xAt(0.78), 0.06, 0));
  } else if (spec.upper === 'clog') {
    closureG.add(strap(shape, 0.22, 0.05, mAccent, 0.02, 0.02));
  }

  // Détails
  for (const d of spec.details) {
    if (d === 'toecap') detailsG.add(mesh(shell(shape, { t0: 0.78, t1: 1, offset: 0.014 }), mAccent));
    if (d === 'heelcounter') detailsG.add(mesh(shell(shape, { t0: 0, t1: 0.25, a1: 0.7, offset: 0.014 }), mAccent));
    if (d === 'panel') detailsG.add(mesh(shell(shape, { t0: 0.3, t1: 0.62, a0: 0.2, a1: 0.62, offset: 0.012 }), mAccent));
    if (d === 'bandline') detailsG.add(mesh(shell(shape, { t0: 0.05, t1: 0.95, a0: 0.1, a1: 0.18, offset: 0.012 }), mAccent));
    if (d === 'tab') {
      detailsG.add(at(mesh(rbox(0.05, 0.22, 0.05, 0.015), mAccent), xAt(0.02), shape.upperHeight(0.02) * 0.9, 0));
    }
    if (d === 'stitch') {
      const pts: Array<[number, number, number]> = [];
      for (let i = 0; i <= 30; i++) { const t = 0.12 + 0.76 * (i / 30); pts.push([xAt(t), shape.upperHeight(t) * 0.35, shape.halfWidth(t) * 0.97 + 0.012]); }
      detailsG.add(mesh(tube(pts, 0.008), mLace));
      detailsG.add(mesh(tube(pts.map(([x, y, z]) => [x, y, -z] as [number, number, number]), 0.008), mLace));
    }
    if (d === 'brogue') {
      for (let i = 0; i < 9; i++) {
        const t = 0.8 + 0.017 * i;
        for (const s of [1, -1] as const) detailsG.add(at(mesh(sphere(0.012, 8, 6), mLace), xAt(t), shape.upperHeight(t) * 0.95, s * shape.halfWidth(t) * 0.35 * (1 - i * 0.05)));
      }
    }
    if (d === 'fringe') {
      for (let i = 0; i < 9; i++) detailsG.add(at(mesh(cyl(0.012, 0.012, 0.12, 6), mAccent), xAt(0.5 + i * 0.012) , 0.08, 0.08 * (i - 4) * 0.35));
    }
    if (d === 'fur') {
      const pts: Array<[number, number, number]> = [];
      for (let i = 0; i <= 22; i++) { const e = edgePoint(shape, 0.3 - 0.3 * (i / 22), 1, 0.01); pts.push([e.x, e.y, e.z]); }
      for (let i = 1; i <= 22; i++) { const e = edgePoint(shape, 0.3 * (i / 22), -1, 0.01); pts.push([e.x, e.y, e.z]); }
      detailsG.add(mesh(tube(pts, 0.1, false, 60), mat('#f4efe6', 0.95)));
    }
    if (d === 'cleats') {
      for (const t of [0.12, 0.3, 0.62, 0.78]) for (const s of [1, -1] as const) {
        const cone = mesh(cyl(0.015, 0.045, 0.1, 12), mat('#222230', 0.6));
        detailsG.add(at(cone, xAt(t), -0.1, s * shape.halfWidth(t) * 0.5));
      }
    }
    if (d === 'lugs') {
      for (let i = 0; i < 9; i++) for (const s of [1, -1] as const) detailsG.add(at(mesh(rbox(0.12, 0.05, 0.16, 0.012), mOut), xAt(0.1 + i * 0.1), -0.02, s * shape.halfWidth(0.1 + i * 0.1) * 0.45));
    }
    if (d === 'platformSole') detailsG.add(at(mesh(rbox(L * 0.86, 0.04, 0.6, 0.02), mAccent), 0, midsole.height * 0.5 + 0.1, 0));
  }

  upperG.position.y = baseY;
  closureG.position.y = baseY;
  detailsG.position.y = baseY;

  // Talons : le pied est incliné (talon en haut, pointe au sol) et la pièce du talon est placée dessous
  let heelObj: THREE.Object3D | null = null;
  let tilt = 0;
  let lift = 0;
  if (heeled && spec.heelH > 0) {
    const hh = spec.heelH;
    const hx = xAt(0.14);
    if (spec.heel === 'wedge') {
      const top = 0.05;
      tilt = Math.atan((hh - top) / L);
      lift = (hh + top) / 2 + 0.03;
      const sh = new THREE.Shape();
      sh.moveTo(-L / 2, 0); sh.lineTo(L / 2, 0); sh.lineTo(L / 2, top); sh.lineTo(-L / 2, hh); sh.closePath();
      const g = new THREE.ExtrudeGeometry(sh, { depth: 0.8 * spec.width, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 2 });
      g.translate(0, 0, -0.4 * spec.width);
      heelObj = mesh(g, mat(c.midsole, 0.7));
    } else {
      tilt = Math.asin(Math.min(0.9, hh / (L / 2 - hx)));
      lift = (L / 2) * Math.sin(tilt) + 0.04;
      const colH = hh + 0.04;
      if (spec.heel === 'stiletto') heelObj = at(mesh(cyl(0.03, 0.065, colH, 20), mat(c.outsole, 0.4, 0.2)), hx, colH / 2, 0);
      else if (spec.heel === 'kitten') heelObj = at(mesh(cyl(0.045, 0.075, colH, 20), mat(c.outsole, 0.4, 0.2)), hx, colH / 2, 0);
      else heelObj = at(mesh(rbox(0.42, colH, 0.42, 0.04), mat(c.outsole, 0.55)), hx + 0.02, colH / 2, 0);
    }
  }
  const tilted = <T extends THREE.Object3D>(o: T): T => {
    if (tilt) { o.rotation.z = -tilt; o.position.y += lift; }
    return o;
  };

  p.add('outsole', tilted(group(outsoleMesh)), [0, -1.0 - lift * 0.5, 0]);
  const midItems = group(tilted(group(midMesh)));
  if (heelObj) midItems.add(heelObj);
  p.add('midsole', midItems, [0, -0.62 - lift * 0.3, 0]);
  p.add('insole', tilted(group(inMesh)), [0, -0.22, 0]);
  p.add('upper', tilted(upperG), [0, 0.35 + lift * 0.2, 0]);
  if (hasClosure(spec)) p.add('closure', tilted(closureG), [0, 1.0 + lift * 0.3, 0]);
  if (spec.details.length > 0) p.add('details', tilted(detailsG), [0.6, 0.7 + lift * 0.3, 0.5]);
  return p.build();
}
