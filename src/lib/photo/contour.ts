import type { Rgba } from './rgba';

/** Masque binaire des pixels suffisamment opaques. */
export function alphaMask(img: Rgba, threshold = 110): Uint8Array {
  const m = new Uint8Array(img.width * img.height);
  for (let i = 0; i < m.length; i++) m[i] = img.data[i * 4 + 3] > threshold ? 1 : 0;
  return m;
}

/** Plus grande zone connexe du masque (4-connexité) ; les petits îlots parasites sont écartés. */
export function largestComponent(mask: Uint8Array, w: number, h: number): { mask: Uint8Array; area: number } {
  const label = new Int32Array(w * h);
  const stack = new Int32Array(w * h);
  let best = 0;
  let bestArea = 0;
  let next = 0;
  for (let s = 0; s < mask.length; s++) {
    if (!mask[s] || label[s]) continue;
    next++;
    let top = 0;
    let area = 0;
    stack[top++] = s;
    label[s] = next;
    while (top > 0) {
      const p = stack[--top];
      area++;
      const x = p % w;
      const y = (p / w) | 0;
      if (x > 0 && mask[p - 1] && !label[p - 1]) { label[p - 1] = next; stack[top++] = p - 1; }
      if (x < w - 1 && mask[p + 1] && !label[p + 1]) { label[p + 1] = next; stack[top++] = p + 1; }
      if (y > 0 && mask[p - w] && !label[p - w]) { label[p - w] = next; stack[top++] = p - w; }
      if (y < h - 1 && mask[p + w] && !label[p + w]) { label[p + w] = next; stack[top++] = p + w; }
    }
    if (area > bestArea) { bestArea = area; best = next; }
  }
  const out = new Uint8Array(w * h);
  if (best) for (let i = 0; i < out.length; i++) out[i] = label[i] === best ? 1 : 0;
  return { mask: out, area: bestArea };
}

// Voisins dans le sens horaire (écran, y vers le bas), en partant de l'ouest
const NB: Array<[number, number]> = [[-1, 0], [-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1]];

/** Contour extérieur de la forme (suivi de bord de Moore), en coordonnées de pixels. */
export function traceOuterContour(mask: Uint8Array, w: number, h: number): Array<[number, number]> {
  const at = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h && mask[y * w + x] === 1;
  let sx = -1, sy = -1;
  for (let i = 0; i < mask.length && sx < 0; i++) if (mask[i]) { sx = i % w; sy = (i / w) | 0; }
  if (sx < 0) return [];

  const contour: Array<[number, number]> = [[sx, sy]];
  let px = sx, py = sy;
  let back = 0; // index (dans NB) du voisin d'où l'on vient : l'ouest du point de départ est vide
  const limit = w * h * 4;
  for (let step = 0; step < limit; step++) {
    let found = false;
    for (let i = 1; i <= 8; i++) {
      const idx = (back + i) % 8;
      const qx = px + NB[idx][0];
      const qy = py + NB[idx][1];
      if (!at(qx, qy)) continue;
      // Nouveau « voisin d'arrivée » : le pixel examiné juste avant, vu depuis q
      const prev = (idx + 7) % 8;
      const vx = px + NB[prev][0] - qx;
      const vy = py + NB[prev][1] - qy;
      back = NB.findIndex(([dx, dy]) => dx === vx && dy === vy);
      if (back < 0) back = 0;
      px = qx; py = qy;
      found = true;
      break;
    }
    if (!found) break; // pixel isolé
    if (px === sx && py === sy) return contour;
    contour.push([px, py]);
  }
  return contour;
}

/** Simplification de polyligne (Ramer-Douglas-Peucker) — garde la forme avec bien moins de points. */
export function simplify(points: Array<[number, number]>, epsilon: number): Array<[number, number]> {
  if (points.length < 4) return points;
  const keep = new Uint8Array(points.length);
  keep[0] = 1; keep[points.length - 1] = 1;
  const stack: Array<[number, number]> = [[0, points.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop()!;
    const [ax, ay] = points[a];
    const [bx, by] = points[b];
    const dx = bx - ax, dy = by - ay;
    const len = Math.hypot(dx, dy) || 1;
    let maxD = 0, idx = -1;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs(dy * points[i][0] - dx * points[i][1] + bx * ay - by * ax) / len;
      if (d > maxD) { maxD = d; idx = i; }
    }
    if (idx >= 0 && maxD > epsilon) {
      keep[idx] = 1;
      stack.push([a, idx], [idx, b]);
    }
  }
  return points.filter((_, i) => keep[i]);
}
