import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { makeRgba, cropToContent, downscale, type Rgba } from '../../lib/photo/rgba';
import { alphaMask, largestComponent, simplify, traceOuterContour } from '../../lib/photo/contour';
import { backgroundUniformity, removeUniformBackground } from '../../lib/photo/cutout';
import { buildDepth, distanceToEdge } from '../../lib/photo/depth';
import { buildPhotoRelief } from '../../lib/product3d/photoModel';
import { MODELS, buildModel } from '../../lib/product3d/catalog';
import { formatModelToken, heroPhotoPath, newPhotoId, parseModelToken, PHOTO_BASE } from '../../lib/product3d/modelToken';

/** Photo de test : fond blanc, produit rouge (rectangle) avec un petit trou blanc à l'intérieur. */
function productPhoto(w = 80, h = 100): Rgba {
  const img = makeRgba(w, h);
  for (let i = 0; i < w * h; i++) img.data.set([255, 255, 255, 255], i * 4);
  for (let y = 20; y < 80; y++) for (let x = 25; x < 55; x++) img.data.set([200, 30, 40, 255], (y * w + x) * 4);
  for (let y = 45; y < 52; y++) for (let x = 36; x < 44; x++) img.data.set([255, 255, 255, 255], (y * w + x) * 4);
  return img;
}

const alphaAt = (img: Rgba, x: number, y: number) => img.data[(y * img.width + x) * 4 + 3];

describe('détourage d\'un fond uni', () => {
  it('rend le fond transparent, garde le produit et recadre', () => {
    const cut = removeUniformBackground(productPhoto());
    expect(cut.width).toBeLessThan(40);
    expect(cut.height).toBeLessThan(70);
    expect(alphaAt(cut, 0, 0)).toBe(0);
    expect(alphaAt(cut, Math.floor(cut.width / 2), 5)).toBe(255);
  });

  it('conserve les zones intérieures de la couleur du fond (le trou n\'est pas détouré)', () => {
    const cut = removeUniformBackground(productPhoto());
    // le trou blanc est entouré de rouge : il reste opaque
    const cx = Math.floor(cut.width / 2), cy = Math.floor(cut.height / 2);
    expect(alphaAt(cut, cx, cy)).toBe(255);
  });

  it('mesure l\'uniformité du fond', () => {
    expect(backgroundUniformity(productPhoto())).toBeGreaterThan(0.95);
    const noisy = makeRgba(40, 40);
    for (let i = 0; i < 1600; i++) noisy.data.set([(i * 37) % 256, (i * 91) % 256, (i * 53) % 256, 255], i * 4);
    expect(backgroundUniformity(noisy)).toBeLessThan(0.6);
  });

  it('écarte les poussières isolées', () => {
    const img = productPhoto();
    img.data.set([20, 20, 20, 255], (5 * img.width + 5) * 4); // pixel parasite en coin
    const cut = removeUniformBackground(img);
    expect(cut.width).toBeLessThan(40); // le recadrage ne s'étend pas jusqu'au parasite
  });
});

describe('contour, relief et traitements de base', () => {
  const rect = (w: number, h: number, x0: number, y0: number, x1: number, y1: number) => {
    const m = new Uint8Array(w * h);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) m[y * w + x] = 1;
    return m;
  };

  it('trace le contour d\'un rectangle et le simplifie à ses coins', () => {
    const mask = rect(30, 30, 5, 8, 20, 22);
    const contour = traceOuterContour(mask, 30, 30);
    const perimeter = 2 * (16 + 15) - 4;
    expect(contour.length).toBe(perimeter);
    const simple = simplify(contour, 0.5);
    expect(simple.length).toBeLessThanOrEqual(6);
    const xs = simple.map(p => p[0]), ys = simple.map(p => p[1]);
    expect([Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)]).toEqual([5, 20, 8, 22]);
  });

  it('garde la plus grande zone', () => {
    const m = rect(30, 30, 2, 2, 12, 12);
    for (let y = 20; y < 23; y++) for (let x = 20; x < 23; x++) m[y * 30 + x] = 1;
    const { mask, area } = largestComponent(m, 30, 30);
    expect(area).toBe(121);
    expect(mask[21 * 30 + 21]).toBe(0);
  });

  it('calcule le relief : bombé au centre, nul hors du produit', () => {
    const img = removeUniformBackground(productPhoto());
    const mask = alphaMask(img, 110);
    const edge = distanceToEdge(mask, img.width, img.height);
    expect(edge[0]).toBe(0);
    const depth = buildDepth(img, mask);
    const mid = Math.floor(img.height / 2) * img.width + Math.floor(img.width / 2);
    expect(depth[mid]).toBeGreaterThan(0.6);
    expect(depth[0]).toBe(0);
    expect(Math.max(...depth)).toBeCloseTo(1, 5);
  });

  it('réduit et recadre sans changer les proportions', () => {
    const small = downscale(productPhoto(200, 300), 100);
    expect(Math.max(small.width, small.height)).toBe(100);
    expect(small.width / small.height).toBeCloseTo(200 / 300, 1);
    // fond transparent, bloc opaque de 30 × 10
    const block = makeRgba(50, 50);
    for (let y = 10; y < 20; y++) for (let x = 5; x < 35; x++) block.data[(y * 50 + x) * 4 + 3] = 255;
    const cropped = cropToContent(block, 16, 0);
    expect([cropped.width, cropped.height]).toEqual([30, 10]);
  });
});

