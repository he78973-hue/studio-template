import * as THREE from 'three';

export const MANSION_ID = '2934341510-7';
export const STORE_ID = '147898520-2094';
export const PALETTE = {
  paper: '#fbf4e8', ground: '#f9e8ce', stone: '#d9cbb3', brick: '#b87551',
  roof: '#b18e6b', building: '#eddbc0', road: '#d7bea1', sidewalk: '#f3e6d1',
  ink: '#4c3527', route: '#a34f32', tree: '#b9873e', treeLight: '#d3ae63',
  window: '#687871', trunk: '#947052', white: '#fffaf1', gray: '#c4c4bb',
  contextWalls: ['#ecdbc1', '#e4cdb0', '#ead7bd', '#f0e0c8'],
  contextRoofs: ['#ae8e70', '#c0a07c', '#b39379', '#c4ad90'],
  foliage: ['#b98943', '#c8a35d', '#a27b3e', '#d6b970'],
  skyLight: '#fff6e5', bounceLight: '#b89570', sunLight: '#fff1d8', fillLight: '#fff4e6',
};

export function footprint(points, holes = [], scale = 1, center = [0, 0]) {
  const transformed = points.map(([x, z]) => new THREE.Vector2(center[0] + (x - center[0]) * scale, -center[1] - (z - center[1]) * scale));
  const shape = new THREE.Shape(transformed);
  shape.holes = holes.map(ring => new THREE.Path(ring.map(([x, z]) => new THREE.Vector2(x, -z))));
  return shape;
}

export function extrude(shape, height, material, bottom = 0, bevel = 0) {
  const geometry = new THREE.ExtrudeGeometry(shape, {depth: height, bevelEnabled: bevel > 0, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 1, steps: 1, curveSegments: 6});
  geometry.rotateX(-Math.PI / 2);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = bottom;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function ribbon(points, width, material, y = 0.1) {
  const positions = [], indices = [];
  points.forEach(([x, z], i) => {
    const a = points[Math.max(0, i - 1)], b = points[Math.min(points.length - 1, i + 1)];
    const dx = b[0] - a[0], dz = b[1] - a[1], length = Math.hypot(dx, dz) || 1;
    const nx = -dz / length * width / 2, nz = dx / length * width / 2;
    positions.push(x + nx, y, z + nz, x - nx, y, z - nz);
    if (i < points.length - 1) {const n = i * 2; indices.push(n, n + 2, n + 1, n + 1, n + 2, n + 3);}
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setIndex(indices); g.computeVertexNormals();
  const mesh = new THREE.Mesh(g, material); mesh.receiveShadow = true;
  return mesh;
}

export function nearestOnRoute(point, route) {
  let best = {distance: Infinity};
  route.slice(1).forEach((b, i) => {
    const a = route[i], dx = b[0] - a[0], dz = b[1] - a[1];
    const t = THREE.MathUtils.clamp(((point[0] - a[0]) * dx + (point[1] - a[1]) * dz) / (dx * dx + dz * dz || 1), 0, 1);
    const p = [a[0] + t * dx, a[1] + t * dz];
    const distance = Math.hypot(point[0] - p[0], point[1] - p[1]);
    if (distance < best.distance) best = {distance, point: p, index: i};
  });
  return best;
}
