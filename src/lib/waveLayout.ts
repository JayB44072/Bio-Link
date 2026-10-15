/** Géométrie du « ruban » sinusoïdal qui porte les services (fonctions pures, sans DOM). */

export interface WaveNode {
  x: number;
  y: number;
  /** Côté de la vague où se trouve le médaillon ; la carte se place du côté opposé. */
  side: 'left' | 'right';
}

export interface WaveLayout {
  /** Tracé principal (chemin SVG). */
  path: string;
  /** Tracé secondaire, déphasé, plus fin. */
  companion: string;
  nodes: WaveNode[];
  height: number;
}

interface WaveOptions {
  rows: number;
  rowHeight: number;
  /** Abscisse de l'axe central de la vague. */
  cx: number;
  /** Amplitude horizontale (distance de l'axe au sommet). */
  amplitude: number;
  /** Marge au-dessus de la première station. */
  top?: number;
  /** Pas d'échantillonnage vertical, en px (plus petit = plus lisse). */
  step?: number;
}

/**
 * Une station par ligne : le médaillon se trouve au sommet de la vague, à droite puis à gauche en alternance.
 * x(y) = cx + A · cos(π · (y − top − rowHeight/2) / rowHeight) passe par +A à la première station, −A à la suivante, etc.
 */
export function waveLayout({ rows, rowHeight, cx, amplitude, top = 0, step = 6 }: WaveOptions): WaveLayout {
  const height = top + rows * rowHeight;
  if (rows <= 0) return { path: '', companion: '', nodes: [], height: top };

  const xAt = (y: number, a: number, phase = 0) => cx + a * Math.cos((Math.PI * (y - top - rowHeight / 2)) / rowHeight + phase);
  const trace = (a: number, phase: number) => {
    const pts: string[] = [];
    for (let y = 0; y <= height + step; y += step) pts.push(`${pts.length ? 'L' : 'M'}${xAt(y, a, phase).toFixed(1)} ${y}`);
    return pts.join(' ');
  };

  const nodes: WaveNode[] = Array.from({ length: rows }, (_, i) => {
    const y = top + rowHeight * (i + 0.5);
    return { x: Math.round(xAt(y, amplitude)), y, side: i % 2 === 0 ? 'right' : 'left' };
  });

  return { path: trace(amplitude, 0), companion: trace(amplitude * 0.55, Math.PI * 0.85), nodes, height };
}

/** Ligne sinusoïdale horizontale (filet décoratif) : `waves` ondulations complètes sur `width`, d'amplitude `amplitude`. */
export function wavyLinePath(width: number, amplitude: number, waves: number): string {
  const mid = amplitude;
  const pts: string[] = [];
  const steps = Math.max(8, Math.round(width / 2));
  for (let i = 0; i <= steps; i++) {
    const x = (width * i) / steps;
    pts.push(`${i ? 'L' : 'M'}${x.toFixed(1)} ${(mid + amplitude * Math.sin((2 * Math.PI * waves * i) / steps)).toFixed(2)}`);
  }
  return pts.join(' ');
}

/** Ondulation sinusoïdale horizontale (bord d'un bandeau), en chemin SVG fermé vers le haut. */
export function sineEdgePath(width: number, baseline: number, amplitude: number, waves: number): string {
  const seg = width / (waves * 2);
  let d = `M0 0 H${width} V${baseline}`;
  for (let i = 0; i < waves * 2; i++) {
    const x1 = width - seg * i - seg / 2;
    const x2 = width - seg * (i + 1);
    const dy = i % 2 === 0 ? amplitude : -amplitude;
    d += ` Q${x1.toFixed(1)} ${baseline + dy} ${x2.toFixed(1)} ${baseline}`;
  }
  return `${d} Z`;
}
