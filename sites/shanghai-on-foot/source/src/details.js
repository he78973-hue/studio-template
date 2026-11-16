import * as THREE from 'three';
import { PALETTE as C, footprint, extrude, ribbon, MANSION_ID, STORE_ID, nearestOnRoute } from './geometry.js';
import { landmarks } from './landmarks.js';
import { buildExtraLandmarks } from './extra-landmarks.js';
import { buildBookshop } from './refined-landmarks.js';
import { masonry } from './architecture.js';

const mat = color => new THREE.MeshStandardMaterial({color, roughness: 0.86});
const dummy = new THREE.Object3D();
const boxes = new THREE.BoxGeometry(1, 1, 1);
function batch(group, records, geometry, material, shadow = true) {
  const mesh = new THREE.InstancedMesh(geometry, material, records.length);
  records.forEach((r, i) => {
    dummy.position.set(...r.position); dummy.rotation.set(0, r.angle || 0, 0); dummy.scale.set(...r.scale); dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
    if (r.color) mesh.setColorAt(i, new THREE.Color(r.color));
  });
  mesh.castShadow = shadow; mesh.receiveShadow = true; group.add(mesh);
  return mesh;
}
function inside(p, ring) {
  let result = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i], b = ring[j];
    if (((a[1] > p[1]) !== (b[1] > p[1])) && (p[0] < (b[0] - a[0]) * (p[1] - a[1]) / (b[1] - a[1]) + a[0])) result = !result;
  }
  return result;
}
function edges(polygon, callback) {
  polygon.slice(1).forEach((b, i) => {
    const a = polygon[i], dx = b[0] - a[0], dz = b[1] - a[1];
    callback(a, b, Math.hypot(dx, dz), -Math.atan2(dz, dx));
  });
}
export function enhanceCity(walk) {
  const {city, data, buildingMeshes} = walk;
  walk.contextMeshes=[];
  city.remove(walk.scaleReference);
  const wallMats = C.contextWalls.map(mat);
  const roofMats = C.contextRoofs.map(mat);
  const stone = mat(C.stone), glass = mat(C.window), frame = mat('#f0e7ce');
  const panes = [], frames = [];
  data.buildings.forEach((b, i) => {
    const old = buildingMeshes.get(b.id);
    if (Object.values(landmarks).some(l=>l.buildingId===b.id)) {city.remove(old); old.geometry.dispose(); return;}
    const h = b.height === 5 ? 8.4 + (i % 4) * 2.5 : b.height;
    old.scale.y = h / b.height;
    old.material = wallMats[i % wallMats.length];
    const roof = extrude(footprint(b.polygon, b.holes, 1.018, b.center), 0.65, roofMats[i % 4], h, 0.04);
    city.add(roof);
    walk.contextMeshes.push(old,roof);
    if (nearestOnRoute(b.center, data.route).distance > 145) return;
    edges(b.polygon, (a, b, length, angle) => {
      if (length < 4 || length > 100) return;
      const count = Math.floor(length / 3.8);
      for (let j = 0; j < count; j++) for (let floor = 0; floor < Math.min(7, Math.floor(h / 3.2)); floor++) {
        const t = (j + 0.5) / count;
        const x = a[0] + (b[0] - a[0]) * t, z = a[1] + (b[1] - a[1]) * t;
        frames.push({position: [x, 2.1 + floor * 3.2, z], angle, scale: [1.35, 1.8, 0.28]});
        panes.push({position: [x, 2.1 + floor * 3.2, z], angle, scale: [1, 1.5, 0.3]});
      }
    });
  });
  walk.contextMeshes.push(batch(city, frames, boxes, frame.clone(), false),batch(city, panes, boxes, glass.clone(), false));
  buildMansion(walk, stone, glass);
  const shop=buildBookshop(data.buildings.find(b=>b.id===STORE_ID));
  city.add(shop);walk.landmarks.push(shop);walk.shop=shop;
  buildExtraLandmarks(walk);
  buildTrees(walk);
  buildStreetDetails(walk);
}

