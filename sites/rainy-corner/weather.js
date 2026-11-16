import {T,scene,mat,mesh,rand,dynamic} from './kit.js';
export function weather(){
const count=1200,positions=new Float32Array(count*6),seeds=[];
for(let i=0;i<count;i++)seeds.push({x:rand()*13.6-6.8,z:rand()*13.6-6.8,phase:rand(),speed:5+rand()*4,length:.12+rand()*.22});
const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(positions,3));
const rain=new T.LineSegments(geometry,new T.LineBasicMaterial({color:'#a3c5d5',transparent:true,opacity:.23,depthWrite:false}));
rain.material.onBeforeCompile=shader=>{shader.vertexShader=shader.vertexShader.replace('void main() {','varying float rainHeight;\nvoid main() {\nrainHeight=position.y;');shader.fragmentShader=shader.fragmentShader.replace('void main() {','varying float rainHeight;\nvoid main() {').replace('#include <opaque_fragment>','diffuseColor.a *= 1.0-smoothstep(6.0,9.0,rainHeight);\n#include <opaque_fragment>');};
rain.frustumCulled=false;scene.add(rain);
const ring=new T.InstancedMesh(new T.RingGeometry(.91,1,28),new T.MeshBasicMaterial({color:'#80adaf',transparent:true,opacity:.2,side:T.DoubleSide,depthWrite:false}),95);scene.add(ring);ring.frustumCulled=false;
const ripples=[];for(let i=0;i<95;i++){let x,z;do{x=rand()*13.5-6.75;z=rand()*13.5-6.75;}while(x>-4.55&&x<5.7&&z<2.75&&z>-6.2);ripples.push({x,z,p:rand(),speed:.45+rand()*.55,size:.18+rand()*.23});}
const tmp=new T.Object3D(),color=new T.Color();
const drips=new Float32Array(45*6);const dg=new T.BufferGeometry();dg.setAttribute('position',new T.BufferAttribute(drips,3));const drops=new T.LineSegments(dg,new T.LineBasicMaterial({color:'#b7d9d4',transparent:true,opacity:.4,depthWrite:false}));scene.add(drops);
const streaks=new Float32Array(36*6);const sg=new T.BufferGeometry();sg.setAttribute('position',new T.BufferAttribute(streaks,3));const windowRain=new T.LineSegments(sg,new T.LineBasicMaterial({color:'#c4e6d5',transparent:true,opacity:.21,depthWrite:false}));scene.add(windowRain);
dynamic.weatherObjects=[rain,ring,drops,windowRain];
const smooth=x=>x*x*(3-2*x);
return function update(t,rainAmount=1){
dynamic.weatherObjects.forEach((o,i)=>{o.visible=rainAmount>.001;o.material.opacity=[.23,.2,.4,.21][i]*rainAmount;});
for(let i=0;i<count;i++){const s=seeds[i],floor=s.x>-4.4&&s.x<4.4&&s.z>-4.65&&s.z<2.34?3.89:.09;const y=floor+(1-((s.phase+t*s.speed/9)%1))*(9-floor),k=i*6;positions[k]=s.x;positions[k+1]=y;positions[k+2]=s.z;positions[k+3]=s.x-.025;positions[k+4]=Math.max(floor,y-s.length);positions[k+5]=s.z+.008;}
geometry.attributes.position.needsUpdate=true;
ripples.forEach((s,i)=>{const p=(t*s.speed+s.p)%1;tmp.position.set(s.x,.066,s.z);tmp.rotation.set(-Math.PI/2,0,0);tmp.scale.setScalar(.018+p*s.size);tmp.updateMatrix();ring.setMatrixAt(i,tmp.matrix);color.setScalar((1-p)*.8);ring.setColorAt(i,color);});ring.instanceMatrix.needsUpdate=true;if(ring.instanceColor)ring.instanceColor.needsUpdate=true;
for(let i=0;i<45;i++){const y=2.74-((t*(.65+(i%4)*.12)+i*.217)%1)*2.45,k=i*6;drips[k]=-4.2+i*.19;drips[k+1]=y;drips[k+2]=2.3;drips[k+3]=drips[k];drips[k+4]=y-.07;drips[k+5]=2.3;}dg.attributes.position.needsUpdate=true;
for(let i=0;i<36;i++){const x=-3.9+(i%24)*.21,y=2.65-((t*.09+i*.173)%1)*2.06,k=i*6;streaks[k]=x;streaks[k+1]=y;streaks[k+2]=1.339;streaks[k+3]=x+.008;streaks[k+4]=y-.08-(i%3)*.055;streaks[k+5]=1.34;}sg.attributes.position.needsUpdate=true;
let phase=t%19,open=phase<2.5?smooth(Math.min(1,phase/1.5)):phase<5.5?1:phase<7?smooth((7-phase)/1.5):0;dynamic.doors[0].position.x=1.8-open*.6;dynamic.doors[1].position.x=2.87+open*.6;
if(dynamic.signMaterial)dynamic.signMaterial.emissiveIntensity=(.87+.025*Math.sin(t*3.1)+.008*Math.sin(t*23))*(.22+.78*rainAmount);
dynamic.mirror.material.uniforms.time.value=t;
if(dynamic.signals){const active=Math.floor(t/9)%3;dynamic.signals.forEach((m,i)=>m.emissiveIntensity=i===active?1.7:.04);}
if(dynamic.signLight)dynamic.signLight.intensity=2.66*(1-.04*Math.sin(t*2.7)-.025*Math.sin(t*17))*(.13+.87*rainAmount);
dynamic.time=t;dynamic.doorOpen=open;
};
}
