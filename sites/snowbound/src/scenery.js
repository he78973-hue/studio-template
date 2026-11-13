import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { random } from './course.js';

function mergeParts(parts) {
  const geometries = parts.map(({ geometry, position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1] }) => {
    const g = geometry.index ? geometry.toNonIndexed() : geometry.clone();
    g.scale(...scale); g.rotateX(rotation[0]); g.rotateY(rotation[1]); g.rotateZ(rotation[2]); g.translate(...position);
    return g;
  });
  const merged = mergeGeometries(geometries); geometries.forEach(g => g.dispose()); return merged;
}

export function buildChaletGeometry() {
  const cube = new THREE.BoxGeometry(1, 1, 1), wood = [], trim = [], snow = [], windows = [];
  const add = (to, position, scale, rotation) => to.push({ geometry: cube, position, scale, rotation });
  add(wood, [0, 1.8, 0], [6.0, 3.6, 5.0]);
  // Gable walls are closed triangular prisms, visible from both ends.
  const shape = new THREE.Shape(); shape.moveTo(-3, 0); shape.lineTo(3, 0); shape.lineTo(0, 2.25); shape.closePath();
  const gable = new THREE.ExtrudeGeometry(shape, { depth: 5, bevelEnabled: false });
  wood.push({ geometry: gable, position: [0, 3.6, -2.5] });
  for (const s of [-1, 1]) {
    add(trim, [s * 1.78, 4.65, 0], [4.55, .3, 6.1], [0, 0, -s * .625]);
    add(snow, [s * 1.78, 4.9, 0], [4.7, .32, 6.22], [0, 0, -s * .625]);
    for (const x of [-1.75, 1.75]) {
      add(trim, [x, 2.15, s * 2.57], [1.36, 1.55, .16]);
      add(windows, [x, 2.15, s * 2.67], [1.08, 1.27, .05]);
      add(trim, [x, 2.15, s * 2.71], [.07, 1.3, .06]);
      add(trim, [x, 2.15, s * 2.71], [1.13, .07, .06]);
      add(snow, [x, 1.46, s * 2.7], [1.5, .15, .38]);
    }
    for (const z of [-1.2, 1.2]) {
      add(trim, [s * 3.06, 2.05, z], [.15, 1.35, 1.22]);
      add(windows, [s * 3.15, 2.05, z], [.05, 1.13, 1]);
      add(trim, [s * 3.19, 2.05, z], [.08, 1.13, .06]);
    }
    for (let y = .25; y < 3.6; y += .43) add(trim, [0, y, s * 2.52], [6.05, .055, .08]);
  }
  add(trim, [0, 1.1, 2.6], [1.1, 2.2, .25]);
  add(windows, [0, 1.67, 2.75], [.62, .7, .05]);
  add(trim, [0, .18, 3.1], [2.4, .36, 1.1]);
  add(snow, [0, .39, 3.1], [2.5, .1, 1.15]);
  for (const x of [-2.95, 2.95]) for (const z of [-2.45, 2.45]) add(trim, [x, 1.8, z], [.22, 3.7, .22]);
  add(trim, [1.9, 5.5, -1.1], [.7, 2.5, .7]);
  add(snow, [1.9, 6.78, -1.1], [.9, .15, .9]);
  const geometries = { chaletWood: mergeParts(wood), chaletTrim: mergeParts(trim), chaletSnow: mergeParts(snow), chaletWindows: mergeParts(windows) };
  cube.dispose(); gable.dispose(); return geometries;
}

export function buildPineGeometry() {
  const needle = [], snow = [], trunk = new THREE.CylinderGeometry(.15, .24, 2, 7); trunk.translate(0, 1, 0);
  const cones = [];
  for (let tier = 0; tier < 5; tier++) {
    const radius = 2.1 - tier * .37, height = 3.3 - tier * .35, center = 2.5 + tier * 1.2;
    const cone = new THREE.ConeGeometry(radius, height, 8); cones.push(cone);
    needle.push({ geometry: cone, position: [0, center, 0], rotation: [0, tier * .17, 0] });
    snow.push({ geometry: cone, position: [.03, center + .28, -.03], rotation: [0, tier * .17, 0], scale: [.86, .92, .86] });
  }
  const result = { pineNeedles: mergeParts(needle), pineSnow: mergeParts(snow), pineTrunk: trunk };
  cones.forEach(c => c.dispose()); return result;
}

