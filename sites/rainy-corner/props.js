import {T,scene,C,box,mat,basic,mesh,cyl,ball,rod,line,group,label,light,dynamic} from './kit.js';
function ac(x,y,z,rot=0){const g=group(x,y,z,rot);box(1.25,.8,.6,0,.4,0,'#9aa6a5',g,true);box(1.12,.66,.035,0,.4,.318,'#617480',g);for(const x of [-.32,.32]){const disk=cyl(.245,.04,x,.4,.35,'#243d4b',g);disk.rotation.x=Math.PI/2;for(let i=0;i<6;i++){const a=box(.36,.037,.01,x,.4,.38,'#829293',g);a.rotation.z=i*Math.PI/3;}}for(let i=0;i<9;i++)box(1.13,.016,.025,0,.13+i*.068,.401,'#a7b4b1',g);for(const x of [-.42,.42])box(.13,.12,.77,x,-.035,0,'#425766',g);line([[.65,.3,-.1],[.9,.3,-.1],[.9,-.15,-.4]],.037,'#6f8286',g);}
function bicycle(x,z,rot){const g=group(x,.3,z,rot),red=mat('#b98273');for(const x of [-.62,.62]){let tire=mesh(new T.TorusGeometry(.35,.039,8,32),mat('#192831'),x,.38,0,g);mesh(new T.TorusGeometry(.3,.018,5,28),mat('#99acb2'),x,.38,0,g);for(let i=0;i<12;i++){let a=i*Math.PI/6;rod([x,.38,0],[x+Math.cos(a)*.29,.38+Math.sin(a)*.29,0],.006,'#9eaeb4',g);}}
for(const [a,b]of [[[-.62,.38,0],[-.2,.87,0]],[[-.2,.87,0],[.07,.4,0]],[[.07,.4,0],[-.62,.38,0]],[[-.2,.87,0],[.43,.93,0]],[[.43,.93,0],[.07,.4,0]],[[.43,.93,0],[.62,.38,0]]])rod(a,b,.027,red,g);
rod([-.2,.8,0],[-.22,1.02,0],.021,'#abc0bd',g);box(.3,.055,.15,-.23,1.04,0,'#24343a',g);rod([.43,.89,0],[.4,1.16,0],.021,'#a7bfbd',g);rod([.4,1.16,-.24],[.4,1.16,.24],.024,'#a7bfbd',g);box(.4,.23,.34,.69,.99,0,'#546870',g,true);for(let i=0;i<5;i++)box(.42,.009,.36,.69,.91+i*.046,0,'#9eb1ae',g);rod([.06,.43,-.18],[.06,.43,.18],.02,'#a6b2ac',g);box(.15,.035,.09,.06,.43,.22,'#21353e',g);rod([-.02,.38,0],[-.18,0,.2],.018,'#829894',g);}
export function props(){
ac(-2.4,3.92,-2.8);ac(-.7,3.92,-2.8);ac(4.49,.38,-3.25,Math.PI/2);
box(1.8,.05,1.25,2.25,3.87,-2.6,'#2a404e',scene,true);for(let i=0;i<7;i++)box(1.55,.018,.045,2.25,3.91,-3.1+i*.17,'#617d87');
const vent=cyl(.23,.46,2.6,4.02,-3.9,'#70858c');cyl(.34,.08,2.6,4.28,-3.9,'#9eb2b3');
const vg=group(-4.9,.27,.04);box(1.13,2.13,.79,0,1.08,0,mat('#cf7479',.18),vg,true);box(.93,1.18,.035,-.03,1.39,.42,'#244451',vg);box(.84,1.04,.025,-.03,1.42,.45,mat('#c9f1e5',.8),vg);
for(let row=0;row<3;row++){for(let n=0;n<5;n++){let x=-.36+n*.16,y=1.06+row*.31;cyl(.051,.19,x,y,.48,mat(['#d59168','#80ae93','#ceb963','#91a9c9','#d48387'][n],.45),vg);cyl(.028,.04,x,y+.114,.48,mat('#f4e8c7',.5),vg);box(.055,.066,.012,x,y,.534,mat('#fff4ce',.6),vg);}box(.86,.05,.03,-.03,.916+row*.31,.49,'#49656b',vg);}
label('自助饮料',.88,.18,0,1.98,.406,{parent:vg,bg:'#dc9192',fg:'#fff5d7',size:130});box(.5,.17,.05,-.17,.32,.415,'#273e48',vg);box(.17,.25,.025,.37,.63,.41,'#233f49',vg);box(.09,.04,.026,.37,.71,.43,mat('#b9f1d5',1),vg);light('#a6f9e8',8,-4.9,1.5,1.0,3.5);
bicycle(-4.88,-2.65,Math.PI/2);
// Umbrella stand with individually hooked handles and folded fabric.
box(.62,.5,.4,4.72,.54,.85,'#3b525c',scene,true);for(let i=0;i<4;i++){const x=4.49+i*.14;cyl(.043,.65,x,.82,.86,mat(['#afc6c3','#b08da4','#6b859c','#d0b88c'][i]));rod([x,.6,.86],[x,1.37,.86],.012,'#abbcb9');line([[x,1.33,.86],[x,1.48,.86],[x+.065,1.5,.86],[x+.09,1.44,.86]],.018,'#b7c8c5');}
for(const z of [-.05,-.85]){box(.62,.95,.62,4.85,.755,z,'#667b7b',scene,true);box(.65,.12,.65,4.85,1.26,z,'#90a9a3',scene,true);box(.33,.14,.015,4.85,1.13,z+.317,'#1e3540');label(z===-.05?'可回收物':'干垃圾',.49,.16,4.85,.82,z+.32,{size:100,bg:'#91b3a4'});}
label('新品上市',.7,.73,-3.33,1.97,1.327,{bg:'#d58e67',fg:'#fff0c5',size:115,sub:'鲜制饭团  ¥6.8'});label('暖一杯',.74,.52,-.54,2.13,1.326,{bg:'#819f8e',fg:'#fff1c9',size:120,sub:'热咖啡  ¥12.0'});
box(.07,1.4,1.0,4.14,1.62,-1.5,'#3c545a');label('社区公告',.85,.37,4.182,2.05,-1.5,{rot:Math.PI/2,bg:'#c8c4a4',fg:'#4d685f',size:100});
for(let i=0;i<3;i++){const a=label(['邻里集','旧书摊','雨天惠'][i],.24,.62,4.183,1.54,-1.81+i*.3,{rot:Math.PI/2,bg:['#cf9c7b','#a7c0af','#cbbb8d'][i],fg:'#4e615a',size:93});}
// Rear service lane stays fully modelled when the miniature is turned around.
box(1.35,2.3,.06,2.6,1.55,-4.51,'#647f80',scene,true);label('卸货口',.66,.23,2.6,2.24,-4.55,{rot:Math.PI,bg:'#778c85',size:105});
for(let i=0;i<4;i++){box(.58,.3,.45,4.8,.44+i*.3,-4.6,mat(i%2?'#aa926b':'#728e88'),scene,true);for(let n=0;n<3;n++)box(.035,.19,.016,4.59+n*.2,.44+i*.3,-4.366,'#425d65');}
for(let i=0;i<3;i++){cyl(.21,.36,4.8,.43,-1.68-i*.58,'#866e65');for(let n=0;n<7;n++){let a=n*2.4;const leaf=ball(.17,4.8+Math.cos(a)*.17,.79+(n%3)*.12,-1.68-i*.58+Math.sin(a)*.13,mat(n%2?'#668a7c':'#82986f'));leaf.scale.y=1.5;}}
}
