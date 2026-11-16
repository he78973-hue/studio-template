import * as THREE from 'three';
import { SPEC, trackPoint, trackTangent, TAU, riverCenter } from './layout.js';
import { add, box, cylinder, rod, sphere, tube, label, InstanceBatch } from './craft.js';

export function buildRailway(root,p) {
  const group=new THREE.Group();group.name='Continuous railway and two bridges';root.add(group);
  const ballast=new InstanceBatch(new THREE.BoxGeometry(.74,.085,.22),p.darkStone);
  const sleepers=new InstanceBatch(new THREE.BoxGeometry(.67,.065,.12),p.darkWood);
  const bolts=new InstanceBatch(new THREE.CylinderGeometry(.025,.025,.018,6),p.iron,false);
  for(let i=0;i<152;i++) {
    const t=i/152*TAU,pos=trackPoint(t), tangent=trackTangent(t), angle=Math.atan2(tangent.x,tangent.z);
    const overWater=Math.abs(pos.x-riverCenter(pos.z))<.8;
    if(!overWater)ballast.push([pos.x,SPEC.railY-.17,pos.z],[1,1,1],[0,angle,0]);
    sleepers.push([pos.x,SPEC.railY-.083,pos.z],[1,1,1],[0,angle,0]);
    for(const s of [-1,1]) {
      const q=trackPoint(t,s*.245);bolts.push([q.x,SPEC.railY-.044,q.z]);
    }
  }
  ballast.finish(group);sleepers.finish(group);bolts.finish(group);
  for(const offset of [-SPEC.gauge/2,SPEC.gauge/2]) {
    const pts=Array.from({length:160},(_,i)=>trackPoint(i/160*TAU,offset));
    const rail=tube(group,pts,.028,p.iron,true);rail.name='Closed rail';
    const shine=tube(group,pts.map(v=>v.clone().add(new THREE.Vector3(0,.018,0))),.012,p.brass,true);shine.castShadow=false;
  }
  // Find both railway/river intersections from the same path used by the train.
  const bridgeTs=[];
  for(let i=1;i<=1000;i++) {
    const a=trackPoint((i-1)/1000*TAU),b=trackPoint(i/1000*TAU);
    if((a.x-riverCenter(a.z))*(b.x-riverCenter(b.z))<0)bridgeTs.push((i-.5)/1000*TAU);
  }
  for(const t of bridgeTs) {
    const center=trackPoint(t), tangent=trackTangent(t), normal=new THREE.Vector3(tangent.z,0,-tangent.x);
    const bridge=new THREE.Group();bridge.position.copy(center);bridge.rotation.y=Math.atan2(tangent.x,tangent.z);group.add(bridge);
    for(let j=0;j<17;j++)box(bridge,.98,.07,.095,p.trimWood,0,-.15,-.81+j*.101,.007);
    for(const s of [-1,1]) {
      box(bridge,.09,.2,1.83,p.darkWood,s*.39,-.27,0,.015);
      for(let j=0;j<5;j++)box(bridge,.045,.37,.045,p.trimWood,s*.48,.065,-.79+j*.395,.008);
      box(bridge,.055,.04,1.77,p.trimWood,s*.48,.25,0,.012);
      rod(bridge,[s*.48,-.04,-.79],[s*.48,.2,-.395],.017,p.trimWood);
      rod(bridge,[s*.48,.2,-.395],[s*.48,-.04,0],.017,p.trimWood);
      rod(bridge,[s*.48,-.04,0],[s*.48,.2,.395],.017,p.trimWood);
      rod(bridge,[s*.48,.2,.395],[s*.48,-.04,.79],.017,p.trimWood);
    }
    for(const z of [-.77,.77])for(const s of [-1,1])box(bridge,.13,.4,.14,p.darkStone,s*.34,-.38,z,.02);
  }
  return group;
}

function wheels(group,p,length) {
  const items=[];
  for(const z of [-length*.33,length*.33])for(const side of [-1,1]) {
    const wheel=new THREE.Group();wheel.position.set(side*.245,.16,z);group.add(wheel);
    const tire=cylinder(wheel,.145,.145,.07,p.iron);tire.rotation.z=Math.PI/2;
    const center=cylinder(wheel,.107,.107,.075,p.brass);center.rotation.z=Math.PI/2;
    const inset=cylinder(wheel,.078,.078,.08,p.green);inset.rotation.z=Math.PI/2;
    for(let j=0;j<5;j++) {
      const a=j/5*TAU;rod(wheel,[side*.045,0,0],[side*.045,Math.sin(a)*.098,Math.cos(a)*.098],.007,p.brass);
    }
    items.push(wheel);
  }
  return items;
}

