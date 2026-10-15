/** Image brute RGBA (même structure qu'ImageData, utilisable sans navigateur). */
export interface Rgba {
  width: number;
  height: number;
  data: Uint8ClampedArray;
}

export const makeRgba = (width: number, height: number): Rgba => ({ width, height, data: new Uint8ClampedArray(width * height * 4) });

/** Réduit l'image (moyenne par blocs) pour que son plus grand côté ne dépasse pas `maxSide`. */
export function downscale(img: Rgba, maxSide: number): Rgba {
  const k = Math.max(img.width, img.height) / maxSide;
  if (k <= 1) return img;
  const w = Math.max(1, Math.round(img.width / k));
  const h = Math.max(1, Math.round(img.height / k));
  const out = makeRgba(w, h);
  for (let y = 0; y < h; y++) {
    const y0 = Math.floor((y * img.height) / h);
    const y1 = Math.max(y0 + 1, Math.floor(((y + 1) * img.height) / h));
    for (let x = 0; x < w; x++) {
      const x0 = Math.floor((x * img.width) / w);
      const x1 = Math.max(x0 + 1, Math.floor(((x + 1) * img.width) / w));
      let r = 0, g = 0, b = 0, a = 0, n = 0;
      for (let yy = y0; yy < y1; yy++) {
        for (let xx = x0; xx < x1; xx++) {
          const i = (yy * img.width + xx) * 4;
          // Pondération par l'opacité pour ne pas ternir les bords détourés
          const wa = img.data[i + 3];
          r += img.data[i] * wa; g += img.data[i + 1] * wa; b += img.data[i + 2] * wa; a += wa; n++;
        }
      }
      const o = (y * w + x) * 4;
      if (a > 0) { out.data[o] = r / a; out.data[o + 1] = g / a; out.data[o + 2] = b / a; }
      out.data[o + 3] = a / n;
    }
  }
  return out;
}

/** Recadre sur la zone visible (opacité > `alphaMin`), avec une petite marge. */
export function cropToContent(img: Rgba, alphaMin = 16, pad = 2): Rgba {
  let x0 = img.width, y0 = img.height, x1 = -1, y1 = -1;
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      if (img.data[(y * img.width + x) * 4 + 3] > alphaMin) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < 0) return img;
  x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad);
  x1 = Math.min(img.width - 1, x1 + pad); y1 = Math.min(img.height - 1, y1 + pad);
  const w = x1 - x0 + 1;
  const h = y1 - y0 + 1;
  const out = makeRgba(w, h);
  for (let y = 0; y < h; y++) {
    const src = ((y0 + y) * img.width + x0) * 4;
    out.data.set(img.data.subarray(src, src + w * 4), y * w * 4);
  }
  return out;
}
