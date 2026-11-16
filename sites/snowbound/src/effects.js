import * as THREE from 'three';
import { elevationAt, groundAt, routeAt, random } from './course.js';

const particleVertex = `attribute float aSize; attribute float aAlpha; varying float vAlpha; uniform float pixelRatio;
void main(){vAlpha=aAlpha;vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=clamp(aSize*pixelRatio*380./-mv.z,0.,110.);gl_Position=projectionMatrix*mv;}`;
const particleFragment = `uniform vec3 color;varying float vAlpha;void main(){float r=length(gl_PointCoord-.5)*2.;float a=(1.-smoothstep(.15,1.,r))*vAlpha;if(a<.01)discard;gl_FragColor=vec4(color,a); #include <tonemapping_fragment> \n #include <colorspace_fragment> }`.replace(' #include', '\n#include');
function particles(count, color, ratio) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(new Float32Array(count), 1));
  geometry.setAttribute('aAlpha', new THREE.BufferAttribute(new Float32Array(count), 1));
  const material = new THREE.ShaderMaterial({ uniforms: { color: { value: new THREE.Color(color) }, pixelRatio: { value: ratio } }, vertexShader: particleVertex, fragmentShader: particleFragment, transparent: true, depthWrite: false });
  const points = new THREE.Points(geometry, material); points.frustumCulled = false; return points;
}

