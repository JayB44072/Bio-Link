import * as THREE from 'three';
import { buildShoe, COLORWAYS } from './buildShoe';
import { lightScene, shadowTexture } from './shoeEngine';

/**
 * Rend la chaussure assemblée dans chaque coloris demandé et renvoie des images
 * PNG (fond transparent). Sert de visuel produit aux cartes de la landing.
 * Renvoie un objet vide si WebGL est indisponible.
 */
export function renderColorwaySnapshots(keys: string[], width = 480, height = 360): Record<string, string> {
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
  const camera = new THREE.PerspectiveCamera(26, width / height, 0.1, 100);
  camera.position.set(0.5, 1.3, 5.2);
  camera.lookAt(0, 0.5, 0);

  const shadowMat = new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false });
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 2.2), shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -0.03;

  for (const key of keys) {
    const palette = COLORWAYS[key];
    if (!palette) continue;
    const shoe = buildShoe(palette);
    const pivot = new THREE.Group();
    pivot.rotation.y = -0.62;
    pivot.rotation.x = 0.05;
    pivot.add(shoe.root, shadow);
    scene.add(pivot);
    renderer.render(scene, camera);
    out[key] = canvas.toDataURL('image/png');
    scene.remove(pivot);
    shoe.dispose();
  }

  shadow.geometry.dispose();
  shadowMat.map?.dispose();
  shadowMat.dispose();
  disposeLight();
  renderer.dispose();
  renderer.forceContextLoss();
  return out;
}
