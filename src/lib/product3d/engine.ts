import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { Framing, Product3D } from './types';

/** État demandé par l'appelant pour une image donnée. */
export interface EngineFrame {
  /** 0 = assemblé, 1 = éclaté */
  explode: number;
  /** Indice de la pièce présentée dans `model.groups` (-1 = aucune) */
  step: number;
}

export interface EngineOptions {
  /** Appelé à chaque image : renvoie l'état à afficher. `time` en secondes depuis le démarrage. */
  frame: (time: number, dt: number) => EngineFrame;
  /** Appelé quand la pièce présentée change. */
  onStep?: (step: number) => void;
  /** Appelé si WebGL est indisponible. */
  onUnavailable?: () => void;
  /** Dessine une seule image (assemblée) sans boucle d'animation. */
  reducedMotion?: boolean;
  /** Cadrage imposé (sinon calculé d'après les dimensions du produit). */
  framing?: Framing;
  /** Fond transparent (défaut) ou couleur unie. */
  background?: string | null;
  /** Éclairage d'appoint teinté (reflets). */
  rimColor?: string;
  /** Rotation du produit (rad) à chaque image ; par défaut un lent balancement autour d'une vue 3/4. */
  yaw?: (time: number) => number;
}

export function shadowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  if (g && 'createRadialGradient' in g) {
    const grad = g.createRadialGradient(64, 64, 4, 64, 64, 64);
    grad.addColorStop(0, 'rgba(0,0,0,0.55)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
  }
  return new THREE.CanvasTexture(c);
}

/** Éclairage commun (scène principale et vignettes). Renvoie ce qu'il faut libérer. */
export function lightScene(scene: THREE.Scene, renderer: THREE.WebGLRenderer, rimColor = '#9fb4ff') {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
  scene.environment = envRT.texture;
  const key = new THREE.DirectionalLight('#ffffff', 1.6);
  key.position.set(3, 5, 4);
  const rim = new THREE.DirectionalLight(rimColor, 1.1);
  rim.position.set(-4, 2, -3);
  scene.add(key, rim);
  return () => { envRT.dispose(); pmrem.dispose(); };
}

const clampMin = (v: number, min: number) => Math.max(v, min);

/** Dimensions du produit assemblé et éclaté, mesurées sur la scène. */
export function measure(model: Product3D) {
  model.root.updateMatrixWorld(true);
  const asm = new THREE.Box3().setFromObject(model.root);
  const base = model.items.map(i => i.object.position.clone());
  model.items.forEach((i, k) => i.object.position.copy(base[k]).add(i.explode));
  model.root.updateMatrixWorld(true);
  const exp = new THREE.Box3().setFromObject(model.root);
  const groupBoxes = new Map<string, THREE.Box3>();
  model.items.forEach(i => {
    const b = new THREE.Box3().setFromObject(i.object);
    const prev = groupBoxes.get(i.group);
    if (prev) prev.union(b); else groupBoxes.set(i.group, b);
  });
  model.items.forEach((i, k) => i.object.position.copy(base[k]));
  model.root.updateMatrixWorld(true);
  return { asm, exp, groupBoxes };
}

/** Cadrage calculé d'après les dimensions du produit. */
export function autoFraming(model: Product3D): Framing {
  const S = 0.76;
  const { asm, exp, groupBoxes } = measure(model);
  const sa = asm.getSize(new THREE.Vector3());
  const se = exp.getSize(new THREE.Vector3());
  const ca = asm.getCenter(new THREE.Vector3());
  const ce = exp.getCenter(new THREE.Vector3());
  const widthA = Math.max(sa.x, sa.z);
  const widthE = Math.max(se.x, se.z);
  return {
    scale: S,
    lookIdle: ca.y * S - 0.17,
    lookExploded: ce.y * S - 0.12,
    halfHIdle: clampMin((sa.y / 2) * S * 1.25 + 0.35, 0.95),
    halfHExploded: (se.y / 2) * S * 1.12 + 0.5,
    halfHFocus: clampMin((se.y / 2) * S * 0.55 + 0.4, 1.3),
    halfWIdle: (widthA / 2) * S * 1.15 + 0.1,
    halfWExploded: (widthE / 2) * S * 1.12 + 0.15,
    halfWFocus: clampMin((widthE / 2) * S * 0.7 + 0.2, 1.1),
    focusY: (g: string) => {
      const b = groupBoxes.get(g);
      return b ? b.getCenter(new THREE.Vector3()).y * S - 0.12 : 0;
    },
    shadow: { w: clampMin(widthA * 1.35, 2.2), d: clampMin(Math.min(sa.x, sa.z) * 1.6, 1.8) },
  };
}

/**
 * Démarre le rendu d'un produit 3D dans `mount`. Renvoie une fonction de nettoyage.
 * Si WebGL est indisponible, appelle `onUnavailable` et ne fait rien.
 * Le produit passé reste à l'appelant pour `dispose` s'il l'a créé lui-même ;
 * ici il est libéré au nettoyage.
 */
