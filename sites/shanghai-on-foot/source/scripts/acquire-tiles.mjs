import { writeFile } from 'node:fs/promises';
import { VectorTile } from '@mapbox/vector-tile';
import Pbf from 'pbf';
const z = 14;
const bbox = [121.426, 31.199, 121.445, 31.216];
const tx = lon => Math.floor((lon + 180) / 360 * 2 ** z);
const ty = lat => Math.floor((1 - Math.asinh(Math.tan(lat * Math.PI / 180)) / Math.PI) / 2 * 2 ** z);
const response = await fetch('https://tiles.openfreemap.org/planet');
const info = await response.json();
const features = [];
const seen = new Set();
for (let x = tx(bbox[0]); x <= tx(bbox[2]); x++) {
  for (let y = ty(bbox[3]); y <= ty(bbox[1]); y++) {
    const url = info.tiles[0].replace('{z}', z).replace('{x}', x).replace('{y}', y);
    const r = await fetch(url, {signal: AbortSignal.timeout(25000)});
    if (!r.ok) throw new Error('Tile status ' + r.status);
    const tile = new VectorTile(new Pbf(new Uint8Array(await r.arrayBuffer())));
    for (const key of ['building', 'transportation', 'transportation_name', 'poi', 'landuse', 'landcover', 'housenumber']) {
      const layer = tile.layers[key];
      if (!layer) continue;
      for (let i = 0; i < layer.length; i++) {
        const feature = layer.feature(i).toGeoJSON(x, y, z);
        feature.properties.layer = key;
        const hash = key + JSON.stringify(feature.geometry);
        if (seen.has(hash)) continue;
        seen.add(hash);
        features.push(feature);
      }
    }
    console.log('Decoded tile', z, x, y);
  }
}
const data = {type: 'FeatureCollection', source: info.tiles[0], attribution: info.attribution, retrieved: new Date().toISOString(), features};
await writeFile(new URL('../public/data/neighborhood.geojson', import.meta.url), JSON.stringify(data));
console.log('Saved', features.length, 'features');
console.log(JSON.stringify(features.filter(f => /武康|安福|多抓鱼|Wukang|Anfu/.test(f.properties.name || ''))));
