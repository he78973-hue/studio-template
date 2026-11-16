import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { SPEC, trackPoint, treeLayout, terrainHeight, TAU } from './layout.js';
import { terrainGeometry, riverGeometry } from './landscape.js';

export function createScene(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.8));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, .1, 150);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = .075;
  controls.enablePan = false;
  controls.minPolarAngle = .22;
  controls.maxPolarAngle = 1.47;
  controls.zoomSpeed = .7;
  controls.rotateSpeed = .65;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const env = pmrem.fromScene(room, .04);
  scene.environment = env.texture;
  scene.environmentIntensity = .55;
  room.dispose();
  pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0xe5efff, 0x877154, .85));
  const sun = new THREE.DirectionalLight(0xffdfaa, 2.5);
  sun.position.set(-8, 17, 7);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 11, bottom: -9, near: .5, far: 45 });
  sun.shadow.normalBias = .035;
  sun.shadow.bias = -.0002;
  sun.shadow.radius = 3;
  sun.target.position.set(0, 3, 0);
  scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight(0xdce9ff, 1.0);
  fill.position.set(9, 7, -8);
  scene.add(fill);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({ opacity: .15 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = .03;
  floor.receiveShadow = true;
  scene.add(floor);
  const root = new THREE.Group();
  scene.add(root);

  let defaultDistance = 26;
  function reset() {
    controls.enableDamping = false;
    controls.update();
    controls.target.set(0, 3.5, 0);
    const direction = new THREE.Vector3(9.6, 8.4, 17.8).normalize();
    camera.position.copy(controls.target).addScaledVector(direction, defaultDistance);
    controls.update();
    controls.enableDamping = true;
    camera.updateMatrixWorld();
  }
  function resize() {
    const { width, height } = canvas.getBoundingClientRect();
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    const v = THREE.MathUtils.degToRad(camera.fov);
    const h = 2 * Math.atan(Math.tan(v / 2) * camera.aspect);
    defaultDistance = 7.7 / Math.tan(Math.min(v, h) / 2);
    controls.minDistance = 12.2;
    controls.maxDistance = defaultDistance * 1.55;
    reset();
    // Resizing clears the drawing buffer even when the camera pose is unchanged.
    controls.dispatchEvent({ type: 'change' });
  }
  const observer = new ResizeObserver(resize);
  observer.observe(canvas.parentElement);
  resize();
  function view(name) {
    const vectors = { front: [0,7,20], back: [0,7,-20], left: [-20,7,0], right: [20,7,0], top: [0,26,.1], detail: [0,1.8,12.3] };
    if (!vectors[name]) return reset();
    controls.enableDamping = false;
    controls.update();
    controls.target.set(0, name === 'detail' ? 1.8 : 3.5, 0);
    camera.position.copy(controls.target).add(new THREE.Vector3(...vectors[name]).normalize().multiplyScalar(name === 'detail' ? 12.8 : defaultDistance));
    controls.update();
    controls.enableDamping = true;
    camera.updateMatrixWorld();
  }
  canvas.addEventListener('keydown', (event) => {
    const delta = camera.position.clone().sub(controls.target);
    const spherical = new THREE.Spherical().setFromVector3(delta);
    if (event.key === 'ArrowLeft') spherical.theta -= .13;
    else if (event.key === 'ArrowRight') spherical.theta += .13;
    else if (event.key === 'ArrowUp') spherical.phi -= .1;
    else if (event.key === 'ArrowDown') spherical.phi += .1;
    else if (event.key === '+' || event.key === '=') spherical.radius *= .9;
    else if (event.key === '-') spherical.radius *= 1.1;
    else if (event.key === 'Home') { reset(); event.preventDefault(); return; }
    else return;
    event.preventDefault();
    spherical.phi = THREE.MathUtils.clamp(spherical.phi, controls.minPolarAngle, controls.maxPolarAngle);
    spherical.radius = THREE.MathUtils.clamp(spherical.radius, controls.minDistance, controls.maxDistance);
    camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(spherical));
    controls.update();
  });
  return { scene, root, camera, renderer, controls, reset, view, render: () => { controls.update(); renderer.render(scene, camera); } };
}

export function buildClay(root) {
  const mat = new THREE.MeshStandardMaterial({ color: 0xb0ada3, roughness: .9 });
  function mesh(geo, x, y, z) {
    const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; root.add(m); return m;
  }
  mesh(new THREE.CylinderGeometry(6.2, 6.2, .3, 96), 0, .45, 0);
  mesh(new THREE.CylinderGeometry(5.95, 5.95, 1.7, 96), 0, 1.4, 0);
  mesh(new THREE.CylinderGeometry(6.2, 6.2, .35, 96), 0, 2.35, 0);
  mesh(new THREE.CylinderGeometry(5.9, 5.9, .12, 96), 0, 2.5, 0);
  mesh(terrainGeometry(), 0, 0, 0);
  const river = mesh(riverGeometry(), 0, 0, 0);
  river.material = new THREE.MeshStandardMaterial({ color: 0x7d807c, side: THREE.DoubleSide });
  for (const inset of [-SPEC.gauge / 2, SPEC.gauge / 2]) {
    const curve = new THREE.CatmullRomCurve3(Array.from({length:128}, (_, i) => trackPoint(i / 128 * TAU, inset)), true);
    mesh(new THREE.TubeGeometry(curve, 128, .035, 6, true), 0, 0, 0);
  }
  mesh(new THREE.BoxGeometry(2, 1.5, 1.5), -1.65, 3.6, .7);
  const roof = mesh(new THREE.ConeGeometry(1.65, .8, 4), -1.65, 4.75, .7); roof.rotation.y = Math.PI / 4;
  for (const [x,z,h] of treeLayout) {
    mesh(new THREE.CylinderGeometry(.04, .09, h, 6), x, terrainHeight(x,z) + h / 2, z);
    mesh(new THREE.ConeGeometry(h * .22, h * .78, 7), x, terrainHeight(x,z) + h * .6, z);
  }
  mesh(new THREE.BoxGeometry(.6,.6,1.2), 0, 3.35, 4.35);
}
