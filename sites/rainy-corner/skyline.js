import * as T from 'three';
export function skylineImages(){
  const world=new T.Scene();
  const camera=new T.OrthographicCamera(-45,45,35,-3,.1,150);camera.position.set(0,0,70);camera.lookAt(0,0,0);
  const renderer=new T.WebGLRenderer({alpha:true,antialias:true});renderer.setSize(1600,680);renderer.setClearColor(0,0);renderer.setPixelRatio(1);
  const night=new T.MeshBasicMaterial({color:'#233f52'}),trim=new T.MeshBasicMaterial({color:'#517380'}),pink=new T.MeshBasicMaterial({color:'#ba8cae'}),blue=new T.MeshBasicMaterial({color:'#789aaa'}),gold=new T.MeshBasicMaterial({color:'#b8a887'});
  const lights=new T.Group();world.add(lights);
  const materials=[night,trim,pink,blue,gold];
  function add(g,m,x,y,z=0,parent=world){const o=new T.Mesh(g,m);o.position.set(x,y,z);parent.add(o);return o;}
  function block(w,h,d,x,y,z=0,m=night){return add(new T.BoxGeometry(w,h,d),m,x,y,z);}
  function tube(r,h,x,y,z=0,m=trim,rt=r){return add(new T.CylinderGeometry(rt,r,h,12),m,x,y,z);}
  function sphere(r,x,y,m=pink){return add(new T.SphereGeometry(r,24,12),m,x,y);}
  let seed=512;function random(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
  for(let i=0;i<43;i++){
    const x=-43+i*2.05,h=2+random()*7,w=1.3+random()*1.4;block(w,h,2,x,h/2,-3-random()*5);
    for(let row=1;row<h-.5;row+=.68)for(let col=-w/2+.25;col<w/2;col+=.45)if(random()>.52)add(new T.PlaneGeometry(.11,.15),random()>.75?gold:blue,x+col,row,-1,lights);
  }
  // Oriental Pearl: slender shaft, two primary spheres and the needle.
  const pearl=-24;for(const dx of [-.66,0,.66])tube(.12,11.5,pearl+dx,5.75,0,trim);
  sphere(1.85,pearl,7.2);sphere(1.25,pearl,19.4);tube(.27,12.2,pearl,13.1,0,trim);tube(.12,5.2,pearl,22.8,0,pink,.03);sphere(.38,pearl,23.2,blue);
  for(const [y,r]of [[7.2,1.88],[19.4,1.28]]){const ring=add(new T.TorusGeometry(r,.075,8,40),blue,pearl,y);ring.rotation.x=Math.PI/2;}
  // World Financial Center: trapezoid profile with a real opening at the crown.
  const swfc=new T.Shape();swfc.moveTo(-2.2,0);swfc.lineTo(2.2,0);swfc.lineTo(1.6,28);swfc.lineTo(-1.6,28);swfc.closePath();
  const hole=new T.Path();hole.moveTo(-1,24.1);hole.lineTo(-.91,26.9);hole.lineTo(.91,26.9);hole.lineTo(1,24.1);hole.closePath();swfc.holes.push(hole);
  add(new T.ExtrudeGeometry(swfc,{depth:1.25,bevelEnabled:false}),night,6,0);
  for(const x of [4.45,7.55])block(.065,26.8,.1,x,13.4,1.32,blue);block(3.1,.10,.1,6,28,1.32,blue);
  for(let y=1;y<24;y+=.7)block(3.0,.027,.1,6,y,1.32,trim);
  // Jin Mao: stepped setbacks and a tiered, tapering crown.
  for(let i=0;i<11;i++){const w=3.2-i*.19,y=i*1.85;block(w,1.82,w,-.4,y+.91,1);block(w+.16,.065,w+.16,-.4,y+1.8,1,trim);}
  tube(.12,3.4,-.4,21.9,1,gold,.025);
  // Shanghai Tower: tapered and twisted envelope, not a generic rectangle.
  const g=new T.CylinderGeometry(.85,2.35,32,28,32),p=g.attributes.position;
  for(let i=0;i<p.count;i++){const y=p.getY(i),a=(y+16)/32*.9,x=p.getX(i),z=p.getZ(i);p.setXYZ(i,x*Math.cos(a)-z*Math.sin(a),y,(x*Math.sin(a)+z*Math.cos(a))*.67);}g.computeVertexNormals();
  add(g,trim,14,16,0);for(let i=0;i<34;i++){const y=i*.91,r=2.35-(y/32)*1.5;const ring=add(new T.TorusGeometry(r,.022,4,30),blue,14,y,0);ring.rotation.x=Math.PI/2;ring.scale.y=.67;}
  for(let i=0;i<3;i++)tube(.045,32-i*.3,13+i*.65,16-i*.15,1,blue);
  block(3.5,13,2,-14,6.5);block(2.6,16,2,24,8);tube(1.05,1.3,-14,13.5,0,gold,.2);
  function snapshot(){renderer.render(world,camera);const canvas=document.createElement('canvas');canvas.width=1600;canvas.height=680;const ctx=canvas.getContext('2d');ctx.drawImage(renderer.domElement,0,0);return canvas;}
  const nightImage=snapshot();lights.visible=false;
  night.color.set('#789497');trim.color.set('#8ca9aa');pink.color.set('#90a7aa');blue.color.set('#9db4b3');gold.color.set('#8ea4a5');
  const dayImage=snapshot();
  world.traverse(o=>{if(o.geometry)o.geometry.dispose();});materials.forEach(m=>m.dispose());renderer.dispose();renderer.forceContextLoss();
  return {night:nightImage,day:dayImage};
}
