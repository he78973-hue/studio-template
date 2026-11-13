import * as THREE from 'three';
import { treeLayout, terrainHeight, riverCenter, SPEC, TAU } from './layout.js';
import { InstanceBatch, material, random, add, sphere, cylinder, rod, box, label } from './craft.js';
import { terrainGeometry, riverGeometry } from './landscape.js';

function leafGeometry(maple=false) {
  const contour=maple ? [[-.07,0],[-.04,.24],[-.42,.19],[-.3,.4],[-.68,.56],[-.37,.6],[-.45,.88],[-.15,.73],[0,1.1],[.15,.73],[.45,.88],[.37,.6],[.68,.56],[.3,.4],[.42,.19],[.04,.24],[.07,0]] : [[0,0],[-.3,.32],[-.32,.58],[-.14,.85],[0,1],[.14,.85],[.32,.58],[.3,.32]];
  const positions=[0,.45,.06],indices=[];
  for(const [x,y]of contour)positions.push(x,y,0);
  for(let i=0;i<contour.length;i++)indices.push(0,i+1,(i+1)%contour.length+1);
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();return g;
}
function needlesGeometry() {
  const pos=[];
  for(let i=0;i<5;i++)for(const side of [-1,1]) {
    const y=i*.16, x=side*(.24-i*.027), z=(i%2)*.04;
    pos.push(0,y,0, x,y+.22,z, side*.035,y+.14,0);
  }
  pos.push(-.024,.65,0,0,1,0,.024,.65,0);
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.computeVertexNormals();return g;
}

function birchMaterial() {
  const c=document.createElement('canvas');c.width=128;c.height=512;const ctx=c.getContext('2d'),r=random(75);
  ctx.fillStyle='#d6d1b9';ctx.fillRect(0,0,128,512);
  for(let i=0;i<150;i++) {ctx.fillStyle=i%4?'#626251':'#989681';const x=r()*128,y=r()*512;ctx.fillRect(x,y,4+r()*29,1+r()*4);}
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;
  return material(0xffffff,{map:t,roughness:.95});
}

