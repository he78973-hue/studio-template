import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Dimensions in metres. All texture artwork is generated here, not sampled
// from the research photographs. Each landmark is merged by material at finish.
export const tones = {
  chalk:'#e7e1d2', plaster:'#c7c2b4', taupe:'#a49e91', brick:'#ae7556',
  stone:'#d2c4ac', tile:'#a7583e', iron:'#343b36', green:'#36574c',
  glass:'#394b49', glassLight:'#657b76', shadow:'#242d29', wood:'#a48257',
  gray:'#989b96', grayBrick:'#a6a6a0', white:'#f2eee0', pink:'#cf2655',
  yellow:'#efc747', blue:'#589abb', leaf:'#6d8564', earth:'#777569',
};
export const mats = Object.fromEntries(Object.entries(tones).map(([key,color])=>[key,new THREE.MeshStandardMaterial({color,roughness:key==='glass'?0.3:0.86,metalness:key==='iron'?0.25:0})]));

const textureCache=new Map();
export function masonry(kind='brick') {
  if(textureCache.has(kind))return textureCache.get(kind);
  const c=document.createElement('canvas');c.width=c.height=512;const ctx=c.getContext('2d');
  const config={brick:[tones.brick,32,10,3.84],roof:[tones.tile,24,38,4],grayBrick:[tones.grayBrick,32,8,3.84],mosaic:[tones.chalk,16,16,0.8],plaster:[tones.plaster,0,0,1.8],taupe:[tones.taupe,0,0,1.8],stone:[tones.wood,128,256,4]}[kind];
  const [base,bw,bh,metres]=config;ctx.fillStyle=base;ctx.fillRect(0,0,512,512);
  let seed=27;const random=()=>{seed=(seed*16807)%2147483647;return (seed-1)/2147483646;};
  if(bw)for(let y=0;y<512;y+=bh)for(let x=-bw;x<512;x+=bw){
    const shift=kind==='mosaic'||kind==='stone'?0:(y/bh%2)*bw/2;
    ctx.fillStyle=`rgba(255,250,228,${0.025+random()*(kind==='roof'||kind==='stone'?.07:.13)})`;ctx.fillRect(x+shift,y,bw-1,bh-1);
    ctx.fillStyle=`rgba(43,36,27,${random()*.07})`;ctx.fillRect(x+shift+1,y+1,bw-3,bh-3);
    if(kind==='roof'){
      const gradient=ctx.createLinearGradient(x+shift,y,x+shift+bw,y);gradient.addColorStop(0,'rgba(30,15,8,.17)');gradient.addColorStop(.45,'rgba(255,220,180,.1)');gradient.addColorStop(1,'rgba(30,15,8,.13)');ctx.fillStyle=gradient;ctx.fillRect(x+shift,y,bw,bh-1);
      ctx.strokeStyle='rgba(37,18,8,.24)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x+shift,y+bh-3);ctx.quadraticCurveTo(x+shift+bw/2,y+bh+1,x+shift+bw,y+bh-3);ctx.stroke();
    }
  }
  for(let i=0;i<26000;i++){ctx.fillStyle=`rgba(${i%2?'255,252,232':'40,32,22'},${random()*(kind==='stone'?0.08:0.14)})`;ctx.fillRect(random()*512,random()*512,1,1);}
  if(kind==='stone')for(let i=0;i<120;i++){ctx.strokeStyle=`rgba(61,52,24,${random()*0.09})`;ctx.beginPath();ctx.moveTo(random()*512,0);ctx.bezierCurveTo(random()*512,160,random()*512,300,random()*512,512);ctx.stroke();}
  const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(1/metres,1/metres);texture.anisotropy=8;
  const bump=texture.clone();bump.colorSpace=THREE.NoColorSpace;bump.needsUpdate=true;
  const material=new THREE.MeshStandardMaterial({map:texture,bumpMap:bump,bumpScale:kind==='mosaic'?0.025:0.045,roughness:0.96});
  textureCache.set(kind,material);return material;
}

