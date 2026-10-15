import { alphaMask, largestComponent } from './contour';
import { cropToContent, makeRgba, type Rgba } from './rgba';

type RGB = [number, number, number];

/** Couleur du fond : médiane des pixels du bord de l'image. */
export function estimateBackground(img: Rgba): RGB {
  const rs: number[] = [], gs: number[] = [], bs: number[] = [];
  const push = (x: number, y: number) => {
    const i = (y * img.width + x) * 4;
    rs.push(img.data[i]); gs.push(img.data[i + 1]); bs.push(img.data[i + 2]);
  };
  for (let x = 0; x < img.width; x++) { push(x, 0); push(x, img.height - 1); }
  for (let y = 1; y < img.height - 1; y++) { push(0, y); push(img.width - 1, y); }
  const med = (a: number[]) => a.sort((p, q) => p - q)[a.length >> 1];
  return [med(rs), med(gs), med(bs)];
}

const dist = (data: Uint8ClampedArray, i: number, bg: RGB) => Math.hypot(data[i] - bg[0], data[i + 1] - bg[1], data[i + 2] - bg[2]);

/**
 * Part des pixels du bord proches de la couleur de fond (0..1).
 * Proche de 1 : fond uni, le détourage rapide suffit. Faible : fond chargé, préférer le détourage IA.
 */
export function backgroundUniformity(img: Rgba, tolerance = 48): number {
  const bg = estimateBackground(img);
  let ok = 0, total = 0;
  const test = (x: number, y: number) => { total++; if (dist(img.data, (y * img.width + x) * 4, bg) <= tolerance) ok++; };
  for (let x = 0; x < img.width; x++) { test(x, 0); test(x, img.height - 1); }
  for (let y = 1; y < img.height - 1; y++) { test(0, y); test(img.width - 1, y); }
  return total ? ok / total : 0;
}

/**
 * Détourage rapide pour fond uni (fond blanc, studio…) : on « remplit » depuis les bords
 * tout ce qui ressemble à la couleur du fond, sans toucher aux zones intérieures de même couleur.
 * Les bords sont adoucis, les îlots parasites supprimés, puis l'image est recadrée sur le produit.
 */
export function removeUniformBackground(src: Rgba, tolerance = 48): Rgba {
  const { width: w, height: h } = src;
  const img: Rgba = { width: w, height: h, data: new Uint8ClampedArray(src.data) };
  const bg = estimateBackground(img);
  const isBg = new Uint8Array(w * h);
  const stack = new Int32Array(w * h);
  let top = 0;

  const seed = (x: number, y: number) => {
    const p = y * w + x;
    if (!isBg[p] && dist(img.data, p * 4, bg) <= tolerance) { isBg[p] = 1; stack[top++] = p; }
  };
  for (let x = 0; x < w; x++) { seed(x, 0); seed(x, h - 1); }
  for (let y = 0; y < h; y++) { seed(0, y); seed(w - 1, y); }
  while (top > 0) {
    const p = stack[--top];
    const x = p % w;
    const y = (p / w) | 0;
    if (x > 0) seed(x - 1, y);
    if (x < w - 1) seed(x + 1, y);
    if (y > 0) seed(x, y - 1);
    if (y < h - 1) seed(x, y + 1);
  }

  const out = makeRgba(w, h);
  out.data.set(img.data);
  for (let p = 0; p < w * h; p++) {
    if (isBg[p]) { out.data[p * 4 + 3] = 0; continue; }
    // Bord du produit : opacité progressive selon la distance à la couleur du fond
    const x = p % w;
    const y = (p / w) | 0;
    const touchesBg = (x > 0 && isBg[p - 1]) || (x < w - 1 && isBg[p + 1]) || (y > 0 && isBg[p - w]) || (y < h - 1 && isBg[p + w]);
    if (touchesBg) {
      const d = dist(img.data, p * 4, bg);
      out.data[p * 4 + 3] = Math.round(255 * Math.min(1, Math.max(0.25, (d - tolerance * 0.5) / (tolerance * 1.2))));
    }
  }

  // Les pixels de bord ont gardé un peu de la couleur du fond (liseré blanc) : on leur redonne la couleur
  // des pixels pleins voisins
  const solid = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h && out.data[(y * w + x) * 4 + 3] === 255;
  const fixed: Array<[number, number, number, number]> = [];
  for (let p = 0; p < w * h; p++) {
    const a = out.data[p * 4 + 3];
    if (a === 0 || a === 255) continue;
    const x = p % w;
    const y = (p / w) | 0;
    let r = 0, g = 0, b = 0, n = 0;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      if (!solid(x + dx, y + dy)) continue;
      const i = ((y + dy) * w + x + dx) * 4;
      r += out.data[i]; g += out.data[i + 1]; b += out.data[i + 2]; n++;
    }
    if (n) fixed.push([p, r / n, g / n, b / n]);
  }
  for (const [p, r, g, b] of fixed) { out.data[p * 4] = r; out.data[p * 4 + 1] = g; out.data[p * 4 + 2] = b; }
  // Ne garder que le produit (plus grande zone), pas les poussières ni les ombres détachées
  const { mask, area } = largestComponent(alphaMask(out, 40), w, h);
  if (area === 0) return out;
  for (let p = 0; p < w * h; p++) if (!mask[p]) out.data[p * 4 + 3] = 0;
  return cropToContent(out, 16, 2);
}
