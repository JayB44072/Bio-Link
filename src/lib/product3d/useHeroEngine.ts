import { useEffect, useRef, useState, type RefObject } from 'react';
import { startProductEngine, type EngineFrame } from './engine';
import { initialHeroMeta, loadHeroModel, type HeroModelMeta } from './heroModel';

interface Options {
  mountRef: RefObject<HTMLElement>;
  /** Identifiant du produit (catalogue, catalogue + photo, ou photo en relief). */
  modelId: string | null;
  accent: string;
  rim: string;
  /** Propriétaire des photos (dossier de stockage du vendeur). */
  ownerId?: string | null;
  /** Faux : on ne charge ni ne démarre rien (connexion lente). */
  enabled: boolean;
  reducedMotion?: boolean;
  /** Fabrique, pour le produit chargé, la fonction qui donne l'état de chaque image. */
  makeFrame: (groupCount: number) => (time: number) => EngineFrame;
  /** Rotation du produit ; par défaut celle du moteur, ou celle que fournit le produit (photo). */
  makeYaw?: (meta: HeroModelMeta) => ((time: number) => number) | undefined;
}

/**
 * Charge le produit d'un héros puis démarre le moteur 3D dans `mountRef`.
 * Renvoie ce que l'interface affiche : noms des pièces, pièce présentée, indisponibilité.
 */
export function useHeroEngine({ mountRef, modelId, accent, rim, ownerId, enabled, reducedMotion, makeFrame, makeYaw }: Options) {
  const [meta, setMeta] = useState<HeroModelMeta>(() => initialHeroMeta(modelId));
  const [groups, setGroups] = useState<string[]>(() => Object.keys(initialHeroMeta(modelId).parts));
  const [step, setStep] = useState(-1);
  const [unavailable, setUnavailable] = useState(false);
  // Les fabriques changent à chaque rendu : on lit toujours la dernière sans relancer le moteur
  const latest = useRef({ makeFrame, makeYaw });
  latest.current = { makeFrame, makeYaw };

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || !enabled) return;
    setUnavailable(false);
    setStep(-1);
    setMeta(initialHeroMeta(modelId));
    let cancelled = false;
    let stop = () => {};

    loadHeroModel(modelId, accent, ownerId).then(({ product, meta: loaded }) => {
      if (cancelled) { product.dispose(); return; }
      setMeta(loaded);
      setGroups(product.groups);
      const frame = latest.current.makeFrame(product.groups.length);
      stop = startProductEngine(mount, product, {
        frame: time => frame(time),
        yaw: latest.current.makeYaw?.(loaded),
        onStep: setStep,
        onUnavailable: () => setUnavailable(true),
        reducedMotion,
        rimColor: rim,
      });
    }).catch(() => { if (!cancelled) setUnavailable(true); });

    return () => { cancelled = true; stop(); };
  }, [mountRef, modelId, accent, rim, ownerId, enabled, reducedMotion]);

  return { meta, groups, step, unavailable };
}