function locomotive(p) {
  const g=new THREE.Group();g.name='Forest green locomotive';
  box(g,.55,.11,1.2,p.darkWood,0,.32,0,.025);
  box(g,.48,.035,1.15,p.brass,0,.4,0,.012);
  const boiler=cylinder(g,.205,.205,.63,p.green,0,.58,.18,32);boiler.rotation.x=Math.PI/2;
  for(const z of [-.08,.17,.45]) { const band=cylinder(g,.212,.212,.032,p.brass,0,.58,z,32);band.rotation.x=Math.PI/2; }
  const front=cylinder(g,.19,.19,.05,p.iron,0,.58,.51);front.rotation.x=Math.PI/2;
  const light=cylinder(g,.07,.07,.08,p.brass,0,.68,.56,20);light.rotation.x=Math.PI/2;
  sphere(g,.055,p.glow,0,.68,.613,[1,1,.3]);
  cylinder(g,.095,.055,.24,p.iron,0,.85,.33,20);
  cylinder(g,.12,.12,.042,p.brass,0,.98,.33,20);
  cylinder(g,.07,.1,.14,p.brass,0,.83,-.015,20);
  box(g,.5,.47,.42,p.green,0,.64,-.4,.018);
  for(const s of [-1,1]) {
    box(g,.016,.25,.28,p.cream,s*.256,.74,-.4,.015);
    box(g,.018,.18,.2,p.glass,s*.267,.75,-.4,.015);
    box(g,.02,.22,.014,p.green,s*.28,.75,-.4);
    box(g,.012,.035,.4,p.brass,s*.266,.47,-.4);
  }
  box(g,.4,.22,.018,p.glass,0,.73,-.62,.01);
  box(g,.64,.09,.6,p.iron,0,.93,-.4,.04);
  for(const x of [-.19,.19])cylinder(g,.03,.03,.15,p.brass,x,.96,-.4,12);
  box(g,.6,.055,.13,p.brass,0,.3,.66,.015);
  const pilot=box(g,.47,.17,.2,p.green,0,.22,.6,.018);pilot.rotation.x=-.25;
  for(const x of [-.15,.15])rod(g,[x,.43,.5],[x,.74,.39],.013,p.brass);
  return { group:g,wheels:wheels(g,p,.99) };
}

function carriage(p) {
  const g=new THREE.Group();g.name='Passenger carriage';
  box(g,.57,.11,1.08,p.darkWood,0,.32,0,.025);
  box(g,.52,.48,.96,p.cream,0,.64,0,.025);
  box(g,.545,.15,1.0,p.green,0,.46,0,.015);
  for(const s of [-1,1])for(let i=0;i<3;i++) {
    box(g,.02,.25,.205,p.trimWood,s*.27,.72,-.3+i*.3,.01);
    box(g,.021,.2,.155,p.glass,s*.285,.73,-.3+i*.3,.006);
    box(g,.022,.012,.17,p.cream,s*.299,.73,-.3+i*.3);
  }
  for(const z of [-.49,.49])box(g,.25,.3,.014,p.green,0,.65,z,.01);
  box(g,.65,.115,1.18,p.green,0,.95,0,.055);
  box(g,.57,.025,1.09,p.brass,0,.41,0,.008);
  return {group:g,wheels:wheels(g,p,1.0)};
}

export function buildTrain(root,p) {
  const engine=locomotive(p),coach=carriage(p);root.add(engine.group,coach.group);
  const coupling=rod(root,[0,0,0],[0,.2,0],.018,p.iron);
  coupling.name='Animated train coupling';
  const samples=2048, lengthTable=[0];let total=0;
  for(let i=1;i<=samples;i++){total+=trackPoint(i/samples*TAU).distanceTo(trackPoint((i-1)/samples*TAU));lengthTable.push(total);}
  function frame(distance) {
    const d=((distance%total)+total)%total;
    let low=0,high=samples;
    while(low+1<high){const mid=(low+high)>>1;if(lengthTable[mid]<d)low=mid;else high=mid;}
    const fraction=(d-lengthTable[low])/(lengthTable[high]-lengthTable[low]);
    const t=(low+fraction)/samples*TAU;
    return {pos:trackPoint(t),direction:trackTangent(t),t};
  }
  let distance=total-2.2;
  function place(item,d) {
    const f=frame(d);item.group.position.copy(f.pos);item.group.rotation.y=Math.atan2(f.direction.x,f.direction.z);
    item.wheels.forEach(w=>w.rotation.x=-distance/.145);
  }
  function update(dt,speed) {
    distance+=dt*speed*.7;
    place(engine,distance);place(coach,distance-1.32);
    const a=frame(distance-.65).pos,b=frame(distance-.76).pos;
    a.y+=.31;b.y+=.31;const delta=b.clone().sub(a);
    coupling.position.copy(a).add(b).multiplyScalar(.5);coupling.scale.y=delta.length()/.2;
    coupling.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());
  }
  update(0,0);
  return { update,engine:engine.group,coach:coach.group,frame,total,get distance(){return distance;},get progress(){return ((distance%total)+total)%total/total;} };
}
