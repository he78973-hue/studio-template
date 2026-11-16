import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Batch only immovable, uninstanced geometry. Animated assemblies remain independent.
export function optimizeStatic(root, exclusions=[]) {
  root.updateMatrixWorld(true);
  const excluded=new Set(exclusions),batches=new Map(),inverse=root.matrixWorld.clone().invert();
  root.traverse(mesh=>{
    if(!mesh.isMesh||mesh.isInstancedMesh||Array.isArray(mesh.material)||mesh.geometry.attributes.color||mesh.material.transmission>0)return;
    if(mesh.name==='Animated train coupling'||mesh.name==='Contoured river-bank terrain')return;
    for(let o=mesh;o&&o!==root;o=o.parent)if(excluded.has(o))return;
    const key=`${mesh.material.uuid}/${mesh.castShadow}/${mesh.receiveShadow}`;
    if(!batches.has(key))batches.set(key,[]);batches.get(key).push(mesh);
  });
  for(const meshes of batches.values()) {
    if(meshes.length<2)continue;
    const parts=meshes.map(mesh=>{
      let geo=mesh.geometry.clone();if(geo.index)geo=geo.toNonIndexed();
      for(const name of Object.keys(geo.attributes))if(!['position','normal','uv'].includes(name))geo.deleteAttribute(name);
      if(!geo.attributes.uv)geo.setAttribute('uv',new THREE.Float32BufferAttribute(new Float32Array(geo.attributes.position.count*2),2));
      geo.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse,mesh.matrixWorld));return geo;
    });
    const merged=mergeGeometries(parts,false);parts.forEach(g=>g.dispose());
    if(!merged)throw new Error('Static geometry could not be batched.');
    const result=new THREE.Mesh(merged,meshes[0].material);result.castShadow=meshes[0].castShadow;result.receiveShadow=meshes[0].receiveShadow;
    result.name='Batched handcrafted details';root.add(result);meshes.forEach(m=>m.removeFromParent());
  }
}