export function metricUV(geometry) {
  const p=geometry.attributes.position,n=geometry.attributes.normal;
  const uv=new Float32Array(p.count*2);
  for(let i=0;i<p.count;i++){
    const ax=Math.abs(n.getX(i)),ay=Math.abs(n.getY(i)),az=Math.abs(n.getZ(i));
    uv[i*2]=ax>az&&ax>ay?p.getZ(i):p.getX(i);
    uv[i*2+1]=ay>ax&&ay>az?p.getZ(i):p.getY(i);
  }
  geometry.setAttribute('uv',new THREE.BufferAttribute(uv,2));return geometry;
}
export function mesh(g,geometry,material,p=[0,0,0]) {
  const o=new THREE.Mesh(geometry,material);o.position.set(...p);o.castShadow=true;o.receiveShadow=true;g.add(o);return o;
}
export function block(g,size,p,material=mats.chalk) {
  return mesh(g,metricUV(new THREE.BoxGeometry(...size)),material,p);
}
export function tube(g,points,r=0.035,material=mats.iron,closed=false) {
  const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)),closed);
  return mesh(g,new THREE.TubeGeometry(curve,Math.max(8,points.length*3),r,6,closed),material);
}
export function inRing(p,ring) {
  let result=false;
  for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])result=!result;}
  return result;
}
export function facadeFrame(building) {
  const faces=building.polygon.slice(1).map((end,i)=>{
    const a=building.polygon[i],dx=end[0]-a[0],dz=end[1]-a[1],length=Math.hypot(dx,dz),mid=[(a[0]+end[0])/2,(a[1]+end[1])/2];
    let n=[-dz/length,dx/length];if(inRing([mid[0]+n[0],mid[1]+n[1]],building.polygon))n=n.map(v=>-v);
    return {mid,n,length,angle:Math.atan2(n[0],n[1])};
  });
  const front=faces.filter(f=>f.length>6).sort((a,b)=>(b.n[1]*2+b.length/40)-(a.n[1]*2+a.length/40))[0];
  const local=building.polygon.map(([x,z])=>new THREE.Vector3(x-front.mid[0],0,z-front.mid[1]).applyAxisAngle(new THREE.Vector3(0,1,0),-front.angle));
  return {...front,width:front.length,depth:Math.max(...local.map(p=>-p.z))};
}
export function orientedGroup(building) {
  const frame=facadeFrame(building),group=new THREE.Group();group.position.set(frame.mid[0],0,frame.mid[1]);group.rotation.y=frame.angle;group.userData.frame=frame;
  return {group,...frame};
}
export function hipRoof(g,w,d,y,rise,x=0,z=0,material=mats.tile) {
  const v=[[-w/2,y,-d/2],[w/2,y,-d/2],[w/2,y,d/2],[-w/2,y,d/2],[-w*.3,y+rise,0],[w*.3,y+rise,0]];
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(v.flat(),3));geo.setIndex([0,4,5,0,5,1,1,5,2,2,5,4,2,4,3,3,4,0,0,1,2,0,2,3]);
  const flat=geo.toNonIndexed();geo.dispose();flat.computeVertexNormals();metricUV(flat);
  const o=mesh(g,flat,material,[x,0,z]);return o;
}
export function tiledRoof(g,w,d,y,rise,x=0,z=0) {
  hipRoof(g,w,d,y,rise,x,z,masonry('roof'));
  block(g,[w,0.14,d],[x,y-0.06,z],mats.tile);
  tube(g,[[x-w*.3,y+rise+.05,z],[x+w*.3,y+rise+.05,z]],.075,mats.tile);
  for(const sx of [-1,1])for(const sz of [-1,1])tube(g,[[x+sx*w*.3,y+rise+.05,z],[x+sx*w/2,y+.05,z+sz*d/2]],.065,mats.tile);
}
export function label(g,text,{x=0,y=0,z=0.1,w=4,h=0.65,color=tones.white,background=null,font='500 95px "PingFang SC",sans-serif'}={}) {
  const c=document.createElement('canvas');c.width=1024;c.height=Math.max(128,Math.round(1024*h/w));const ctx=c.getContext('2d');
  if(background){ctx.fillStyle=background;ctx.fillRect(0,0,c.width,c.height);}
  ctx.fillStyle=color;ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.font=font.replace(/\d+px/,`${Math.round(c.height*.8)}px`);ctx.fillText(text,c.width/2,c.height/2,c.width*.94);
  const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=8;
  const material=new THREE.MeshBasicMaterial({map:texture,transparent:true,side:THREE.DoubleSide,depthWrite:false});material.userData.noShadow=true;
  return mesh(g,new THREE.PlaneGeometry(w,h),material,[x,y,z]);
}
export function window(g,x,y,w=1.6,h=2.2,{frame=mats.green,z=0,columns=2,rows=3,shutters=false,arch=false}={}) {
  if(arch)return archWindow(g,x,y-h/2,w,h,{frame,z,columns,rows});
  block(g,[w+0.18,h+0.18,0.16],[x,y,z+0.08],mats.shadow);
  block(g,[w,h,0.04],[x,y,z+0.18],mats.glass);
  // Recessed glass, projecting perimeter and narrow muntins.
  for(const s of [-1,1]){
    block(g,[0.095,h+0.2,0.3],[x+s*(w/2+0.03),y,z+0.16],frame);
    block(g,[w+0.24,0.11,0.3],[x,y+s*(h/2+0.03),z+0.16],frame);
  }
  for(let i=1;i<columns;i++)block(g,[0.055,h,0.07],[x-w/2+i*w/columns,y,z+0.24],frame);
  for(let i=1;i<rows;i++)block(g,[w,0.055,0.07],[x,y-h/2+i*h/rows,z+0.24],frame);
  block(g,[w+0.34,0.13,0.48],[x,y-h/2-0.13,z+0.12],mats.chalk);
  if(shutters)for(const s of [-1,1])louver(g,x+s*(w*.72+0.16),y,w*.4,h,{z:z+0.12});
}
function archShape(w,h) {
  const r=w/2,s=new THREE.Shape();s.moveTo(-r,0);s.lineTo(r,0);s.lineTo(r,h-r);s.absarc(0,h-r,r,0,Math.PI,false);s.lineTo(-r,0);s.closePath();return s;
}
export function archWindow(g,x,bottom,w,h,{frame=mats.iron,z=0,columns=3,rows=4}={}) {
  const pane=mesh(g,new THREE.ShapeGeometry(archShape(w,h),24),mats.glass,[x,bottom,z+0.07]);
  pane.material=mats.glass;
  const points=[[-w/2,0,0],[-w/2,h-w/2,0]];
  for(let i=0;i<=24;i++){const a=Math.PI-i*Math.PI/24;points.push([Math.cos(a)*w/2,h-w/2+Math.sin(a)*w/2,0]);}
  points.push([w/2,0,0]);tube(g,points.map(([px,py,pz])=>[px+x,py+bottom,pz+z+0.16]),0.075,frame);
  for(let i=1;i<columns;i++){const px=-w/2+i*w/columns;const height=h-w/2+Math.sqrt(w*w/4-px*px);block(g,[0.055,height,0.06],[x+px,bottom+height/2,z+0.14],frame);}
  for(let i=1;i<rows;i++){const py=i*h/rows;const width=py<h-w/2?w:2*Math.sqrt(w*w/4-(py-h+w/2)**2);block(g,[width,0.055,0.06],[x,bottom+py,z+0.14],frame);}
  block(g,[w+0.3,0.14,0.38],[x,bottom-0.06,z+0.1],mats.tile);
}
export function louver(g,x,y,w,h,{z=0,material=mats.iron}={}) {
  block(g,[w,h,0.1],[x,y,z],material);
  for(let j=0;j<Math.floor(h/0.12);j++){const o=block(g,[w-0.07,0.045,0.09],[x,y-h/2+0.07+j*0.12,z+0.075],material);o.rotation.x=0.25;}
  for(const s of [-1,1])block(g,[0.06,h+0.06,0.15],[x+s*w/2,y,z],material);
}
export function rail(g,w,y,z,{x=0,h=1.05,material=mats.iron}={}) {
  for(const dy of [0.16,h])block(g,[w,0.045,0.045],[x,y+dy,z],material);
  const n=Math.ceil(w/0.2);for(let i=0;i<=n;i++)block(g,[0.028,h,0.028],[x-w/2+w*i/n,y+h/2,z],material);
}
export function balcony(g,x,y,w=2.7,depth=1.05) {
  const r=w/2,s=new THREE.Shape();s.moveTo(-r,0);s.absellipse(0,0,r,depth,Math.PI,0,true);s.lineTo(-r,0);s.closePath();
  const geo=new THREE.ExtrudeGeometry(s,{depth:0.16,bevelEnabled:true,bevelSize:0.025,bevelThickness:0.02,bevelSegments:2});geo.rotateX(-Math.PI/2);
  mesh(g,geo,mats.tile,[x,y,0.18]);
  // Convex iron balusters; 1.05m rail, 30mm rods. Open space remains visible.
  for(let i=0;i<=26;i++){
    const a=i*Math.PI/26,px=-Math.cos(a),pz=Math.sin(a);
    tube(g,[[x+px*r,y+0.12,0.18+pz*depth],[x+px*(r+0.1),y+0.4,0.18+pz*(depth+0.15)],[x+px*(r-0.04),y+0.85,0.18+pz*(depth-0.04)],[x+px*r,y+1.17,0.18+pz*depth]],0.015);
    const loop=[];for(let k=0;k<13;k++){const t=k*Math.PI*2/12;loop.push([x+px*r+Math.sin(a)*Math.cos(t)*0.057,y+1.04+Math.sin(t)*0.075,0.18+pz*depth+Math.cos(a)*Math.cos(t)*0.057]);}tube(g,loop,0.009,mats.iron);
  }
  for(const dy of [0.15,1.18]){const p=[];for(let i=0;i<=32;i++){const a=i*Math.PI/32;p.push([x-Math.cos(a)*r,y+dy,0.18+Math.sin(a)*depth]);}tube(g,p,0.033);}
  for(const s of [-1,1]){const o=block(g,[0.14,0.65,0.7],[x+s*w*.28,y-0.27,0.35],mats.stone);o.rotation.x=-0.35;}
}
export function pot(g,x,z,size=0.8) {
  mesh(g,new THREE.CylinderGeometry(size*.45,size*.3,size*.8,12),mats.wood,[x,size*.4,z]);
  for(let i=0;i<5;i++){const a=i*2.4;const leaf=mesh(g,new THREE.IcosahedronGeometry(size*.42,1),mats.leaf,[x+Math.cos(a)*size*.28,size*1.2+Math.sin(i)*size*.12,z+Math.sin(a)*size*.28]);leaf.scale.y=1.5;}
}
export function table(g,x,z) {
  mesh(g,new THREE.CylinderGeometry(0.62,0.62,0.055,24),mats.wood,[x,0.75,z]);
  block(g,[0.055,0.7,0.055],[x,0.36,z],mats.iron);block(g,[0.6,0.04,0.6],[x,0.04,z],mats.iron);
  for(const side of [-1,1]){
    block(g,[0.46,0.06,0.46],[x+side*0.95,0.43,z],mats.wood);
    for(const a of [-1,1])for(const b of [-1,1])block(g,[0.03,0.44,0.03],[x+side*0.95+a*.19,0.22,z+b*.19],mats.iron);
    block(g,[0.06,0.4,0.48],[x+side*1.14,0.64,z],mats.wood);
  }
}

export function compact(g,id) {
  // Merge in landmark-local space. Bounding boxes and raycasts stay correct,
  // while hundreds of mullions/louvers need only one call per material.
  g.updateMatrixWorld(true);const inverse=g.matrixWorld.clone().invert(),buckets=new Map(),originals=new Set();
  g.traverse(o=>{if(!o.isMesh)return;const key=o.material;const a=buckets.get(key)||[];let geo=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();geo.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse,o.matrixWorld));a.push(geo);buckets.set(key,a);originals.add(o.geometry);});
  g.clear();
  for(const [material,geometries] of buckets){const geo=mergeGeometries(geometries,false);geometries.forEach(a=>a.dispose());if(!geo)throw new Error(`Cannot merge ${id}`);geo.computeBoundingSphere();const o=mesh(g,geo,material);o.castShadow=!material.userData.noShadow;}
  originals.forEach(geo=>geo.dispose());g.name=id;g.traverse(o=>o.userData.stop=id);return g;
}
