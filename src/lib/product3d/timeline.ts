import type { EngineFrame } from './engine';

export const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/** Durées (secondes) de chaque phase de la boucle automatique. */
const T_IDLE = 2.2;
const T_EXPLODE = 1.8;
const T_PART = 1.7;
const T_REASSEMBLE = 2.0;

/** Boucle automatique : assemblé → éclaté → chaque pièce présentée → recomposé. Entrée : temps en secondes. */
export function loopTimeline(partCount: number) {
  const total = T_IDLE + T_EXPLODE + T_PART * partCount + T_REASSEMBLE;
  return (time: number): EngineFrame => {
    const t = time % total;
    if (t < T_IDLE) return { explode: 0, step: -1 };
    let c = t - T_IDLE;
    if (c < T_EXPLODE) return { explode: easeInOut(c / T_EXPLODE), step: -1 };
    c -= T_EXPLODE;
    const partsEnd = T_PART * partCount;
    if (c < partsEnd) return { explode: 1, step: Math.floor(c / T_PART) };
    c -= partsEnd;
    return { explode: 1 - easeInOut(clamp01(c / T_REASSEMBLE)), step: -1 };
  };
}

/** Parts de la course de défilement (somme = 1). */
export const SCROLL_PHASES = { intro: 0.1, explode: 0.14, outro: 0.12 } as const;

/**
 * Même scénario, piloté par le défilement : entrée = progression 0..1 de la page.
 * Le moteur lisse les mouvements de caméra, donc on peut lui donner la valeur brute.
 */
export function scrollTimeline(partCount: number) {
  const { intro, explode, outro } = SCROLL_PHASES;
  const partsStart = intro + explode;
  const partsEnd = 1 - outro;
  return (p: number): EngineFrame => {
    if (p < intro) return { explode: 0, step: -1 };
    if (p < partsStart) return { explode: easeInOut((p - intro) / explode), step: -1 };
    if (p < partsEnd) {
      const i = Math.floor(((p - partsStart) / (partsEnd - partsStart)) * partCount);
      return { explode: 1, step: Math.min(partCount - 1, Math.max(0, i)) };
    }
    return { explode: 1 - easeInOut((p - partsEnd) / outro), step: -1 };
  };
}

/** Phase de lecture, pour l'affichage (titre d'ouverture, légendes, appel à l'action final). */
export function scrollPhase(p: number): 'intro' | 'parts' | 'outro' {
  if (p < SCROLL_PHASES.intro + SCROLL_PHASES.explode * 0.6) return 'intro';
  if (p < 1 - SCROLL_PHASES.outro) return 'parts';
  return 'outro';
}
