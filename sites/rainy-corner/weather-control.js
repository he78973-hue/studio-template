import {T,scene,dynamic} from './kit.js';
import {icon} from './icons.js';
import {createBackdrop} from './backdrop.js';
export function weatherControl({hemisphere,moon,rim,bloom,renderer}){
  const updateBackdrop=createBackdrop();
  const button=document.createElement('button');button.type='button';button.className='weather-switch';button.setAttribute('aria-label','晴天模式');button.setAttribute('aria-pressed','false');
  const choices=[['cloud-rain','雨天'],['sun','晴天']].map(([name,text])=>{const span=document.createElement('span');span.className='weather-choice';span.append(icon(name),document.createTextNode(text));button.append(span);return span;});
  document.body.append(button);
  let sunny=false,blend=0,start=0,elapsed=0;
  function select(value){if(value===sunny)return;sunny=value;start=blend;elapsed=0;sync();}
  function sync(){button.setAttribute('aria-pressed',String(sunny));button.title=sunny?'切换为雨天':'切换为晴天';document.body.dataset.weather=sunny?'sunny':'rainy';choices.forEach((choice,i)=>choice.classList.toggle('is-selected',i===(sunny?1:0)));dynamic.sunny=sunny;}
  button.addEventListener('click',()=>select(!sunny));sync();
  const pointLights=[];scene.traverse(o=>{if(o.isPointLight&&o!==dynamic.signLight)pointLights.push([o,o.intensity]);});
  const emissive=new Map();scene.traverse(o=>{if(o.isMesh&&o.material?.emissive&&o.material!==dynamic.signMaterial&&!dynamic.signals.includes(o.material))emissive.set(o.material,o.material.emissiveIntensity);});
  const night={sky:hemisphere.color.clone(),floor:hemisphere.groundColor.clone(),sun:moon.color.clone(),rim:rim.color.clone()};
  const day={sky:new T.Color('#d5e9ed'),floor:new T.Color('#d8cbaa'),sun:new T.Color('#fff0c9'),rim:new T.Color('#a6cbd2')};
  return {
    select,get blend(){return blend;},get sunny(){return sunny;},button,
    advance(dt,reduced){elapsed=Math.min(1.6,elapsed+dt);const p=elapsed/1.6,ease=p*p*(3-2*p);blend=reduced?Number(sunny):T.MathUtils.lerp(start,Number(sunny),ease);dynamic.dayBlend=blend;return blend;},
    apply(){
      hemisphere.color.copy(night.sky).lerp(day.sky,blend);hemisphere.groundColor.copy(night.floor).lerp(day.floor,blend);hemisphere.intensity=T.MathUtils.lerp(.85,1.6,blend);
      moon.color.copy(night.sun).lerp(day.sun,blend);moon.intensity=T.MathUtils.lerp(1.05,2.7,blend);rim.color.copy(night.rim).lerp(day.rim,blend);rim.intensity=T.MathUtils.lerp(.85,.65,blend);
      pointLights.forEach(([l,value])=>l.intensity=value*(1-blend*.87));emissive.forEach((value,m)=>m.emissiveIntensity=value*(1-blend*.78));
      dynamic.mirror.material.uniforms.day.value=blend;dynamic.mirror.visible=blend<.999;
      dynamic.wetOverlays.forEach(({object,opacity})=>{object.material.opacity=opacity*(1-blend);object.visible=blend<.999;});
      renderer.toneMappingExposure=T.MathUtils.lerp(1.05,1.0,blend);bloom.strength=T.MathUtils.lerp(.22,.07,blend);
      updateBackdrop(blend);
    }
  };
}
