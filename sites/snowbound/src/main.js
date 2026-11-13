import * as THREE from 'three';
import './style.css';
import { World } from './world.js';
import { createSkier } from './skier.js';
import { Panorama } from './scenery.js';
import { Effects } from './effects.js';
import { clamp, lerp, routeAt, elevationAt, groundAt, biomeAt, intersectsObstacle, getRegionStart, MAX_SPEED, REGIONS } from './course.js';

const $ = id => document.getElementById(id);
const canvas = $('scene');
let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' }); }
catch (error) { $('fatal-error').hidden = false; $('error-message').textContent = `当前浏览器无法创建三维画面。请开启硬件加速后重试。${error.message}`; }
$('reload-button').onclick = () => location.reload();
if (renderer) startApp();

function startApp() {
  const mobile = matchMedia('(pointer: coarse)').matches || innerWidth <= 700;
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 1.75));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.12;
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#cbdde2'); scene.fog = new THREE.Fog('#d4e2e6', 95, 540);
  const camera = new THREE.PerspectiveCamera(47, innerWidth / innerHeight, .1, 1600);
  const ambient = new THREE.HemisphereLight('#c7e1ee', '#819496', 1.95); scene.add(ambient);
  const sun = new THREE.DirectionalLight('#fff0d6', 2.4); sun.position.set(-50, 85, -50); sun.castShadow = true; sun.shadow.radius = 2.5;
  const fill = new THREE.DirectionalLight('#dce8ed', .95); fill.position.set(12, 30, 70); scene.add(fill);
  sun.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048); Object.assign(sun.shadow.camera, { left: -65, right: 65, top: 65, bottom: -65, near: 1, far: 260 }); sun.shadow.bias = -.0003; sun.shadow.normalBias = .065; scene.add(sun, sun.target);
  const seedStart = 418;
  let seed = seedStart, state = 'ready', time = 0, crashTime = 0, last = performance.now(), steer = 0, cameraX = routeAt(0, seed), previousRegion = -1, landing = 0;
  let quality = mobile ? .75 : 1, frameAverage = 16.7, frameSamples = 0;
  let selectedRegion = 0, runStartDistance = getRegionStart(selectedRegion);
  const player = { distance: 0, x: routeAt(0, seed), vx: 0, speed: 12, jump: 0, vy: 0 };
  const keys = new Set(); let pointerStart = null, touchSteer = 0;
  const world = new World(scene, seed); world.update(0);
  const skier = createSkier(); scene.add(skier.group);
  const panorama = new Panorama(scene);
  const effects = new Effects(scene, mobile, renderer.getPixelRatio());
  const cameraGoal = new THREE.Vector3(), target = new THREE.Vector3();
  const environmentColor = new THREE.Color();
  let inspectAngle = null;
  const placeInputs = [...document.querySelectorAll('input[name="start-region"]')];
  const runDistance = () => Math.max(0, player.distance - runStartDistance);

  function setState(next) {
    state = next; document.body.dataset.state = state;
    $('welcome').hidden = next !== 'ready'; $('welcome-footer').hidden = next !== 'ready';
    $('hud').hidden = next === 'ready'; $('overlay').hidden = !['paused', 'crashed'].includes(next);
    $('touch-controls').hidden = next !== 'playing'; keys.clear(); touchSteer = 0; pointerStart = null;
    if (next === 'paused' || next === 'crashed') {
      const crash = next === 'crashed';
      $('overlay-eyebrow').textContent = crash ? 'UNTIL THE NEXT RUN' : 'TAKE A BREATH';
      $('overlay-title').textContent = crash ? '雪地接住了你。' : '在雪里，停一会。';
      $('overlay-description').textContent = crash ? '拍拍雪，还有新的风景在前方。' : '山野会在这里等你。';
      $('result').hidden = !crash; $('result-distance').textContent = Math.floor(runDistance()).toLocaleString('en-US');
      $('resume-button').hidden = crash; $('restart-label').textContent = crash ? '再滑一次' : '重新开始';
      $('restart-button').className = crash ? 'primary-button' : 'secondary-button';
      $('overlay-hint').textContent = crash ? 'R 再滑一次' : 'ESC 继续 · R 重新开始';
      (crash ? $('restart-button') : $('resume-button')).focus({ preventScroll: true });
    } else if (next === 'playing') canvas.focus({ preventScroll: true });
  }
  function resetCourse() {
    runStartDistance = getRegionStart(selectedRegion);
    Object.assign(player, { distance: runStartDistance, x: routeAt(runStartDistance, seed), vx: 0, speed: 12, jump: 0, vy: 0 });
    steer = 0; crashTime = 0; landing = 0; cameraX = player.x;
    effects.reset(); world.reset(seed, runStartDistance); world.update(runStartDistance);
    $('distance').textContent = '0';
    const name = placeInputs[selectedRegion].dataset.name;
    $('selected-place').textContent = `已选 · ${name}`;
    $('start-button').querySelector('span').textContent = `从${name}出发`;
  }
  function restart() {
    seed = (seed + 137) % 100000;
    resetCourse(); setState('playing');
  }
  function chooseLocation() {
    setState('ready'); resetCourse();
    placeInputs[selectedRegion].focus({ preventScroll: true });
  }
  function pause() { if (state === 'playing') setState('paused'); else if (state === 'paused') setState('playing'); }
  function jump() { if (state === 'playing' && player.jump <= .001) { player.vy = 6.8; player.jump = .012; } }
  $('start-button').disabled = false; $('start-button').querySelector('span').textContent = '从松林出发';
  $('start-button').onclick = restart; $('pause-button').onclick = pause; $('resume-button').onclick = pause; $('restart-button').onclick = restart;
  $('location-button').onclick = chooseLocation;
  for (const input of placeInputs) input.addEventListener('change', () => {
    if (state !== 'ready' || !input.checked) return;
    selectedRegion = Number(input.value); resetCourse();
  });
  $('jump-button').addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); jump(); });
  // Keyboard and assistive activation emit click without a pointerdown.
  $('jump-button').addEventListener('click', e => { if (e.detail === 0) jump(); });
  document.addEventListener('keydown', e => {
    if (!$('fatal-error').hidden) return;
    // Let native radio arrow navigation and button activation work on the welcome screen.
    if (state === 'ready') return;
    if (['ArrowLeft', 'ArrowRight', 'Space', 'Escape', 'KeyA', 'KeyD', 'KeyR'].includes(e.code)) {
      if (e.code === 'Space' && e.target instanceof HTMLButtonElement) return;
      e.preventDefault();
      if (e.code === 'Escape' && !e.repeat) pause();
      else if (e.code === 'KeyR' && !e.repeat && state !== 'ready') restart();
      else if (e.code === 'Space' && !e.repeat) jump();
      else keys.add(e.code);
    }
    if (e.code === 'Tab' && ['paused', 'crashed'].includes(state)) {
      const buttons = [...$('overlay').querySelectorAll('button')].filter(b => !b.hidden);
      if (e.shiftKey && document.activeElement === buttons[0]) { e.preventDefault(); buttons.at(-1).focus(); }
      else if (!e.shiftKey && document.activeElement === buttons.at(-1)) { e.preventDefault(); buttons[0].focus(); }
    }
  });
  document.addEventListener('keyup', e => keys.delete(e.code));
  canvas.addEventListener('pointerdown', e => { if (state !== 'playing') return; pointerStart = e.clientX; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', e => { if (pointerStart !== null) touchSteer = clamp((e.clientX - pointerStart) / (innerWidth * .18), -1, 1); });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) canvas.addEventListener(type, () => { pointerStart = null; touchSteer = 0; });
  const deactivate = () => { keys.clear(); touchSteer = 0; pointerStart = null; if (state === 'playing') setState('paused'); };
  window.addEventListener('blur', deactivate); document.addEventListener('visibilitychange', () => { if (document.hidden) deactivate(); });
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); deactivate(); $('fatal-error').hidden = false; $('reload-button').focus({ preventScroll: true }); });
  function resize() { renderer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); }
  addEventListener('resize', resize); resize(); setState('ready');

  function update(dt) {
    if (state === 'playing') {
      const input = (keys.has('ArrowRight') || keys.has('KeyD') ? 1 : 0) - (keys.has('ArrowLeft') || keys.has('KeyA') ? 1 : 0) + touchSteer;
      steer = lerp(steer, clamp(input, -1, 1), 1 - Math.exp(-dt * 10));
      player.speed = Math.min(MAX_SPEED, player.speed + dt * .42);
      const oldRoute = routeAt(player.distance, seed);
      player.distance += player.speed * dt;
      player.x += routeAt(player.distance, seed) - oldRoute;
      player.vx = lerp(player.vx, steer * (8 + player.speed * .13), 1 - Math.exp(-dt * (world.onIce(player) ? 4.2 : 8)));
      player.x += player.vx * dt;
      player.x = clamp(player.x, routeAt(player.distance, seed) - 12, routeAt(player.distance, seed) + 12);
      if (player.jump > 0 || player.vy > 0) { player.vy -= 16 * dt; player.jump = Math.max(0, player.jump + player.vy * dt); if (!player.jump) { player.vy = 0; landing = 1; effects.burst(player, seed); } }
      world.update(player.distance);
      for (const o of world.obstacles) if (intersectsObstacle(player, o)) { crashTime = time; effects.burst(player, seed, 45); setState('falling'); break; }
    }
    if (state === 'falling' && time - crashTime > 1.05) setState('crashed');
    if (state !== 'paused') time += dt;
    if (state !== 'paused') landing = Math.max(0, landing - dt * 3.4);
    const y = groundAt(player.x, player.distance, seed) - elevationAt(player.distance);
    skier.group.position.set(player.x, y + player.jump, 0);
    skier.animate(steer, player.jump, time, state === 'crashed' || state === 'falling', time - crashTime, landing, groundAt(player.x, player.distance - .6, seed) - groundAt(player.x, player.distance + .6, seed));
    cameraX = lerp(cameraX, player.x, 1 - Math.exp(-dt * 3));
    cameraGoal.set(cameraX, 11 + y * .3, mobile ? 33 : 28);
    target.set(lerp(cameraX, routeAt(player.distance + 55, seed), .20), -1.6, -27);
    if (state === 'ready') { cameraGoal.set(player.x - (mobile ? 5 : 18), 18, 35); target.set(player.x - (mobile ? 4 : 3), 0, -32); }
    if (inspectAngle !== null) { cameraGoal.set(player.x + Math.sin(inspectAngle) * 12, 7, Math.cos(inspectAngle) * 12); target.set(player.x, 1, 0); }
    camera.position.lerp(cameraGoal, 1 - Math.exp(-dt * 4)); camera.lookAt(target);
    sun.position.set(cameraX - 55, 90, -45); sun.target.position.set(cameraX, 0, -28);
    const region = biomeAt(player.distance); const current = region.current;
    const from = REGIONS[region.from], to = REGIONS[region.to];
    scene.background.set(from.sky).lerp(environmentColor.set(to.sky), region.blend);
    scene.fog.color.set(from.fog).lerp(environmentColor.set(to.fog), region.blend);
    sun.color.set(from.light).lerp(environmentColor.set(to.light), region.blend);
    ambient.color.set(from.ambient).lerp(environmentColor.set(to.ambient), region.blend);
    panorama.update(player.distance, player.x, scene.background, scene.fog.color, region.weights[3]);
    world.animate(player.distance, time);
    effects.update(state === 'paused' ? 0 : dt, time, player, seed, steer, state === 'playing', region, world.chimneys, quality);
    $('distance').textContent = Math.floor(runDistance()).toLocaleString('en-US');
    $('region-index').textContent = `CHAPTER ${String(current + 1).padStart(2, '0')}`;
    $('region-name').textContent = REGIONS[current].name;
    $('region-progress').style.transform = `scaleX(${region.progress})`;
    if (current !== previousRegion) { $('announcement').textContent = `进入${REGIONS[current].name}`; previousRegion = current; }
  }
  camera.position.set(player.x - 18, 20, 31);
  renderer.setAnimationLoop(now => {
    const elapsed = now - last, dt = Math.min(elapsed / 1000, .04); last = now;
    if (!document.hidden && elapsed < 200) { frameAverage = lerp(frameAverage, elapsed, .02); frameSamples++; }
    if (frameSamples > 240 && frameAverage > 26 && quality > .5) {
      quality = .5; renderer.setPixelRatio(Math.min(devicePixelRatio, 1.15)); sun.shadow.mapSize.set(1024, 1024); sun.shadow.map?.dispose(); sun.shadow.map = null; resize();
    }
    if (frameSamples > 600 && frameAverage > 37 && renderer.shadowMap.enabled) renderer.shadowMap.enabled = false;
    update(dt); renderer.render(scene, camera);
  });
  // Development-only observability. Production builds do not expose test controls.
  if (import.meta.env.DEV) window.__snowbound = {
    getState: () => ({ state, ...player, seed, selectedRegion, runStartDistance, runDistance: runDistance(), region: biomeAt(player.distance), segments: world.segments.size, obstacles: world.obstacles.filter(o => o.d > player.distance && o.d < player.distance + 80), render: { ...renderer.info.render }, memory: { ...renderer.info.memory }, fps: Math.round(1000 / frameAverage), quality, onIce: world.onIce(player), chimneys: world.chimneys.length, cars: [...world.segments.values()].reduce((n,s) => n+s.userData.cars.length,0) }),
    inspect: angle => { inspectAngle = angle; },
    seek: d => { player.distance = d; player.x = routeAt(d, seed); player.jump = 0; player.vy = 0; player.vx = 0; cameraX = player.x; effects.reset(); world.update(d); },
    setPlayer: values => Object.assign(player, values),
    visualState: () => ({ camera: camera.position.toArray(), skierLean: skier.group.children[0].rotation.z, shadow: renderer.shadowMap.enabled, powder: effects.pool.filter(p => p.life > 0).length, smoke: Array.from(effects.smoke.geometry.attributes.position.array.slice(0, 12)), cars: [...world.segments.values()].flatMap(s => s.userData.cars.map(c => c.car.position.toArray())).slice(0, 3) }),
  };
}
