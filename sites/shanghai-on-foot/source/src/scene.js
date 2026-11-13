import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { footprint, extrude, ribbon, PALETTE, MANSION_ID, STORE_ID } from './geometry.js';
import { enhanceCity } from './details.js';
import { landmarks, finishPoint } from './landmarks.js';

export class WalkScene {
  constructor(container, data, {gray = false, onSelect = () => {}} = {}) {
    this.container = container;
    this.data = data;
    this.gray = gray;
    this.onSelect = onSelect;
    this.reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(PALETTE.paper);
    this.scene.fog = new THREE.Fog(PALETTE.paper, 2200, 3100);
    this.renderer = new THREE.WebGLRenderer({antialias: true, alpha: false});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth <= 760 ? 1.5 : 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.02;
    container.append(this.renderer.domElement);
    this.renderer.domElement.setAttribute('aria-label', '可旋转的三维街区；也可以使用地点列表浏览各站');
    this.camera = new THREE.PerspectiveCamera(34, 1, 1, 6500);
    this.camera.position.set(1050, 1050, 1400);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 65;
    this.controls.maxDistance = 4200;
    this.controls.minPolarAngle = 0.12;
    this.controls.maxPolarAngle = Math.PI / 2.12;
    this.controls.maxTargetRadius = 1400;
    this.controls.target.set(0, 0, 0);
    this.scene.add(new THREE.HemisphereLight(PALETTE.skyLight, PALETTE.bounceLight, 1.3));
    this.sun = new THREE.DirectionalLight(PALETTE.sunLight, 2.5);
    this.sun.position.set(-400, 800, 450);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(innerWidth <= 760 ? 2048 : 4096, innerWidth <= 760 ? 2048 : 4096);
    Object.assign(this.sun.shadow.camera, {left: -800, right: 800, top: 800, bottom: -800, near: 50, far: 2400});
    this.sun.shadow.bias = -0.0003;
    this.sun.shadow.normalBias = 0.5;
    this.scene.add(this.sun);
    this.scene.add(this.sun.target);
    this.scene.add(new THREE.DirectionalLight(PALETTE.fillLight, 0.45));
    this.city = new THREE.Group();
    this.scene.add(this.city);
    this.buildGraybox();
    if (!gray) enhanceCity(this);
    this.bindPicking();
    this.needsRender = true;
    this.controls.addEventListener('start', () => {this.flight = null;});
    this.controls.addEventListener('change', () => {this.needsRender = true;});
    this.resize = this.resize.bind(this);
    this.observer = new ResizeObserver(this.resize);
    this.observer.observe(container);
    this.resize();
    this.overview(false);
    this.renderer.setAnimationLoop(time => {
      if (this.flight) {
        const t = Math.min(1, (time - this.flight.started) / 1300);
        const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        this.camera.position.lerpVectors(this.flight.fromPosition, this.flight.position, ease);
        this.controls.target.lerpVectors(this.flight.fromTarget, this.flight.target, ease);
        if (t === 1) this.flight = null;
      }
      this.controls.update();
      this.camera.position.y = Math.max(2, this.camera.position.y);
      const distance = this.camera.position.distanceTo(this.controls.target);
      this.scene.fog.near = distance + 300;
      this.scene.fog.far = distance + 1000;
      if (this.needsRender || this.flight) {
        this.renderer.render(this.scene, this.camera); this.onFrame?.(); this.needsRender = false;
      }
    });
  }

