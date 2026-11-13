import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { MANSION_ID, STORE_ID, nearestOnRoute } from '../src/geometry.js';
import { landmarks, finishPoint } from '../src/landmarks.js';
import { places } from '../src/places.js';
const data = JSON.parse(await readFile(new URL('../public/data/streets.json', import.meta.url)));
assert.equal(data.unit, 'metre');
assert.ok(data.source.startsWith('https://tiles.openfreemap.org/'));
assert.ok(data.buildings.length > 100, 'The neighborhood needs a real street context');
assert.ok(data.routeLength > 2000 && data.routeLength < 3000, 'Unexpected afternoon route scale');
assert.deepEqual(data.route.at(-1),finishPoint,'Finish must agree with the Urumqi/Huaihai road endpoint');
assert.ok(Math.hypot(data.route[0][0]+172,data.route[0][1]-551)<1,'Start must be at the mansion/photo corner');
for (const b of data.buildings) {
  assert.ok(b.height > 0, 'Non-positive building height');
  assert.ok(b.polygon.length >= 4);
  assert.deepEqual(b.polygon[0], b.polygon.at(-1), 'Footprint must be closed');
  assert.ok(b.polygon.flat().every(Number.isFinite), 'Invalid projected coordinate');
}
const mansion = data.buildings.find(b => b.id === MANSION_ID);
const shop = data.buildings.find(b => b.id === STORE_ID);
assert.ok(mansion && shop, 'Landmark footprint IDs no longer match; reidentify after data refresh');
assert.equal(mansion.height, 30, 'Mansion scale anchor must remain 30 metres');
assert.ok(nearestOnRoute(mansion.center, data.route).distance < 60, 'Mansion disconnected from route');
assert.ok(Math.hypot(shop.center[0] - data.shop[0], shop.center[1] - data.shop[1]) < 25);
const landmarkIds=Object.values(landmarks).map(l=>l.buildingId);
assert.equal(new Set(landmarkIds).size,7,'Landmarks must use distinct models');
for(const [id,l] of Object.entries(landmarks)) {
 const b=data.buildings.find(b=>b.id===l.buildingId);
 assert.ok(b,`${id}: missing footprint`);
 assert.ok(nearestOnRoute(b.center,data.route).distance<110,`${id}: disconnected from the walking corridor`);
}
assert.equal(places.length,9);assert.equal(new Set(places.map(p=>p.id)).size,9);
places.forEach((p,i)=>{assert.equal(p.next,places[i+1]?.id||null);assert.equal(p.previous,places[i-1]?.id||null);assert.ok(p.source.startsWith('https://'));});
for (let i = 1; i < data.route.length; i++) assert.ok(Math.hypot(data.route[i][0] - data.route[i - 1][0], data.route[i][1] - data.route[i - 1][1]) < 350, 'Route contains a suspicious discontinuity');
const image = await readFile(new URL('../public/assets/wukang-mansion.jpg', import.meta.url));
assert.equal(image[0], 0xff); assert.equal(image[1], 0xd8); assert.ok(image.length > 100000);
for(const name of ['romeo-balcony.jpg','ba-jin-house.jpg']){const image=await readFile(new URL(`../public/assets/${name}`,import.meta.url));assert.equal(image[0],0xff);assert.equal(image[1],0xd8);assert.ok(image.length>10000);}
console.log(`PASS: ${data.buildings.length} closed footprints; ${data.roads.length} road features; ${Math.round(data.routeLength)} m route; seven landmark anchors; nine-stop chain; three local JPEGs.`);
