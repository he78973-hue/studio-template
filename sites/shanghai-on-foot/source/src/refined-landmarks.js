import * as THREE from 'three';
import { block, mesh, tube, hipRoof, tiledRoof, orientedGroup, compact, mats, masonry, window, archWindow, balcony, label, louver, rail, pot, table, tones, metricUV } from './architecture.js';

const massing=()=>import.meta.env.DEV&&new URLSearchParams(location.search).has('massing');
function side(g,x,z,angle){const s=new THREE.Group();s.position.set(x,0,z);s.rotation.y=angle;g.add(s);return s;}
function cornice(g,w,h,x,z,depth){
  block(g,[w+.28,.18,depth+.28],[x,h-.09,z],mats.tile);
  block(g,[w+.18,.16,depth+.18],[x,h-.28,z],mats.tile);
  const front=z+depth/2,n=Math.floor(w/.36);
  for(let i=0;i<n;i++)block(g,[.13,.24,.19],[x-w/2+(i+.5)*w/n,h-.49,front+.04],mats.chalk);
}
export function buildRomeo(building) {
  const {group:g,width:w,depth:d}=orientedGroup(building);
  const volumes=[[w*.94,6.4,d*.53,0,-d*.68,1.25],[w*.37,8.8,d*.49,-w*.315,-d*.245,1.05],[w*.27,6.5,d*.44,0,-d*.24,1.1],[w*.38,7.6,d*.45,w*.31,-d*.265,1.25],[w*.18,9.45,d*.2,w*.34,-d*.38,.45]];
  for(const [vw,h,vd,x,z,rise] of volumes){block(g,[vw,h,vd],[x,h/2,z],massing()?mats.plaster:masonry('plaster'));(massing()?hipRoof:tiledRoof)(g,vw+.35,vd+.4,h,rise,x,z);}
  if(massing())return compact(g,'romeo');
  for(const [vw,h,vd,x,z] of volumes)cornice(g,vw,h,x,z,vd);
  const left=-w*.315;
  archWindow(g,left,4.15,1.7,3.25,{columns:3,rows:6});balcony(g,left,4.03,2.7,1.05);
  // The entrance sits between unequal wings, rather than centred under the balcony.
  archWindow(g,.05,.18,1.8,2.6,{z:-d*.02,columns:2,rows:2});
  block(g,[1.55,1.8,.05],[.05,1.1,-d*.02+.13],mats.wood);
  label(g,'210',{x:-1.45,y:2.1,z:-d*.02+.15,w:.55,h:.27,background:tones.green});
  window(g,0,5.08,1.8,1.45,{z:-d*.02,frame:mats.iron,columns:3,rows:3});
  const rightZ=-d*.04;
  for(let i=-1;i<=1;i++)archWindow(g,w*.31+i*.9,4.35,.52,1.75,{z:rightZ,columns:1,rows:2});
  for(let i=-1;i<=1;i++)window(g,w*.31+i*.9,1.3,.45,1.05,{z:rightZ,frame:mats.iron,columns:1,rows:2});
  block(g,[3.3,.17,.3],[w*.31,4.2,rightZ+.12],mats.tile);
  for(const s of [-1,1]){
    const f=side(g,s*w*.5,-d*.24,s*Math.PI/2);
    for(let k=0;k<2;k++)window(f,(k-.5)*3.8,4.8,1.15,1.8,{frame:mats.iron,columns:2,rows:4});
  }
  const back=side(g,0,-d*.945,Math.PI);
  for(const x of [-w*.3,0,w*.3])for(const y of [1.8,4.7])window(back,x,y,1.4,1.65,{frame:mats.iron});
  const tower=side(g,w*.34,-d*.28,0);archWindow(tower,0,8.15,.75,1.1,{columns:1,rows:2});
  for(const [vw,h,vd,x,z] of volumes){
    block(g,[vw,.26,.15],[x,.24,z+vd/2+.04],mats.tile);
    block(g,[.065,h-.75,.07],[x+vw/2-.17,(h-.75)/2,z+vd/2+.07],mats.chalk);
  }
  return compact(g,'romeo');
}

