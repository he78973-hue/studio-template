import * as THREE from 'three';
import {landmarks,finishPoint} from './landmarks.js';
import {buildRomeo,buildBajin,buildCourtyard,buildRac,buildWiggle} from './refined-landmarks.js';
import {block,label,compact,mats,tones} from './architecture.js';

export function buildExtraLandmarks(walk){
  for(const [id,builder] of Object.entries({courtyard:buildCourtyard,bajin:buildBajin,romeo:buildRomeo,rac:buildRac,wiggle:buildWiggle})){
    const b=walk.data.buildings.find(b=>b.id===landmarks[id].buildingId),model=builder(b);
    walk.city.add(model);walk.landmarks.push(model);
  }
  const end=new THREE.Group();end.position.set(finishPoint[0]-11,0,finishPoint[1]-10);
  block(end,[.14,4,.14],[0,2,0],mats.green);
  for(const [text,w,y] of [['乌鲁木齐中路',5,3.5],['淮海中路',4.5,2.2]]){
    block(end,[w,.85,.12],[0,y,0],mats.green);label(end,text,{w:w-.3,h:.65,y,z:.07,background:tones.green});
  }
  compact(end,'finish');walk.city.add(end);walk.landmarks.push(end);
}