function buildMansion(walk, stone, glass) {
  const building = walk.data.buildings.find(b => b.id === MANSION_ID);
  const group = new THREE.Group(); group.userData.stop = 'mansion';
  const brick = masonry('brick');
  const layers = [[0, 6.5, stone, 1], [6.5, 19.2, brick, 1], [25.7, 3.3, stone, 1], [29, 1, stone, 1.035]];
  layers.forEach(([bottom, height, material, scale]) => group.add(extrude(footprint(building.polygon, [], scale, building.center), height, material, bottom, 0.08)));
  const roof = extrude(footprint(building.polygon, [], 0.95, building.center), 0.3, mat('#9b9685'), 30);
  group.add(roof);
  [6.3, 9.7, 25.5, 28.9].forEach(y => group.add(extrude(footprint(building.polygon, [], 1.025, building.center), 0.35, stone, y)));
  const windows = [], frames = [], shutters = [], rails = [], ledges = [];
  const shutterMat = mat('#ba8868');
  edges(building.polygon, (a, b, length, angle) => {
    if (length < 2.2) return;
    const count = Math.max(1, Math.floor(length / 4.6));
    const dx = (b[0] - a[0]) / length, dz = (b[1] - a[1]) / length;
    // Choose the normal pointing away from the polygon's interior.
    let normal = [-dz, dx];
    const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    if (inside([mid[0] + normal[0], mid[1] + normal[1]], building.polygon)) normal = [dz, -dx];
    for (let j = 0; j < count; j++) {
      const t = (j + 0.5) / count;
      const x = a[0] + (b[0] - a[0]) * t, z = a[1] + (b[1] - a[1]) * t;
      for (let floor = 0; floor < 7; floor++) {
        const y = floor===6?27.1:5.05 + floor * 3.45;
        frames.push({position: [x, y, z], angle, scale: [2.02, 2.6, 0.4]});
        windows.push({position: [x + normal[0] * 0.08, y, z + normal[1] * 0.08], angle, scale: [1.63, 2.22, 0.46]});
        frames.push({position: [x + normal[0] * 0.35, y, z + normal[1] * 0.35], angle, scale: [0.085, 2.25, 0.12]});
        frames.push({position: [x + normal[0] * 0.35, y + 0.25, z + normal[1] * 0.35], angle, scale: [1.67, 0.09, 0.12]});
        if (floor > 0 && floor < 6 && length > 3.6) {
          // The photograph shows compact louvered equipment enclosures, not
          // full-height shutters flanking every window.
          const side=j%2?1:-1,cx=x+dx*1.32*side+normal[0]*.28,cz=z+dz*1.32*side+normal[1]*.28;
          shutters.push({position:[cx,y-.7,cz],angle,scale:[.72,.64,.55]});
          for(let k=0;k<6;k++)rails.push({position:[cx+normal[0]*.29,y-.95+k*.09,cz+normal[1]*.29],angle,scale:[.65,.025,.03]});
        }
        for(let k=-1;k<=1;k++)frames.push({position:[x+normal[0]*.36,y+k*.55,z+normal[1]*.36],angle,scale:[1.64,.045,.055]});
        for(const side of [-1,1])frames.push({position:[x+dx*side*.48+normal[0]*.36,y,z+dz*side*.48+normal[1]*.36],angle,scale:[.045,2.24,.055]});
        // Pediments and sill brackets distinguish the lowest red-brick storey.
        if(floor===1){
          const p=new THREE.Shape();p.moveTo(-1.25,0);p.lineTo(0,.55);p.lineTo(1.25,0);p.closePath();
          const geo=new THREE.ExtrudeGeometry(p,{depth:.28,bevelEnabled:false});
          const cap=new THREE.Mesh(geo,stone);cap.position.set(x+normal[0]*.22,y+1.5,z+normal[1]*.22);cap.rotation.y=angle;cap.castShadow=true;group.add(cap);
        }
        if (floor === 0 || floor === 5 || (floor > 0 && j % 3 === 0)) {
          ledges.push({position: [x + normal[0] * 0.5, y - 1.4, z + normal[1] * 0.5], angle, scale: [2.65, 0.25, 1.15]});
          rails.push({position: [x + normal[0] * 1.03, y - 0.4, z + normal[1] * 1.03], angle, scale: [2.55, 0.08, 0.07]});
          for (let k = -4; k <= 4; k++) rails.push({position: [x + dx * k * 0.27 + normal[0] * 1.03, y - 0.85, z + dz * k * 0.27 + normal[1] * 1.03], angle, scale: [0.06, 0.98, 0.06]});
        }
      }
      // Ground-floor arcades are shallow recessed openings with masonry arches.
      const radius = Math.min(1.48, length * 0.39);
      const arch = new THREE.Shape();
      arch.moveTo(-radius, 0); arch.lineTo(radius, 0); arch.lineTo(radius, 1.9);
      arch.absarc(0, 1.9, radius, 0, Math.PI, false); arch.lineTo(-radius, 0);
      const recess = new THREE.Mesh(new THREE.ShapeGeometry(arch, 16), new THREE.MeshStandardMaterial({color: '#515e55', side: THREE.DoubleSide, roughness: 0.95}));
      recess.position.set(x + normal[0] * 0.16, 0.3, z + normal[1] * 0.16); recess.rotation.y = angle;
      group.add(recess);
      const curve = new THREE.EllipseCurve(0, 1.9, radius + 0.13, radius + 0.13, 0, Math.PI, false);
      const path = new THREE.CatmullRomCurve3(curve.getPoints(20).map(p => new THREE.Vector3(p.x, p.y, 0)));
      const trim = new THREE.Mesh(new THREE.TubeGeometry(path, 24, 0.13, 5, false), stone);
      trim.position.copy(recess.position); trim.position.y += 0.3; trim.rotation.y = angle; group.add(trim);
      for(const s of [-1,1])frames.push({position:[x+dx*s*(radius+.1)+normal[0]*.27,1.25,z+dz*s*(radius+.1)+normal[1]*.27],angle,scale:[.22,2.1,.24]});
      for(let k=0;k<4;k++)frames.push({position:[x+normal[0]*.36,5.85+k*.14,z+normal[1]*.36],angle,scale:[.3+k*.05,.08,.35+k*.09]});
    }
    // Continuous fine balustrades at the lower terrace and upper cornice.
    for(const y of [6.55,25.3]){
      const n=Math.ceil(length/.3);
      for(let i=0;i<=n;i++){
        const t=i/n,px=a[0]+(b[0]-a[0])*t+normal[0]*.72,pz=a[1]+(b[1]-a[1])*t+normal[1]*.72;
        rails.push({position:[px,y+.53,pz],angle,scale:[.035,1.03,.035]});
      }
      rails.push({position:[mid[0]+normal[0]*.72,y+1.06,mid[1]+normal[1]*.72],angle,scale:[length,.065,.065]});
      ledges.push({position:[mid[0]+normal[0]*.35,y,mid[1]+normal[1]*.35],angle,scale:[length,.18,1.1]});
    }
    for(let d=1;d<length;d+=.85)frames.push({position:[a[0]+dx*d+normal[0]*.15,29.3,a[1]+dz*d+normal[1]*.15],angle,scale:[.24,.3,.45]});
  });
  batch(group, frames, boxes, mat('#d7c8ab')); batch(group, windows, boxes, glass, false);
  batch(group, shutters, boxes, shutterMat); batch(group, rails, boxes, mat('#465247')); batch(group, ledges, boxes, stone);
  group.name='mansion';group.traverse(obj => {obj.userData.stop = 'mansion';});
  walk.city.add(group); walk.landmarks = [group]; walk.mansion = group;
}

