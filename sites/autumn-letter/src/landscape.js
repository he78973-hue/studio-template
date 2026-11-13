import * as THREE from 'three';
import { SPEC, TAU, terrainHeight, riverCenter } from './layout.js';

export function terrainGeometry() {
  const positions = [0, terrainHeight(0,0), 0];
  const colors = [.57,.47,.23];
  const indices = [];
  const segments = 160, rings = 48;
  const c = new THREE.Color();
  for (let r = 1; r <= rings; r++) {
    for (let j = 0; j < segments; j++) {
      const a = j / segments * TAU, radius = r / rings * 5.88;
      const x = Math.sin(a) * radius, z = Math.cos(a) * radius;
      positions.push(x, terrainHeight(x,z), z);
      const variation = Math.sin(x * 8 + z * 5) * .04 + Math.sin(x * 2 - z * 4) * .03;
      const riverD = Math.abs(x - riverCenter(z));
      c.setHSL(.105 + variation * .35, .3 + variation, .34 + variation, THREE.SRGBColorSpace);
      if (riverD < .77) c.setHSL(.095, .29, .46 + variation, THREE.SRGBColorSpace);
      colors.push(c.r,c.g,c.b);
      const b = 1 + (r - 1) * segments + j;
      const next = 1 + (r - 1) * segments + (j + 1) % segments;
      if (r === 1) indices.push(0, b, next);
      else {
        const a0 = b - segments, a1 = next - segments;
        indices.push(a0,b,next, a0,next,a1);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  return geometry;
}

export function riverGeometry() {
  const positions = [], indices = [], uvs = [];
  for (let i = 0; i <= 160; i++) {
    const z = -5.86 + i / 160 * 11.72;
    const edge = Math.sqrt(Math.max(0, 5.875 ** 2 - z ** 2));
    const center = riverCenter(z), width = .43 + .08 * Math.sin(z * 1.1);
    const left = Math.min(edge, Math.max(-edge, center - width));
    const right = Math.min(edge, Math.max(-edge, center + width));
    positions.push(left,2.61,z, right,2.61,z);
    uvs.push(left*.6,z*.6,right*.6,z*.6);
    if (i > 0) { const a = (i-1)*2; indices.push(a,a+2,a+1, a+1,a+2,a+3); }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions,3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs,2));
  geo.setIndex(indices); geo.computeVertexNormals(); return geo;
}
