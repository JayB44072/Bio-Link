import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import type { Product3D, ProductItem } from './types';

/** Matériau standard, prêt pour l'atténuation et la mise en valeur d'une pièce. */
export function mat(color: string, roughness = 0.6, metalness = 0, side: THREE.Side = THREE.FrontSide): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness, side, emissive: '#ffffff', emissiveIntensity: 0 });
}

/** Verre / plastique translucide. */
export function glass(color: string, opacity = 0.35): THREE.MeshStandardMaterial {
  const m = mat(color, 0.08, 0.1, THREE.DoubleSide);
  m.transparent = true;
  m.opacity = opacity;
  (m.userData as { baseOpacity?: number }).baseOpacity = opacity;
  return m;
}

export const mesh = (geo: THREE.BufferGeometry, material: THREE.Material) => new THREE.Mesh(geo, material);

/** Boîte aux angles arrondis. */
export const rbox = (w: number, h: number, d: number, r = 0.05, seg = 4) => new RoundedBoxGeometry(w, h, d, seg, Math.min(r, w / 2, h / 2, d / 2));
export const cyl = (rTop: number, rBottom: number, h: number, seg = 48) => new THREE.CylinderGeometry(rTop, rBottom, h, seg);
export const sphere = (r: number, w = 32, h = 24) => new THREE.SphereGeometry(r, w, h);
export const torus = (r: number, tube: number, radial = 16, tubular = 48) => new THREE.TorusGeometry(r, tube, radial, tubular);

/** Solide de révolution à partir d'un profil [rayon, hauteur]. */
export function lathe(profile: Array<[number, number]>, seg = 56) {
  return new THREE.LatheGeometry(profile.map(([x, y]) => new THREE.Vector2(x, y)), seg);
}

/** Forme 2D extrudée (épaisseur sur Z), avec léger biseau. */
export function extrude(shape: THREE.Shape, depth: number, bevel = 0.012) {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, curveSegments: 12 });
  g.translate(0, 0, -depth / 2);
  return g;
}

/** Rectangle arrondi 2D (pour `extrude`). */
export function roundedRectShape(w: number, h: number, r: number) {
  const s = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

/** Forme 2D à partir d'une suite de points. */
export function polyShape(points: Array<[number, number]>) {
  const s = new THREE.Shape();
  points.forEach(([x, y], i) => (i === 0 ? s.moveTo(x, y) : s.lineTo(x, y)));
  s.closePath();
  return s;
}

/** Tube qui suit une courbe passant par des points. */
export function tube(points: Array<[number, number, number]>, radius: number, closed = false, seg = 40) {
  const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)), closed);
  return new THREE.TubeGeometry(curve, seg, radius, 10, closed);
}

/** UV planaires (0..1 sur la boîte englobante, plan XY) : permet d'appliquer une image sur une forme extrudée. */
export function planarUV(geo: THREE.BufferGeometry) {
  geo.computeBoundingBox();
  const bb = geo.boundingBox!;
  const w = Math.max(1e-6, bb.max.x - bb.min.x);
  const h = Math.max(1e-6, bb.max.y - bb.min.y);
  const pos = geo.getAttribute('position');
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    uv[i * 2] = (pos.getX(i) - bb.min.x) / w;
    uv[i * 2 + 1] = (pos.getY(i) - bb.min.y) / h;
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
}

/** Comment la photo recouvre la cible : `plane` = face plane (recadrée), `wrap` = enroulée autour d'un cylindre. */
export type PhotoFit = 'plane' | 'wrap';

/** Marque une pièce comme zone qui peut recevoir la photo du vendeur (imprimé, étiquette, écran). */
export function photoTarget<T extends THREE.Mesh>(m: T, fit: PhotoFit = 'plane', planar = false): T {
  if (planar) planarUV(m.geometry);
  m.userData.photoTarget = fit;
  return m;
}
/** Place un objet. */
export function at<T extends THREE.Object3D>(o: T, x = 0, y = 0, z = 0): T {
  o.position.set(x, y, z);
  return o;
}

export function rot<T extends THREE.Object3D>(o: T, x = 0, y = 0, z = 0): T {
  o.rotation.set(x, y, z);
  return o;
}

/** Réunit plusieurs objets en un seul. */
export function group(...children: THREE.Object3D[]) {
  const g = new THREE.Group();
  children.forEach(c => g.add(c));
  return g;
}

/** Tous les matériaux standard d'un objet. */
function collectMaterials(o: THREE.Object3D): THREE.MeshStandardMaterial[] {
  const set = new Set<THREE.MeshStandardMaterial>();
  o.traverse(c => {
    const m = (c as THREE.Mesh).material;
    if (!m) return;
    (Array.isArray(m) ? m : [m]).forEach(x => { if ((x as THREE.MeshStandardMaterial).isMeshStandardMaterial) set.add(x as THREE.MeshStandardMaterial); });
  });
  return [...set];
}

/**
 * Assemble un produit pièce par pièce.
 * `add(groupe, objet, [dx, dy, dz])` : `groupe` est le nom de la pièce présentée,
 * le vecteur donne son déplacement en vue éclatée.
 */
export function createProduct(groups: string[]) {
  const root = new THREE.Group();
  const items: ProductItem[] = [];
  return {
    root,
    add(groupKey: string, object: THREE.Object3D, explode: [number, number, number] = [0, 0, 0]) {
      root.add(object);
      items.push({ group: groupKey, object, explode: new THREE.Vector3(...explode), materials: collectMaterials(object) });
      return object;
    },
    build(): Product3D {
      return {
        root, items, groups,
        dispose() {
          const geos = new Set<THREE.BufferGeometry>();
          const mats = new Set<THREE.Material>();
          root.traverse(c => {
            const m = c as THREE.Mesh;
            if (m.geometry) geos.add(m.geometry);
            if (m.material) (Array.isArray(m.material) ? m.material : [m.material]).forEach(x => mats.add(x));
          });
          geos.forEach(g => g.dispose());
          mats.forEach(x => {
            // Textures (photo du vendeur, écrans) : libérées avec le matériau
            const t = x as THREE.MeshStandardMaterial;
            t.map?.dispose();
            t.emissiveMap?.dispose();
            x.dispose();
          });
        },
      };
    },
  };
}

/** Décale le produit pour que sa base repose sur y = 0 et qu'il soit centré sur X / Z. */
export function groundAndCenter(root: THREE.Object3D) {
  const box = new THREE.Box3().setFromObject(root);
  if (box.isEmpty()) return;
  const c = box.getCenter(new THREE.Vector3());
  root.children.forEach(ch => { ch.position.x -= c.x; ch.position.z -= c.z; ch.position.y -= box.min.y; });
}

/**
 * Met le produit à l'échelle de la scène (plus grande dimension = `size`).
 * Les géométries sont redimensionnées directement pour que les déplacements en vue éclatée restent cohérents.
 */
export function normalize(root: THREE.Object3D, size = 3) {
  const box = new THREE.Box3().setFromObject(root);
  if (box.isEmpty()) return 1;
  const s = box.getSize(new THREE.Vector3());
  const k = size / Math.max(s.x, s.y, s.z);
  root.scale.setScalar(k);
  return k;
}
