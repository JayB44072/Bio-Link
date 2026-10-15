import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { buildShoe, DEFAULT_PALETTE, PART_ORDER, type ShoePalette } from './buildShoe';

/** État demandé par l'appelant pour une image donnée. */
export interface EngineFrame {
  /** 0 = assemblée, 1 = éclatée */
  explode: number;
  /** Pièce présentée (-1 = aucune) */
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
  palette?: ShoePalette;
}

const SCALE = 0.76;

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
export function lightScene(scene: THREE.Scene, renderer: THREE.WebGLRenderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
  scene.environment = envRT.texture;
  const key = new THREE.DirectionalLight('#ffffff', 1.6);
  key.position.set(3, 5, 4);
  const rim = new THREE.DirectionalLight('#9fb4ff', 1.1);
  rim.position.set(-4, 2, -3);
  scene.add(key, rim);
  return () => { envRT.dispose(); pmrem.dispose(); };
}

/**
 * Démarre le rendu de la chaussure dans `mount`. Renvoie une fonction de nettoyage.
 * Si WebGL est indisponible, appelle `onUnavailable` et ne fait rien.
 */
export function startShoeEngine(mount: HTMLElement, opts: EngineOptions): () => void {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch {
    opts.onUnavailable?.();
    return () => {};
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 768 ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.domElement.style.cssText = 'width:100%;height:100%;display:block';
  renderer.domElement.setAttribute('aria-hidden', 'true');
  mount.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const disposeLight = lightScene(scene, renderer);

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  const tanHalf = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));

  const shoe = buildShoe(opts.palette ?? DEFAULT_PALETTE);
  const pivot = new THREE.Group();
  pivot.scale.setScalar(SCALE);
  pivot.add(shoe.root);
  scene.add(pivot);

  // Ombre au sol, qui suit la semelle extérieure
  const shadowMat = new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false });
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 2.2), shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shoe.root.add(shadow);

  shoe.items.forEach(it => { it.object.userData.baseY = it.object.position.y; });
  const outsoleItem = shoe.items.find(i => i.group === 'outsole')!;
  const focusYByGroup = new Map<string, number>();
  PART_ORDER.forEach(g => {
    const its = shoe.items.filter(i => i.group === g);
    const y = its.reduce((s, i) => s + i.object.userData.baseY + i.explode.y, 0) / its.length;
    focusYByGroup.set(g, y + 0.2);
  });

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
  const lookY = { v: 0.25 };
  const halfH = { v: 1.2 };
  const dim = new Map<string, number>();  // opacité courante par pièce
  const glow = new Map<string, number>(); // intensité de mise en valeur par pièce
  PART_ORDER.forEach(g => { dim.set(g, 1); glow.set(g, 0); });
  let lastStep = -2;

  const render = (time: number, dt: number) => {
    const { explode, step } = opts.frame(time, dt);
    if (step !== lastStep) { lastStep = step; opts.onStep?.(step); }
    const damp = (k: number) => 1 - Math.exp(-dt * k);

    shoe.items.forEach(it => {
      const base = it.object.userData.baseY as number;
      it.object.position.set(it.explode.x * explode, base + it.explode.y * explode, it.explode.z * explode);
    });

    // Mise en retrait des pièces non présentées, mise en valeur de celle qui l'est
    PART_ORDER.forEach((g, i) => {
      const target = step === -1 || step === i ? 1 : 0.14;
      const cur = dim.get(g)! + (target - dim.get(g)!) * damp(7);
      dim.set(g, cur);
      const gl = glow.get(g)! + ((step === i ? 1 : 0) - glow.get(g)!) * damp(6);
      glow.set(g, gl);
      shoe.items.filter(it => it.group === g).forEach(it => it.materials.forEach(m => {
        m.opacity = cur; m.transparent = cur < 0.99; m.depthWrite = cur > 0.6; m.emissiveIntensity = 0.2 * gl;
      }));
    });

    shadow.position.y = outsoleItem.object.position.y - 0.03;
    shadowMat.opacity = (0.9 - 0.45 * explode) * dim.get('outsole')!;

    // Balancement lent autour d'une vue 3/4
    pivot.rotation.y = -0.75 + 0.45 * Math.sin(time * 0.45);
    pivot.rotation.x = 0.06;

    // Caméra : cadrage selon la phase et la pièce présentée
    const focusY = step >= 0 ? focusYByGroup.get(PART_ORDER[step])! * SCALE - 0.12 : 0.25 + 0.05 * explode;
    const wantHalfH = step >= 0 ? 1.55 : 0.95 + 1.55 * explode;
    lookY.v += (focusY - lookY.v) * damp(4);
    halfH.v += (wantHalfH - halfH.v) * damp(4);
    const halfW = step >= 0 ? 1.3 : 1.3 + 0.25 * explode;
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
    render(0, 1); // image fixe : chaussure assemblée
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
    shoe.dispose();
    shadow.geometry.dispose();
    shadowMat.map?.dispose();
    shadowMat.dispose();
    disposeLight();
    renderer.dispose();
    if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
  };
}
