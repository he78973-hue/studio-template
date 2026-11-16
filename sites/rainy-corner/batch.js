import {T,scene,dynamic} from './kit.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
export function batchStatic(){
scene.updateMatrixWorld(true);const buckets=new Map(),lines=[];
scene.traverse(o=>{if(!o.isMesh||o.isInstancedMesh||o.isReflector||Array.isArray(o.material)||o.material.transparent)return;let p=o;while(p){if(dynamic.doors.includes(p))return;p=p.parent;}
const k=o.material.uuid;if(!buckets.has(k))buckets.set(k,{material:o.material,items:[]});buckets.get(k).items.push(o);});
for(const {material,items}of buckets.values()){if(items.length<2)continue;const geometry=mergeGeometries(items.map(o=>{const g=o.geometry.clone();g.applyMatrix4(o.matrixWorld);return g;}));if(!geometry)continue;for(const o of items){for(const child of o.children){if(child.isLineSegments){let g=child.geometry.clone();g.applyMatrix4(child.matrixWorld);lines.push(g);}}o.removeFromParent();}const m=new T.Mesh(geometry,material);m.castShadow=true;m.receiveShadow=true;scene.add(m);}
if(lines.length){const g=mergeGeometries(lines);scene.add(new T.LineSegments(g,new T.LineBasicMaterial({color:'#142634',transparent:true,opacity:.55})));}
}
