import * as THREE from 'three';
import { box, cylinder, sphere, rod, label, add, InstanceBatch } from './craft.js';
import { terrainHeight } from './layout.js';

export function buildStation(root,p) {
  const station=new THREE.Group();station.name='Autumn forest station';station.position.set(-1.9,terrainHeight(-1.9,.65),.65);root.add(station);
  box(station,2.75,.16,2.6,p.darkStone,0,.08,.28,.07);
  box(station,2.48,.1,2.36,p.trimWood,0,.19,.28,.035);
  for(let i=0;i<17;i++)box(station,2.38,.035,.105,p.wall,0,.255,-.83+i*.14);
  box(station,1.85,1.38,1.45,p.wall,0,.94,-.16,.04);
  // Horizontal timber siding and structural members on all sides.
  for(let y=.36;y<1.64;y+=.13) {
    for(const z of [-.895,.575])box(station,1.85,.018,.02,p.cream,0,y,z);
    for(const x of [-.935,.935])box(station,.02,.018,1.45,p.cream,x,y,-.16);
  }
  for(const x of [-.94,.94])for(const z of [-.88,.57])box(station,.085,1.45,.085,p.trimWood,x,.96,z,.01);
  const gableShape=new THREE.Shape();gableShape.moveTo(-.925,0);gableShape.lineTo(.925,0);gableShape.lineTo(0,.7);gableShape.closePath();
  const gable=add(station,new THREE.ExtrudeGeometry(gableShape,{depth:1.45,bevelEnabled:false}),p.wall,0,1.63,-.89);
  gable.castShadow=true;
  const angle=Math.atan2(.77,1.15), slope=Math.hypot(.77,1.15);
  for(const side of [-1,1]) {
    const roof=new THREE.Group();station.add(roof);roof.position.set(side*.57,2.02,-.16);roof.rotation.z=-side*angle;
    box(roof,slope+.08,.08,1.92,p.darkWood,0,0,0,.02);
    const tiles=new InstanceBatch(new THREE.BoxGeometry(.21,.028,.21),p.roof);
    for(let row=0;row<7;row++)for(let col=0;col<9;col++) {
      tiles.push([-.64+row*.205,.06+(row%2)*.005,-.85+col*.212],[1,1,1],[0,0,0],new THREE.Color(row%3?0x97523c:0xaf6949));
    }
    tiles.finish(roof);
    rod(station,[0,2.43,.83],[side*1.18,1.64,.83],.045,p.trimWood);
    rod(station,[0,2.43,-1.15],[side*1.18,1.64,-1.15],.045,p.trimWood);
  }
  rod(station,[0,2.45,-1.18],[0,2.45,.88],.06,p.roof);
  // Chimney, cap, and brick joints.
  box(station,.26,.6,.28,p.roof,.48,2.36,-.62,.018);
  box(station,.34,.07,.36,p.darkStone,.48,2.68,-.62,.02);
  box(station,.18,.01,.2,p.black,.48,2.721,-.62);
  for(let i=0;i<6;i++)box(station,.265,.012,.285,p.wall,.48,2.08+i*.09,-.62);

  // Front door, cross-bar windows, brass handle.
  box(station,.4,1.0,.08,p.green,-.32,.79,.615,.025);
  box(station,.25,.39,.012,p.glow,-.32,1.03,.661,.015);
  box(station,.032,.42,.016,p.cream,-.32,1.03,.674);
  box(station,.29,.025,.016,p.cream,-.32,1.03,.676);
  sphere(station,.025,p.brass,-.17,.75,.68);
  for(const x of [-.56,-.09])box(station,.045,1.08,.06,p.trimWood,x,.8,.65);
  box(station,.52,.065,.07,p.trimWood,-.32,1.33,.65);

  function windowAt(x,y,z,turn=0) {
    const w=new THREE.Group();w.position.set(x,y,z);w.rotation.y=turn;station.add(w);
    box(w,.5,.57,.03,p.darkWood,0,0,0,.025);
    box(w,.4,.47,.035,p.glow,0,0,.02,.014);
    box(w,.026,.48,.04,p.cream,0,0,.045);
    box(w,.42,.025,.04,p.cream,0,0,.045);
    box(w,.6,.05,.16,p.trimWood,0,-.3,.05,.012);
  }
  windowAt(.5,.97,.61);windowAt(-.946,1.0,-.2,-Math.PI/2);windowAt(.946,1.0,-.2,Math.PI/2);
  windowAt(0,1.0,-.915,Math.PI);
  // Round station clock under the gable.
  const clock=cylinder(station,.18,.18,.045,p.brass,0,1.97,.61);clock.rotation.x=Math.PI/2;
  const dial=cylinder(station,.145,.145,.048,p.cream,0,1.97,.62);dial.rotation.x=Math.PI/2;
  rod(station,[0,1.97,.65],[.075,2.015,.65],.009,p.iron);
  rod(station,[0,1.97,.65],[-.015,2.085,.65],.009,p.iron);

  const canopy=box(station,2.23,.075,.83,p.roof,0,1.48,1.0,.025);canopy.rotation.x=.1;
  for(const x of [-1.0,1.0]) {
    box(station,.065,1.27,.065,p.trimWood,x,.89,1.28,.009);
    rod(station,[x,.95,1.28],[x,1.43,.89],.023,p.trimWood);
  }
  box(station,2.15,.13,.06,p.trimWood,0,1.4,1.4,.014);
  label(station,'兴 安 岭  ·  秋 日 站',1.55,.21,0,1.47,1.45,{bg:'#e3cc95',ink:'#324b3e',font:'"Songti SC", serif'});
  // Porch stairs and bench.
  for(let i=0;i<2;i++)box(station,.7,.07+i*.06,.25,p.darkStone,-.35,.04+i*.035,1.83-i*.22,.018);
  for(const x of [.48,.92])for(const z of [.83,1.1])box(station,.035,.22,.035,p.iron,x,.38,z);
  for(let i=0;i<3;i++)box(station,.67,.035,.07,p.trimWood,.7,.49,.83+i*.095,.01);
  box(station,.65,.17,.035,p.trimWood,.7,.65,.82,.01);
  for(let i=0;i<8;i++) {
    const log=cylinder(station,.062,.065,.4,p.trimWood,-.7+(i%4)*.14,.32+Math.floor(i/4)*.12,-1.04,10);log.rotation.x=Math.PI/2;
  }
  const barrel=cylinder(station,.16,.14,.34,p.trimWood,1.08,.41,-.69,16);
  for(const y of [.29,.48]) { const hoop=cylinder(station,.164,.164,.018,p.iron,1.08,y,-.69,16);hoop.castShadow=false; }
  cylinder(station,.139,.139,.025,p.darkWood,1.08,.59,-.69,16);
  // Platform lamp — the warm pane itself is emissive, no costly point-light shadow.
  const lamp=new THREE.Group();station.add(lamp);lamp.position.set(-1.25,.25,1.3);
  cylinder(lamp,.022,.035,1.35,p.iron,0,.675,0,10);
  box(lamp,.19,.27,.19,p.glow,0,1.42,0,.018);
  for(const x of [-.1,.1])for(const z of [-.1,.1])box(lamp,.018,.29,.018,p.iron,x,1.42,z);
  cylinder(lamp,0,.18,.14,p.iron,0,1.635,0,4).rotation.y=Math.PI/4;
  return station;
}
