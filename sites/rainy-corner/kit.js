import * as T from 'three';
export {T};
export const scene=new T.Scene(), dynamic={};
export const C={ink:'#182333',wall:'#9da7ab',cream:'#f4e1ad',mint:'#72e5c2',red:'#d86d73',blue:'#597791',steel:'#4c6576',road:'#263646',roof:'#426779'};
const gradient=new T.DataTexture(new Uint8Array([85,155,216,255]),4,1,T.RedFormat);gradient.needsUpdate=true;gradient.minFilter=gradient.magFilter=T.NearestFilter;
const mats=new Map();
export function mat(color,glow=0){const k=color+glow;if(!mats.has(k))mats.set(k,new T.MeshToonMaterial({color,gradientMap:gradient,emissive:color,emissiveIntensity:glow}));return mats.get(k);}
export function basic(color){return new T.MeshBasicMaterial({color});}
export const edgeMat=new T.LineBasicMaterial({color:'#101e2c',transparent:true,opacity:.62});
export function mesh(g,m,x=0,y=0,z=0,parent=scene,edge=false){let a=new T.Mesh(g,typeof m==='string'?mat(m):m);a.position.set(x,y,z);a.castShadow=true;a.receiveShadow=true;parent.add(a);if(edge){let e=new T.LineSegments(new T.EdgesGeometry(g,32),edgeMat);a.add(e);}return a;}
export function box(w,h,d,x,y,z,m=C.wall,p=scene,e=false){return mesh(new T.BoxGeometry(w,h,d),m,x,y,z,p,e);}
export function cyl(r,h,x,y,z,m=C.steel,p=scene,rt=r){return mesh(new T.CylinderGeometry(rt,r,h,12),m,x,y,z,p);}
export function ball(r,x,y,z,m,p=scene){return mesh(new T.SphereGeometry(r,12,8),m,x,y,z,p);}
export function rod(a,b,r=.025,m=C.steel,p=scene){a=new T.Vector3(...a);b=new T.Vector3(...b);let v=b.clone().sub(a);let o=cyl(r,v.length(),...a.clone().add(b).multiplyScalar(.5).toArray(),m,p);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());return o;}
export function line(points,r=.018,m=C.ink,p=scene){return mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(v=>new T.Vector3(...v))),32,r,6,false),m,0,0,0,p);}
export function group(x=0,y=0,z=0,rot=0,p=scene){let g=new T.Group();g.position.set(x,y,z);g.rotation.y=rot;p.add(g);return g;}
export function texture(draw,w=1024,h=256){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);let t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=8;return t;}
export function label(text,w,h,x,y,z,{bg='#173b40',fg='#edffdf',size=100,rot=0,parent=scene,sub='',glow=true,canvasWidth=1024}={}){
const font='"PingFang SC","Microsoft YaHei","Noto Sans CJK SC",sans-serif';
const tex=texture((c,W,H)=>{c.fillStyle=bg;c.fillRect(0,0,W,H);c.textAlign='center';c.textBaseline='middle';c.fillStyle=fg;c.font=`600 ${size}px ${font}`;c.fillText(text,W/2,H*(sub?.40:.52));if(sub){c.font=`42px ${font}`;c.fillText(sub,W/2,H*.81);}},canvasWidth,256);
const m=glow?new T.MeshBasicMaterial({map:tex,side:T.DoubleSide}):new T.MeshToonMaterial({map:tex,side:T.DoubleSide});let o=mesh(new T.PlaneGeometry(w,h),m,x,y,z,parent);o.rotation.y=rot;o.castShadow=false;return o;}
export function light(color,intensity,x,y,z,distance=8){const l=new T.PointLight(color,intensity,distance,2);l.position.set(x,y,z);scene.add(l);return l;}
let seed=21;export function rand(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
export function decal(w,d,x,z,tex,opacity=1,y=.018){const o=mesh(new T.PlaneGeometry(w,d),new T.MeshBasicMaterial({map:tex,transparent:true,opacity,depthWrite:false}),x,y,z);o.rotation.x=-Math.PI/2;o.castShadow=false;return o;}
