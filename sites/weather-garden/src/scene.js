import * as THREE from '../vendor/three.module.js';

export function weatherTransitionScale(progress, startScale = 1) {
  const t = Math.max(0, Math.min(1, progress));
  if (t === 1) return 1;
  return 1 + (startScale - 1) * Math.exp(-6 * t) + .035 * Math.sin(2 * Math.PI * t) * Math.exp(-3 * t);
}

export class WeatherScene {
  constructor(canvas, { gray = false } = {}) {
    this.canvas = canvas; this.gray = gray; this.disposed = false;
    this.motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
    this.reduced = this.motionQuery.matches;
    this.visible = true; this.windEnabled = false; this.time = 0;
    this.drag = null; this.yaw = 0; this.pitch = 0; this.targetYaw = 0; this.targetPitch = 0;
    this.yawVelocity = 0; this.pitchVelocity = 0;
    this.up = new THREE.Vector3(0, 1, 0); this.tangent = new THREE.Vector3();
    this.kind = 'partly'; this.reading = { wind: 0, direction: 0, precipitation: 0 };
    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(34, 1, .1, 60);
    this.camera.position.set(0, 1.35, 8.3); this.camera.lookAt(-.1, .15, 0);
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0xa9b6c2, 1.1));
    this.key = new THREE.DirectionalLight(0xffffff, 2.7); this.key.position.set(-3, 6, 5); this.scene.add(this.key);
    const fill = new THREE.DirectionalLight(0xe2efff, .7); fill.position.set(5, 1, 2); this.scene.add(fill);
    const rim = new THREE.DirectionalLight(0xffffff, 1.3); rim.position.set(1, 4, -4); this.scene.add(rim);
    this.root = new THREE.Group(); this.scene.add(this.root);
    this.materials = {};
    const material = (name, color) => this.materials[name] = new THREE.MeshPhysicalMaterial({ color: gray ? '#c4c9cd' : color, roughness: .5, metalness: 0, clearcoat: .12, clearcoatRoughness: .4 });
    material('cloud', '#fff7ee'); material('sun', '#eca56b'); material('ray', '#f3c799'); material('rain', '#79afca'); material('moon', '#c9cce8'); material('dark', '#526c7e');
    material('cheek', '#e8b9ad'); material('snow', '#dce9f1');
    this.materials.cloud.roughness = .62;
    this.materials.rain.roughness = .22; this.materials.rain.clearcoat = .55;
    this.materials.sun.clearcoat = .28;
    this.makeEnvironment();
    this.sun = new THREE.Group();
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(.84, 40, 28), this.materials.sun); sphere.scale.z = .55; this.sun.add(sphere);
    const rayGeometry = new THREE.CapsuleGeometry(.095, .25, 5, 12);
    for (let i = 0; i < 10; i++) {
      const a = i * Math.PI / 5;
      const ray = new THREE.Mesh(rayGeometry, this.materials.ray);
      ray.position.set(Math.sin(a) * 1.13, Math.cos(a) * 1.13, -.01); ray.rotation.z = -a; this.sun.add(ray);
    }
    this.root.add(this.sun);
    const shape = new THREE.Shape();
    shape.moveTo(-1.65, -.55);
    shape.bezierCurveTo(-2.4, -.55, -2.3, .45, -1.64, .49);
    shape.bezierCurveTo(-1.78, 1.44, -.45, 1.68, -.13, .84);
    shape.bezierCurveTo(.38, 1.37, 1.19, 1.1, 1.18, .54);
    shape.bezierCurveTo(2.08, .66, 2.36, -.55, 1.53, -.55);
    shape.lineTo(-1.65, -.55);
    const geometry = new THREE.ExtrudeGeometry(shape, { depth: .65, bevelEnabled: true, bevelSegments: 6, steps: 1, bevelSize: .20, bevelThickness: .23, curveSegments: 24 });
    geometry.translate(0, -.25, -.35);
    this.cloud = new THREE.Mesh(geometry, this.materials.cloud); this.cloud.scale.setScalar(.86); this.cloud.rotation.z = -.055;
    this.root.add(this.cloud);
    this.drops = new THREE.Group();
    const dropGeometry = new THREE.SphereGeometry(.09, 12, 10);
    for (let i = 0; i < 9; i++) {
      const drop = new THREE.Mesh(dropGeometry, this.materials.rain);
      drop.scale.set(.75, 1.7, .75); drop.userData.seed = i * .73;
      drop.position.set((i % 3 - 1) * .73, -1 - Math.floor(i / 3) * .3, .35);
      this.drops.add(drop);
    }
    this.root.add(this.drops);
    this.buildDetails();
    const groundCanvas = document.createElement('canvas'); groundCanvas.width = groundCanvas.height = 128;
    const g = groundCanvas.getContext('2d'), gradient = g.createRadialGradient(64, 64, 4, 64, 64, 62);
    gradient.addColorStop(0, 'rgba(61,83,103,.22)'); gradient.addColorStop(1, 'rgba(61,83,103,0)'); g.fillStyle = gradient; g.fillRect(0, 0, 128, 128);
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(5.7, 2.9), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(groundCanvas), transparent: true, depthWrite: false, opacity: .75 }));
    shadow.rotation.x = -Math.PI / 2; shadow.position.set(0, -1.55, 0); this.scene.add(shadow);
    this.setWeather('partly', this.reading, true);
    this.resizeObserver = new ResizeObserver(() => this.resize()); this.resizeObserver.observe(canvas.parentElement); this.resize();
    this.intersectionObserver = new IntersectionObserver(entries => { this.visible = entries[0].isIntersecting; if (this.visible) this.start(); else if (this.drag) this.reset(); }); this.intersectionObserver.observe(canvas);
    this.visibilityHandler = () => { if (document.hidden && this.drag) this.reset(); if (!document.hidden) this.start(); };
    document.addEventListener('visibilitychange', this.visibilityHandler);
    this.motionHandler = event => { this.reduced = event.matches; this.bounce = 1; this.reset(); };
    this.motionQuery.addEventListener('change', this.motionHandler);
    this.bindInteraction(); this.start();
  }
  makeEnvironment() {
    const room = new THREE.Scene();
    const box = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.BackSide })); room.add(box);
    for (const [x, y, z, color] of [[-4, 4, 2, 0xfff1e0], [4, 2, -2, 0xc7dfe9]]) {
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(5, 5), new THREE.MeshBasicMaterial({ color })); plane.position.set(x, y, z); plane.lookAt(0, 0, 0); room.add(plane);
    }
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.environment = pmrem.fromScene(room, .02, .1, 30); this.scene.environment = this.environment.texture;
    Object.values(this.materials).forEach(m => { m.envMapIntensity = .28; });
    pmrem.dispose(); room.traverse(o => { o.geometry?.dispose(); o.material?.dispose(); });
  }
  buildDetails() {
    const eyeGeo = new THREE.SphereGeometry(.044, 12, 10);
    for (const x of [-.34, .34]) {
      const eye = new THREE.Mesh(eyeGeo, this.materials.dark); eye.scale.set(1, 1.35, .4); eye.position.set(x, .05, .58); this.cloud.add(eye);
      const cheek = new THREE.Mesh(new THREE.SphereGeometry(.095, 16, 10), this.materials.cheek); cheek.scale.set(1, .42, .15); cheek.position.set(x * 1.6, -.09, .58); this.cloud.add(cheek);
      const sunEye = new THREE.Mesh(eyeGeo, this.materials.dark); sunEye.scale.z = .4; sunEye.position.set(x * .68, .02, .49); this.sun.add(sunEye);
    }
    const smile = new THREE.CatmullRomCurve3([new THREE.Vector3(-.13, -.11, .59), new THREE.Vector3(0, -.17, .59), new THREE.Vector3(.13, -.11, .59)]);
    this.cloud.add(new THREE.Mesh(new THREE.TubeGeometry(smile, 14, .016, 6, false), this.materials.dark));
    const moon = new THREE.Shape(); moon.moveTo(.48, 1.03);
    moon.bezierCurveTo(-.85, 1.42, -1.6, .05, -.82, -.88); moon.bezierCurveTo(-.10, -1.58, 1.16, -.94, 1.08, -.29); moon.bezierCurveTo(.18, -.6, -.53, .18, .48, 1.03);
    const moonGeo = new THREE.ExtrudeGeometry(moon, { depth: .45, bevelEnabled: true, bevelSegments: 5, bevelSize: .13, bevelThickness: .16, curveSegments: 28 }); moonGeo.translate(0, 0, -.25);
    this.moon = new THREE.Mesh(moonGeo, this.materials.moon); this.moon.scale.setScalar(1.25); this.root.add(this.moon);
    this.snow = new THREE.Group(); const snowGeo = new THREE.IcosahedronGeometry(.10, 0);
    for (let i = 0; i < 12; i++) { const flake = new THREE.Mesh(snowGeo, this.materials.snow); flake.position.set((i % 4 - 1.5) * .55, -1, .4); flake.userData.seed = i * .57; this.snow.add(flake); }
    this.root.add(this.snow);
    const boltShape = new THREE.Shape(); boltShape.moveTo(.07, .62); boltShape.lineTo(-.3, -.06); boltShape.lineTo(-.03, -.06); boltShape.lineTo(-.2, -.69); boltShape.lineTo(.42, .14); boltShape.lineTo(.11, .14); boltShape.closePath();
    this.bolt = new THREE.Mesh(new THREE.ExtrudeGeometry(boltShape, { depth: .15, bevelEnabled: true, bevelSize: .035, bevelThickness: .035, bevelSegments: 3 }), this.materials.ray); this.bolt.position.set(0, -.85, .6); this.root.add(this.bolt);
    this.fog = new THREE.Group(); const fogGeo = new THREE.CapsuleGeometry(.04, 2.6, 4, 10);
    for (let i = 0; i < 3; i++) { const bar = new THREE.Mesh(fogGeo, this.materials.snow); bar.rotation.z = Math.PI / 2; bar.position.set((i % 2 ? -.2 : .15), -.9 - i * .22, .5); this.fog.add(bar); } this.root.add(this.fog);
    this.windGroup = new THREE.Group(); this.windGroup.position.z = -.65; this.root.add(this.windGroup); this.streams = [];
    const windMaterial = new THREE.MeshBasicMaterial({ color: 0x72a69b, transparent: true, opacity: .32, depthWrite: false });
    const markerMaterial = new THREE.MeshStandardMaterial({ color: 0x77a59a, roughness: .6 });
    const markerGeometry = new THREE.ConeGeometry(.045, .13, 7);
    for (let i = 0; i < 7; i++) {
      const yy = (i - 3) * .52;
      const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(-3.1, yy, 0), new THREE.Vector3(-1.5, yy + .22, .05), new THREE.Vector3(0, yy - .15, .05), new THREE.Vector3(1.5, yy + .12, .03), new THREE.Vector3(3.1, yy, 0)]);
      const line = new THREE.Mesh(new THREE.TubeGeometry(curve, 38, .008, 4, false), windMaterial); this.windGroup.add(line);
      const marker = new THREE.Mesh(markerGeometry, markerMaterial); this.windGroup.add(marker); this.streams.push({ curve, marker, seed: i * .127 });
    }
  }
  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.renderer.setSize(rect.width, rect.height, false); this.camera.aspect = rect.width / Math.max(1, rect.height);
    this.camera.position.z = this.camera.aspect < 1.3 ? 9 : 7.6;
    this.camera.lookAt(-.1, .15, 0); this.camera.updateProjectionMatrix(); this.start();
  }
  setWeather(kind, reading = {}, instant = false) {
    this.reading = reading; const changed = this.kind !== kind; this.kind = kind;
    this.sun.visible = kind === 'sun' || kind === 'partly';
    this.sun.position.set(kind === 'partly' ? -1.1 : 0, kind === 'partly' ? .8 : .15, kind === 'partly' ? -.6 : 0);
    this.sun.scale.setScalar(kind === 'sun' ? 1.35 : 1);
    this.moon.visible = kind === 'moon';
    this.cloud.visible = !['sun', 'moon'].includes(kind);
    this.cloud.position.y = ['rain', 'snow', 'storm'].includes(kind) ? .25 : -.10;
    this.drops.visible = ['rain', 'storm'].includes(kind); this.snow.visible = kind === 'snow';
    this.bolt.visible = kind === 'storm'; this.fog.visible = kind === 'fog';
    if (!this.gray) this.materials.cloud.color.set(kind === 'storm' ? '#a9bfd0' : kind === 'rain' ? '#c1d4df' : kind === 'snow' ? '#edf4f5' : '#fff7ee');
    this.windGroup.visible = this.windEnabled && Number.isFinite(reading.wind) && Number.isFinite(reading.direction);
    this.windGroup.rotation.z = -(reading.direction || 0) * Math.PI / 180 - Math.PI / 2;
    if (changed && !instant && !this.reduced) { this.bounceStart = this.root.scale.x; this.bounce = 0; }
    this.start();
  }
  setWind(enabled) { this.windEnabled = enabled; this.setWeather(this.kind, this.reading, true); }
  reset() {
    const pointerId = this.drag?.pointerId;
    this.drag = null; this.targetYaw = this.targetPitch = 0;
    if (pointerId != null && this.canvas.hasPointerCapture?.(pointerId)) this.canvas.releasePointerCapture(pointerId);
    this.start();
  }
  bindInteraction() {
    this.handlers = {
      pointerdown: e => {
        if (e.isPrimary === false || (e.button && e.button !== 0)) return;
        this.drag = { pointerId: e.pointerId, x: e.clientX, y: e.clientY, yaw: this.yaw, pitch: this.pitch, touch: e.pointerType === 'touch' };
        try { this.canvas.setPointerCapture?.(e.pointerId); } catch { /* Global release handling remains available. */ }
        this.start();
      },
      pointermove: e => { if (!this.drag) return; const dx = e.clientX - this.drag.x, dy = e.clientY - this.drag.y; if (this.drag.touch && Math.abs(dy) > Math.abs(dx) * 1.4 && Math.abs(dy) > 12) { this.reset(); return; } this.targetYaw = Math.max(-1.35, Math.min(1.35, this.drag.yaw + dx * .009)); this.targetPitch = Math.max(-.5, Math.min(.5, this.drag.pitch + dy * .006)); },
      pointerup: () => this.reset(), pointercancel: () => this.reset(), lostpointercapture: () => this.reset(),
      keydown: e => {
        if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Escape'].includes(e.key)) return;
        e.preventDefault();
        if (e.key === 'Escape') this.reset();
        else {
          this.targetYaw = Math.max(-1.35, Math.min(1.35, this.targetYaw + (e.key === 'ArrowLeft' ? -.35 : e.key === 'ArrowRight' ? .35 : 0)));
          this.targetPitch = Math.max(-.5, Math.min(.5, this.targetPitch + (e.key === 'ArrowUp' ? -.2 : e.key === 'ArrowDown' ? .2 : 0)));
          clearTimeout(this.keyTimer); this.keyTimer = setTimeout(() => this.reset(), 650); this.start();
        }
      },
    };
    Object.entries(this.handlers).forEach(([name, fn]) => this.canvas.addEventListener(name, fn));
    this.releaseHandler = event => { if (this.drag && (event.type === 'blur' || event.pointerId === this.drag.pointerId)) this.reset(); };
    for (const name of ['pointerup', 'pointercancel', 'blur']) window.addEventListener(name, this.releaseHandler);
  }
  start() { if (this.raf || this.disposed) return; this.last = performance.now(); this.raf = requestAnimationFrame(now => this.frame(now)); }
  frame(now) {
    this.raf = null; if (this.disposed || !this.visible || document.hidden) return;
    const dt = Math.max(0, Math.min(.035, (now - this.last) / 1000)); this.last = now; this.time += dt;
    if (this.reduced) { this.yaw = this.targetYaw; this.pitch = this.targetPitch; }
    else if (this.drag) {
      const ease = 1 - Math.exp(-16 * dt); this.yaw += (this.targetYaw - this.yaw) * ease; this.pitch += (this.targetPitch - this.pitch) * ease;
      this.yawVelocity = this.pitchVelocity = 0;
    } else {
      this.yawVelocity += ((this.targetYaw - this.yaw) * 95 - this.yawVelocity * 15) * dt;
      this.pitchVelocity += ((this.targetPitch - this.pitch) * 95 - this.pitchVelocity * 15) * dt;
      this.yaw += this.yawVelocity * dt; this.pitch += this.pitchVelocity * dt;
    }
    this.root.rotation.set(this.pitch + .06, this.yaw - .15, 0);
    this.root.position.y = this.reduced ? 0 : Math.sin(this.time * 1.05) * .035;
    if (!this.reduced && this.bounce != null && this.bounce < 1) {
      this.bounce = Math.min(1, this.bounce + dt / .48);
      this.root.scale.setScalar(weatherTransitionScale(this.bounce, this.bounceStart));
    } else this.root.scale.setScalar(1);
    const motionTime = this.reduced ? 0 : this.time;
    const rate = .7 + Math.min(this.reading.precipitation || 0, 8) * .16;
    const slant = -Math.sin((this.reading.direction || 0) * Math.PI / 180) * Math.min(this.reading.wind || 0, 12) * .025;
    if (this.drops.visible) this.drops.children.forEach((drop, i) => {
      const p = (motionTime * rate + drop.userData.seed) % 1;
      drop.position.set((i % 3 - 1) * .74 + slant * p, -.5 - p * 1.12, .36); drop.rotation.z = -slant;
    });
    if (this.snow.visible) this.snow.children.forEach((flake, i) => {
      const p = (motionTime * .35 + flake.userData.seed) % 1;
      flake.position.set((i % 4 - 1.5) * .54 + Math.sin(motionTime + i) * .12, -.48 - p * 1.16, .4); flake.rotation.z = motionTime * .2 + i;
    });
    if (this.windGroup.visible) {
      this.windPhase = (this.windPhase || 0) + (this.reduced ? 0 : dt * Math.min(this.reading.wind || 0, 18) * .025);
      this.streams.forEach(({ curve, marker, seed }) => {
        const u = ((this.windPhase + seed) % 1 + 1) % 1; marker.position.copy(curve.getPoint(u)); this.tangent.copy(curve.getTangent(u)).normalize(); marker.quaternion.setFromUnitVectors(this.up, this.tangent);
      });
    }
    this.renderer.render(this.scene, this.camera);
    if (!this.reduced || this.drag) this.raf = requestAnimationFrame(t => this.frame(t));
  }
  dispose() {
    this.disposed = true; cancelAnimationFrame(this.raf); clearTimeout(this.keyTimer);
    this.resizeObserver.disconnect(); this.intersectionObserver.disconnect(); document.removeEventListener('visibilitychange', this.visibilityHandler);
    this.motionQuery.removeEventListener('change', this.motionHandler);
    Object.entries(this.handlers).forEach(([name, fn]) => this.canvas.removeEventListener(name, fn));
    for (const name of ['pointerup', 'pointercancel', 'blur']) window.removeEventListener(name, this.releaseHandler);
    const geometries = new Set(), materials = new Set(), textures = new Set();
    this.scene.traverse(o => { if (o.geometry) geometries.add(o.geometry); if (o.material) materials.add(o.material); });
    materials.forEach(m => { if (m.map) textures.add(m.map); m.dispose(); }); geometries.forEach(g => g.dispose()); textures.forEach(t => t.dispose()); this.environment?.dispose(); this.renderer.dispose();
  }
}
