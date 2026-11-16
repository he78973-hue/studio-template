import { readFile, writeFile } from 'node:fs/promises';
const source = JSON.parse(await readFile(new URL('../public/data/neighborhood.geojson', import.meta.url), 'utf8'));
source.features = source.features.flatMap(f => f.geometry.type === 'MultiPolygon'
  ? f.geometry.coordinates.map((coordinates, i) => ({...f, id: `${f.id}-${i}`, geometry: {type: 'Polygon', coordinates}}))
  : f.geometry.type === 'MultiLineString' ? f.geometry.coordinates.map((coordinates, i) => ({...f, id: `${f.id}-${i}`, geometry: {type: 'LineString', coordinates}})) : [f]);
const origin = [121.4351, 31.2105];
const project = ([lon, lat]) => [(lon - origin[0]) * 111320 * Math.cos(origin[1] * Math.PI / 180), -(lat - origin[1]) * 111320];
const round = value => Math.round(value * 100) / 100;
const p = coord => project(coord).map(round);
const wukang = source.features.find(f => f.properties.name === '武康路').geometry.coordinates.slice(3);
const anfu = source.features.find(f => f.properties.name === '安福路' && f.geometry.coordinates.length > 4).geometry.coordinates;
const shop = source.features.find(f => f.properties.name === '多抓鱼').geometry.coordinates;
// Follow the OSM centerlines north, east, then south. Interpolate the actual
// Anfu/Urumqi intersection rather than drawing a diagonal across a city block.
const urumqi = source.features.find(f => f.properties.name === '乌鲁木齐中路' && f.geometry.coordinates.length > 10).geometry.coordinates;
const intersection = [121.440662,31.216185];
const racAccess = [121.43562376499176,31.215040332136766];
const rawRoute = [[-172,551],[-174.35,535],...wukang.toReversed().map(p),p(racAccess),...anfu.toReversed().slice(2,4).map(p),p(intersection),...urumqi.slice(0,7).toReversed().map(p)];
const route = rawRoute.flatMap((point,i) => {
 if (!i) return [point];
 const a=rawRoute[i-1], steps=Math.ceil(Math.hypot(point[0]-a[0],point[1]-a[1])/150);
 return Array.from({length:steps},(_,j)=>point.map((n,k)=>round(a[k]+(n-a[k])*(j+1)/steps)));
});
const segmentDistance = (point, a, b) => {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const t = Math.max(0, Math.min(1, ((point[0] - a[0]) * dx + (point[1] - a[1]) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(point[0] - a[0] - t * dx, point[1] - a[1] - t * dy);
};
const distance = point => Math.min(...route.slice(1).map((b, i) => segmentDistance(point, route[i], b)));
const buildings = [], roads = [], labels = [];
for (const feature of source.features) {
  const { geometry: g, properties: props } = feature;
  if (props.layer === 'building' && g.type === 'Polygon') {
    const ring = g.coordinates[0].map(p);
    const center = ring.slice(0, -1).reduce((a, b) => [a[0] + b[0] / (ring.length - 1), a[1] + b[1] / (ring.length - 1)], [0, 0]);
    if (distance(center) > 190) continue;
    buildings.push({id: feature.id, polygon: ring, holes: g.coordinates.slice(1).map(r => r.map(p)), center, height: props.render_height, minHeight: props.render_min_height});
  }
  if (props.layer === 'transportation' && g.type === 'LineString' && !['rail', 'path'].includes(props.class) && props.brunnel !== 'tunnel') {
    const points = g.coordinates.map(p);
    if (points.some(point => distance(point) < 240)) roads.push({points, class: props.class, subclass: props.subclass});
  }
  if (props.layer === 'transportation_name' && g.type === 'LineString') {
    const points = g.coordinates.map(p);
    if (points.some(point => distance(point) < 200)) labels.push({name: props.name, points});
  }
}
const south = p(wukang.at(-1));
// The source combines 300–308 Anfu in one footprint. Divide its frontage into
// illustrative shop bays; do not stack two full-size models at one address.
const combined = buildings.find(b=>b.id==='147898520-2094');
const [a,b,c,d]=combined.polygon;
const mix=(a,b,t)=>a.map((n,i)=>round(n+(b[i]-n)*t));
const front=mix(a,d,0.4), back=mix(b,c,0.4);
const center=ring=>ring.slice(0,-1).reduce((a,p)=>a.map((n,i)=>n+p[i]/(ring.length-1)),[0,0]);
const west=[a,b,back,front,a];
buildings.push({...combined,id:'147898520-2094-wiggle',polygon:west,center:center(west),height:15,placement:'Illustrative subdivision of shared source footprint'});
combined.polygon=[front,back,c,d,front]; combined.center=center(combined.polygon);
combined.placement='Illustrative subdivision of shared source footprint';
const output = {origin, unit: 'metre', source: source.source, attribution: source.attribution, buildings, roads, labels, route, shop: p(shop), south, routeLength: route.slice(1).reduce((sum, b, i) => sum + Math.hypot(b[0] - route[i][0], b[1] - route[i][1]), 0)};
await writeFile(new URL('../public/data/streets.json', import.meta.url), JSON.stringify(output));
console.log('Prepared:', buildings.length, 'buildings', roads.length, 'roads. Route', output.routeLength.toFixed(0), 'm');
