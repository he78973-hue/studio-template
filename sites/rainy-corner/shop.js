import {T,scene,C,box,mat,basic,mesh,cyl,rod,line,group,label,light,dynamic} from './kit.js';
export function shop(){
const wall=mat('#bebcad',.15),inside=mat('#e4d1a6',.35),frame=mat('#384d57');
box(8.15,.16,5.8,0,.32,-1.55,inside,scene,true);box(8.15,3.05,.18,0,1.94,-4.4,wall,scene,true);box(.18,3.05,5.8,4,1.94,-1.55,wall,scene,true);
for(let x=-3.75;x<4;x+=.5)for(let z=-4.12;z<1.3;z+=.5)box(.485,.005,.485,x,.406,z,mat((Math.floor(x*4+z*4)%3)?'#e1d6b9':'#d0c8b0',.25));
box(8.65,.22,6.2,0,3.59,-1.5,'#314853',scene,true);box(8.34,.08,5.9,0,3.75,-1.5,'#55727b',scene,true);
for(let x=-4.04;x<=4.1;x+=.37)box(.028,.055,5.9,x,3.81,-1.5,'#789399');
for(const z of [-4.48,1.48])box(8.6,.14,.12,0,3.83,z,'#76969a',scene,true);
box(8.65,.7,.32,0,3.15,1.48,mat('#dcf4ce',.9),scene,true);
box(8.66,.075,.34,0,3.48,1.48,mat(C.mint,1));box(8.66,.07,.34,0,2.83,1.48,mat('#e4a268',.5));
label('听雨便利店',3.3,.40,-.65,3.25,1.655,{bg:'#daf2d5',fg:'#275e56',size:176});
label('R A I N Y  C O R N E R',2.3,.12,-.64,2.98,1.66,{bg:'#daf2d5',fg:'#477b68',size:66});
dynamic.signMaterial=mat('#dcf4ce',.9);
label('24',.65,.49,3.63,3.17,1.66,{bg:'#daf2d5',fg:'#25675b',size:176});
label('上海 · 街角',1.4,.3,-3.2,3.15,1.66,{bg:'#daf2d5',fg:'#3e7160',size:80});
// Wraparound fascia remains legible from the street corner.
box(.3,.7,5.7,-4.15,3.15,-1.5,mat('#d2e8c5',.65));box(.32,.075,5.7,-4.15,3.48,-1.5,mat(C.mint,.8));
label('听雨便利店  /  24H',3.8,.47,-4.313,3.15,-1.5,{rot:-Math.PI/2,bg:'#d2e8c5',fg:'#35675a',size:94});
for(const x of [-4,-1.35,1.25,3.45,4])box(.085,2.42,.12,x,1.61,1.29,frame,scene,true);
for(const y of [.49,2.75])box(8.06,.075,.12,0,y,1.29,frame);
const glass=new T.MeshBasicMaterial({color:'#9bcfdb',transparent:true,opacity:.065,depthWrite:false,side:T.DoubleSide});
for(const [x,w]of [[-2.67,2.55],[-.05,2.5],[3.73,.47]]){mesh(new T.PlaneGeometry(w,2.2),glass,x,1.64,1.30);box(w,.06,.02,x,1.24,1.315,mat('#b5d5ba',.25));}
for(const z of [-4.35,-2.45,-.55,1.29])box(.12,2.42,.075,-4,1.61,z,frame);
for(const y of [.49,2.75])box(.12,.07,5.7,-4,y,-1.55,frame);
for(const z of [-3.4,-1.5,.38]){const a=mesh(new T.PlaneGeometry(1.8,2.2),glass,-4.015,1.63,z);a.rotation.y=-Math.PI/2;}
const doors=[];
for(const x of [1.8,2.87]){const g=group(x,0,1.32);box(1.04,2.25,.045,0,1.61,0,glass,g);for(const dx of [-.52,.52])box(.055,2.3,.075,dx,1.6,0,frame,g);for(const y of [.47,2.73,1.25])box(1.07,.045,.08,0,y,0,frame,g);box(.045,.36,.06,x<2? .37:-.37,1.6,.05,'#c3d7cc',g);label('自动门',.52,.12,0,1.26,.055,{parent:g,bg:'#d7e7c8',fg:'#416c67',size:90});doors.push(g);}
dynamic.doors=doors;
box(2.3,.14,.23,2.34,2.78,1.3,frame);box(.19,.06,.14,2.34,2.79,1.46,basic('#1a2329'));box(.035,.015,.008,2.34,2.79,1.54,basic('#ffdd97'));
box(2.14,.025,.73,2.34,.277,1.69,'#324c50');for(let i=0;i<18;i++)box(.016,.004,.7,1.38+i*.114,.292,1.69,'#48666a');
// A narrow translucent rain canopy, not an opaque slab over the windows.
const canopy=box(8.65,.05,.73,0,2.81,1.93,new T.MeshBasicMaterial({color:'#83bfb6',transparent:true,opacity:.36,side:T.DoubleSide}));canopy.rotation.x=.035;
for(let x=-4.2;x<4.3;x+=1.42)rod([x,2.82,1.48],[x,2.78,2.3],.025,'#34565c');rod([-4.32,2.78,2.3],[4.32,2.78,2.3],.045,'#678a8a');
for(const x of [-3,0,2.8]){box(1.75,.065,.25,x,3.39,-1.3,mat('#fff0c4',1.4));light('#ffe1a1',22,x,2.9,-1.5,5);}
box(7.9,.035,.05,0,2.78,1.2,mat('#fff5ce',2));light('#bfffe4',14,-2,2.8,2.1,5);light('#ffcf86',18,2.5,2.5,.8,5);
for(const x of [-3.7,3.7])line([[x,3.8,-4.4],[x,2.7,-4.57],[x,.5,-4.57]],.055,'#63717b');
}