describe('objet 3D en relief fidèle à la photo', () => {
  const cut = removeUniformBackground(productPhoto());

  it('produit deux pièces, à l\'échelle de la scène, libérables', () => {
    const product = buildPhotoRelief(cut, null);
    expect(product.groups).toEqual(['front', 'volume']);
    const size = new THREE.Box3().setFromObject(product.root).getSize(new THREE.Vector3());
    expect(Math.max(size.x, size.y)).toBeCloseTo(3, 1);
    expect(size.z).toBeGreaterThan(0.2); // une vraie épaisseur, pas une carte plate
    expect(() => product.dispose()).not.toThrow();
  });

  it('la face avant garde les proportions de la photo et possède des UV', () => {
    const product = buildPhotoRelief(cut, null);
    const front = product.items.find(i => i.group === 'front')!.object as THREE.Mesh;
    expect(front.geometry.getAttribute('uv')).toBeDefined();
    const size = new THREE.Box3().setFromObject(front).getSize(new THREE.Vector3());
    expect(size.x / size.y).toBeCloseTo(cut.width / cut.height, 1);
  });

  it('refuse une image sans produit', () => {
    expect(() => buildPhotoRelief(makeRgba(20, 20), null)).toThrow();
  });
});

describe('photo sur un modèle du catalogue', () => {
  it('chaque modèle marqué « photo » a une zone qui peut recevoir l\'image', () => {
    const withPhoto = MODELS.filter(m => m.photo);
    expect(withPhoto.length).toBeGreaterThanOrEqual(8);
    for (const def of withPhoto) {
      const product = buildModel(def);
      let targets = 0;
      product.root.traverse(o => { if (o.userData.photoTarget) targets++; });
      expect(targets, def.id).toBeGreaterThan(0);
      product.dispose();
    }
  });

  it('les autres modèles n\'ont pas de zone photo', () => {
    for (const def of MODELS.filter(m => !m.photo)) {
      const product = buildModel(def);
      let targets = 0;
      product.root.traverse(o => { if (o.userData.photoTarget) targets++; });
      expect(targets, def.id).toBe(0);
      product.dispose();
    }
  });
});

describe('identifiant de produit 3D', () => {
  it('lit les trois formes', () => {
    expect(parseModelToken('sneaker')).toEqual({ base: 'sneaker', photoId: null });
    expect(parseModelToken('tshirt~ab12cd')).toEqual({ base: 'tshirt', photoId: 'ab12cd' });
    expect(parseModelToken('photo~ab12cd')).toEqual({ base: PHOTO_BASE, photoId: 'ab12cd' });
    expect(parseModelToken(null)).toEqual({ base: null, photoId: null });
  });
  it('rejette un identifiant de photo douteux', () => {
    expect(parseModelToken('tshirt~../../x').photoId).toBeNull();
  });
  it('formate et génère des identifiants valides', () => {
    expect(formatModelToken('tshirt', 'ab12cd')).toBe('tshirt~ab12cd');
    expect(formatModelToken('tshirt')).toBe('tshirt');
    expect(newPhotoId()).toMatch(/^[a-z0-9]{6,16}$/);
  });
  it('range les fichiers dans le dossier du vendeur', () => {
    expect(heroPhotoPath('u1', 'ab12cd', 'cutout')).toBe('u1/hero/ab12cd.png');
    expect(heroPhotoPath('u1', 'ab12cd', 'source')).toBe('u1/hero/ab12cd-src.jpg');
  });
});

describe('alphaMask', () => {
  it('seuille l\'opacité', () => {
    const img = makeRgba(2, 1);
    img.data.set([0, 0, 0, 200, 0, 0, 0, 20]);
    expect(Array.from(alphaMask(img, 110))).toEqual([1, 0]);
  });
});