export function startProductEngine(mount: HTMLElement, model: Product3D, opts: EngineOptions): () => void {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch {
    opts.onUnavailable?.();
    model.dispose();
    return () => {};
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 768 ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.domElement.style.cssText = 'width:100%;height:100%;display:block';
  renderer.domElement.setAttribute('aria-hidden', 'true');
  if (opts.background) renderer.setClearColor(opts.background, 1);
  mount.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const disposeLight = lightScene(scene, renderer, opts.rimColor);

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  const tanHalf = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));

  const framing = opts.framing ?? autoFraming(model);
  const SCALE = framing.scale;

  // Pièce la plus basse en vue assemblée (l'ombre la suit) — mesurée avant l'ajout au pivot
  model.root.updateMatrixWorld(true);
  const lowest = model.items.reduce((a, b) => (new THREE.Box3().setFromObject(b.object).min.y < new THREE.Box3().setFromObject(a.object).min.y ? b : a));
  const lowestMin = new THREE.Box3().setFromObject(lowest.object).min.y / (model.root.scale.x || 1);

  const pivot = new THREE.Group();
  pivot.scale.setScalar(SCALE);
  pivot.add(model.root);
  scene.add(pivot);

  // Ombre au sol, sous la pièce la plus basse
  const shadowMat = new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false });
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(framing.shadow.w, framing.shadow.d), shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  model.root.add(shadow);

  model.items.forEach(it => { it.object.userData.base = it.object.position.clone(); });

  const resize = () => {
    const w = Math.max(1, mount.clientWidth);
    const h = Math.max(1, mount.clientHeight);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(mount);

  // État animé (lissé)
  const lookY = { v: framing.lookIdle };
  const halfH = { v: framing.halfHIdle };
  const dim = new Map<string, number>();
  const glow = new Map<string, number>();
  model.groups.forEach(g => { dim.set(g, 1); glow.set(g, 0); });
  let lastStep = -2;

  const render = (time: number, dt: number) => {
    const { explode, step } = opts.frame(time, dt);
    if (step !== lastStep) { lastStep = step; opts.onStep?.(step); }
    const damp = (k: number) => 1 - Math.exp(-dt * k);

    model.items.forEach(it => {
      const b = it.object.userData.base as THREE.Vector3;
      it.object.position.set(b.x + it.explode.x * explode, b.y + it.explode.y * explode, b.z + it.explode.z * explode);
    });

    // Mise en retrait des pièces non présentées, mise en valeur de celle qui l'est
    model.groups.forEach((g, i) => {
      const target = step === -1 || step === i ? 1 : 0.14;
      const cur = dim.get(g)! + (target - dim.get(g)!) * damp(7);
      dim.set(g, cur);
      const gl = glow.get(g)! + ((step === i ? 1 : 0) - glow.get(g)!) * damp(6);
      glow.set(g, gl);
      model.items.filter(it => it.group === g).forEach(it => it.materials.forEach(m => {
        const baseOpacity = (m.userData as { baseOpacity?: number }).baseOpacity ?? 1;
        m.opacity = cur * baseOpacity;
        m.transparent = m.opacity < 0.99;
        m.depthWrite = cur > 0.6 && baseOpacity >= 0.99;
        m.emissiveIntensity = 0.2 * gl;
      }));
    });

    // Ombre : sous la pièce la plus basse
    const lowestItem = lowest.object.position.y;
    shadow.position.y = lowestMin + (lowestItem - (lowest.object.userData.base as THREE.Vector3).y) - 0.03;
    shadowMat.opacity = (0.9 - 0.45 * explode) * (dim.get(lowest.group) ?? 1);

    // Balancement lent autour d'une vue 3/4
    pivot.rotation.y = opts.yaw ? opts.yaw(time) : -0.75 + 0.45 * Math.sin(time * 0.45);
    pivot.rotation.x = 0.06;

    // Caméra : cadrage selon la phase et la pièce présentée
    const idx = step;
    const focused = idx >= 0 && idx < model.groups.length;
    const focusY = focused ? framing.focusY(model.groups[idx]) : 0;
    const wantLook = focused ? focusY : framing.lookIdle + (framing.lookExploded - framing.lookIdle) * explode;
    const wantHalfH = focused ? framing.halfHFocus : framing.halfHIdle + (framing.halfHExploded - framing.halfHIdle) * explode;
    lookY.v += (wantLook - lookY.v) * damp(4);
    halfH.v += (wantHalfH - halfH.v) * damp(4);
    const halfW = focused ? framing.halfWFocus : framing.halfWIdle + (framing.halfWExploded - framing.halfWIdle) * explode;
    const dist = Math.max(halfH.v / tanHalf, halfW / (tanHalf * camera.aspect));
    camera.position.set(0, lookY.v + 0.9, dist);
    camera.lookAt(0, lookY.v, 0);

    renderer.render(scene, camera);
  };

  let raf = 0;
  let running = false;
  let visible = true;
  let elapsed = 0;
  let prev = performance.now();

  const tick = (now: number) => {
    const dt = Math.min(0.05, (now - prev) / 1000);
    prev = now;
    elapsed += dt;
    render(elapsed, dt);
    raf = requestAnimationFrame(tick);
  };
  const start = () => {
    if (running || opts.reducedMotion || !visible || document.hidden) return;
    running = true;
    prev = performance.now();
    raf = requestAnimationFrame(tick);
  };
  const stop = () => { running = false; cancelAnimationFrame(raf); };

  if (opts.reducedMotion) {
    render(0, 1); // image fixe : produit assemblé
  } else {
    start();
  }

  const onVis = () => (document.hidden ? stop() : start());
  document.addEventListener('visibilitychange', onVis);
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) start(); else stop(); });
  io.observe(mount);

  return () => {
    stop();
    io.disconnect();
    ro.disconnect();
    document.removeEventListener('visibilitychange', onVis);
    model.dispose();
    shadow.geometry.dispose();
    shadowMat.map?.dispose();
    shadowMat.dispose();
    disposeLight();
    renderer.dispose();
    if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
  };
}