  buildGraybox() {
    const material = new THREE.MeshStandardMaterial({color: PALETTE.gray, roughness: 1});
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(16000, 16000), new THREE.MeshStandardMaterial({color: this.gray ? PALETTE.paper : PALETTE.ground, roughness: 1}));
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.city.add(ground);
    this.buildingMeshes = new Map();
    for (const b of this.data.buildings) {
      const landmark = Object.values(landmarks).find(l=>l.buildingId===b.id);
      const height = landmark?.height || b.height;
      const mesh = extrude(footprint(b.polygon, b.holes), height, material, b.minHeight);
      mesh.userData.building = b;
      this.buildingMeshes.set(b.id, mesh);
      this.city.add(mesh);
    }
    const roadMaterial = new THREE.MeshStandardMaterial({color: PALETTE.road, side: THREE.DoubleSide});
    for (const road of this.data.roads) this.city.add(ribbon(road.points, road.class === 'primary' ? 18 : road.class === 'secondary' ? 13 : 8, roadMaterial));
    this.routeLine = ribbon(this.data.route, 2.1, new THREE.MeshBasicMaterial({color: PALETTE.route, side: THREE.DoubleSide}), 0.4);
    this.city.add(this.routeLine);
    const scale = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), new THREE.MeshStandardMaterial({color: '#555555'}));
    scale.position.set(-172, 1, 505); this.city.add(scale);
    this.scaleReference = scale;
    this.mansion = this.buildingMeshes.get(MANSION_ID);
    const ring = new THREE.Mesh(new THREE.RingGeometry(3, 4.3, 48), new THREE.MeshBasicMaterial({color: PALETTE.route, side: THREE.DoubleSide}));
    ring.rotation.x = -Math.PI / 2; ring.position.set(-172, 0.5, 551); this.city.add(ring);
    const cone = new THREE.Shape(); cone.moveTo(-172, -551); cone.lineTo(-174, -490); cone.lineTo(-127, -500); cone.closePath();
    this.photoCone = new THREE.Mesh(new THREE.ShapeGeometry(cone), new THREE.MeshBasicMaterial({color: PALETTE.route, transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false}));
    this.photoCone.rotation.x = -Math.PI / 2; this.photoCone.position.y = 0.45; this.photoCone.visible = false; this.city.add(this.photoCone);
  }

  resize() {
    const {width, height} = this.container.getBoundingClientRect();
    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.needsRender = true;
    if (this.ready) this.focus(this.active || null, false);
  }

  setView(position, target) {
    this.flight = null;
    this.camera.position.set(...position);
    this.controls.target.set(...target);
    this.controls.update();
  }

  fly(position, target, animate = true) {
    this.needsRender = true;
    if (!animate || this.reducedMotion.matches) {this.setView(position, target); return;}
    this.flight = {fromPosition: this.camera.position.clone(), fromTarget: this.controls.target.clone(), position: new THREE.Vector3(...position), target: new THREE.Vector3(...target), started: performance.now()};
  }

  overview(animate = true) {
    this.active = null;
    this.setContextFocus(false);
    this.controls.minDistance = 65;
    this.controls.maxPolarAngle = Math.PI / 2.12;
    const aspect = this.camera.aspect;
    const distance = aspect < 1 ? 2550 / aspect : 2250;
    const target = new THREE.Vector3(250,0,-55);
    const direction = new THREE.Vector3(0.75, 1.65, 1.5).normalize().multiplyScalar(distance);
    this.fly(direction.add(target).toArray(), target.toArray(), animate);
    this.photoCone.visible = false;
    this.ready = true;
  }

  focus(id, animate = true) {
    if (!id) {this.overview(animate); return;}
    this.active = id;
    this.setContextFocus(id!=='finish');
    this.controls.minDistance = ['mansion','photo','finish'].includes(id) ? 65 : 28;
    this.controls.maxPolarAngle = id === 'photo' ? 1.72 : Math.PI / 2.12;
    const target = this.targetFor(id);
    const offset = landmarks[id]?.offset || (id==='photo' ? [-38,-8,97] : [120,160,180]);
    const scale = Math.max(1, 1.05 / this.camera.aspect);
    let position = offset.map((n, i) => target[i] + n * scale);
    const bounds=this.boundsFor(id);
    if(bounds){
      // Fit the actual assembled geometry, including eaves and entrance steps.
      // Portrait viewports and tall shopfronts must never crop the ground floor.
      const direction=new THREE.Vector3(...offset).normalize(),right=new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),direction).normalize(),up=new THREE.Vector3().crossVectors(direction,right);
      const tanV=Math.tan(THREE.MathUtils.degToRad(this.camera.fov)/2),tanH=tanV*this.camera.aspect;
      let distance=this.controls.minDistance;
      for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){
        const p=new THREE.Vector3(x-target[0],y-target[1],z-target[2]);
        distance=Math.max(distance,p.dot(direction)+Math.max(Math.abs(p.dot(up))/tanV,Math.abs(p.dot(right))/tanH)*1.32);
      }
      position=direction.multiplyScalar(distance).add(new THREE.Vector3(...target)).toArray();
    }
    this.fly(position, target, animate);
    this.photoCone.visible = id === 'photo';
  }

  targetFor(id) {
    if (id==='photo') return [-138,14,475];
    if (id==='finish') return [finishPoint[0],8,finishPoint[1]];
    const l=landmarks[id];
    const b=this.data.buildings.find(b=>b.id===l?.buildingId);
    const bounds=this.boundsFor(id);
    return l?.target || (bounds?bounds.getCenter(new THREE.Vector3()).toArray():b ? [b.center[0],l.height*0.55,b.center[1]] : [0,0,0]);
  }

  boundsFor(id){
    if(!landmarks[id]||this.gray)return null;
    this.landmarkBounds ||= new Map();
    if(!this.landmarkBounds.has(id)){
      const group=this.landmarks?.find(g=>g.userData.stop===id);
      if(!group)return null;
      this.landmarkBounds.set(id,new THREE.Box3().setFromObject(group));
    }
    return this.landmarkBounds.get(id);
  }

  setContextFocus(focused) {
    // Architectural focus mode makes neighboring massing translucent so a
    // courtyard facade remains inspectable from every direction.
    const mats=new Set((this.contextMeshes||[]).map(o=>o.material));
    for(const m of mats){m.opacity=focused?0.07:1;m.transparent=focused;m.depthWrite=!focused;m.needsUpdate=true;}
    const target=focused?this.targetFor(this.active):null;
    const range=focused?(this.active==='mansion'||this.active==='photo'?105:58):800;
    Object.assign(this.sun.shadow.camera,{left:-range,right:range,top:range,bottom:-range,near:focused?5:50,far:focused?650:2400});
    this.sun.shadow.camera.updateProjectionMatrix();
    this.sun.shadow.normalBias=focused?.035:.5;
    if(focused){this.sun.target.position.set(...target);this.sun.position.set(target[0]-160,target[1]+240,target[2]+150);}
    else{this.sun.target.position.set(0,0,0);this.sun.position.set(-400,800,450);}
    this.sun.target.updateMatrixWorld();this.sun.shadow.needsUpdate=true;
    for(const o of this.contextMeshes||[]){
      o.castShadow=!focused;
      o.visible=true;
      if(!focused)continue;
      // Nearby transparent walls still paint over delicate ironwork. Suppress
      // those occluders and batched context windows/trees in inspection mode;
      // retain distant, faint massing and the real street layout.
      if(o.isInstancedMesh){o.visible=false;continue;}
      if(!o.geometry.boundingSphere)o.geometry.computeBoundingSphere();
      const sphere=o.geometry.boundingSphere;
      o.visible=Math.hypot(sphere.center.x+o.position.x-target[0],sphere.center.z+o.position.z-target[2])>55+sphere.radius;
    }
  }

  anchorFor(id) {
    if (id==='photo') return [-172,4,551];
    const p=this.targetFor(id);
    return [p[0],(landmarks[id]?.height || 4)+8,p[2]];
  }

  zoom(factor) {
    const offset = this.camera.position.clone().sub(this.controls.target);
    offset.setLength(THREE.MathUtils.clamp(offset.length() * factor, this.controls.minDistance, this.controls.maxDistance));
    this.fly(offset.add(this.controls.target).toArray(), this.controls.target.toArray(), false);
  }

  north() {
    const distance = this.camera.position.distanceTo(this.controls.target);
    this.fly(this.controls.target.clone().add(new THREE.Vector3(0, 0.9, 0.8).normalize().multiplyScalar(distance)).toArray(), this.controls.target.toArray());
  }

  bindPicking() {
    const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2();
    const canvas = this.renderer.domElement;
    let down = null;
    const getHit = event => {
      const r = canvas.getBoundingClientRect();
      pointer.set((event.clientX - r.left) / r.width * 2 - 1, -(event.clientY - r.top) / r.height * 2 + 1);
      raycaster.setFromCamera(pointer, this.camera);
      return raycaster.intersectObjects(this.landmarks || [], true)[0];
    };
    canvas.addEventListener('pointerdown', event => {down = [event.clientX, event.clientY];});
    canvas.addEventListener('pointermove', event => {if (!event.buttons) canvas.style.cursor = getHit(event) ? 'pointer' : 'grab';});
    canvas.addEventListener('pointerup', event => {
      if (!down || Math.hypot(event.clientX - down[0], event.clientY - down[1]) > 5) return;
      const hit = getHit(event); if (hit) this.onSelect(hit.object.userData.stop);
      down = null;
    });
    canvas.addEventListener('webglcontextlost', event => {event.preventDefault(); this.onError?.('三维画面暂时中断，你仍可通过地点列表阅读路书。刷新页面可重试。');});
  }

  project(point) {
    const p = new THREE.Vector3(...point).project(this.camera);
    return {x: (p.x + 1) / 2 * this.container.clientWidth, y: (-p.y + 1) / 2 * this.container.clientHeight, visible: p.z > -1 && p.z < 1 && Math.abs(p.x) < 1.08 && Math.abs(p.y) < 1.1};
  }
}
