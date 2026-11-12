(function () {
'use strict';
const THREE = window.THREE;
if (!THREE) return;

const host = document.getElementById('object-layout');
const viewport = document.getElementById('object-viewer');
const canvas = document.getElementById('object-canvas');
const selectors = [...host.querySelectorAll('[data-select]')];
const status = document.getElementById('object-status');
const labels = { lamp: '台灯', chess: '几何棋具', chair: '瓦西里椅' };
const grey = new THREE.MeshStandardMaterial({ color: 0xbac6cf, metalness: .38, roughness: .3, side: THREE.DoubleSide });
const dark = new THREE.MeshStandardMaterial({ color: 0x28354a, roughness: .78, side: THREE.DoubleSide });
const pale = new THREE.MeshPhysicalMaterial({ color: 0xf0f2e9, roughness: .45, transparent: true, opacity: .91, emissive: 0x3b3933, emissiveIntensity: .13, side: THREE.DoubleSide, depthWrite: false });
const timber = new THREE.MeshStandardMaterial({ color: 0xb59b79, roughness: .8 });
const ivory = new THREE.MeshStandardMaterial({ color: 0xe8dfce, roughness: .85 });
const walnut = new THREE.MeshStandardMaterial({ color: 0x55453b, roughness: .82 });
const box = (parent, w, h, d, x, y, z, material = grey) => {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z); parent.add(mesh); return mesh;
};
const cylinder = (parent, rTop, rBottom, h, x, y, z, material = grey) => {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBottom, h, 48), material);
  mesh.position.set(x, y, z); parent.add(mesh); return mesh;
};
const rod = (parent, points, radius = .035, material = grey) => {
  const curve = new THREE.CatmullRomCurve3(points.map(([x, y, z]) => new THREE.Vector3(x, y, z)));
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 48, radius, 8, false), material);
  parent.add(mesh); return mesh;
};
function lamp() {
  const group = new THREE.Group();
  cylinder(group, .68, .72, .10, 0, .06, 0, grey);
  cylinder(group, .14, .14, .09, 0, .15, 0);
  cylinder(group, .053, .053, 1.43, 0, .9, 0, grey);
  cylinder(group, .16, .16, .08, 0, 1.65, 0);
  const shade = new THREE.Mesh(new THREE.SphereGeometry(.76, 48, 22, 0, Math.PI * 2, 0, Math.PI / 2), pale);
  shade.scale.y = .78; shade.position.y = 1.69; group.add(shade);
  cylinder(group, .77, .77, .035, 0, 1.7, 0, pale);
  return group;
}
function chess() {
  const group = new THREE.Group();
  box(group, 3.72, .18, 3.72, 0, .09, 0, timber);
  for (let row = 0; row < 8; row++) for (let col = 0; col < 8; col++) {
    box(group, .44, .012, .44, (col - 3.5) * .44, .19, (row - 3.5) * .44, (row + col) % 2 ? timber : ivory);
  }
  const pieces = [[-1.1, -1.1, 'tower'], [-.65, -1.1, 'knight'], [-.2, -1.1, 'bishop'], [.25, -1.1, 'king'], [.7, -1.1, 'bishop'], [1.15, -1.1, 'tower']];
  pieces.forEach(([x, z, kind]) => {
    cylinder(group, .19, .22, .12, x, .27, z, walnut);
    if (kind === 'tower') { box(group, .24, .48, .24, x, .56, z, walnut); box(group, .36, .08, .36, x, .84, z, walnut); }
    if (kind === 'knight') { box(group, .27, .24, .32, x, .44, z, walnut); box(group, .36, .12, .18, x + .08, .6, z, walnut); }
    if (kind === 'bishop') { cylinder(group, .04, .20, .55, x, .55, z, walnut); }
    if (kind === 'king') { box(group, .28, .73, .28, x, .62, z, walnut); box(group, .44, .07, .12, x, 1.02, z, walnut); }
  });
  return group;
}
function chair() {
  const group = new THREE.Group();
  const sides = [-.96, .96];
  for (const x of sides) {
    rod(group, [[x, .04, .83], [x, .04, -.65], [x, 2.28, -.72], [x, 2.28, -.54]], .043);
    rod(group, [[x, .04, .83], [x, 1.48, .83], [x, 1.48, -.75]], .044);
    rod(group, [[x, .96, .80], [x, .96, -.70]], .039);
  }
  rod(group, [[-.96, .04, .83], [.96, .04, .83]], .038);
  rod(group, [[-.96, .04, -.65], [.96, .04, -.65]], .038);
  const seat = box(group, 1.86, .068, 1.35, 0, .98, .04, dark);
  seat.rotation.x = -.055;
  const back = box(group, 1.86, .89, .065, 0, 1.79, -.67, dark);
  back.rotation.x = -.08;
  return group;
}
const builders = { lamp, chess, chair };
let renderer = null;
let scene = null;
let camera = null;
let object = null;
let current = 'lamp';
let yaw = .5;
let pitch = .24;
let distance = 5.3;
let target = new THREE.Vector3(0, 1, 0);
let drag = null;
function draw() {
  if (!renderer || !scene || !camera) return;
  const w = viewport.clientWidth;
  const h = viewport.clientHeight;
  if (!w || !h) return;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.position.set(target.x + distance * Math.sin(yaw) * Math.cos(pitch), target.y + distance * Math.sin(pitch), target.z + distance * Math.cos(yaw) * Math.cos(pitch));
  camera.lookAt(target);
  camera.updateProjectionMatrix();
  renderer.render(scene, camera);
}
function frame() {
  const bounds = new THREE.Box3().setFromObject(object);
  bounds.getCenter(target);
  const size = bounds.getSize(new THREE.Vector3());
  const vertical = THREE.MathUtils.degToRad(camera.fov);
  const horizontal = 2 * Math.atan(Math.tan(vertical / 2) * Math.max(.35, camera.aspect));
  distance = Math.max(size.length() * .5 / Math.sin(Math.min(vertical, horizontal) / 2) * .94, 2.5);
  yaw = .5; pitch = .24;
  draw();
}
function select(name, announce = true) {
  if (!(name in builders)) return;
  current = name;
  host.dataset.object = name;
  selectors.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.select === name)));
  viewport.setAttribute('aria-label', `教学示意：${labels[name]}${renderer ? '，可拖动查看' : '，静态图解'}`);
  if (object) {
    if (scene) scene.remove(object);
    object.traverse(node => { if (node.geometry) node.geometry.dispose(); });
  }
  object = builders[name]();
  if (scene) { scene.add(object); frame(); }
  if (announce) status.textContent = `正在查看${labels[name]}的教学示意。`;
}
selectors.forEach(button => button.addEventListener('click', () => select(button.dataset.select)));
host.classList.add('object-ready');
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0xeef1f4);
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(36, 1, .1, 60);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x9aa8b7, 2.1));
  const key = new THREE.DirectionalLight(0xffffff, 2.5); key.position.set(3, 6, 5); scene.add(key);
  const fill = new THREE.DirectionalLight(0xbecbd9, 1.1); fill.position.set(-5, 3, -4); scene.add(fill);
  const shadowCanvas = document.createElement('canvas'); shadowCanvas.width = shadowCanvas.height = 128;
  const context = shadowCanvas.getContext('2d');
  const gradient = context.createRadialGradient(64, 64, 8, 64, 64, 62);
  gradient.addColorStop(0, 'rgba(24,40,60,.27)'); gradient.addColorStop(1, 'rgba(24,40,60,0)');
  context.fillStyle = gradient; context.fillRect(0, 0, 128, 128);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 4.8), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(shadowCanvas), transparent: true, depthWrite: false }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -.015; scene.add(ground);
  viewport.tabIndex = 0;
  host.classList.add('webgl-ready');
  new ResizeObserver(draw).observe(viewport);
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault(); host.classList.remove('webgl-ready'); renderer = null;
    viewport.tabIndex = -1;
    viewport.setAttribute('aria-label', `教学示意：${labels[current]}，静态图解`);
    status.textContent = '三维显示中断，已切换为静态图解。';
  });
} catch (error) {
  host.classList.remove('webgl-ready');
  viewport.tabIndex = -1;
  renderer?.dispose();
  renderer = null;
  status.textContent = '此设备无法使用三维显示，已显示静态图解。';
}
select(current, false);
if (renderer) {
  canvas.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove', event => {
    if (!drag || drag.id !== event.pointerId) return;
    yaw += (event.clientX - drag.x) * .009;
    pitch = THREE.MathUtils.clamp(pitch + (event.clientY - drag.y) * .008, -.85, 1.18);
    drag.x = event.clientX; drag.y = event.clientY; draw();
  });
  const endDrag = event => { if (drag?.id === event.pointerId) drag = null; };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('wheel', event => {
    event.preventDefault(); distance = THREE.MathUtils.clamp(distance * Math.exp(event.deltaY * .001), 2.4, 13); draw();
  }, { passive: false });
  viewport.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') yaw -= .18;
    else if (event.key === 'ArrowRight') yaw += .18;
    else if (event.key === 'ArrowUp') pitch = Math.min(1.18, pitch + .15);
    else if (event.key === 'ArrowDown') pitch = Math.max(-.85, pitch - .15);
    else if (event.key === '+' || event.key === '=') distance = Math.max(2.4, distance * .88);
    else if (event.key === '-') distance = Math.min(13, distance * 1.12);
    else if (event.key === '0') { frame(); }
    else return;
    event.preventDefault(); event.stopPropagation(); draw();
  });
  document.getElementById('object-reset').addEventListener('click', () => { frame(); status.textContent = `${labels[current]}已回到初始视角。`; });
}
window.BauhausObjects = Object.freeze({ getState: () => ({ current, yaw, pitch, distance, webgl: !!renderer }) });
})();