export function buildBajin(building){
  const {group:g,width:w,depth:d}=orientedGroup(building),eave=7.6,rise=4.4;
  block(g,[w,eave,d],[0,eave/2,-d/2],massing()?mats.taupe:masonry('taupe'));
  // Folded gable: a shallow lower pitch, then the steep attic roof.
  const shape=new THREE.Shape();shape.moveTo(-w/2,eave);shape.lineTo(-w*.34,eave+1.8);shape.lineTo(0,eave+rise);shape.lineTo(w*.34,eave+1.8);shape.lineTo(w/2,eave);shape.closePath();
  const attic=new THREE.ExtrudeGeometry(shape,{depth:d,bevelEnabled:false});attic.translate(0,0,-d);metricUV(attic);mesh(g,attic,massing()?mats.taupe:masonry('taupe'));
  for(const sign of [-1,1]){
    const points=[[sign*w/2+.25*sign,eave-.1],[sign*w*.34,eave+1.8],[0,eave+rise+.12]];
    for(let i=0;i<2;i++){
      const a=points[i],b=points[i+1],length=Math.hypot(b[0]-a[0],b[1]-a[1]);
      const roof=block(g,[length,.18,d+.75],[(a[0]+b[0])/2,(a[1]+b[1])/2,-d/2],mats.gray);roof.rotation.z=Math.atan2(b[1]-a[1],b[0]-a[0]);
      if(!massing())for(const z of [.44,-d-.44]){const fascia=block(g,[length,.2,.13],[(a[0]+b[0])/2,(a[1]+b[1])/2,z],mats.chalk);fascia.rotation.z=roof.rotation.z;}
    }
  }
  if(massing())return compact(g,'bajin');
  for(let i=0;i<4;i++){
    const x=(i-1.5)*w*.21;
    window(g,x,2.04,w*.16,2.9,{columns:3,rows:4});
    window(g,x,5.65,w*.16,1.95,{columns:3,rows:3});
    if(i===1||i===2)for(const s of [-1,1])block(g,[w*.067,.65,.08],[x+s*w*.04,.93,.24],mats.green);
  }
  // Wide semicircular attic glazing, as photographed, with a horizontal sill.
  const atticWindow=new THREE.Shape();atticWindow.moveTo(-w*.19,0);atticWindow.absellipse(0,0,w*.19,1.75,Math.PI,0,true);atticWindow.lineTo(-w*.19,0);atticWindow.closePath();
  mesh(g,new THREE.ShapeGeometry(atticWindow,32),mats.glass,[0,8.18,.09]);
  const rim=[];for(let i=0;i<=32;i++){const a=i*Math.PI/32;rim.push([Math.cos(a)*w*.19,8.18+Math.sin(a)*1.75,.15]);}tube(g,rim,.08,mats.green);
  for(let i=-3;i<=3;i++){const x=i*w*.0475,h=1.75*Math.sqrt(1-(x/(w*.19))**2);block(g,[.065,h,.09],[x,8.18+h/2,.17],mats.green);}
  block(g,[w*.35,.06,.09],[0,8.7,.17],mats.green);block(g,[w*.4,.13,.3],[0,8.12,.15],mats.chalk);
  for(const x of [-.32,0,.32]){const diamond=block(g,[.22,.22,.04],[x,4.03,.12],mats.white);diamond.rotation.z=Math.PI/4;}
  for(const x of [-.7,-.35,0,.35,.7])block(g,[.12,.2,.025],[x,7.88,.035],mats.shadow);
  for(let i=0;i<4;i++)block(g,[w*.87,.15,2-i*.43],[0,.075+i*.15,.75-i*.19],mats.chalk);
  block(g,[w+2,.08,3.8],[0,.04,2.3],mats.leaf);
  for(const x of [-w*.41,w*.41])pot(g,x,1.8,1);
  for(const sign of [-1,1]){
    const f=side(g,sign*w/2,-d/2,sign*Math.PI/2);
    for(const x of [-d*.28,d*.28])for(const y of [2.1,5.6])window(f,x,y,1.5,1.9,{columns:3,rows:3});
  }
  const back=side(g,0,-d,Math.PI);for(const x of [-w*.3,0,w*.3])for(const y of [2.1,5.6])window(back,x,y,1.5,1.9);
  const plaque=side(g,-w*.49,1.5,.1);block(plaque,[.7,1,.12],[0,.5,0],mats.stone);label(plaque,'巴金故居',{y:.7,z:.07,w:.61,h:.18,color:tones.iron});
  return compact(g,'bajin');
}

