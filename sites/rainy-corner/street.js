import {T,scene,C,box,mat,basic,mesh,cyl,ball,rod,line,group,label,light,dynamic} from './kit.js';
export function street(){
// Protective rails are warm ivory enamel, with dark footings.
for(const [x,z,len,rot]of [[-1.9,2.85,2.2,0],[-5.0,-4.5,1.9,Math.PI/2]]){let g=group(x,.05,z,rot);for(let s of [-1,1]){cyl(.065,.95,s*len/2,.475,0,'#b2c0b6',g);cyl(.105,.1,s*len/2,.05,0,'#354e5c',g);}for(let y of [.48,.88])rod([-len/2,y,0],[len/2,y,0],.043,'#b3c0b4',g);}
for(const [x,z]of [[-5.78,2.15],[5.7,-5.5]]){cyl(.105,6.35,x,3.18,z,'#718394');cyl(.17,.5,x,.25,z,'#3c5363');for(let i=0;i<5;i++)box(.22,.12,.23,x,.51+i*.24,z,mat(i%2?'#334754':'#b4a475'));rod([x-.85,5.8,z],[x+.85,5.8,z],.055,'#4c5e6f');for(let j=-1;j<=1;j++){cyl(.08,.18,x+j*.65,5.97,z,'#92a4a6');cyl(.1,.04,x+j*.65,5.98,z,'#c3cdbe');}box(.35,.7,.28,x+.23,4.6,z,'#7d8d97',scene,true);}
for(let i=0;i<3;i++)line([[-5.78+i*.32,6.05,2.15],[-.2+i*.32,5.22,-1.8],[5.7+i*.32,6.05,-5.5]],.016,'#162938');
line([[-5.78,4.9,2.15],[-5.4,4.53,-2.0],[-4.1,3.65,-4.3]],.02,'#223345');
// Goose-neck neighbourhood lamp.
rod([-5.78,5.25,2.15],[-4.92,5.25,2.15],.046,'#556f7e');line([[-5.78,4.95,2.15],[-5.52,5.43,2.15],[-4.97,5.44,2.15],[-4.87,5.25,2.15]],.036,'#839a9e');
box(.61,.12,.34,-4.81,5.23,2.15,'#637e87',scene,true);box(.49,.022,.26,-4.81,5.157,2.15,mat('#ffdfad',2));light('#ffd8a3',33,-4.81,5.02,2.15,8);
// Suspended three-light signal, very small against the power-pole silhouette.
rod([5.7,4.82,-5.5],[4.1,4.82,-5.5],.04,'#839494');box(1.17,.44,.37,4.0,4.75,-5.5,'#263e4b',scene,true);
const signals=[];for(let i=0;i<3;i++){const m=mat(['#5bdfc6','#e6c978','#e77f8b'][i],i===0?1.8:.08).clone();let o=cyl(.125,.055,3.62+i*.38,4.75,-5.282,m);o.rotation.x=Math.PI/2;signals.push(m);box(.29,.05,.26,3.62+i*.38,4.92,-5.25,'#3b515b');}dynamic.signals=signals;
// Parking blade and compact corner signs are physical objects, not UI.
cyl(.045,3.65,5.37,1.83,2.15,'#526f7a');box(.88,.83,.15,5.37,3.7,2.15,'#839698',scene,true);label('P',.75,.66,5.37,3.7,2.235,{bg:'#366984',fg:'#d4f1de',size:203});label('24h',.68,.22,5.37,3.17,2.23,{bg:'#7cbaa1',fg:'#183f45',size:90});light('#70b9e0',5,5.37,3.5,2.5,3.5);
label('滨江路',1.1,.29,-5.78,3.72,2.282,{bg:'#416a81',fg:'#dbe6cf',size:120});
const sg=group(-5.7,.04,5.8);cyl(.045,2.3,0,1.15,-.08,'#7f959e',sg);const sign=mesh(new T.CylinderGeometry(.35,.35,.04,8),mat('#c47c7d'),0,2.1,0,sg);sign.rotation.x=Math.PI/2;sign.rotation.y=Math.PI/8;label('停',.27,.27,0,2.1,.029,{parent:sg,bg:'#c47c7d',fg:'#fff1da',size:224,canvasWidth:256});
for(const [x,z]of [[4.65,4.0],[5.37,4.0]]){box(.35,.055,.35,x,.08,z,'#354d5a',scene,true);mesh(new T.ConeGeometry(.14,.48,4),mat('#c78373'),x,.34,z);box(.12,.07,.12,x,.37,z,'#e3d6b7');}
// Alley markers and tactile paving complete the turn in the street.
label('街巷  02',.9,.23,4.184,2.58,-2.45,{rot:Math.PI/2,bg:'#3b5964',fg:'#c2d5c7',size:92});
for(let i=0;i<5;i++){box(.34,.015,.34,1.53+i*.37,.285,2.14,'#b6ad71');for(let j=0;j<3;j++)box(.025,.012,.27,1.42+i*.37+j*.105,.302,2.14,'#c6bd7c');}
}
