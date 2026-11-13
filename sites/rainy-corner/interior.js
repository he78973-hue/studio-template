import {T,scene,C,box,mat,basic,mesh,cyl,group,label} from './kit.js';
const colors=['#e3946b','#e6c764','#a6ba78','#b3d3c6','#cf7974','#8ea4bc'];
function bottle(x,y,z,i,p=scene,s=1){cyl(.045*s,.18*s,x,y+.09*s,z,mat(colors[i%6],.32),p);cyl(.023*s,.055*s,x,y+.206*s,z,mat('#d4dbc8',.3),p);box(.075*s,.074*s,.006*s,x,y+.095*s,z+.044*s,mat('#f2e6bd',.3),p);}
function packet(x,y,z,i,p=scene){box(.14,.19,.11,x,y+.1,z,mat(colors[i%6],.35),p);box(.09,.075,.008,x,y+.11,z+.06,mat('#f5e7c4',.3),p);box(.13,.025,.12,x,y+.19,z,mat('#dfd7ba',.2),p);}
export function interior(){
// Refrigerated drinks wall, with shelves, framed glazing and luminous strips.
for(let k=0;k<4;k++){const x=-3.27+k*1.17;box(1.09,2.35,.56,x,1.6,-3.98,mat('#6a827f',.2),scene,true);box(.97,2.1,.04,x,1.6,-3.675,mat('#b9d2c7',.7));for(let row=0;row<5;row++){let y=.62+row*.38;box(1,.04,.42,x,y,-3.65,mat('#eef0d8',.45));for(let n=0;n<7;n++)bottle(x-.42+n*.14,y+.02,-3.52,n+row+k);}for(let dx of [-.54,.54])box(.035,2.26,.05,x+dx,1.6,-3.42,'#394f54');box(.022,.45,.06,x+.41,1.6,-3.36,'#d1ded3');box(.022,2.15,.025,x-.49,1.6,-3.42,mat('#e0fff2',1.8));label(['饮料','茶饮 · 水','鲜牛奶','冷藏饮品'][k],.95,.16,x,2.83,-3.62,{size:100,bg:'#557d72'});}
// Two low gondolas keep the rear cabinets visible from outside.
for(let k=0;k<2;k++){let x=-2.6+k*2.1;box(1.58,.18,1.8,x,.52,-1.45,mat('#bdba9e',.25),scene,true);box(.06,1.05,1.7,x,1.04,-1.45,mat('#d4d4bb',.25));for(let row=0;row<3;row++){let y=.66+row*.37;box(1.6,.045,1.77,x,y,-1.45,mat('#e8dfbd',.35),scene,true);for(let side of [-1,1])for(let n=0;n<8;n++){const z=-2.19+n*.2;if(row===2&&k===0)bottle(x+side*.48,y+.025,z,n,scene,.84);else packet(x+side*.5,y+.025,z,n+row+k);}
box(1.62,.09,.03,x,y,-.55,mat('#dfcd9d',.3));for(let n=0;n<6;n++)box(.13,.05,.008,x-.66+n*.25,y,-.529,mat('#fff4ce',.5));}
label(k?'饼干 · 零食':'饭团 · 便当',1.5,.17,x,1.59,-.54,{bg:k?'#b86e66':'#789f79',size:90});}
// Window-side bento display: black trays, rice, vegetables and salmon.
box(2.5,.58,.65,-2.45,.73,.7,mat('#b8b392',.3),scene,true);box(2.6,.08,.7,-2.45,1.06,.7,mat('#e3d8b5',.4));
for(let i=0;i<7;i++){const x=-3.45+i*.34;box(.28,.035,.42,x,1.13,.7,'#27373b');box(.14,.04,.32,x-.05,1.166,.7,mat('#f6edca',.45));box(.09,.04,.13,x+.08,1.17,.58,mat('#9aaf67',.3));box(.09,.04,.14,x+.08,1.17,.77,mat('#d69568',.3));}
label('每日鲜食 · 便当',2.2,.2,-2.45,.89,1.036,{bg:'#e9d7a3',fg:'#64734d',size:90});
// Checkout, coffee, oden and register, arranged on the right of the entrance.
box(1.23,.87,2.0,2.8,.855,-1.05,mat('#adc4b4',.3),scene,true);box(1.35,.09,2.13,2.8,1.335,-1.05,mat('#e9debf',.45),scene,true);
box(.38,.07,.3,2.55,1.42,-.6,'#2c454b');const screen=box(.43,.32,.075,2.55,1.65,-.66,'#29414a',scene,true);screen.rotation.x=-.18;box(.34,.21,.009,2.55,1.66,-.613,mat('#a0d8c0',.8));
box(.46,.6,.43,2.78,1.68,-1.75,'#374c52',scene,true);box(.3,.17,.015,2.78,1.79,-1.52,mat('#dfcda5',.4));for(const x of [2.68,2.87]){cyl(.045,.13,x,1.47,-1.48,mat('#f7e8c7',.4));box(.025,.04,.07,x,1.63,-1.48,'#c4d4cf');}label('现磨咖啡',.37,.085,2.78,1.94,-1.523,{size:90});
box(.55,.1,.55,2.92,1.46,.0,'#52645b');for(let x=0;x<3;x++)for(let z=0;z<3;z++)cyl(.066,.04,2.74+x*.17,1.53,-.16+z*.17,mat('#d6b87b',.4));const clear=new T.MeshBasicMaterial({color:'#daf2d9',transparent:true,opacity:.16,depthWrite:false,side:T.DoubleSide});box(.57,.25,.015,2.92,1.64,.27,clear);label('关东煮',.51,.12,2.92,1.47,.285,{bg:'#bd8556',size:100});
// Freezer, magazines, stock-room door and notices.
box(.8,.79,1.5,-3.48,.8,-2.45,mat('#d2d9bc',.35),scene,true);box(.74,.055,1.37,-3.48,1.23,-2.45,mat('#abd5cf',.5));
box(.66,.75,.5,.68,.8,.76,'#9b9177',scene,true);for(let row=0;row<3;row++)for(let i=0;i<3;i++){const a=box(.18,.26,.025,.45+i*.21,.69+row*.23,.92-row*.07,mat(colors[(i+row)%6],.4));a.rotation.x=-.3;box(.13,.05,.015,.45+i*.21,.78+row*.23,.947-row*.07,mat('#f6e6c3',.4));}
box(1.0,2.1,.04,2.79,1.45,-4.28,mat('#859e98',.2),scene,true);label('员工专用',.65,.13,2.79,2.0,-4.249,{bg:'#a0b5a3',fg:'#465953',size:100});box(.06,.12,.07,3.1,1.43,-4.22,'#e1d8b8');
label('秋日好食光',1.0,.72,1.29,2.17,-4.28,{bg:'#d79861',fg:'#fff4d4',size:100,sub:'热食 · 便当 · 暖心供应'});
for(let n=0;n<4;n++)box(.33,.006,.1,1.75,.418,.5-n*.48,mat('#b1cda2',.4));
}
