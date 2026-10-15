import * as THREE from 'three';
import { alphaMask, largestComponent, simplify, traceOuterContour } from '../photo/contour';
import { buildDepth } from '../photo/depth';
import { downscale, type Rgba } from '../photo/rgba';
import { createProduct, groundAndCenter, mat, mesh, normalize } from './kit';
import type { Label, Product3D } from './types';

/** Fiche (noms des pièces) d'un produit issu d'une photo. */
export const PHOTO_META: { name: Label; parts: Record<string, Label> } = {
  name: { fr: 'Votre produit en 3D', en: 'Your product in 3D' },
  parts: {
    front: { fr: 'Votre photo en relief', en: 'Your photo in relief' },
    volume: { fr: 'Volume et épaisseur', en: 'Volume and thickness' },
  },
};

/** Définition du maillage : résolution de travail (la photo d'origine n'est jamais déformée, seule sa profondeur varie). */
const WORK_SIDE = 200;
const GRID_MAX = 120;

interface ReliefOptions {
  /** Hauteur du relief, en fraction du plus petit côté. */
  relief?: number;
  /** Épaisseur du volume, en fraction du plus petit côté. */
  thickness?: number;
}

/** Échantillonne un champ scalaire (w×h) en coordonnées normalisées, avec interpolation bilinéaire. */
function sample(field: Float32Array, w: number, h: number, u: number, v: number): number {
  const x = Math.min(w - 1, Math.max(0, u * (w - 1)));
  const y = Math.min(h - 1, Math.max(0, v * (h - 1)));
  const x0 = Math.floor(x), y0 = Math.floor(y);
  const x1 = Math.min(w - 1, x0 + 1), y1 = Math.min(h - 1, y0 + 1);
  const fx = x - x0, fy = y - y0;
  const a = field[y0 * w + x0] * (1 - fx) + field[y0 * w + x1] * fx;
  const b = field[y1 * w + x0] * (1 - fx) + field[y1 * w + x1] * fx;
  return a * (1 - fy) + b * fy;
}

/**
 * Transforme une photo détourée (RGBA) en objet 3D fidèle à la photo :
 *  - `front` : la photo elle-même plaquée sur une surface en relief (profondeur déduite de la photo),
 *    découpée au contour exact grâce à la transparence ;
 *  - `volume` : la silhouette extrudée, qui donne l'épaisseur, les flancs et le dos.
 * `texture` est la photo (en pleine résolution) ; sans texture on obtient un objet uni (tests).
 */
