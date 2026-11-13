import {T,scene,C,box,mat,basic,mesh,cyl,rod,texture,decal,rand,dynamic} from './kit.js';
import {Reflector} from 'three/addons/objects/Reflector.js';
export function ground(){
dynamic.wetOverlays=[];
box(14,.6,14,0,-.34,0,'#263949',scene,true);box(13.9,.08,13.9,0,-.015,0,'#334353');
const mirror=new Reflector(new T.PlaneGeometry(13.86,13.86),{textureWidth:1024,textureHeight:1024,color:'#819bb0',clipBias:.003});mirror.rotation.x=-Math.PI/2;mirror.position.y=.029;
mirror.material.uniforms.time={value:0};mirror.material.uniforms.day={value:0};mirror.material.fragmentShader=mirror.material.fragmentShader.replace('void main() {','uniform float time;\nuniform float day;\nvoid main() {').replace('vec4 base = texture2DProj( tDiffuse, vUv );',`vec4 q=vUv; q.x += (sin(q.y*110.0+time*1.5)+sin(q.y*230.0-time))*0.0013*q.w; vec4 base=texture2DProj(tDiffuse,q)*0.4; for(int i=0;i<4;i++){vec4 offset=q; offset.x+=(float(i)-1.5)*0.0018*q.w;offset.y+=(float(i)-1.5)*0.001*q.w;base+=texture2DProj(tDiffuse,offset)*0.15;}`).replace('gl_FragColor = vec4( blendOverlay( base.rgb, color ), 1.0 );','gl_FragColor = vec4(mix(mix(vec3(0.027,0.046,0.069),vec3(0.115,0.16,0.18),day), blendOverlay(base.rgb,color),0.30*(1.0-day)),1.0);');scene.add(mirror);dynamic.mirror=mirror;
box(9.8,.22,8.8,.75,.14,-1.72,'#687b84',scene,true);
for(let x=-4.1;x<5.7;x+=.49)box(.46,.04,.37,x,.265,2.47,'#86949a');
for(let z=-5.7;z<2.5;z+=.49)box(.37,.04,.46,-4.31,.265,z,'#83949d');
for(let x=-3.9;x<5.5;x+=.62)for(let z=-5.5;z<2.2;z+=.64){box(.605,.012,.624,x,.257,z,mat((Math.floor((x+z)*10)%3===0)?'#6b7e87':'#73868c'));}
for(let i=0;i<7;i++)box(1.9,.012,.34,-4.96,.049,3.1+i*.49,mat('#b5c5c2',.12));
for(let i=0;i<5;i++)box(.09,.01,.62,-5.35,.048,-5.9+i*1.12,mat('#b6bba4',.1));
for(const x of [-2.1,1.0,4.1]){box(.045,.01,1.65,x,.052,3.65,'#c7cabc');box(2.9,.01,.045,x+1.45,.052,4.46,'#c7cabc');}
const numbers=texture((c)=>{c.fillStyle='#c6cdc2';c.font='bold 115px sans-serif';c.textAlign='center';c.fillText('01        02',512,180);});decal(5,.65,.85,3.9,numbers,1,.055);
for(let x=-3.6;x<5.6;x+=.85){box(.72,.014,.2,x,.277,2.04,'#253b47');for(let n=0;n<8;n++)box(.024,.014,.19,x-.3+n*.084,.289,2.04,'#738892');}
const puddleTex=texture((c,W,H)=>{c.fillStyle='#7397b0';c.beginPath();for(let i=0;i<60;i++){const a=i/60*Math.PI*2,r=.8+rand()*.18;const x=W/2+Math.cos(a)*W*.48*r,y=H/2+Math.sin(a)*H*.44*r;i?c.lineTo(x,y):c.moveTo(x,y);}c.closePath();c.fill();},512,256);
for(const [x,z,w,d]of [[0,5.2,4.6,1.2],[-5.6,1.4,1.3,2.9],[4.7,5.5,2.3,.8],[3.5,2.9,2,.6],[-2.8,3.4,1.7,.8]]){const object=decal(w,d,x,z,puddleTex,.12,.052);dynamic.wetOverlays.push({object,opacity:.12});}
const m=cyl(.48,.015,-.8,.055,5.6,'#344c5a');for(let i=-3;i<=3;i++)box(.62,.007,.018,-.8,.067,5.6+i*.095,'#6a7d84');
// Broken painted reflections add a graphic, animation-background finish.
for(let i=0;i<70;i++){const x=-3+rand()*6,z=2.65+rand()*3.7;const object=box(.1+rand()*.48,.002,.012+rand()*.04,x,.056,z,new T.MeshBasicMaterial({color:i%3?'#69bda9':'#e8bb81',transparent:true,opacity:.05+rand()*.09,depthWrite:false}));dynamic.wetOverlays.push({object,opacity:object.material.opacity});}
}
