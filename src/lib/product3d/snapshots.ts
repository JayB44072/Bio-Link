import * as THREE from 'three';
import type { ModelDef } from './types';
import { buildModel } from './catalog';
import { lightScene, shadowTexture } from './engine';

interface SnapshotOptions {
  width?: number;
  height?: number;
  /** 0 = assemblé, 1 = éclaté. */
  explode?: number;
  accent?: string;
  /** Rotation du produit (rad). */
  yaw?: number;
}

/**
 * Rend chaque produit en image PNG (fond transparent). Sert aux vignettes du sélecteur de produit.
 * Renvoie un objet vide si WebGL est indisponible.
 */
export function renderModelSnapshots(models: ModelDef[], opts: SnapshotOptions = {}): Record<string, string> {
  const { width = 220, height = 220, explode = 0, accent, yaw = -0.62 } = opts;
  const out: Record<string, string> = {};
  const canvas = document.createElement('canvas');
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
  } catch {
    return out;
  }
  renderer.setPixelRatio(1);
  renderer.setSize(width, height, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const disposeLight = lightScene(scene, renderer);
  const camera = new THREE.PerspectiveCamera(28, width / height, 0.1, 100);
  const shadowMat = new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false });
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  scene.add(shadow);

  for (const def of models) {
    const product = buildModel(def, accent);
    const pivot = new THREE.Group();
    pivot.rotation.y = yaw;
    pivot.rotation.x = 0.05;
    pivot.add(product.root);
    scene.add(pivot);

    product.items.forEach(it => it.object.position.add(it.explode.clone().multiplyScalar(explode)));
    pivot.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(pivot);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const radius = Math.max(size.length() / 2, 0.5);
    const dist = (radius / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) * 1.05;
    camera.position.set(center.x + dist * 0.18, center.y + dist * 0.28, center.z + dist);
    camera.lookAt(center);

    shadow.scale.set(size.x * 1.25 + 0.5, size.z * 1.4 + 0.5, 1);
    shadow.position.set(center.x, box.min.y - 0.02, center.z);
    shadow.visible = explode < 0.5;

    renderer.render(scene, camera);
    out[def.id] = canvas.toDataURL('image/png');

    scene.remove(pivot);
    product.dispose();
  }

  shadow.geometry.dispose();
  shadowMat.map?.dispose();
  shadowMat.dispose();
  disposeLight();
  renderer.dispose();
  renderer.forceContextLoss();
  return out;
}