export function buildForest(root,p) {
  const rand=random(1113), color=new THREE.Color();
  const needleMat=material(0xffffff,{side:THREE.DoubleSide,roughness:.83});
  const leafMat=material(0xffffff,{side:THREE.DoubleSide,roughness:.82});
  const needles=new InstanceBatch(needlesGeometry(),needleMat);
  const goldLeaves=new InstanceBatch(leafGeometry(),leafMat);
  const mapleLeaves=new InstanceBatch(leafGeometry(true),leafMat);
  const branches=new InstanceBatch(new THREE.CylinderGeometry(.45,1,1,5),material(0x61523a));
  const whiteBranches=new InstanceBatch(new THREE.CylinderGeometry(.42,1,1,6),birchMaterial());
  const mapleColors=[0xb5401d,0xc9511f,0xdc6f27,0xa83920,0xe08b32,0xbd4c1c];
  const goldColors=[0xcd951f,0xe3ac2c,0xf0bd42,0xb78019,0xd99923,0xe9b834];
  const birchColors=[0xe7ba48,0xd6a530,0xbd942a,0xe4c160,0xc3aa4a];
  const makeColor=palette=>new THREE.Color(palette[Math.floor(rand()*palette.length)]).multiplyScalar(.83+rand()*.3);
  function clearTrack(point) {
    const normalized=Math.sqrt((point.x/SPEC.trackX)**2+(point.z/SPEC.trackZ)**2);
    return !(Math.abs(normalized-1)<.105 && point.y<4.12);
  }
  function branch(batch,a,b,radius) {
    for(let i=0;i<=6;i++)if(!clearTrack(a.clone().lerp(b,i/6)))return;
    batch.between(a,b,radius);
  }
  for(const [x,z,h,type] of treeLayout) {
    const base=new THREE.Vector3(x,terrainHeight(x,z),z);
    const drift=new THREE.Vector3((rand()-.5)*.25,0,(rand()-.5)*.25);
    const trunkBatch=type==='birch'?whiteBranches:branches;
    const centerAt=f=>base.clone().add(new THREE.Vector3(drift.x*f,h*f,drift.z*f));
    for(let j=0;j<7;j++)trunkBatch.between(centerAt(j/7),centerAt((j+1)/7),(.063*h/4)*(1-j/7)+.011);
    // Splayed root flares are subtle at collectible scale.
    for(let j=0;j<4;j++) {
      const a=j/4*TAU+rand();const end=base.clone().add(new THREE.Vector3(Math.sin(a)*.18,0,Math.cos(a)*.18));end.y=terrainHeight(end.x,end.z)+.012;
      trunkBatch.between(base.clone().add(new THREE.Vector3(0,.16,0)),end,.034);
    }
    if(type==='larch') {
      for(let level=0;level<11;level++) {
        const fraction=.24+level*.065;
        const center=centerAt(fraction);
        const n=level>8?4:6;
        for(let b=0;b<n;b++) {
          const a=b/n*TAU+level*1.24+rand()*.4;
          const length=h*.32*(1-fraction)*(.8+rand()*.3);
          const forward=new THREE.Vector3(Math.sin(a),0,Math.cos(a));
          const lateral=new THREE.Vector3(Math.cos(a),0,-Math.sin(a));
          const mid=center.clone().addScaledVector(forward,length*.54).add(new THREE.Vector3(0,-.05,0));
          const end=center.clone().addScaledVector(forward,length).add(new THREE.Vector3(0,.05+level*.008,0));
          branch(branches,center,mid,.022*(1-fraction)+.006);branch(branches,mid,end,.013*(1-fraction)+.003);
          for(let k=1;k<=10;k++) {
            const f=k/10, core=center.clone().lerp(end,f);
            core.y-=Math.sin(f*Math.PI)*.1;
            const wing=(1-f)*length*.32+.035;
            if(k%3===0)for(const sign of [-1,1])branch(branches,core,core.clone().addScaledVector(lateral,sign*wing).addScaledVector(forward,length*.13),.004);
            for(let j=0;j<5;j++) {
              const offset=(j-2)/2*wing;
              const loc=core.clone().addScaledVector(lateral,offset).addScaledVector(forward,rand()*.08);
              loc.y+=(rand()-.5)*.07;
              if(!clearTrack(loc))continue;
              const size=.16+rand()*.085;
              needles.push(loc,[size,size*(.85+rand()*.35),size],[rand()*TAU,rand()*TAU,rand()*TAU],makeColor(goldColors));
            }
          }
        }
      }
      for(let j=0;j<50;j++) {
        const f=.83+rand()*.17;const loc=centerAt(f).add(new THREE.Vector3((rand()-.5)*.17,0,(rand()-.5)*.17));
        needles.push(loc,[.15,.22,.15],[rand()*TAU,rand()*TAU,rand()*TAU],makeColor(goldColors));
      }
    } else {
      const leafBatch=type==='maple'?mapleLeaves:goldLeaves;
      const palette=type==='maple'?mapleColors:birchColors;
      for(let b=0;b<15;b++) {
        const a=b*2.399+rand()*.4;
        const f=.35+(b/15)*.46;
        const start=centerAt(f-.12);
        const reach=h*(type==='maple'?.3:.23)*Math.sin((f-.15)*Math.PI);
        const end=centerAt(f+.13).add(new THREE.Vector3(Math.sin(a)*reach,0,Math.cos(a)*reach));
        const joint=start.clone().lerp(end,.57);joint.y-=.1;
        branch(trunkBatch,start,joint,.027*(1-f)+.009);branch(trunkBatch,joint,end,.014*(1-f)+.004);
        for(let twig=0;twig<3;twig++) {
          const tip=end.clone().add(new THREE.Vector3((rand()-.5)*.5,(rand()-.2)*.36,(rand()-.5)*.5));
          branch(trunkBatch,joint.clone().lerp(end,.55),tip,.005);
          for(let j=0;j<85;j++) {
            const az=rand()*TAU,cos=rand()*2-1,rad=Math.cbrt(rand())*(type==='maple'?.46:.37);
            const loc=tip.clone().add(new THREE.Vector3(Math.cos(az)*Math.sqrt(1-cos*cos)*rad,cos*rad*.55,Math.sin(az)*Math.sqrt(1-cos*cos)*rad));
            if(!clearTrack(loc))continue;
            const size=type==='maple'?.075+rand()*.055:.045+rand()*.035;
            leafBatch.push(loc,[size,size,size],[rand()*TAU,rand()*TAU,rand()*TAU],makeColor(palette));
          }
        }
      }
    }
  }
  const meshes=[branches.finish(root),whiteBranches.finish(root),needles.finish(root),goldLeaves.finish(root),mapleLeaves.finish(root)];
  return { meshes, leaves:needles.entries.length+goldLeaves.entries.length+mapleLeaves.entries.length };
}