export function buildCourtyard(building){
  const {group:g,width:w,depth:d}=orientedGroup(building),mainW=w*.55,mainX=w*.2;
  const brick=massing()?mats.brick:masonry('brick');
  block(g,[w*.45,7.2,d*.78],[-w*.275,3.6,-d*.51],brick);
  block(g,[mainW,10.2,d],[mainX,5.1,-d/2],brick);
  (massing()?hipRoof:tiledRoof)(g,w*.48,d*.82,7.2,2.4,-w*.275,-d*.51);
  (massing()?hipRoof:tiledRoof)(g,mainW+.5,d+.5,10.2,3.3,mainX,-d/2);
  block(g,[1.2,6.1,1.15],[mainX-mainW*.28,12.1,-d*.32],brick);
  block(g,[1.5,.18,1.45],[mainX-mainW*.28,15.24,-d*.32],mats.stone);
  if(massing())return compact(g,'courtyard');
  for(const [width,cx,height,frontZ] of [[w*.45,-w*.275,7.2,-d*.12],[mainW,mainX,10.2,0]]){
    block(g,[width,.65,.2],[cx,.36,frontZ+.02],mats.stone);
    const n=Math.max(3,Math.floor(width/4));
    for(let i=0;i<n;i++)for(let y=2.1;y<height-1;y+=3.4){
      const x=cx+(i-(n-1)/2)*width/n;
      if(y<3&&Math.abs(x+w*.14)<2.9)continue;
      window(g,x,y,1.45,2.1,{z:frontZ,frame:mats.chalk,shutters:true,columns:2,rows:3});
    }
    block(g,[width+.35,.22,.48],[cx,height-.2,frontZ+.04],mats.chalk);
    for(const x of [-1,1])block(g,[.25,height,.24],[cx+x*(width/2-.18),height/2,frontZ+.05],brick);
  }
  const entryX=-w*.14,entryZ=-d*.12+.15;
  block(g,[2.15,3.4,.2],[entryX,1.85,entryZ],mats.green);
  for(const sign of [-1,1]){block(g,[.3,3.5,.38],[entryX+sign*1.25,1.83,entryZ+.05],mats.chalk);block(g,[.48,.25,.48],[entryX+sign*1.25,3.48,entryZ+.05],mats.chalk);}
  const pediment=[];for(let i=0;i<=28;i++){const a=i*Math.PI/28;pediment.push([entryX+Math.cos(a)*1.45,3.62+Math.sin(a)*.73,entryZ+.18]);}tube(g,pediment,.14,mats.chalk);
  block(g,[3.2,.18,.5],[entryX,3.58,entryZ+.08],mats.chalk);
  for(let i=0;i<3;i++)block(g,[3.4,.15,1.65-i*.42],[entryX,.075+i*.15,entryZ+.64-i*.16],mats.stone);
  const canopyX=mainX+mainW*.12;
  block(g,[3.1,1.75,2],[mainX+mainW*.18,11.15,-d*.18],brick);
  tiledRoof(g,3.5,2.3,12.03,.65,mainX+mainW*.18,-d*.18);
  window(g,mainX+mainW*.18,11.25,1.7,1.3,{frame:mats.chalk,z:-d*.18+1,columns:3,rows:2});
  block(g,[6.2,.08,2.3],[canopyX,3.35,1.07],mats.glassLight);
  for(let i=0;i<5;i++)block(g,[.06,.12,2.35],[canopyX-3.05+i*1.53,3.4,1.1],mats.iron);
  for(const x of [-3.05,3.05])block(g,[.06,3.4,.06],[canopyX+x,1.7,2.2],mats.iron);
  for(const sign of [-1,1]){const f=side(g,sign*w/2,-d*.53,sign*Math.PI/2);for(const x of [-d*.26,d*.26])for(const y of [2.1,5.5])window(f,x,y,1.45,2,{frame:mats.chalk,shutters:true});}
  const back=side(g,mainX,-d,Math.PI);for(const x of [-mainW*.3,0,mainW*.3])for(const y of [2.1,5.5,8.9])window(back,x,y,1.45,2,{frame:mats.chalk,shutters:true});
  for(const x of [-w*.39,-w*.02,w*.4])pot(g,x,2.5,1.1);
  for(const x of [-w*.39,w*.4])table(g,x,4.2);
  // Two modest Art-Deco entrance piers, rather than a billboard on the villa.
  for(const x of [-3.1,3.1]){
    block(g,[.9,3.7,.8],[x,1.85,5.7],mats.plaster);block(g,[1.05,.2,.95],[x,3.75,5.7],mats.chalk);block(g,[1.05,.8,.95],[x,.4,5.7],mats.gray);
    for(const dx of [-.28,0,.28])block(g,[.06,2.6,.09],[x+dx,2.1,6.13],mats.chalk);
  }
  block(g,[5.6,.055,.055],[0,3.45,5.7],mats.iron);label(g,'FERGUSON LANE',{x:0,y:3.85,z:5.72,w:4.5,h:.4,color:tones.iron});
  label(g,'武康庭',{x:3.1,y:1.5,z:6.13,w:.72,h:.22,color:tones.iron});
  return compact(g,'courtyard');
}

