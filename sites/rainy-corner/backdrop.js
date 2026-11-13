import {T,scene} from './kit.js';
import {skylineImages} from './skyline.js';
export function createBackdrop(){
  const images=skylineImages(),canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.minFilter=T.LinearFilter;texture.generateMipmaps=false;scene.background=texture;
  let last=-1,width=0,height=0,cityLayers=[];
  function sky(colors,w,h){const g=ctx.createRadialGradient(w*.4,h*.25,0,w*.5,h*.42,w*.7);g.addColorStop(0,colors[0]);g.addColorStop(.6,colors[1]);g.addColorStop(1,colors[2]);ctx.fillStyle=g;ctx.fillRect(0,0,w,h);}
  function city(source,w,h){
    const mobile=w/h<.8,sw=Math.max(w,mobile?850:900),sh=h*(mobile?.4:.57),top=h*(mobile?.21:.12);
    const layer=document.createElement('canvas');layer.width=w;layer.height=h;const c=layer.getContext('2d');c.filter='blur(4px)';c.drawImage(source,(w-sw)/2,top,sw,sh);c.filter='none';c.globalCompositeOperation='destination-in';
    const mask=c.createLinearGradient(0,top,0,top+sh);mask.addColorStop(0,'transparent');mask.addColorStop(.14,'#000');mask.addColorStop(.58,'#000');mask.addColorStop(.96,'transparent');c.fillStyle=mask;c.fillRect(0,0,w,h);return layer;
  }
  return function update(day){
    const w=Math.min(1440,innerWidth),h=Math.round(w*innerHeight/innerWidth);
    if(last===day&&width===w&&height===h)return;
    if(width!==w||height!==h){texture.dispose();canvas.width=w;canvas.height=h;width=w;height=h;cityLayers=[city(images.night,w,h),city(images.day,w,h)];}
    sky(['#1c3445','#112637','#0e1d2f'],w,h);
    ctx.globalAlpha=day;sky(['#f4e9cd','#d5e5db','#b2ccd1'],w,h);ctx.globalAlpha=1;
    ctx.globalAlpha=.42*(1-day);ctx.drawImage(cityLayers[0],0,0);ctx.globalAlpha=.28*day;ctx.drawImage(cityLayers[1],0,0);ctx.globalAlpha=1;
    texture.needsUpdate=true;last=day;
  };
}