export function buildPhotoRelief(img: Rgba, texture: THREE.Texture | null, opts: ReliefOptions = {}): Product3D {
  const work = downscale(img, WORK_SIDE);
  const { width: w, height: h } = work;

  const { mask } = largestComponent(alphaMask(work, 110), w, h);
  const contour = simplify(traceOuterContour(mask, w, h), 0.8);
  if (contour.length < 3) throw new Error('Silhouette introuvable : la photo doit contenir un produit détouré.');
  const depth = buildDepth(work, mask);

  // Dimensions dans la scène : le plus grand côté mesure 3 unités, le ratio de la photo est conservé
  const ratio = w / h;
  const W = ratio >= 1 ? 3 : 3 * ratio;
  const H = ratio >= 1 ? 3 / ratio : 3;
  const small = Math.min(W, H);
  const reliefH = (opts.relief ?? 0.3) * small;
  const thick = (opts.thickness ?? 0.12) * small;

  // ── Face avant : grille régulière, la profondeur vient de la photo ──
  const nx = Math.min(GRID_MAX, w);
  const ny = Math.min(GRID_MAX, h);
  const positions = new Float32Array((nx + 1) * (ny + 1) * 3);
  const uvs = new Float32Array((nx + 1) * (ny + 1) * 2);
  const near = new Uint8Array((nx + 1) * (ny + 1));
  for (let j = 0; j <= ny; j++) {
    for (let i = 0; i <= nx; i++) {
      const k = j * (nx + 1) + i;
      const u = i / nx, v = j / ny;
      positions[k * 3] = (u - 0.5) * W;
      positions[k * 3 + 1] = (0.5 - v) * H;
      positions[k * 3 + 2] = sample(depth, w, h, u, v) * reliefH;
      uvs[k * 2] = u;
      uvs[k * 2 + 1] = 1 - v;
      // Sommet « utile » : proche du masque (on garde une marge pour que le découpage par transparence soit net)
      const px = Math.round(u * (w - 1)), py = Math.round(v * (h - 1));
      let hit = 0;
      for (let dy = -2; dy <= 2 && !hit; dy++) for (let dx = -2; dx <= 2; dx++) {
        const xx = px + dx, yy = py + dy;
        if (xx >= 0 && yy >= 0 && xx < w && yy < h && mask[yy * w + xx]) { hit = 1; break; }
      }
      near[k] = hit;
    }
  }
  const index: number[] = [];
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1;
      if (!(near[a] || near[b] || near[c] || near[d])) continue;
      index.push(a, c, b, b, c, d);
    }
  }
  const frontGeo = new THREE.BufferGeometry();
  frontGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  frontGeo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  frontGeo.setIndex(index);
  frontGeo.computeVertexNormals();

  const frontMat = mat('#ffffff', 0.5, 0.04, THREE.DoubleSide);
  if (texture) {
    texture.colorSpace = THREE.SRGBColorSpace;
    frontMat.map = texture;
    frontMat.emissiveMap = texture; // le halo de mise en valeur garde les couleurs de la photo
    frontMat.alphaTest = 0.5; // la transparence de la photo détourée découpe le contour
  }

  // ── Volume : la silhouette extrudée (épaisseur, flancs, dos), teinte tirée de la photo ──
  const shape = new THREE.Shape();
  contour.forEach(([px, py], i) => {
    const x = ((px + 0.5) / w - 0.5) * W;
    const y = (0.5 - (py + 0.5) / h) * H;
    if (i === 0) shape.moveTo(x, y); else shape.lineTo(x, y);
  });
  shape.closePath();
  const volumeGeo = new THREE.ExtrudeGeometry(shape, { depth: thick, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.01, bevelSegments: 2, curveSegments: 1 });
  volumeGeo.translate(0, 0, -thick);

  let r = 0, g = 0, b = 0, n = 0;
  for (let i = 0; i < work.data.length; i += 4) {
    if (work.data[i + 3] > 200) { r += work.data[i]; g += work.data[i + 1]; b += work.data[i + 2]; n++; }
  }
  const tint = new THREE.Color(n ? r / n / 255 : 0.5, n ? g / n / 255 : 0.5, n ? b / n / 255 : 0.5).multiplyScalar(0.62);
  const volumeMat = mat('#ffffff', 0.62, 0.05);
  if (texture) {
    // La photo se prolonge sur les flancs et le dos (couleurs du bord étirées sur l'épaisseur), un peu assombrie
    const pos = volumeGeo.getAttribute('position');
    const vuv = new Float32Array(pos.count * 2);
    // Centre de la silhouette : on échantillonne ~2 pixels vers l'intérieur pour éviter la frange transparente du bord
    let cx = 0, cy = 0;
    contour.forEach(([px, py]) => { cx += ((px + 0.5) / w - 0.5) * W; cy += (0.5 - (py + 0.5) / h) * H; });
    cx /= contour.length; cy /= contour.length;
    const inset = (2 * W) / w;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i);
      const len = Math.hypot(cx - x, cy - y) || 1;
      vuv[i * 2] = (x + ((cx - x) / len) * inset) / W + 0.5;
      vuv[i * 2 + 1] = (y + ((cy - y) / len) * inset) / H + 0.5;
    }
    volumeGeo.setAttribute('uv', new THREE.BufferAttribute(vuv, 2));
    volumeMat.map = texture;
    volumeMat.emissiveMap = texture;
    volumeMat.color.set('#c4c4c4');
  } else {
    volumeMat.color.copy(tint);
  }

  const p = createProduct(['front', 'volume']);
  p.add('front', mesh(frontGeo, frontMat), [0, 0, 1.5]);
  p.add('volume', mesh(volumeGeo, volumeMat), [0, 0, -0.5]);
  const product = p.build();
  groundAndCenter(product.root);
  normalize(product.root, 3);
  return product;
}
