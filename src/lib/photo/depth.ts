import type { Rgba } from './rgba';

/** Distance de chaque pixel du masque au bord le plus proche (chanfrein 3-4), en pixels. */
export function distanceToEdge(mask: Uint8Array, w: number, h: number): Float32Array {
  const INF = 1e9;
  const d = new Float32Array(w * h);
  for (let i = 0; i < d.length; i++) d[i] = mask[i] ? INF : 0;
  const get = (x: number, y: number) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : d[y * w + x]);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (!d[i]) continue;
      d[i] = Math.min(d[i], get(x - 1, y) + 3, get(x - 1, y - 1) + 4, get(x, y - 1) + 3, get(x + 1, y - 1) + 4);
    }
  }
  for (let y = h - 1; y >= 0; y--) {
    for (let x = w - 1; x >= 0; x--) {
      const i = y * w + x;
      if (!d[i]) continue;
      d[i] = Math.min(d[i], get(x + 1, y) + 3, get(x + 1, y + 1) + 4, get(x, y + 1) + 3, get(x - 1, y + 1) + 4);
    }
  }
  for (let i = 0; i < d.length; i++) d[i] /= 3;
  return d;
}

/** Flou rapide (deux passes de moyenne glissante) sur un champ scalaire. */
function boxBlur(src: Float32Array, w: number, h: number, r: number): Float32Array {
  if (r < 1) return src;
  const tmp = new Float32Array(src.length);
  const out = new Float32Array(src.length);
  for (let y = 0; y < h; y++) {
    let sum = 0, n = 0;
    for (let x = -r; x <= r; x++) if (x >= 0 && x < w) { sum += src[y * w + x]; n++; }
    for (let x = 0; x < w; x++) {
      tmp[y * w + x] = sum / n;
      const add = x + r + 1, rem = x - r;
      if (add < w) { sum += src[y * w + add]; n++; }
      if (rem >= 0) { sum -= src[y * w + rem]; n--; }
    }
  }
  for (let x = 0; x < w; x++) {
    let sum = 0, n = 0;
    for (let y = -r; y <= r; y++) if (y >= 0 && y < h) { sum += tmp[y * w + x]; n++; }
    for (let y = 0; y < h; y++) {
      out[y * w + x] = sum / n;
      const add = y + r + 1, rem = y - r;
      if (add < h) { sum += tmp[add * w + x]; n++; }
      if (rem >= 0) { sum -= tmp[rem * w + x]; n--; }
    }
  }
  return out;
}

/**
 * Relief du produit (0..1) déduit de la photo elle-même :
 *  - un volume arrondi : plus on s'éloigne des bords, plus la surface avance (profil de cercle) ;
 *  - un micro-relief tiré des ombres et lumières de la photo (plis, coutures, reliefs d'impression),
 *    pour rester fidèle à ce qui est réellement visible.
 */
export function buildDepth(img: Rgba, mask: Uint8Array): Float32Array {
  const { width: w, height: h } = img;
  const edge = distanceToEdge(mask, w, h);
  let dmax = 0;
  for (let i = 0; i < edge.length; i++) if (edge[i] > dmax) dmax = edge[i];
  const depth = new Float32Array(w * h);
  if (dmax === 0) return depth;

  const gray = new Float32Array(w * h);
  for (let i = 0; i < gray.length; i++) gray[i] = (0.299 * img.data[i * 4] + 0.587 * img.data[i * 4 + 1] + 0.114 * img.data[i * 4 + 2]) / 255;
  const blurred = boxBlur(gray, w, h, Math.max(2, Math.round(Math.min(w, h) / 36)));

  for (let i = 0; i < depth.length; i++) {
    if (!mask[i]) continue;
    const t = Math.min(1, edge[i] / dmax);
    const dome = Math.sqrt(Math.max(0, 1 - (1 - t) * (1 - t)));
    const detail = Math.max(-0.07, Math.min(0.07, (gray[i] - blurred[i]) * 0.5));
    depth[i] = Math.max(0, dome * 0.88 + detail * Math.sqrt(dome));
  }
  const smooth = boxBlur(depth, w, h, 1);
  let max = 0;
  for (let i = 0; i < smooth.length; i++) { if (!mask[i]) smooth[i] = 0; if (smooth[i] > max) max = smooth[i]; }
  if (max > 0) for (let i = 0; i < smooth.length; i++) smooth[i] /= max;
  return smooth;
}