function umbrella(g,x,z){
  block(g,[.07,2.8,.07],[x,1.4,z],mats.gray);
  const canopy=new THREE.ConeGeometry(2.35,.5,4,1,false);canopy.rotateY(Math.PI/4);mesh(g,canopy,mats.white,[x,2.73,z]);
  for(const sx of [-1,1])for(const sz of [-1,1])tube(g,[[x,2.92,z],[x+sx*1.64,2.5,z+sz*1.64]],.025,mats.gray);
}
export function buildRac(building){
  const {group:g,width:w,depth:d}=orientedGroup(building);
  block(g,[w,8.4,d],[0,4.2,-d/2],mats.chalk);
  block(g,[w*.28,11,d*.64],[w*.35,5.5,-d*.45],mats.chalk);
  // The raised wing intersects this roof; omit the continuous ridge strip
  // that would otherwise protrude through the raised volume.
  hipRoof(g,w+.4,d+.45,8.4,1.35,0,-d/2,massing()?mats.tile:masonry('roof'));
  (massing()?hipRoof:tiledRoof)(g,w*.3,d*.66,11,.7,w*.35,-d*.45);
  if(massing())return compact(g,'rac');
  block(g,[w*.74,3.8,.24],[-w*.07,1.9,.15],mats.wood);
  for(let i=0;i<Math.floor(w*.74/.15);i++)block(g,[.052,3.8,.095],[-w*.44+i*.15,1.9,.3],mats.stone);
  for(const x of [-w*.27,0,w*.27]){
    window(g,x,1.7,w*.19,2.9,{frame:mats.wood,rows:1,columns:2,z:.36});
    window(g,x,5.9,1.6,2,{frame:mats.stone,rows:2});
  }
  label(g,'RAC',{x:-w*.28,y:3.25,z:.61,w:1.45,h:.45,color:tones.white});
  for(const x of [-w*.29,w*.08,w*.35]){table(g,x,3.2);umbrella(g,x,3.35);}
  for(const x of [-w*.48,w*.47])pot(g,x,2,1.25);
  for(const sign of [-1,1]){const f=side(g,sign*w/2,-d/2,sign*Math.PI/2);for(const x of [-d*.28,d*.28])for(const y of [2,5.9])window(f,x,y,1.5,1.9,{frame:mats.stone});}
  const back=side(g,0,-d,Math.PI);for(const x of [-w*.3,0,w*.3])for(const y of [2,5.9])window(back,x,y,1.5,1.9,{frame:mats.stone});
  block(g,[w+1.5,.09,6.5],[0,.045,2.8],mats.stone);
  return compact(g,'rac');
}

