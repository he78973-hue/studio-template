import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export function random(seed = 42) {
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
export const rng = random(481001);
const geometries = new Map();
export const material = (color, options = {}) => new THREE.MeshStandardMaterial({ color, roughness: .75, ...options });
export function add(parent, geometry, mat, x=0, y=0, z=0) {
  const mesh = new THREE.Mesh(geometry, mat);
  mesh.position.set(x,y,z); mesh.castShadow = true; mesh.receiveShadow = true;
  parent.add(mesh); return mesh;
}
export function box(parent, w,h,d,mat,x=0,y=0,z=0,round=0) {
  const key = `${w}/${h}/${d}/${round}`;
  if (!geometries.has(key)) geometries.set(key, round ? new RoundedBoxGeometry(w,h,d,2,round) : new THREE.BoxGeometry(w,h,d));
  return add(parent, geometries.get(key), mat,x,y,z);
}
export function cylinder(parent, rt,rb,h,mat,x=0,y=0,z=0,segments=32) {
  return add(parent,new THREE.CylinderGeometry(rt,rb,h,segments),mat,x,y,z);
}
export function sphere(parent, r,mat,x=0,y=0,z=0,scale=[1,1,1]) {
  const key = `sphere/${r}`;
  if (!geometries.has(key)) geometries.set(key,new THREE.SphereGeometry(r,12,8));
  const mesh = add(parent,geometries.get(key),mat,x,y,z); mesh.scale.set(...scale); return mesh;
}
export function rod(parent,a,b,r,mat,rTop=r) {
  a = a.isVector3 ? a : new THREE.Vector3(...a); b = b.isVector3 ? b : new THREE.Vector3(...b);
  const delta = b.clone().sub(a);
  const mesh = cylinder(parent,rTop,r,delta.length(),mat);
  mesh.position.copy(a).add(b).multiplyScalar(.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize()); return mesh;
}
export function tube(parent, points, radius, mat, closed=false) {
  const curve = new THREE.CatmullRomCurve3(points.map(p=>p.isVector3?p:new THREE.Vector3(...p)),closed);
  return add(parent,new THREE.TubeGeometry(curve,Math.max(24,points.length*4),radius,6,closed),mat);
}
export function torus(parent,radius,t,mat,x=0,y=0,z=0) {
  return add(parent,new THREE.TorusGeometry(radius,t,8,96),mat,x,y,z);
}
export function label(parent,text,w,h,x,y,z,{ bg='#dac18e', ink='#3c392b', font='serif', border=true }={}) {
  const canvas = document.createElement('canvas'); canvas.width=1024; canvas.height=Math.round(1024*h/w);
  const ctx=canvas.getContext('2d'); ctx.fillStyle=bg; ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle=ink; ctx.strokeStyle=ink;
  if(border) { ctx.lineWidth=2; ctx.strokeRect(12,12,canvas.width-24,canvas.height-24); }
  ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font=`${canvas.height*.43}px ${font}`;
  ctx.fillText(text,canvas.width/2,canvas.height*.52,canvas.width*.9);
  const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace; tex.anisotropy=4;
  return add(parent,new THREE.PlaneGeometry(w,h),material(0xffffff,{map:tex,roughness:.48,metalness:.18,side:THREE.DoubleSide}),x,y,z);
}

export function woodTexture() {
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=512;
  const ctx=canvas.getContext('2d'), img=ctx.createImageData(1024,512); const rand=random(5);
  for(let y=0;y<512;y++) for(let x=0;x<1024;x++) {
    const warp=y*.15+Math.sin(x*.009)*2.5+Math.sin(x*.031+y*.008)*.9;
    const grain=Math.sin(warp*5)*2+Math.sin(warp*13)*1.5+Math.sin(warp*.62)*6;
    const knot=Math.sin(Math.sqrt(((x-380)*.034)**2+((y-210)*.21)**2)*5)*2;
    const v=grain+knot+(rand()-.5)*7, i=(y*1024+x)*4;
    img.data[i]=103+v*1.2;img.data[i+1]=67+v;img.data[i+2]=43+v*.7;img.data[i+3]=255;
  }
  ctx.putImageData(img,0,0); const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;
  tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.anisotropy=8;return tex;
}

export function createPalette() {
  const grain=woodTexture();
  return {
    walnut: new THREE.MeshPhysicalMaterial({color:0xbca58e,map:grain,roughness:.39,metalness:0,clearcoat:.24,clearcoatRoughness:.38}),
    darkWood: material(0x523526,{roughness:.64}),
    trimWood: material(0x875432,{roughness:.52}),
    brass: material(0xb99854,{metalness:.82,roughness:.29}),
    darkBrass: material(0x6f633b,{metalness:.72,roughness:.4}),
    iron: material(0x373e38,{metalness:.65,roughness:.39}),
    cream: material(0xe5d3aa),
    wall: material(0xc8b68b,{roughness:.92}),
    green: material(0x254b42,{metalness:.25,roughness:.32}),
    roof: material(0x8d4833,{roughness:.73}),
    roofLight: material(0xa0563a,{roughness:.8}),
    earth: material(0x726141),
    stone: material(0x8e9081,{flatShading:true}),
    darkStone: material(0x666c60,{flatShading:true}),
    glass: new THREE.MeshPhysicalMaterial({color:0xb5d3cf,roughness:.16,metalness:.18,transparent:true,opacity:.75,side:THREE.DoubleSide}),
    glow: material(0xf2cd72,{emissive:0xffb644,emissiveIntensity:.12,roughness:.48}),
    black: material(0x2b2e25),
    wool: material(0xeee4c8,{roughness:1}),
    woolShade: material(0xd7c9a7,{roughness:1}),
  };
}

export class InstanceBatch {
  constructor(geometry,mat,shadow=true) { this.geometry=geometry;this.mat=mat;this.entries=[];this.shadow=shadow;this.dummy=new THREE.Object3D(); }
  push(position,scale=[1,1,1],rotation=[0,0,0],color=null) {
    this.dummy.position.copy(position.isVector3?position:new THREE.Vector3(...position));
    this.dummy.scale.set(...scale);this.dummy.rotation.set(...rotation);this.dummy.updateMatrix();
    this.entries.push({matrix:this.dummy.matrix.clone(),color});
  }
  between(a,b,r,color=null) {
    const delta=b.clone().sub(a);this.dummy.position.copy(a).add(b).multiplyScalar(.5);
    this.dummy.scale.set(r,delta.length(),r);this.dummy.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());this.dummy.updateMatrix();
    this.entries.push({matrix:this.dummy.matrix.clone(),color});
  }
  finish(parent) {
    if(!this.entries.length)return null;
    const mesh=new THREE.InstancedMesh(this.geometry,this.mat,this.entries.length);
    this.entries.forEach((e,i)=>{mesh.setMatrixAt(i,e.matrix);if(e.color)mesh.setColorAt(i,e.color);});
    mesh.instanceMatrix.needsUpdate=true;
    if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
    mesh.castShadow=this.shadow;mesh.receiveShadow=true;mesh.computeBoundingSphere();parent.add(mesh);return mesh;
  }
}
