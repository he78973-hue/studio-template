import * as THREE from 'three';
import { SEGMENT_LENGTH, REGIONS, random, routeAt, elevationAt, groundAt, obstacleRows, biomeAt, smoothstep } from './course.js';
import { buildChaletGeometry, buildPineGeometry } from './scenery.js';

export class World {
  constructor(scene, seed = 1, runStart = 0) {
    this.scene = scene; this.seed = seed; this.runStart = runStart; this.segments = new Map(); this.obstacles = []; this.chimneys = []; this.icePatches = [];
    this.materials = {
      snow: new THREE.MeshStandardMaterial({ color: '#eef3f0', roughness: .91, flatShading: true }),
      pine: new THREE.MeshStandardMaterial({ color: '#315c58', roughness: .95, flatShading: true }),
      wood: new THREE.MeshStandardMaterial({ color: '#73533e', roughness: .95 }),
      trim: new THREE.MeshStandardMaterial({ color: '#503e35', roughness: .9 }),
      windows: new THREE.MeshStandardMaterial({ color: '#ffe2a6', emissive: '#ffbd56', emissiveIntensity: 1.65, roughness: .4 }),
      steel: new THREE.MeshStandardMaterial({ color: '#4c6265', metalness: .25, roughness: .65 }),
      red: new THREE.MeshStandardMaterial({ color: '#bc5341', roughness: .55 }),
      glass: new THREE.MeshStandardMaterial({ color: '#a3c6cc', metalness: .12, roughness: .22 }),
      rock: new THREE.MeshStandardMaterial({ color: '#849ca9', roughness: .9, flatShading: true }),
      terrain: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .97, flatShading: true }),
      ice: new THREE.MeshStandardMaterial({ color: '#9dd5e4', metalness: .12, roughness: .21, flatShading: true }),
    };
    this.geometries = { cone: new THREE.ConeGeometry(1, 1, 7), box: new THREE.BoxGeometry(1, 1, 1), rock: new THREE.IcosahedronGeometry(1, 0), cylinder: new THREE.CylinderGeometry(1, 1, 1, 7), ...buildChaletGeometry(), ...buildPineGeometry() };
    this.dummy = new THREE.Object3D();
  }
  reset(seed, runStart = 0) { for (const s of this.segments.values()) this.disposeSegment(s); this.segments.clear(); this.seed = seed; this.runStart = runStart; }
  disposeSegment(s) { this.scene.remove(s); s.traverse(o => { if (o.userData.ownedGeometry) o.geometry.dispose(); if (o.isInstancedMesh) o.dispose(); }); }
  makeSegment(index) {
    const start = index * SEGMENT_LENGTH, group = new THREE.Group(); group.userData.start = start; group.userData.chimneys = []; group.userData.cars = []; group.userData.ice = []; group.userData.occluders = [];
    const geometry = new THREE.PlaneGeometry(320, SEGMENT_LENGTH, 48, 16); geometry.rotateX(-Math.PI / 2);
    const p = geometry.attributes.position, colors = [], color = new THREE.Color(), next = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
      const offset = -p.getZ(i) + SEGMENT_LENGTH / 2, d = start + offset, x = p.getX(i) + routeAt(d, this.seed), lateral = Math.abs(p.getX(i));
      const region = biomeAt(d);
      let h = groundAt(x, d, this.seed);
      h += smoothstep(35, 125, lateral) * (13 + Math.sin(d * .021 + x * .008) * 8);
      p.setXYZ(i, x, h - elevationAt(start), -offset);
      color.set(REGIONS[region.from].snow).lerp(next.set(REGIONS[region.to].snow), region.blend);
      const shade = 1 - smoothstep(10, 25, lateral) * .04 + Math.sin(d * .24 + x * .28) * .014;
      color.multiplyScalar(shade); colors.push(color.r, color.g, color.b);
    }
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3)); geometry.computeVertexNormals();
    const ground = new THREE.Mesh(geometry, this.materials.terrain); ground.userData.ownedGeometry = true; ground.receiveShadow = true; group.add(ground);
    const batches = new Map();
    let obstacleD = null;
    const put = (geo, mat, x, y, z, sx, sy, sz, ry = 0) => {
      const key = `${geo}:${mat}`; if (!batches.has(key)) batches.set(key, []);
      this.dummy.position.set(x, y, z); this.dummy.scale.set(sx, sy, sz); this.dummy.rotation.set(0, ry, 0); this.dummy.updateMatrix(); batches.get(key).push(this.dummy.matrix.clone());
      if (obstacleD !== null) group.userData.occluders.push({ key, i: batches.get(key).length - 1, matrix: this.dummy.matrix.clone(), d: obstacleD, hidden: false });
    };
    const tree = (x, d, scale) => {
      const y = groundAt(x, d, this.seed) - elevationAt(start), z = start - d;
      put('pineTrunk', 'wood', x, y, z, scale, scale, scale);
      put('pineNeedles', 'pine', x, y, z, scale, scale, scale, d);
      put('pineSnow', 'snow', x, y, z, scale, scale, scale, d);
    };
    const rng = random((index + 430) * 1327 ^ this.seed);
    for (let j = 0; j < 62; j++) {
      const d = start + rng() * SEGMENT_LENGTH, b = biomeAt(d), density = b.weights.reduce((sum, w, i) => sum + w * REGIONS[i].trees, 0);
      if (rng() > density) continue;
      const side = j % 2 ? -1 : 1, lateral = 17 + rng() ** 1.5 * 60;
      const x = routeAt(d, this.seed) + side * lateral;
      tree(x, d, .72 + rng() * .95);
    }
    group.userData.obstacles = obstacleRows(start, this.seed, this.runStart);
    for (const o of group.userData.obstacles) {
      obstacleD = o.d;
      const y = groundAt(o.x, o.d, this.seed) - elevationAt(start), z = start - o.d;
      if (o.type === 'tree') tree(o.x, o.d, .88);
      else if (o.type === 'rock') { put('rock', 'rock', o.x, y + .3, z, 1.25, .78, 1.05); put('rock', 'snow', o.x - .05, y + .61, z, 1.15, .5, .97); }
      else { put('cylinder', 'wood', o.x, y + .3, z, .62, .7, .62); put('rock', 'snow', o.x, y + .7, z, .76, .23, .73); }
    }
    obstacleD = null;
    for (let j = 0; j < 8; j++) {
      const d = start + j * 8, b = biomeAt(d), c = routeAt(d, this.seed);
      if (b.weights[2] > .05) for (const side of [-1, 1]) {
        const strength = b.weights[2], x = c + side * (24 + rng() * 8), h = (12 + rng() * 15) * strength;
        const y = groundAt(x, d, this.seed) - elevationAt(start);
        put('rock', 'rock', x, y + h * .3, start - d, 7 + rng() * 4, h, 8, rng());
        put('rock', 'snow', x, y + h * .95, start - d, 7.5, h * .18, 7);
      }
      if (b.weights[2] > .65 && j === 3 && index % 3 === 0) {
        const x = c - 24, base = groundAt(x, d, this.seed) - elevationAt(start);
        for (let k = 0; k < 9; k++) { const height = 10 + rng() * 9; put('cylinder', 'ice', x - k * .5, base + height * .46, start - d, .34 + rng() * .22, height, .6); }
        put('rock', 'ice', x + 2, base + .8, start - d, 6, 1.3, 5);
      }
      if (b.weights[3] > .32 && j % 4 === 0 && rng() < b.weights[3]) {
        const side = j % 8 === 0 ? 1 : -1, x = c + side * (24 + rng() * 9), y = groundAt(x, d, this.seed) - elevationAt(start), rotation = -side * (.2 + rng() * .24), scale = .9 + rng() * .45;
        for (const [geo, mat] of [['chaletWood', 'wood'], ['chaletTrim', 'trim'], ['chaletSnow', 'snow'], ['chaletWindows', 'windows']]) put(geo, mat, x, y, start - d, scale, scale, scale, rotation);
        group.userData.chimneys.push({ x: x + (1.9 * Math.cos(rotation) - 1.1 * Math.sin(rotation)) * scale, y: y + elevationAt(start) + 6.9 * scale, d: d + (1.9 * Math.sin(rotation) + 1.1 * Math.cos(rotation)) * scale });
        for (let k = -3; k <= 3; k++) {
          const fx = c + side * 16.7, fd = d + k * 2.4, fy = groundAt(fx, fd, this.seed) - elevationAt(start);
          put('box', 'wood', fx, fy + .55, start - fd, .18, 1.25, .18);
          put('rock', 'snow', fx, fy + 1.2, start - fd, .2, .09, .2);
          if (k < 3) for (const height of [.43, .92]) put('box', 'wood', fx, fy + height - .1, start - fd - 1.2, .12, .13, 2.5);
        }
      }
    }
    const middle = start + 32;
    if (biomeAt(middle).weights[2] > .3 && index % 2 === 0) {
      const ix = routeAt(middle, this.seed) + (rng() - .5) * 4, ice = new THREE.CircleGeometry(1, 14, 0, Math.PI * 2); ice.rotateX(-Math.PI / 2);
      const pos = ice.attributes.position;
      for (let i = 0; i < pos.count; i++) { const x = ix + pos.getX(i) * 7, d = middle - pos.getZ(i) * 15; pos.setXYZ(i, x, groundAt(x, d, this.seed) - elevationAt(start) + .028, start - d); }
      ice.computeVertexNormals(); const mesh = new THREE.Mesh(ice, this.materials.ice); mesh.userData.ownedGeometry = true; mesh.receiveShadow = true; group.add(mesh);
      group.userData.ice.push({ x: ix, d: middle, width: 7, length: 15 });
    }
    // Course-edge markers provide perspective and keep the playable corridor legible.
    if (index % 2 === 0) for (const side of [-1, 1]) {
      const d = start + 10, x = routeAt(d, this.seed) + side * 13.8, y = groundAt(x, d, this.seed) - elevationAt(start);
      put('cylinder', 'wood', x, y + .6, start - d, .07, 1.2, .07);
      put('box', 'red', x, y + 1.13, start - d, .17, .25, .17);
    }
    if (biomeAt(middle).weights[3] > .55) this.addCableway(group, start, put);
    const meshes = new Map();
    for (const [key, matrices] of batches) {
      const [geo, mat] = key.split(':'), mesh = new THREE.InstancedMesh(this.geometries[geo], this.materials[mat], matrices.length);
      matrices.forEach((m, i) => mesh.setMatrixAt(i, m)); mesh.castShadow = true; mesh.receiveShadow = true; mesh.computeBoundingSphere(); group.add(mesh); meshes.set(key, mesh);
    }
    for (const o of group.userData.occluders) o.mesh = meshes.get(o.key);
    this.scene.add(group); this.segments.set(index, group); return group;
  }
  addCableway(group, start, put) {
    const x1 = routeAt(start, this.seed) + 42, x2 = routeAt(start + SEGMENT_LENGTH, this.seed) + 42;
    const y1 = groundAt(x1, start, this.seed) - elevationAt(start) + 17, y2 = groundAt(x2, start + SEGMENT_LENGTH, this.seed) - elevationAt(start) + 17;
    put('cylinder', 'steel', x1, y1 - 8.5, 0, .19, 17, .19);
    put('box', 'steel', x1, y1, 0, 6, .24, .25);
    for (const s of [-1, 1]) {
      const points = [];
      for (let i = 0; i <= 16; i++) { const t = i / 16; points.push(new THREE.Vector3(x1 + (x2 - x1) * t + s * 2.2, y1 + (y2 - y1) * t - Math.sin(t * Math.PI) * .9, -t * SEGMENT_LENGTH)); }
      const curve = new THREE.CatmullRomCurve3(points), geometry = new THREE.TubeGeometry(curve, 16, .035, 4, false), cable = new THREE.Mesh(geometry, this.materials.steel); cable.userData.ownedGeometry = true; group.add(cable);
      const car = new THREE.Group();
      const add = (mat, sx, sy, sz, y) => { const m = new THREE.Mesh(this.geometries.box, this.materials[mat]); m.scale.set(sx, sy, sz); m.position.y = y; m.castShadow = true; car.add(m); };
      add('steel', .09, 1.3, .1, -.65); add('red', 1.55, .8, 1.7, -2.45); add('glass', 1.5, .9, 1.65, -1.6); add('snow', 1.7, .17, 1.9, -1.08);
      for (const dx of [-.7, .7]) { const m = new THREE.Mesh(this.geometries.box, this.materials.steel); m.scale.set(.07, .9, 1.68); m.position.set(dx, -1.6, 0); car.add(m); }
      group.add(car); group.userData.cars.push({ car, curve, sign: s, offset: start * .014 });
    }
  }
  animate(distance, time) {
    for (const s of this.segments.values()) {
      for (const c of s.userData.cars) { const t = ((time * .027 * c.sign + c.offset) % 1 + 1) % 1; c.car.position.copy(c.curve.getPoint(t)); c.car.rotation.z = Math.sin(time * .7 + c.offset) * .025; }
      for (const o of s.userData.occluders) {
        const hide = distance - o.d > 4;
        if (hide !== o.hidden) { o.hidden = hide; this.dummy.matrix.copy(o.matrix); if (hide) this.dummy.matrix.scale(new THREE.Vector3(0, 0, 0)); o.mesh.setMatrixAt(o.i, this.dummy.matrix); o.mesh.instanceMatrix.needsUpdate = true; }
      }
    }
  }
  onIce(player) { return this.icePatches.some(p => ((player.x - p.x) / p.width) ** 2 + ((player.distance - p.d) / p.length) ** 2 < 1); }
  update(distance) {
    const current = Math.floor(distance / SEGMENT_LENGTH);
    for (let i = Math.max(-1, current - 2); i <= current + 10; i++) if (!this.segments.has(i)) this.makeSegment(i);
    this.obstacles.length = 0; this.chimneys.length = 0; this.icePatches.length = 0;
    for (const [index, s] of this.segments) {
      if (index < current - 2 || index > current + 10) { this.disposeSegment(s); this.segments.delete(index); continue; }
      s.position.set(0, elevationAt(s.userData.start) - elevationAt(distance), distance - s.userData.start);
      this.obstacles.push(...s.userData.obstacles);
      this.chimneys.push(...s.userData.chimneys); this.icePatches.push(...s.userData.ice);
    }
  }
}
