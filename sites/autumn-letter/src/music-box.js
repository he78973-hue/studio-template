import * as THREE from 'three';
import { add, box, cylinder, torus, rod, label } from './craft.js';
import { TAU } from './layout.js';

function lathe(parent,points,mat) {
  return add(parent,new THREE.LatheGeometry(points.map(p=>new THREE.Vector2(...p)),128),mat);
}

function gear(parent,r,teeth,x,y,z,mat) {
  const group=new THREE.Group(); group.position.set(x,y,z);parent.add(group);
  const shape=new THREE.Shape();
  for(let i=0;i<teeth*4;i++) {
    const a=i/(teeth*4)*TAU, radius=r*(i%4===1||i%4===2?1:.87);
    if(i===0)shape.moveTo(Math.sin(a)*radius,Math.cos(a)*radius);else shape.lineTo(Math.sin(a)*radius,Math.cos(a)*radius);
  }
  shape.closePath();
  const hole=new THREE.Path();hole.absarc(0,0,r*.65,0,TAU,true);shape.holes.push(hole);
  add(group,new THREE.ExtrudeGeometry(shape,{depth:.055,bevelEnabled:true,bevelSegments:1,bevelSize:.008,bevelThickness:.008,curveSegments:32}),mat);
  for(let i=0;i<5;i++) {
    const a=i/5*TAU;rod(group,[Math.sin(a)*r*.15,Math.cos(a)*r*.15,.028],[Math.sin(a)*r*.83,Math.cos(a)*r*.83,.028],r*.05,mat);
  }
  const hub=cylinder(group,r*.16,r*.16,.12,mat,0,0,.04,24);hub.rotation.x=Math.PI/2;
  return group;
}

export function buildMusicBox(root,p) {
  const group=new THREE.Group();group.name='Walnut music box';root.add(group);
  lathe(group,[[0,.24],[5.83,.24],[6.05,.29],[6.2,.4],[6.23,.49],[6.19,.58],[6.08,.64],[0,.64]],p.walnut);
  lathe(group,[[0,2.15],[5.95,2.15],[6.15,2.22],[6.23,2.32],[6.2,2.44],[6.1,2.52],[5.89,2.57],[0,2.57]],p.walnut);
  const shell=new THREE.CylinderGeometry(5.96,5.96,1.51,112,1,true,.49,TAU-.98);
  add(group,shell,p.walnut,0,1.39,0);
  add(group,new THREE.CylinderGeometry(5.8,5.8,1.51,112,1,true,.49,TAU-.98),p.darkWood,0,1.39,0).material=p.darkWood.clone();
  group.children.at(-1).material.side=THREE.BackSide;
  cylinder(group,5.94,5.94,.12,p.darkWood,0,.7,0,112);
  cylinder(group,5.94,5.94,.1,p.darkWood,0,2.13,0,112);
  for(const y of [.42,.62,2.2,2.45]) { const ring=torus(group,y<1?6.19:6.16,.022,p.brass,0,y,0);ring.rotation.x=Math.PI/2; }
  for(const y of [.86,1.95]) {
    const rim=add(group,new THREE.TorusGeometry(5.98,.011,6,112,TAU-.98),p.darkBrass,0,y,0);rim.rotation.set(Math.PI/2,0,-Math.PI/2+.49);
  }
  // Open front bay: the gears are genuine solid geometry, with a dark backing.
  box(group,5.64,1.36,.12,p.darkWood,0,1.38,4.83,.07);
  box(group,5.67,.09,.54,p.brass,0,.75,5.14,.035);
  box(group,5.67,.07,.44,p.brass,0,2.08,5.13,.025);
  for(const x of [-2.78,2.78]) box(group,.065,1.3,.44,p.brass,x,1.42,5.13,.02);
  const gears=[];
  gears.push(gear(group,.57,24,-1.65,1.36,5.08,p.brass));
  gears.push(gear(group,.36,16,-.77,1.51,5.13,p.brass));
  gears.push(gear(group,.49,21,.06,1.35,5.09,p.darkBrass));
  gears.push(gear(group,.61,26,1.13,1.42,5.10,p.brass));
  gears.push(gear(group,.26,12,1.96,1.65,5.15,p.darkBrass));
  const drum=cylinder(group,.25,.25,.75,p.brass,-.1,1.45,4.95);drum.rotation.z=Math.PI/2;
  for(let i=0;i<15;i++) box(group,.022,.46,.06,p.brass,-.42+i*.045,1.8,5.05);
  for(let i=0;i<19;i++) {
    const a=.55+(TAU-1.1)*i/18;
    for(const y of [.92,1.88]) {
      const rivet=cylinder(group,.027,.027,.035,p.brass,Math.sin(a)*5.982,y,Math.cos(a)*5.982,10);
      rivet.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3(Math.sin(a),0,Math.cos(a)));
    }
  }
  for(const a of [.75,2.4,3.9,5.55]) sphereFoot(a);
  function sphereFoot(a) {
    const foot=cylinder(group,.26,.22,.22,p.darkWood,Math.sin(a)*4.8,.15,Math.cos(a)*4.8,24);
    foot.rotation.z=.06;
  }
  const plaque=new THREE.Group();group.add(plaque);plaque.position.set(0,2.33,6.26);
  box(plaque,2.0,.32,.045,p.brass,0,0,0,.04);
  label(plaque,'秋 日 来 信',1.78,.25,0,0,.026,{bg:'#b59a63',ink:'#453623',font:'"Songti SC", serif',border:false});

  // The winding key's local Z axis points out from the box side.
  const key=new THREE.Group();key.name='Interactive winding key';key.position.set(5.67,1.4,1.76);key.rotation.y=1.27;root.add(key);
  const stem=cylinder(key,.075,.075,.87,p.brass,0,0,.34,20);stem.rotation.x=Math.PI/2;
  const collar=cylinder(key,.18,.18,.12,p.darkBrass,0,0,0,32);collar.rotation.x=Math.PI/2;
  box(key,.25,.44,.1,p.brass,0,0,.78,.06);
  for(const s of [-1,1]) {
    const bow=torus(key,.27,.075,p.brass,s*.28,0,.8);bow.scale.set(1,.8,1);
  }
  return { gears,key, update(dt,speed) { gears.forEach((g,i)=>g.rotation.z+=dt*speed*(i%2?-.8:.6)*(24/[24,16,21,26,12][i]));key.rotation.z-=dt*speed*.27; } };
}