function colorWindow(g,x,y,w,h,index){
  const c=document.createElement('canvas');c.width=512;c.height=512;const ctx=c.getContext('2d');
  ctx.fillStyle=['#74bfe0','#98bc63','#e99eb7'][index%3];ctx.fillRect(0,0,512,512);
  // Original graphic study: rainbow bands and daisy silhouettes, not a copied campaign.
  for(let i=0;i<5;i++){ctx.beginPath();ctx.strokeStyle=['#e36e93','#f0ba45','#b9cb74','#6caeb6','#777aac'][i];ctx.lineWidth=27;ctx.arc(260,560,240+i*27,Math.PI,Math.PI*2);ctx.stroke();}
  for(const [cx,cy,r] of [[115,110,42],[410,190,31]]){
    ctx.fillStyle='#fff9e8';for(let k=0;k<6;k++){const a=k*Math.PI/3;ctx.beginPath();ctx.ellipse(cx+Math.cos(a)*r*.85,cy+Math.sin(a)*r*.85,r*.52,r*.85,a,0,Math.PI*2);ctx.fill();}
    ctx.fillStyle='#f1ca3e';ctx.beginPath();ctx.arc(cx,cy,r*.6,0,Math.PI*2);ctx.fill();
  }
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;
  block(g,[w+.14,h+.14,.16],[x,y,.12],mats.iron);
  mesh(g,new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map:t,roughness:.55,side:THREE.DoubleSide}),[x,y,.215]);
}
export function buildWiggle(building){
  const {group:g,width:w,depth:d}=orientedGroup(building);
  block(g,[w,15,d],[0,7.5,-d/2],massing()?mats.grayBrick:masonry('grayBrick'));
  block(g,[w+.35,.4,d+.35],[0,15.2,-d/2],mats.gray);
  if(massing())return compact(g,'wiggle');
  const finX=w*.24,entryX=w*.32;
  block(g,[w*.38,15,.2],[entryX,7.5,.12],mats.gray);
  // Stairwell glazing and fine horizontal metal screen.
  window(g,entryX,9.4,w*.25,9.2,{frame:mats.iron,columns:2,rows:7,z:.15});
  for(let y=5.1;y<14.1;y+=.24)block(g,[w*.27,.07,.13],[entryX,y,.52],mats.gray);
  for(const [x,y,pw,ph,index] of [[-w*.27,6.3,w*.23,2.9,0],[-w*.26,11,w*.26,4.2,1],[-w*.025,11,w*.17,4.2,2],[-w*.025,6.3,w*.17,2.9,1]]){
    colorWindow(g,x,y,pw,ph,index);
    block(g,[pw,.06,.06],[x,y,.27],mats.iron);block(g,[.06,ph,.06],[x,y,.27],mats.iron);
  }
  for(let i=0;i<6;i++)colorWindow(g,finX-w*.15,1.7+i*2.15,1.3,1.45,i);
  block(g,[w*.27,3.4,.18],[entryX,1.7,.38],mats.shadow);
  for(const s of [-1,1])block(g,[.13,3.4,.2],[entryX+s*w*.135,1.7,.53],mats.iron);
  const oval=new THREE.SphereGeometry(1,32,16);const emblem=mesh(g,oval,mats.pink,[entryX,4.05,.62]);emblem.scale.set(1.12,.52,.15);
  label(g,'wiggle wiggle',{x:entryX,y:4.06,z:.79,w:1.8,h:.37,font:'italic 600 95px Georgia,serif'});
  block(g,[w*.47,3.65,.18],[-w*.265,1.825,.06],mats.iron);
  window(g,-w*.265,1.7,w*.35,2.7,{frame:mats.iron,rows:1,columns:2,z:.14});
  for(let i=0;i<6;i++)block(g,[w*.27/6,.06,.5],[entryX-w*.135+(i+.5)*w*.27/6,.07,.8],[mats.blue,mats.yellow,mats.pink][i%3]);
  for(const sign of [-1,1]){const f=side(g,sign*w/2,-d/2,sign*Math.PI/2);for(const x of [-d*.3,0,d*.3])for(const y of sign===1?[13.2]:[2.1,5.8,9.5,13.2])window(f,x,y,1.9,2.1,{frame:mats.iron});}
  const back=side(g,0,-d,Math.PI);for(const x of [-w*.28,w*.28])for(const y of [2.1,5.8,9.5,13.2])window(back,x,y,1.8,2.1,{frame:mats.iron});
  return compact(g,'wiggle');
}