function isTrack(x,z,margin=.12) {return Math.abs(Math.sqrt((x/SPEC.trackX)**2+(z/SPEC.trackZ)**2)-1)<margin;}
function isStation(x,z) {return x>-3.4&&x<-.4&&z>-.8&&z<2.6;}
function pathX(z) {return -1.9+.15*Math.sin(z*2);}
export function buildLandscape(root,p) {
  const rand=random(1200);
  const ground=add(root,terrainGeometry(),material(0xffffff,{vertexColors:true,roughness:1}));ground.name='Contoured river-bank terrain';
  cylinder(root,5.88,5.92,.12,p.earth,0,2.5,0,128);
  const waterNormals=new Uint8Array(128*128*4);
  for(let y=0;y<128;y++)for(let x=0;x<128;x++) {
    const i=(y*128+x)*4;
    waterNormals[i]=128+Math.sin(x*.32+y*.7)*15;
    waterNormals[i+1]=128+Math.cos(y*.35+x*.22)*13;
    waterNormals[i+2]=253;waterNormals[i+3]=255;
  }
  const normalMap=new THREE.DataTexture(waterNormals,128,128);normalMap.wrapS=normalMap.wrapT=THREE.RepeatWrapping;normalMap.needsUpdate=true;
  const waterMat=new THREE.MeshPhysicalMaterial({color:0x367c91,roughness:.4,metalness:0,specularIntensity:.3,envMapIntensity:.3,clearcoat:.3,clearcoatRoughness:.38,transmission:.18,thickness:.16,ior:1.4,normalMap,normalScale:new THREE.Vector2(.3,.3),side:THREE.DoubleSide});
  const water=add(root,riverGeometry(),waterMat);water.castShadow=false;water.name='Blue resin river';
  // Fine, very low-contrast ripples read as a cast-resin river rather than an ocean.
  const ripples=new InstanceBatch(new THREE.PlaneGeometry(1,1),material(0xa9d6d5,{transparent:true,opacity:.23,depthWrite:false}),false);
  for(let i=0;i<125;i++) {
    const z=-5.2+rand()*10.4,x=riverCenter(z)+(rand()-.5)*.65;
    if(x*x+z*z>5.7**2)continue;
    ripples.push([x,2.617,z],[.045+rand()*.15,.007,1],[-Math.PI/2,0,rand()*.5]);
  }
  ripples.finish(root);
  const grassGeo=new THREE.BufferGeometry();
  grassGeo.setAttribute('position',new THREE.Float32BufferAttribute([-.18,0,0,-.12,1,.03,0,0,0, 0,0,-.13,.13,.75,.1,0,0,.13, .08,0,.06,.37,.55,.05,.2,0,.06],3));grassGeo.computeVertexNormals();
  const grass=new InstanceBatch(grassGeo,material(0xffffff,{side:THREE.DoubleSide,roughness:1}),false);
  const leaves=new InstanceBatch(leafGeometry(true),material(0xffffff,{side:THREE.DoubleSide,roughness:1}),false);
  const stones=new InstanceBatch(new THREE.IcosahedronGeometry(1,1),p.stone);
  const color=new THREE.Color();
  const grassColors=[0x9b8b49,0xb0a157,0x837a3c,0xc2a451,0x9b9254,0x747141];
  for(let i=0;i<22000;i++) {
    const a=rand()*TAU,r=Math.sqrt(rand())*5.84,x=Math.sin(a)*r,z=Math.cos(a)*r;
    const riverD=Math.abs(x-riverCenter(z));
    if(riverD<.6||isTrack(x,z,.1)||isStation(x,z)||(z>1.9&&z<3.6&&Math.abs(x-pathX(z))<.24))continue;
    const size=.04+rand()*.1;
    grass.push([x,terrainHeight(x,z)+.002,z],[size*1.4,size*(.6+rand()),size*1.4],[0,rand()*TAU,0],new THREE.Color(grassColors[i%grassColors.length]));
  }
  for(let i=0;i<1700;i++) {
    const a=rand()*TAU,r=Math.sqrt(rand())*5.82,x=Math.sin(a)*r,z=Math.cos(a)*r;
    if(Math.abs(x-riverCenter(z))<.5||isTrack(x,z,.085)||isStation(x,z))continue;
    const size=.035+rand()*.045;
    leaves.push([x,terrainHeight(x,z)+.016,z],[size,size,size],[-Math.PI/2,0,rand()*TAU],new THREE.Color([0xc67b28,0xe1ac3b,0x8e5629,0xb65123][i%4]));
  }
  // Pebbles stitch the blue river into the earth.
  for(let i=0;i<330;i++) {
    const z=-5.5+rand()*11,x=riverCenter(z)+(rand()<.5?-1:1)*(.52+rand()*.17);
    if(x*x+z*z>5.82**2||isTrack(x,z,.08))continue;
    const s=.025+rand()*.06;stones.push([x,terrainHeight(x,z)+s*.15,z],[s*1.5,s*.7,s],[rand(),rand(),rand()],new THREE.Color([0x999584,0xa7a08a,0x716f5d][i%3]));
  }
  for(let i=0;i<30;i++) {
    const a=rand()*TAU,r=2.2+rand()*3.4,x=Math.sin(a)*r,z=Math.cos(a)*r;
    if(Math.abs(x-riverCenter(z))<.75||isTrack(x,z,.15)||isStation(x,z))continue;
    const s=.08+rand()*.16;stones.push([x,terrainHeight(x,z)+s*.25,z],[s*1.45,s*.8,s],[rand(),rand(),rand()],new THREE.Color(0x969484));
  }
  grass.finish(root);leaves.finish(root);stones.finish(root);
  // Soft gravel footpath from the porch to the trackside.
  const pathPos=[],pathIdx=[];
  for(let i=0;i<=24;i++) {
    const z=1.9+i/24*1.6,x=pathX(z);
    for(const s of [-1,1])pathPos.push(x+s*.2,terrainHeight(x+s*.2,z)+.021,z);
    if(i){const n=(i-1)*2;pathIdx.push(n,n+2,n+1,n+1,n+2,n+3);}
  }
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pathPos,3));geo.setIndex(pathIdx);geo.computeVertexNormals();add(root,geo,material(0xb6a076));
  const sign=new THREE.Group();sign.position.set(-.9,terrainHeight(-.9,2.7),2.7);sign.rotation.y=-.2;root.add(sign);
  cylinder(sign,.026,.033,.72,p.trimWood,0,.36,0,8);
  box(sign,.6,.24,.055,p.green,0,.71,0,.015);
  label(sign,'森林慢行',.55,.19,0,.71,.029,{bg:'#354d3c',ink:'#dec797',border:false,font:'"Songti SC", serif'});
  // Short timber fence behind the grazing sheep.
  for(let i=0;i<9;i++) {
    const a=3.10+i*.068,r=5.52,x=Math.sin(a)*r,z=Math.cos(a)*r,y=terrainHeight(x,z);
    box(root,.06,.43,.06,p.trimWood,x,y+.2,z,.01);
    if(i<8){const b=a+.068,xx=Math.sin(b)*r,zz=Math.cos(b)*r,yy=terrainHeight(xx,zz);for(const h of [.15,.32])rod(root,[x,y+h,z],[xx,yy+h,zz],.021,p.trimWood);}
  }
  for(const [x,z,angle,graze]of [[-.45,-5.0,.6,true],[-1.4,-4.9,-.8,false],[-2.4,-4.55,.3,true]])buildSheep(root,p,x,z,angle,graze);
  return { water };
}

