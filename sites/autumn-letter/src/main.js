import './style.css';
import { mountIcons, setIcon } from './icons.js';
import { createScene, buildClay } from './scene.js';
import * as THREE from 'three';
import { createPalette } from './craft.js';
import { buildMusicBox } from './music-box.js';
import { buildLandscape, buildForest } from './forest.js';
import { buildStation } from './station.js';
import { buildRailway, buildTrain } from './railway.js';
import { MusicBoxAudio } from './audio.js';
import { optimizeStatic } from './optimize.js';

mountIcons();
document.querySelector('#retry').addEventListener('click', () => location.reload());
try {
  const app = createScene(document.querySelector('#scene'));
  const clay=new URLSearchParams(location.search).has('clay');
  const p=createPalette();
  let mechanism,train,forest;
  if(clay)buildClay(app.root);
  else {
    mechanism=buildMusicBox(app.root,p);
    buildLandscape(app.root,p);
    buildRailway(app.root,p);
    buildStation(app.root,p);
    forest=buildForest(app.root,p);
    train=buildTrain(app.root,p);
    optimizeStatic(app.root,[...mechanism.gears,mechanism.key,train.engine,train.coach]);
  }
  const audio=new MusicBoxAudio();
  const playButton=document.querySelector('#play');
  const playIcon=document.querySelector('#play-icon');
  const player=document.querySelector('.player');
  const muteButton=document.querySelector('#mute');
  const volumeInput=document.querySelector('#volume');
  const volumeIcon=document.querySelector('#volume-icon');
  const status=document.querySelector('#audio-status');
  let previousVolume=audio.volume;
  let busy=false,speed=0,previous=performance.now(),frameCount=0,lastFrameTime=performance.now(),fps=0,dirty=true;
  app.controls.addEventListener('change',()=>dirty=true);
  const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
  const renderPlayback=()=>{
    setIcon(playIcon,busy?'loading':audio.playing?'pause':'play');
    player.dataset.state=busy?'loading':audio.playing?'playing':audio.position?'paused':'idle';
    playButton.setAttribute('aria-busy',String(busy));
    playButton.setAttribute('aria-label',busy?'正在开启音乐':audio.playing?'暂停音乐':'播放音乐');
    playButton.setAttribute('aria-pressed',String(audio.playing));
    document.querySelector('#play-state').textContent=busy?'正在开启旋律':audio.playing?'秋天正在缓缓经过':audio.position?'让时光停一会儿':'等一阵秋风';
  };
  async function toggle() {
    if(busy||clay)return;
    const restoreFocus=document.activeElement===playButton;
    busy=true;playButton.disabled=true;status.textContent='';
    renderPlayback();
    try {if(audio.playing)audio.pause();else await audio.play();}
    catch(error){audio.pause();status.textContent=error.message;}
    finally{busy=false;playButton.disabled=false;renderPlayback();if(restoreFocus)playButton.focus({preventScroll:true});}
  }
  playButton.addEventListener('click',toggle);
  audio.onInterrupted=()=>{renderPlayback();status.textContent='播放已暂停，点击播放即可继续。';};
  function changeVolume(value) {
    const volume=THREE.MathUtils.clamp(value,0,1);
    if(volume>0)previousVolume=volume;
    audio.setVolume(volume);
    const percent=Math.round(volume*100);
    volumeInput.value=String(percent);
    volumeInput.style.setProperty('--volume-level',`${percent}%`);
    volumeInput.setAttribute('aria-valuetext',percent?`${percent}%`:'静音');
    setIcon(volumeIcon,volume===0?'volume-muted':volume<=.35?'volume-low':'volume-high');
    muteButton.setAttribute('aria-pressed',String(volume===0));
    const action=volume===0?'恢复音量':'静音';
    muteButton.setAttribute('aria-label',action);
    muteButton.dataset.tooltip=action;
  }
  volumeInput.addEventListener('input',event=>changeVolume(Number(event.target.value)/100));
  muteButton.addEventListener('click',()=>changeVolume(audio.volume>0?0:previousVolume));
  changeVolume(audio.volume);
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&audio.playing){audio.pause();renderPlayback();}});
  document.querySelector('#scene').addEventListener('webglcontextlost',event=>{event.preventDefault();audio.pause();renderPlayback();document.querySelector('#scene-error').hidden=false;document.querySelector('#error-detail').textContent='图形上下文已中断，请点击重新打开。';playButton.disabled=muteButton.disabled=volumeInput.disabled=true;});
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
  let pointerStart=null;
  const hitKey=event=>{
    if(!mechanism)return false;
    const r=app.renderer.domElement.getBoundingClientRect();
    pointer.set((event.clientX-r.left)/r.width*2-1,-(event.clientY-r.top)/r.height*2+1);
    raycaster.setFromCamera(pointer,app.camera);
    if(!raycaster.intersectObject(mechanism.key,true).length)return false;
    // Raycast the complete scene so hidden keys cannot be activated through the box.
    const hits=raycaster.intersectObject(app.root,true);
    if(!hits.length)return false;
    let object=hits[0].object;
    while(object){if(object===mechanism.key)return true;object=object.parent;}
    return false;
  };
  const canvas=app.renderer.domElement,hint=document.querySelector('#key-hint');
  canvas.addEventListener('pointerdown',e=>{pointerStart={x:e.clientX,y:e.clientY,id:e.pointerId,time:performance.now()};});
  canvas.addEventListener('pointerup',e=>{if(pointerStart&&pointerStart.id===e.pointerId&&Math.hypot(e.clientX-pointerStart.x,e.clientY-pointerStart.y)<6&&performance.now()-pointerStart.time<600&&hitKey(e))toggle();pointerStart=null;});
  canvas.addEventListener('pointercancel',()=>pointerStart=null);
  canvas.addEventListener('pointermove',e=>{
    if(e.buttons||e.pointerType==='touch')return;
    const hit=hitKey(e);canvas.style.cursor=hit?'pointer':'grab';hint.hidden=!hit;
    if(hit){const r=canvas.getBoundingClientRect();hint.style.left=`${e.clientX-r.left-70}px`;hint.style.top=`${e.clientY-r.top-43}px`;}
  });
  canvas.addEventListener('pointerleave',()=>hint.hidden=true);
  document.querySelector('#loading').hidden = true;
  playButton.disabled=clay;
  muteButton.disabled=volumeInput.disabled=clay;
  document.querySelector('#reset').disabled = false;
  document.querySelector('#reset').addEventListener('click', app.reset);
  app.renderer.setAnimationLoop((now)=>{
    const dt=Math.min((now-previous)/1000,.05);previous=now;
    speed=THREE.MathUtils.damp(speed,audio.playing?1:0,5,dt);
    if(speed<.0001)speed=0;
    if(!clay){const motionSpeed=speed*(reducedMotion.matches?.55:1);train.update(dt,motionSpeed);mechanism.update(dt,motionSpeed);p.glow.emissiveIntensity=THREE.MathUtils.lerp(.12,.85,speed);}
    const t=audio.currentTime;
    document.querySelector('#progress').style.transform=`scaleX(${t/audio.duration})`;
    document.querySelector('.progress-track').setAttribute('aria-valuenow',String(Math.round(t/audio.duration*100)));
    document.querySelector('#time').textContent=`${String(Math.floor(t/60)).padStart(2,'0')}:${String(Math.floor(t%60)).padStart(2,'0')}`;
    app.controls.update();
    if(dirty||speed>0||audio.playing){app.render();dirty=false;frameCount++;}
    if(now-lastFrameTime>1000){fps=Math.round(frameCount*1000/(now-lastFrameTime));frameCount=0;lastFrameTime=now;}
  });
  window.__musicBox = {
    view:app.view,app,audio,train,mechanism,phase:clay?'clay':'complete',
    get metrics(){return{fps,calls:app.renderer.info.render.calls,triangles:app.renderer.info.render.triangles,leaves:forest?.leaves,playing:audio.playing,audioState:audio.context?.state??'not-started',rms:audio.rms,volume:audio.volume,time:audio.currentTime,trainProgress:train?.progress,trainDistance:train?.distance,camera:app.camera.position.toArray(),distance:app.camera.position.distanceTo(app.controls.target),reducedMotion:reducedMotion.matches};},
    keyScreenPosition(){app.camera.updateMatrixWorld();const v=mechanism.key.localToWorld(new THREE.Vector3(0,.05,.84)).project(app.camera);const r=canvas.getBoundingClientRect();return{x:r.left+(v.x+1)*r.width/2,y:r.top+(1-v.y)*r.height/2};}
  };
} catch (error) {
  console.error(error);
  document.querySelector('#loading').hidden = true;
  document.querySelector('#scene-error').hidden = false;
}