export function buildBookshop(building){
  const {group:g,width:w,depth:d}=orientedGroup(building),frontW=w*.72,cx=w*.14,frontDepth=d*.33;
  block(g,[w,11.4,d*.65],[0,5.7,-d*.675],mats.gray);
  block(g,[w*.27,10.8,frontDepth],[-w*.365,5.4,-frontDepth/2],mats.gray);
  block(g,[frontW,6.1,frontDepth],[cx,3.05,-frontDepth/2],massing()?mats.wood:masonry('stone'));
  // Remove actual volume for the recessed entrance, instead of a dark sticker.
  // The stone block above stops behind the 1.3m-deep entrance shell.
  const frontBody=g.children[g.children.length-1];frontBody.scale.z=(frontDepth-1.35)/frontDepth;frontBody.position.z=-(frontDepth+1.35)/2;
  block(g,[frontW,2.5,1.35],[cx,4.85,-.675],massing()?mats.wood:masonry('stone'));
  const entryX=cx-frontW*.26,entryW=2.1,leftWidth=frontW*.24-entryW/2;
  block(g,[leftWidth,3.6,1.35],[cx-frontW/2+leftWidth/2,1.8,-.675],massing()?mats.chalk:masonry('mosaic'));
  const rightStart=entryX+entryW/2,rightWidth=cx+frontW/2-rightStart;
  block(g,[rightWidth,3.6,1.35],[rightStart+rightWidth/2,1.8,-.675],massing()?mats.chalk:masonry('mosaic'));
  block(g,[entryW,0.65,1.35],[entryX,3.275,-.675],massing()?mats.chalk:masonry('mosaic'));
  if(massing())return compact(g,'bookshop');
  // Soft outside corners and lintel surface, with a real open passage behind.
  const portal=new THREE.Shape();portal.moveTo(-entryW/2-.13,0);portal.lineTo(-entryW/2-.13,2.72);portal.quadraticCurveTo(-entryW/2-.13,3.06,-entryW/2+.2,3.06);portal.lineTo(entryW/2-.2,3.06);portal.quadraticCurveTo(entryW/2+.13,3.06,entryW/2+.13,2.72);portal.lineTo(entryW/2+.13,0);portal.lineTo(entryW/2,0);portal.lineTo(entryW/2,2.62);portal.quadraticCurveTo(entryW/2,2.92,entryW/2-.25,2.92);portal.lineTo(-entryW/2+.25,2.92);portal.quadraticCurveTo(-entryW/2,2.92,-entryW/2,2.62);portal.lineTo(-entryW/2,0);portal.closePath();
  const trim=new THREE.ExtrudeGeometry(portal,{depth:.14,bevelEnabled:true,bevelSize:.035,bevelThickness:.025,bevelSegments:3});mesh(g,metricUV(trim),masonry('mosaic'),[entryX,0,.02]);
  block(g,[entryW,2.7,.04],[entryX,1.35,-1.31],mats.shadow);block(g,[entryW,.06,1.35],[entryX,.04,-.65],mats.chalk);
  label(g,'多抓鱼循环商店',{x:entryX,y:1.65,z:-1.27,w:1.55,h:.2,color:tones.chalk});
  const doorX=cx+frontW*.16,doorW=frontW*.41;
  block(g,[doorW+.16,2.85,.09],[doorX,1.47,.09],mats.stone);
  block(g,[doorW,2.7,.08],[doorX,1.48,.17],mats.chalk);
  for(const s of [-1,1]){louver(g,doorX+s*doorW*.245,.64,doorW*.43,.94,{material:mats.chalk,z:.22});block(g,[.025,.3,.045],[doorX+s*.08,1.54,.25],mats.wood);}
  block(g,[.023,2.7,.01],[doorX,1.48,.22],mats.stone);
  label(g,'多抓鱼',{x:cx-frontW*.29,y:5.3,z:.06,w:3.8,h:1,color:tones.chalk,font:'400 110px "Songti SC",serif'});
  label(g,'déjà vu',{x:cx-frontW*.29,y:4.79,z:.06,w:2.75,h:.25,color:tones.chalk,font:'500 85px Georgia,serif'});
  // Small original fish silhouette identifying the entrance.
  const fish=new THREE.Shape();fish.moveTo(-.35,0);fish.quadraticCurveTo(-.15,.3,.2,.15);fish.lineTo(.36,.26);fish.lineTo(.36,-.17);fish.lineTo(.2,-.08);fish.quadraticCurveTo(-.17,-.27,-.35,0);mesh(g,new THREE.ShapeGeometry(fish,16),mats.iron,[cx-frontW*.405,1.68,.04]);
  rail(g,frontW,6.13,-.16,{x:cx,h:1.02});
  for(const x of [cx-frontW/2,cx+frontW/2]){const r=side(g,x,-frontDepth/2,Math.PI/2);rail(r,frontDepth,6.13,0);}
  const facade=side(g,0,-d*.35+.03,0);
  for(const y of [7.8,10])for(const x of [0,w*.3])window(facade,x,y,3,1.6,{frame:mats.iron,rows:2,columns:3});
  window(g,-w*.365,6.8,w*.2,6.8,{frame:mats.iron,rows:5,columns:2,z:.05});
  for(let y=3.7;y<10.1;y+=.19)block(g,[w*.1,.065,.1],[-w*.27,y,.23],mats.iron);
  const east=side(g,w/2,-d*.675,Math.PI/2);for(const x of [-d*.2,d*.2])for(const y of [2,5.6,9.2])window(east,x,y,1.8,2,{frame:mats.iron});
  const back=side(g,0,-d,Math.PI);for(const x of [-w*.3,0,w*.3])for(const y of [2,5.6,9.2])window(back,x,y,1.8,2,{frame:mats.iron});
  return compact(g,'bookshop');
}
