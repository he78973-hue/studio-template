import * as THREE from 'three';
import { projectArtwork } from './depth.js';

export function createGrayScene(host) {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setSize(innerWidth, innerHeight);
  host.append(renderer.domElement);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#222725');
  const camera = new THREE.PerspectiveCamera(48, innerWidth / innerHeight, 0.1, 160);
  const params = new URLSearchParams(location.search);
  const view = params.get('view') || 'front';
  camera.position.set(...({ front: [0, 0, 39], top: [0, 35, 28], angle: [26, 9, 28] }[view]));
  camera.lookAt(0, 0, 0);
  const geo = new THREE.PlaneGeometry(1, 1, 90, 110);
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) pos.setXYZ(i, ...projectArtwork(uv.getX(i), 1 - uv.getY(i)));
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, new THREE.MeshNormalMaterial({ side: THREE.DoubleSide, flatShading: true }));
  scene.add(mesh);
  const wire = new THREE.LineSegments(new THREE.WireframeGeometry(geo), new THREE.LineBasicMaterial({ color: '#d0d6d2', transparent: true, opacity: 0.15 }));
  scene.add(wire);
  renderer.render(scene, camera);
  const label = document.createElement('div');
  label.style.cssText = 'position:fixed;left:32px;top:24px;color:white;font:14px monospace;line-height:1.7';
  label.textContent = `DEPTH STUDY / ${view.toUpperCase()} — foliage → bridge → pond → foreground`;
  host.append(label);
}