function buildSheep(root,p,x,z,angle,graze) {
  const sheep=new THREE.Group();sheep.position.set(x,terrainHeight(x,z),z);sheep.rotation.y=angle;root.add(sheep);sheep.name='Miniature grazing sheep';
  for(const sx of [-1,1])for(const sz of [-1,1]) {
    cylinder(sheep,.029,.022,.24,p.woolShade,sx*.12,.14,sz*.19,8);
    sphere(sheep,.035,p.black,sx*.12,.035,sz*.19,[1,.7,1.2]);
  }
  sphere(sheep,.235,p.wool,0,.33,0,[.86,.81,1.35]);
  const r=random(Math.round((x+10)*100));
  for(let i=0;i<36;i++) {
    const a=r()*TAU,phi=Math.acos(r()*1.8-.8);
    sphere(sheep,.053+r()*.015,p.wool,Math.sin(phi)*Math.cos(a)*.18,.33+Math.cos(phi)*.17,Math.sin(phi)*Math.sin(a)*.285,[1,1,1]);
  }
  const head=new THREE.Group();head.position.set(0,.37,.28);head.rotation.x=graze?.88:.12;sheep.add(head);
  sphere(head,.1,p.woolShade,0,0,.03,[.85,1.15,1.1]);
  sphere(head,.09,p.darkStone,0,-.025,.13,[.76,.9,1.3]);
  for(const s of [-1,1]) {
    const ear=sphere(head,.06,p.woolShade,s*.1,.035,.025,[1.5,.42,.65]);ear.rotation.z=s*.3;
    sphere(head,.012,p.black,s*.066,.019,.115);
  }
  sphere(sheep,.064,p.wool,0,.35,-.31,[.8,1.1,1]);
}