export class Effects {
  constructor(scene, mobile, pixelRatio) {
    this.maxFlakes = mobile ? 180 : 420; this.flakes = particles(this.maxFlakes, '#ffffff', pixelRatio); scene.add(this.flakes);
    this.snowData = []; const rng = random(7918);
    for (let i = 0; i < this.maxFlakes; i++) this.snowData.push({ x: (rng() - .5) * 130, y: rng() * 50, z: 28 - rng() * 200, speed: .6 + rng() * .9, size: .11 + rng() * .14 });
    this.maxPowder = mobile ? 100 : 220; this.powder = particles(this.maxPowder, '#fbffff', pixelRatio); scene.add(this.powder);
    this.pool = Array.from({ length: this.maxPowder }, () => ({ life: 0 })); this.cursor = 0; this.emitDebt = 0;
    this.smoke = particles(mobile ? 70 : 140, '#e1e0db', pixelRatio); scene.add(this.smoke);
    this.mist = particles(32, '#d4e5eb', pixelRatio); scene.add(this.mist);
    this.glints = particles(110, '#ffffff', pixelRatio); scene.add(this.glints);
    this.glintData = Array.from({ length: 110 }, () => ({ d: rng() * 180, offset: (rng() - .5) * 50, phase: rng() * 6.28 }));
    this.trackCount = 360; this.trackCursor = 0; this.lastTrack = null;
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(this.trackCount * 12 * 3), 3));
    geometry.setAttribute('birth', new THREE.BufferAttribute(new Float32Array(this.trackCount * 12).fill(-100), 1));
    this.tracks = new THREE.Mesh(geometry, new THREE.ShaderMaterial({
      uniforms: { age: { value: 0 }, distance: { value: 0 }, elevation: { value: 0 } },
      vertexShader: 'attribute float birth;varying float vBirth;uniform float distance;uniform float elevation;void main(){vBirth=birth;vec3 p=position;p.z+=distance;p.y-=elevation;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}',
      fragmentShader: 'uniform float age;varying float vBirth;void main(){float a=max(0.,1.-(age-vBirth)/7.)*.29;if(a<.005)discard;gl_FragColor=vec4(.39,.56,.64,a);}',
      transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2,
    })); this.tracks.frustumCulled = false; scene.add(this.tracks);
  }
  reset() { this.lastTrack = null; this.pool.forEach(p => p.life = 0); this.glintData.forEach(p => p.d = Math.random() * 180); this.tracks.geometry.attributes.birth.array.fill(-100); this.tracks.geometry.attributes.birth.needsUpdate = true; }
  burst(player, seed, count = 28) {
    for (let i = 0; i < count; i++) this.emit(player, seed, 0, true);
  }
  emit(p, seed, steer, landing = false) {
    const a = this.pool[this.cursor++ % this.maxPowder], side = Math.random() < .5 ? -1 : 1;
    Object.assign(a, { x: p.x + side * .28, y: groundAt(p.x, p.distance, seed) + .12, d: p.distance - .55, vx: (Math.random() - .5) * (landing ? 5 : 1.5) - steer * 2.4, vy: .8 + Math.random() * (landing ? 2.5 : 1.8), vd: -1 - Math.random() * 2, life: 1, size: .15 + Math.random() * .32 });
  }
  writeTrack(player, seed, time) {
    const curr = { x: player.x, d: player.distance };
    if (!this.lastTrack) { this.lastTrack = curr; return; }
    if (curr.d - this.lastTrack.d < .35) return;
    if (curr.d - this.lastTrack.d > 2) { this.lastTrack = curr; return; }
    const p = this.tracks.geometry.attributes.position, birth = this.tracks.geometry.attributes.birth;
    const index = this.trackCursor++ % this.trackCount;
    for (let side = 0; side < 2; side++) {
      const offset = side ? .27 : -.27, width = .062;
      const corners = [[this.lastTrack.x + offset - width, this.lastTrack.d], [this.lastTrack.x + offset + width, this.lastTrack.d], [curr.x + offset - width, curr.d], [curr.x + offset + width, curr.d]];
      [0, 1, 2, 1, 3, 2].forEach((n, j) => { const [x, d] = corners[n], i = index * 12 + side * 6 + j; p.setXYZ(i, x, groundAt(x, d, seed) + .055, -d); birth.setX(i, time); });
    }
    p.needsUpdate = true; birth.needsUpdate = true; this.lastTrack = curr;
  }
  update(dt, time, player, seed, steer, playing, region, chimneys, quality) {
    const distance = player.distance, h = elevationAt(distance), density = region.weights.reduce((a, w, i) => a + w * [1, .15, .5, .4][i], 0);
    const fp = this.flakes.geometry.attributes;
    for (let i = 0; i < this.maxFlakes; i++) {
      const f = this.snowData[i]; f.y -= dt * f.speed; f.z += dt * (playing ? player.speed : 1.5); f.x += dt * .35;
      if (f.y < -.5 || f.z > 30) { f.y = 8 + Math.random() * 40; f.z = -165 + Math.random() * 130; }
      if (f.x > 65) f.x = -65;
      fp.position.setXYZ(i, player.x + f.x, f.y, f.z); fp.aSize.setX(i, f.size); fp.aAlpha.setX(i, i < this.maxFlakes * density * quality ? .5 : 0);
    }
    if (playing && player.jump < .01) {
      this.emitDebt += dt * (18 + Math.abs(steer) * 80) * quality;
      while (this.emitDebt >= 1) { this.emit(player, seed, steer); this.emitDebt--; }
      this.writeTrack(player, seed, time);
    } else this.lastTrack = null;
    const pp = this.powder.geometry.attributes;
    for (let i = 0; i < this.maxPowder; i++) {
      const p = this.pool[i]; if (p.life > 0) { p.life -= dt * .95; p.x += p.vx * dt; p.y += p.vy * dt; p.vy -= dt * 3; p.d += p.vd * dt; }
      pp.position.setXYZ(i, p.x || 0, (p.y || 0) - h, distance - (p.d || 0)); pp.aSize.setX(i, p.size || 0); pp.aAlpha.setX(i, Math.max(0, p.life) * .7);
    }
    const sp = this.smoke.geometry.attributes; let smokeIndex = 0;
    for (const chimney of chimneys) {
      if (chimney.d < distance - 25 || chimney.d > distance + 210) continue;
      for (let j = 0; j < 8 && smokeIndex < sp.position.count; j++) {
        const age = ((time * .23 + j / 8 + chimney.d * .02) % 1), rise = age * 12;
        sp.position.setXYZ(smokeIndex, chimney.x + Math.sin(age * 4 + chimney.d) * 1.3 + age * 3, chimney.y - h + rise, distance - chimney.d);
        sp.aSize.setX(smokeIndex, 1.6 + age * 4.5); sp.aAlpha.setX(smokeIndex, Math.sin(age * Math.PI) * .2); smokeIndex++;
      }
    }
    for (let i = smokeIndex; i < sp.position.count; i++) sp.aAlpha.setX(i, 0);
    const mp = this.mist.geometry.attributes;
    for (let i = 0; i < 32; i++) {
      const z = -30 - (i * 19 + time * 1.5) % 260;
      mp.position.setXYZ(i, player.x + Math.sin(i * 43) * 33, 1.1 - z * .045, z);
      mp.aSize.setX(i, 20); mp.aAlpha.setX(i, region.weights[2] * .043);
    }
    const gp = this.glints.geometry.attributes;
    for (let i = 0; i < this.glintData.length; i++) {
      const g = this.glintData[i]; if (g.d < distance - 20 || g.d > distance + 200) g.d = distance + 30 + (i * 17.7) % 150;
      const x = routeAt(g.d, seed) + g.offset;
      gp.position.setXYZ(i, x, groundAt(x, g.d, seed) - h + .085, distance - g.d);
      gp.aSize.setX(i, .13); gp.aAlpha.setX(i, Math.max(0, Math.sin(time * 2 + g.phase)) ** 12 * region.weights[1] * .8 * quality);
    }
    for (const attrs of [fp, pp, sp, mp, gp]) for (const attr of Object.values(attrs)) attr.needsUpdate = true;
    this.tracks.material.uniforms.age.value = time; this.tracks.material.uniforms.distance.value = distance; this.tracks.material.uniforms.elevation.value = h;
  }
}