function buildTrees(walk) {
  const trunks = [], crowns = [];
  let seed = 621;
  const random = () => {seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646;};
  const trees = [];
  const route = walk.data.route;
  route.slice(2).forEach((b, i) => {
    const a = route[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], length = Math.hypot(dx, dz);
    for (let d = 8; d < length; d += 16 + random() * 5) for (const side of [-1, 1]) {
      const p = [a[0] + dx * d / length - dz / length * 8.5 * side, a[1] + dz * d / length + dx / length * 8.5 * side];
      if (!walk.data.buildings.some(b => inside(p, b.polygon))) trees.push(p);
    }
  });
  walk.data.buildings.forEach((b, i) => {
    if (i % 2 || [STORE_ID, MANSION_ID].includes(b.id)) return;
    const p = [b.center[0] + 16 + random() * 9, b.center[1] + 11];
    if (walk.data.roads.some(r => nearestOnRoute(p, r.points).distance < 7)) return;
    if (!walk.data.buildings.some(b => inside(p, b.polygon))) trees.push(p);
  });
  trees.forEach(([x, z]) => {
    if (Object.values(landmarks).some(l=>{const b=walk.data.buildings.find(b=>b.id===l.buildingId);return Math.hypot(x-b.center[0],z-b.center[1])<22;})) return;
    if (z > 478 && z < 580 && x > -198 && x < -95) return;
    if (z > -530 && z < -492 && x > 54 && x < 112) return;
    const h = 9 + random() * 4;
    trunks.push({position: [x, h * 0.35, z], scale: [0.52, h * 0.7, 0.52]});
    for (let i = 0; i < 4; i++) {
      const angle = i * Math.PI * 2 / 3;
      crowns.push({position: [x + Math.cos(angle) * 1.8, h - 1 + (i === 3 ? 2.4 : 0), z + Math.sin(angle) * 1.8], scale: [3 + random(), 3.1 + random(), 3 + random()], color: C.foliage[Math.floor(random() * C.foliage.length)]});
    }
  });
  walk.contextMeshes.push(batch(walk.city, trunks, new THREE.CylinderGeometry(0.7, 1, 1, 5), mat(C.trunk)));
  walk.contextMeshes.push(batch(walk.city, crowns, new THREE.IcosahedronGeometry(1, 1), mat('#ffffff')));
}

function buildStreetDetails(walk) {
  const markings = [];
  const roadmat = new THREE.MeshStandardMaterial({color: C.sidewalk, side: THREE.DoubleSide, roughness: 1});
  const roadinner = new THREE.MeshStandardMaterial({color: C.road, side: THREE.DoubleSide, roughness: 1});
  walk.data.roads.forEach(r => {
    const width = r.class === 'primary' ? 18 : r.class === 'secondary' ? 13 : 8;
    walk.city.add(ribbon(r.points, width + 3, roadmat, 0.15));
    walk.city.add(ribbon(r.points, width, roadinner, 0.19));
  });
  // Crosswalk striping is illustrative; it is not a surveyed crossing map.
  for (let i = 0; i < 7; i++) markings.push({position: [-165 + i * 1.7, 0.23, 523 + i * 0.9], angle: -0.5, scale: [0.75, 0.03, 9]});
  batch(walk.city, markings, boxes, mat('#f6f2df'), false);
}
