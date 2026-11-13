import * as THREE from 'three';

// 1 unit = 2 cm on the collectible. Landscape objects are approximately 1:100.
export const SPEC = Object.freeze({ radius: 6.2, ground: 2.7, railY: 2.95, trackX: 4.9, trackZ: 4.35, gauge: 0.38 });
export const TAU = Math.PI * 2;
export const trackPoint = (t, inset = 0) => new THREE.Vector3((SPEC.trackX + inset) * Math.sin(t), SPEC.railY, (SPEC.trackZ + inset) * Math.cos(t));
export const trackTangent = (t) => new THREE.Vector3(SPEC.trackX * Math.cos(t), 0, -SPEC.trackZ * Math.sin(t)).normalize();
export const riverCenter = (z) => 1.5 + .65 * Math.sin(z * .64);
export function terrainHeight(x, z) {
  const hill = .82 * Math.exp(-((x + .3) ** 2 / 7 + (z + 2.05) ** 2 / 2.8));
  const ripple = .07 * Math.sin(x * 1.8) * Math.cos(z * 1.6);
  const edge = THREE.MathUtils.smoothstep(Math.hypot(x, z), 4, 5.6);
  const riverDistance = Math.abs(x - riverCenter(z));
  const bed = 1 - THREE.MathUtils.smoothstep(riverDistance, .35, .68);
  return SPEC.ground + (hill + ripple) * (1 - edge) * (1 - bed) - .3 * bed;
}
export const treeLayout = [
  [-3.5,-2.0,4.6,'larch'],[-2.1,-2.9,5.3,'larch'],[-.5,-3.0,5.9,'larch'],[1.9,-2.7,4.8,'larch'],[2.7,-2.3,4.6,'larch'],[3.6,-1.1,3.6,'larch'],
  [-3.8,-.6,4.0,'larch'],[-2.7,-1.35,4.4,'larch'],[-1.2,-1.7,4.7,'larch'],[.1,-1.6,4.0,'birch'],[2.55,-.5,3.25,'birch'],
  [-3.55,1.15,3.8,'maple'],[-.2,-.25,3.6,'maple'],[2.8,1.7,3.2,'maple'],[-2.7,2.7,2.5,'birch'],[3.1,2.9,2.3,'larch'],[-5.35,.2,2.1,'larch']
];
