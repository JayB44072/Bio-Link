import { useEffect, useRef } from 'react';
import { PART_ORDER } from './buildShoe';
import { startShoeEngine, type EngineFrame } from './shoeEngine';

/** Durées (secondes) de chaque phase de la boucle. */
const T_IDLE = 2.4;
const T_EXPLODE = 1.9;
const T_PART = 1.8;
const T_REASSEMBLE = 2.1;
const T_TOTAL = T_IDLE + T_EXPLODE + T_PART * PART_ORDER.length + T_REASSEMBLE;

const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/** Chronologie : assemblée → éclatée → chaque pièce présentée → recomposée. */
function frameAt(time: number): EngineFrame {
  const t = time % T_TOTAL;
  if (t < T_IDLE) return { explode: 0, step: -1 };
  let c = t - T_IDLE;
  if (c < T_EXPLODE) return { explode: easeInOut(c / T_EXPLODE), step: -1 };
  c -= T_EXPLODE;
  const partsEnd = T_PART * PART_ORDER.length;
  if (c < partsEnd) return { explode: 1, step: Math.floor(c / T_PART) };
  c -= partsEnd;
  return { explode: 1 - easeInOut(clamp01(c / T_REASSEMBLE)), step: -1 };
}

interface ShoeSceneProps {
  /** Appelé quand la pièce présentée change (-1 = aucune). */
  onStep: (step: number) => void;
  /** Appelé si WebGL est indisponible. */
  onUnavailable: () => void;
  reducedMotion: boolean;
}

/** Animation autonome de la chaussure (écrans de connexion / inscription). */
export default function ShoeScene({ onStep, onUnavailable, reducedMotion }: ShoeSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const callbacks = useRef({ onStep, onUnavailable });
  callbacks.current = { onStep, onUnavailable };

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    return startShoeEngine(mount, {
      frame: time => frameAt(time),
      onStep: s => callbacks.current.onStep(s),
      onUnavailable: () => callbacks.current.onUnavailable(),
      reducedMotion,
    });
  }, [reducedMotion]);

  return <div ref={mountRef} className="absolute inset-0" />;
}