export class Panorama {
  constructor(scene) {
    this.root = new THREE.Group(); scene.add(this.root); this.peaks = [];
    const rng = random(2857);
    for (let layer = 0; layer < 3; layer++) for (let i = 0; i < 11; i++) {
      const radius = 140 + rng() * 130, height = 155 + rng() * 100, slices = 9, rings = 6;
      const vertices = [], colors = [], positions = [];
      const rock = new THREE.Color(layer === 0 ? '#91aebb' : '#afc4ce'), white = new THREE.Color('#e4edef');
      const variation = Array.from({ length: slices }, () => .73 + rng() * .48);
      for (let ring = 0; ring <= rings; ring++) {
        const t = ring / rings;
        for (let j = 0; j < slices; j++) {
          const angle = j / slices * Math.PI * 2;
          const r = radius * (1 - t) * variation[j] * (ring === 0 ? 1 : .86 + rng() * .25);
          positions.push([Math.cos(angle) * r + t * radius * .18, t * height + (ring > 0 && ring < rings ? (rng() - .5) * 24 : 0), Math.sin(angle) * r]);
        }
      }
      for (let ring = 0; ring < rings; ring++) for (let j = 0; j < slices; j++) {
        const a = ring * slices + j, b = ring * slices + (j + 1) % slices, c = a + slices, d = b + slices;
        for (const ids of [[a, c, b], [b, c, d]]) {
          const snow = ring > 2 || (ring > 0 && rng() > .42);
          const color = (snow ? white : rock).clone().multiplyScalar(.9 + rng() * .15);
          for (const id of ids) { vertices.push(...positions[id]); colors.push(color.r, color.g, color.b); }
        }
      }
      const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3)); geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3)); geometry.computeVertexNormals();
      const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: true, fog: false });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set((i - 5) * 250 + rng() * 100, -155 - layer * 4, -840 - layer * 300 - rng() * 80);
      mesh.rotation.y = rng() * 6; this.root.add(mesh); this.peaks.push({ mesh, layer });
    }
    this.skyMaterial = new THREE.ShaderMaterial({
      uniforms: { topColor: { value: new THREE.Color('#bed5df') }, bottomColor: { value: new THREE.Color('#e9eeea') } },
      side: THREE.BackSide, depthWrite: false, toneMapped: false,
      vertexShader: 'varying vec3 vPos; void main(){vPos=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: 'uniform vec3 topColor;uniform vec3 bottomColor;varying vec3 vPos;void main(){float h=smoothstep(-.12,.30,normalize(vPos).y);gl_FragColor=vec4(mix(bottomColor,topColor,h),1.);\n#include <colorspace_fragment>\n}',
    });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(1450, 24, 16), this.skyMaterial); this.sky.renderOrder = -10; scene.add(this.sky);
    const sunMaterial = new THREE.MeshBasicMaterial({ color: '#fff4d5', fog: false, transparent: true, opacity: .8 });
    this.sun = new THREE.Mesh(new THREE.CircleGeometry(18, 40), sunMaterial); this.sun.position.set(-390, 88, -1050); scene.add(this.sun);
    const haloCanvas = document.createElement('canvas'); haloCanvas.width = haloCanvas.height = 128;
    const ctx = haloCanvas.getContext('2d');
    const gradient = ctx.createRadialGradient(64, 64, 5, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(255,236,189,.65)'); gradient.addColorStop(.3, 'rgba(255,236,189,.22)'); gradient.addColorStop(1, 'rgba(255,236,189,0)');
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, 128, 128);
    const haloTexture = new THREE.CanvasTexture(haloCanvas); haloTexture.colorSpace = THREE.SRGBColorSpace;
    this.halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTexture, transparent: true, depthWrite: false, fog: false, opacity: .4, toneMapped: false }));
    this.halo.position.copy(this.sun.position); this.halo.position.z += 1; this.halo.scale.set(160, 160, 1); scene.add(this.halo);
  }
  update(distance, x, sky, fog, warmth) {
    this.root.position.set(-x * .12 + Math.sin(distance * .00023) * 65, 0, Math.sin(distance * .00017) * 30);
    this.skyMaterial.uniforms.topColor.value.copy(sky);
    this.skyMaterial.uniforms.bottomColor.value.copy(fog).lerp(new THREE.Color('#fff2db'), .15 + warmth * .2);
    this.sun.material.opacity = .55 + warmth * .2;
    this.halo.material.opacity = .3 + warmth * .3;
    for (const { mesh, layer } of this.peaks) mesh.material.color.set('#ffffff').lerp(fog, .18 + layer * .19);
  }
}
