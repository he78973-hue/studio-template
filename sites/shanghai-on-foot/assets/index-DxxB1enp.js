(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const a of document.querySelectorAll('link[rel="modulepreload"]'))s(a);new MutationObserver(a=>{for(const l of a)if(l.type==="childList")for(const c of l.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&s(c)}).observe(document,{childList:!0,subtree:!0});function o(a){const l={};return a.integrity&&(l.integrity=a.integrity),a.referrerPolicy&&(l.referrerPolicy=a.referrerPolicy),a.crossOrigin==="use-credentials"?l.credentials="include":a.crossOrigin==="anonymous"?l.credentials="omit":l.credentials="same-origin",l}function s(a){if(a.ep)return;a.ep=!0;const l=o(a);fetch(a.href,l)}})();const W="modulepreload",z=function(e,t){return new URL(e,t).href},j={},Y=function(t,o,s){let a=Promise.resolve();if(o&&o.length>0){let c=function(u){return Promise.all(u.map(m=>Promise.resolve(m).then(h=>({status:"fulfilled",value:h}),h=>({status:"rejected",reason:h}))))};const p=document.getElementsByTagName("link"),i=document.querySelector("meta[property=csp-nonce]"),b=(i==null?void 0:i.nonce)||(i==null?void 0:i.getAttribute("nonce"));a=c(o.map(u=>{if(u=z(u,s),u in j)return;j[u]=!0;const m=u.endsWith(".css"),h=m?'[rel="stylesheet"]':"";if(!!s)for(let k=p.length-1;k>=0;k--){const v=p[k];if(v.href===u&&(!m||v.rel==="stylesheet"))return}else if(document.querySelector(`link[href="${u}"]${h}`))return;const g=document.createElement("link");if(g.rel=m?"stylesheet":W,m||(g.as="script"),g.crossOrigin="",g.href=u,b&&g.setAttribute("nonce",b),document.head.appendChild(g),m)return new Promise((k,v)=>{g.addEventListener("load",k),g.addEventListener("error",()=>v(new Error(`Unable to preload CSS for ${u}`)))})}))}function l(c){const p=new Event("vite:preloadError",{cancelable:!0});if(p.payload=c,window.dispatchEvent(p),!p.defaultPrevented)throw c}return a.then(c=>{for(const p of c||[])p.status==="rejected"&&l(p.reason);return t().catch(l)})};/**
 * @license lucide v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const P=(e,t,o=[])=>{const s=document.createElementNS("http://www.w3.org/2000/svg",e);return Object.keys(t).forEach(a=>{s.setAttribute(a,String(t[a]))}),o.length&&o.forEach(a=>{const l=P(...a);s.appendChild(l)}),s};var V=([e,t,o])=>P(e,t,o);/**
 * @license lucide v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const K=e=>Array.from(e.attributes).reduce((t,o)=>(t[o.name]=o.value,t),{}),J=e=>typeof e=="string"?e:!e||!e.class?"":e.class&&typeof e.class=="string"?e.class.split(" "):e.class&&Array.isArray(e.class)?e.class:"",G=e=>e.flatMap(J).map(o=>o.trim()).filter(Boolean).filter((o,s,a)=>a.indexOf(o)===s).join(" "),X=e=>e.replace(/(\w)(\w*)(_|-|\s*)/g,(t,o,s)=>o.toUpperCase()+s.toLowerCase()),T=(e,{nameAttr:t,icons:o,attrs:s})=>{var g;const a=e.getAttribute(t);if(a==null)return;const l=X(a),c=o[l];if(!c)return console.warn(`${e.outerHTML} icon name was not found in the provided icons object.`);const p=K(e),[i,b,u]=c,m={...b,"data-lucide":a,...s,...p},h=G(["lucide",`lucide-${a}`,p,s]);h&&Object.assign(m,{class:h});const w=V([i,m,u]);return(g=e.parentNode)==null?void 0:g.replaceChild(w,e)};/**
 * @license lucide v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const d={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":2,"stroke-linecap":"round","stroke-linejoin":"round"};/**
 * @license lucide v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Q=["svg",d,[["path",{d:"m12 19-7-7 7-7"}],["path",{d:"M19 12H5"}]]];/**
 * @license lucide v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Z=["svg",d,[["path",{d:"M5 12h14"}],["path",{d:"m12 5 7 7-7 7"}]]];/**
 * @license lucide v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ee=["svg",d,[["path",{d:"M7 7h10v10"}],["path",{d:"M7 17 17 7"}]]];/**
 * @license lucide v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const te=["svg",d,[["path",{d:"M12 7v14"}],["path",{d:"M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"}]]];/**
 * @license lucide v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ae=["svg",d,[["path",{d:"M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"}],["circle",{cx:"12",cy:"13",r:"3"}]]];/**
 * @license lucide v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const oe=["svg",d,[["path",{d:"M10 2v2"}],["path",{d:"M14 2v2"}],["path",{d:"M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1"}],["path",{d:"M6 2v2"}]]];/**
 * @license lucide v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const se=["svg",d,[["path",{d:"M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.66-2 8.68V16a2 2 0 1 1-4 0Z"}],["path",{d:"M20 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C14.63 6 14 7.8 14 9.5c0 3.11 2 5.66 2 8.68V20a2 2 0 1 0 4 0Z"}],["path",{d:"M16 17h4"}],["path",{d:"M4 13h4"}]]];/**
 * @license lucide v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ne=["svg",d,[["circle",{cx:"12",cy:"12",r:"10"}],["path",{d:"M12 16v-4"}],["path",{d:"M12 8h.01"}]]];/**
 * @license lucide v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const re=["svg",d,[["line",{x1:"3",x2:"21",y1:"22",y2:"22"}],["line",{x1:"6",x2:"6",y1:"18",y2:"11"}],["line",{x1:"10",x2:"10",y1:"18",y2:"11"}],["line",{x1:"14",x2:"14",y1:"18",y2:"11"}],["line",{x1:"18",x2:"18",y1:"18",y2:"11"}],["polygon",{points:"12 2 20 7 4 7"}]]];/**
 * @license lucide v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ie=["svg",d,[["path",{d:"M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"}],["circle",{cx:"12",cy:"10",r:"3"}]]];/**
 * @license lucide v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const le=["svg",d,[["path",{d:"M8 3H5a2 2 0 0 0-2 2v3"}],["path",{d:"M21 8V5a2 2 0 0 0-2-2h-3"}],["path",{d:"M3 16v3a2 2 0 0 0 2 2h3"}],["path",{d:"M16 21h3a2 2 0 0 0 2-2v-3"}]]];/**
 * @license lucide v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ce=["svg",d,[["path",{d:"M5 12h14"}]]];/**
 * @license lucide v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const de=["svg",d,[["rect",{x:"5",y:"2",width:"14",height:"20",rx:"7"}],["path",{d:"M12 6v4"}]]];/**
 * @license lucide v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const pe=["svg",d,[["path",{d:"M13 5H19V11"}],["path",{d:"M19 5L5 19"}]]];/**
 * @license lucide v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ue=["svg",d,[["polygon",{points:"3 11 22 2 13 21 11 13 3 11"}]]];/**
 * @license lucide v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const he=["svg",d,[["circle",{cx:"13.5",cy:"6.5",r:".5",fill:"currentColor"}],["circle",{cx:"17.5",cy:"10.5",r:".5",fill:"currentColor"}],["circle",{cx:"8.5",cy:"7.5",r:".5",fill:"currentColor"}],["circle",{cx:"6.5",cy:"12.5",r:".5",fill:"currentColor"}],["path",{d:"M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"}]]];/**
 * @license lucide v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const me=["svg",d,[["path",{d:"M5 12h14"}],["path",{d:"M12 5v14"}]]];/**
 * @license lucide v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ge=["svg",d,[["path",{d:"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"}],["path",{d:"M3 3v5h5"}]]];/**
 * @license lucide v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const fe=["svg",d,[["circle",{cx:"6",cy:"19",r:"3"}],["path",{d:"M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"}],["circle",{cx:"18",cy:"5",r:"3"}]]];/**
 * @license lucide v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const be=["svg",d,[["path",{d:"M18 6 6 18"}],["path",{d:"m6 6 12 12"}]]];/**
 * @license lucide v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ve=({icons:e={},nameAttr:t="data-lucide",attrs:o={}}={})=>{if(!Object.values(e).length)throw new Error(`Please provide an icons object.
If you want to use all the icons you can import it like:
 \`import { createIcons, icons } from 'lucide';
lucide.createIcons({icons});\``);if(typeof document>"u")throw new Error("`createIcons()` only works in a browser environment.");const s=document.querySelectorAll(`[${t}]`);if(Array.from(s).forEach(a=>T(a,{nameAttr:t,icons:e,attrs:o})),t==="data-lucide"){const a=document.querySelectorAll("[icon-name]");a.length>0&&(console.warn("[Lucide] Some icons were found with the now deprecated icon-name attribute. These will still be replaced for backwards compatibility, but will no longer be supported in v1.0 and you should switch to data-lucide"),Array.from(a).forEach(l=>T(l,{nameAttr:"icon-name",icons:e,attrs:o})))}},ye=[{id:"bookshop",number:"01",name:"多抓鱼循环商店",short:"多抓鱼",english:"DÉJÀ VU RECYCLE STORE",category:"旧书与日常",icon:"book-open",address:"安福路 300 号",position:[86,17,-532],lead:"好东西，值得再遇见。",description:"在安福路，把脚步留给一本旧书。多抓鱼让读过的书、穿过的衣服，和下一个喜欢它们的人相遇。",content:'<div class="editorial-quote">旧书，也有<br>下一段旅程。<span>A SECOND CHAPTER</span></div><p>这栋三层建筑曾是上海电影发行放映公司的办公场所。2020 年，OFFHAND PRACTICE 将它改造成循环商店，让旧空间也拥有了新的日常。</p><div class="small-heading">走到这里，可以做什么</div><ul class="reading-list"><li>慢慢翻书，让偶遇代替搜索。</li><li>看看窗边的自然光，以及天然石材拼成的马赛克细节。</li><li>出门后向西，转入武康路，继续这段散步。</li></ul><p class="detail-note">商店介绍依据建筑项目资料整理；营业信息以店方最新公告为准。</p>',source:"https://offhandpractice.com/Deja-Vu-Recycle-Store-Shanghai",sourceLabel:"阅读建筑设计资料",next:"mansion"},{id:"mansion",number:"02",name:"武康大楼",short:"武康大楼",english:"WUKANG MANSION",category:"建筑与往事",icon:"landmark",address:"淮海中路 1836—1858 号",position:[-136,43,474],lead:"一栋楼，停泊了一百年。",description:"沿着武康路走到尽头，红砖立面在街角收成一道弧线。抬头看，拱廊、阳台与窗框，把时间留在了建筑上。",content:'<figure class="detail-photo"><img src="./assets/wukang-mansion.jpg" alt="武康大楼红砖立面、弧形阳台与底层拱廊" width="960" height="1200"><figcaption>武康大楼 · 建筑师 邬达克<br>摄影 Supanut Arunoprayote / CC BY 4.0</figcaption></figure><div class="small-heading">街角的时间线</div><ol class="timeline"><li><strong>1924</strong><div><h3>诺曼底公寓落成</h3><p>由建筑师邬达克设计，八层、约 30 米高。地块的形状，成就了这道独特的楔形轮廓。</p></div></li><li><strong>1953</strong><div><h3>有了今天的名字</h3><p>诺曼底公寓更名为武康大楼，和身旁的武康路，共同成为上海的城市记忆。</p></div></li><li><strong>今天</strong><div><h3>日常仍在继续</h3><p>它是一处历史建筑，也是一栋住宅。最动人的风景，是百年建筑里延续至今的生活。</p></div></li></ol>',source:"https://en.wikipedia.org/wiki/Wukang_Mansion",sourceLabel:"查看历史资料",next:"photo"},{id:"photo",number:"03",name:"对街取景点",short:"对街取景点",english:"THE POSTCARD VIEW",category:"留下这一刻",icon:"camera",address:"武康大楼对面人行道 · 位置示意",position:[-172,4,551],lead:"把这个街角，带回去。",description:"走到大楼对面，朝着楔形街角望过去。两侧立面在画面里展开，这是属于武康大楼的经典角度。",content:'<figure class="detail-photo photo-tall"><img src="./assets/wukang-mansion.jpg" alt="从对街望向武康大楼的经典街角构图参考" width="960" height="1200"><figcaption>构图参考 · 摄影 Supanut Arunoprayote / CC BY 4.0</figcaption></figure><div class="small-heading">给这一张照片的小建议</div><ul class="reading-list"><li>试试竖构图，从底层拱廊一直收进屋顶。</li><li>把楔形街角放在画面偏中间的位置，让两侧立面自然延伸。</li><li>留一点天空和街道，让建筑有呼吸的空间。</li></ul><p class="detail-note">橙色扇形表示取景方向。站位与镜头高度为示意，现场请以实际人行道位置为准。</p>',source:"https://commons.wikimedia.org/wiki/File:Wukang_Mansion_20251128.jpg",sourceLabel:"查看原图与摄影署名",next:null}],F=(e,t,o,s,a)=>`<figure class="detail-photo"><img src="./assets/${e}" alt="${t}" loading="lazy"><figcaption>资料照片 · ${o} / <a href="${a}" target="_blank" rel="noopener">${s}</a><br>展示时缩放、裁切与降饱和度；非实时街景。</figcaption></figure>`,M='<p class="detail-note">建筑高度、背面与细节为风格化推定。地标落位为近似示意，现场请按门牌寻找。</p>',we=[{id:"courtyard",name:"武康庭",short:"武康庭",english:"FERGUSON LANE",category:"庭院与咖啡 · 20–30 分钟",icon:"landmark",address:"武康路 374—376 号",lead:"在院子里，慢一拍。",description:"从武康大楼向北走，先把时间留给武康庭。红砖、窗台和庭院，把街边的热闹收进一段安静的日常。",content:'<div class="editorial-quote">街道之外，<br>还有一座小庭院。<span>A PAUSE IN THE COURTYARD</span></div><ul class="reading-list"><li>从武康路入口进入，看看老建筑与当下小店的相处方式。</li><li>给一杯咖啡留出时间，再回到武康路向北。</li></ul>'+M,source:"https://baike.baidu.com/item/武康庭",sourceLabel:"查看武康庭资料"},{id:"bajin",name:"巴金故居",short:"巴金故居",english:"THE HOME OF BA JIN",category:"文学与生活 · 30–40 分钟",icon:"book-open",address:"武康路 113 号",lead:"在书页之外，遇见作家。",description:"这栋花园住宅建于 1923 年。1955 年起，巴金在这里生活；2011 年，故居向公众开放。房间、书籍与手稿，把文学重新带回日常。",content:F("ba-jin-house.jpg","从花园看巴金故居的灰墙、绿色门窗与山墙","Jpbowen","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0/")+'<div class="small-heading">走到这里，可以留意</div><ul class="reading-list"><li>绿色窗框、山墙和花园，是观察这栋住宅的起点。</li><li>如遇开放，可按现场参观安排慢慢阅读展陈。</li></ul><p class="detail-note">入内前请核实故居最新开放与预约公告；本路书不提供实时开馆状态。照片的展示改编同样采用 CC BY-SA 4.0。</p>'+M,source:"https://en.wikipedia.org/wiki/Former_Residence_of_Ba_Jin",sourceLabel:"查看故居历史资料"},{id:"romeo",name:"罗密欧阳台",short:"罗密欧阳台",english:"ROMEO’S BALCONY",category:"街角建筑 · 10–15 分钟",icon:"landmark",address:"武康路 210 号",lead:"抬头，就有一点浪漫。",description:"武康路 210 号的弧形阳台，被人们昵称为“罗密欧阳台”。浅色墙面、红色线脚与圆弧轮廓，是这处街边小建筑的记忆点。",content:F("romeo-balcony.jpg","武康路210号的弧形墙面与门牌","Shypanda","CC BY 3.0","https://creativecommons.org/licenses/by/3.0/")+'<p>这个名字是一种浪漫的联想，并非莎士比亚故事的发生地。试着从人行道仰望，让梧桐枝叶成为画面的前景。</p><p class="detail-note">这里是住宅建筑，以外观欣赏为主。</p>'+M,source:"https://en.wikipedia.org/wiki/Wukang_Road#Former_residences",sourceLabel:"查看地址与建筑资料"},{id:"rac",name:"RAC Bar",short:"RAC Bar",english:"CRÊPES, COFFEE & A PAUSE",category:"咖啡与可丽饼 · 40–60 分钟",icon:"coffee",address:"安福路 322 号 6 幢一楼",lead:"把散步，暂时交给一杯咖啡。",description:"走到武康路与安福路交会处，转入 322 号院内寻找 RAC Bar。院子、咖啡与可丽饼，让午后多了一个坐下来的理由。",content:'<div class="editorial-quote">不赶路，<br>也算行程的一部分。<span>TAKE YOUR TIME</span></div><ul class="reading-list"><li>这是院内的 RAC Bar，与临街 RAC Coffee 点位有所区别。</li><li>可把这里作为用餐停留，排队时间另外预留。</li><li>回到安福路后向东，依次到 308 号与 300 号。</li></ul>'+M,source:"https://www.baidu.com/link?url=Rm0xNhR4KWJXe65tMnmlpUWGDWv95weVmzFTD3WKysj09EFn3HMHhJ1jYipbMD9ENW59Q0UK3iSxJwE5vf01l_",sourceLabel:"上海徐汇 · 餐厅与地址资料"},{id:"wiggle",name:"wiggle wiggle",short:"wiggle wiggle",english:"A LITTLE COLOUR ON ANFU",category:"色彩与小物 · 20–30 分钟",icon:"palette",address:"安福路 308 号",lead:"给今天，加一点颜色。",description:"韩国生活方式品牌 wiggle wiggle 在安福路开设了四层空间。鲜明的配色、花朵与日常小物，让这段梧桐街区忽然变得活泼。",content:'<div class="editorial-quote">小小的东西，<br>也能让人开心。<span>COLOUR YOUR AFTERNOON</span></div><ul class="reading-list"><li>挑一件喜欢的小物，或留下一张色彩鲜明的照片。</li><li>四层空间的信息来自 2024 年开店报道；陈列与营业情况以店方最新公告为准。</li><li>离开后沿安福路向东，到多抓鱼翻一本书。</li></ul>'+M,source:"https://www.baidu.com/link?url=X6-icdu6oMd8S_gTa88dKxbgXj5zFEi4huQPAPa0aqRcpFUlfrBznAobrHMyFxoA9mifRcazm5F-4QFvX1f30jDS_SrsoD0VChxY8Ys2HhC",sourceLabel:"新民晚报 · 开店报道"},{id:"finish",name:"在淮海中路收尾",short:"淮海中路",english:"THE WALK CONTINUES",category:"街区日常 · 行程收尾",icon:"map-pin",address:"淮海中路 × 乌鲁木齐中路",lead:"散步结束，上海还在继续。",description:"沿安福路向东，在乌鲁木齐中路转向南。让沿途的小店与街区日常，陪你走到淮海中路，为这个下午画一个轻轻的句号。",content:'<div class="small-heading">接下来，怎么走</div><ul class="reading-list"><li>本路线在淮海中路与乌鲁木齐中路交会处结束。</li><li>可按当天目的地选择附近地铁；往东北方向继续可到常熟路站（1／7 号线）。</li><li>2–3 公里为含短距离院内绕行的估计，3–4 小时包含参观、逛店与用餐。</li></ul><p class="detail-note">红线沿公开路网中心线绘制，不是实时人行导航。院内支路与具体过街位置以现场为准。</p>',source:"https://www.exploreshanghai.com/metro/pedia/station/changshu-road/",sourceLabel:"查看常熟路站交通信息"}],O=Object.fromEntries([...ye,...we].map(e=>[e.id,e]));O.mansion.description="从武康路南端开始，红砖立面在街角收成一道弧线。抬头看，拱廊、阳台与窗框，把时间留在了建筑上。";O.bookshop.content=O.bookshop.content.replace("出门后向西，转入武康路，继续这段散步。","出门后沿安福路向东，在乌鲁木齐中路转向南，走到淮海中路收尾。");const _=["mansion","photo","courtyard","bajin","romeo","rac","wiggle","bookshop","finish"],f=_.map((e,t)=>({...O[e],number:String(t+1).padStart(2,"0"),next:_[t+1]||null,previous:_[t-1]||null})),I='<div class="arrival-entry"><strong>从武康大楼出发</strong><span class="metro-lines">10 / 11 号线 · 交通大学站 7 号口</span><p>出站后经华山路、淮海中路步行到大楼，预留约 5–10 分钟。</p><a href="https://www.exploreshanghai.com/metro/pedia/station/jiaotong-university/" target="_blank" rel="noopener">查看站口资料 ↗</a></div><div class="arrival-entry"><strong>从安福路一侧到达</strong><span class="metro-lines">1 / 7 号线 · 常熟路站 8 号口</span><p>到安福路东端约 5–10 分钟；继续到西段的多抓鱼、wiggle wiggle 和 RAC 一带，建议总共预留约 15–20 分钟。</p><a href="https://www.exploreshanghai.com/metro/pedia/station/changshu-road/" target="_blank" rel="noopener">查看站口资料 ↗</a></div><p class="detail-note">出口位置依据 ExploreShanghai；步行时间为编辑估计，包含步速与等灯差异。本页默认从武康大楼向北出发。</p>',ke={ArrowUpRight:ee,ArrowLeft:Q,ArrowRight:Z,BookOpen:te,Camera:ae,Landmark:re,Plus:me,Minus:ce,MoveUpRight:pe,Maximize:le,X:be,Info:ne,Footprints:se,RotateCcw:ge,Mouse:de,Navigation:ue,MapPin:ie,Route:fe,Coffee:oe,Palette:he},r=e=>`<i data-lucide="${e}" aria-hidden="true"></i>`,D=()=>ve({icons:ke,attrs:{"stroke-width":1.6}});let n,$=null;const H=new URLSearchParams(location.search).get("gray")==="1",Se=document.querySelector("#app");Se.innerHTML=`
  <header class="site-header">
    <a class="brand" href="./" aria-label="上海路书首页"><span class="brand-symbol">${r("route")}</span><span>上海路书<small>SHANGHAI, ON FOOT.</small></span></a>
    <div class="edition"><span class="edition-dot"></span> 城市漫游计划 <span class="edition-divider">/</span> VOL. 001</div>
    <button class="about-button" id="about">关于这份路书 ${r("arrow-up-right")}</button>
  </header>
  <main class="experience">
    <section class="map-stage" aria-label="交互式三维街区">
      <div id="map"></div>
      <div id="map-status" class="map-status" role="status"><span class="loading-dot"></span> 正在展开这片街区…</div>
      <div class="scene-caption"><span class="scene-dot"></span><span>真实路网 · 微缩上海</span><small>3D STREETSCAPE</small></div>
      <svg class="marker-leaders" aria-hidden="true">${f.map(e=>`<line data-leader="${e.id}"/>`).join("")}</svg>
      <div id="markers" class="markers">${f.map(e=>`<button class="map-marker marker-${e.id}" data-stop="${e.id}" aria-label="在地图上探索${e.name}"><span class="marker-badge">${e.id==="photo"?r("camera"):e.number}</span><span class="marker-label">${e.short}</span></button>`).join("")}</div>
      <div id="street-labels" class="street-labels" aria-hidden="true"><span data-position="185,1,-450">安 福 路<small>ANFU RD.</small></span><span data-position="108,1,-48">武 康 路<small>WUKANG RD.</small></span><span data-position="-29,1,547">淮 海 中 路<small>HUAIHAI MIDDLE RD.</small></span></div>
      <button class="postcard" id="postcard" data-stop="mansion" aria-label="探索武康大楼的历史"><span class="postcard-tape"></span><img src="./assets/wukang-mansion.jpg" alt="武康大楼的红砖街角" width="960" height="1200"><span class="postcard-caption">街角，已有百年。 ${r("arrow-up-right")}</span><span class="postcard-date">WUKANG MANSION · 1924</span></button>
      <div class="map-tools" role="group" aria-label="地图控制"><button class="compass" id="north" aria-label="朝北查看" title="朝北查看"><span>N</span>${r("navigation")}</button><div class="zoom-tools"><button id="zoom-in" aria-label="放大地图" title="放大">${r("plus")}</button><button id="zoom-out" aria-label="缩小地图" title="缩小">${r("minus")}</button></div><button id="reset" aria-label="回到路线全景" title="回到全景">${r("maximize")}</button></div>
      <div class="map-hint">${r("mouse")}<span class="desktop-hint">拖动旋转 <b>·</b> 滚轮缩放 <b>·</b> 点击建筑探索</span><span class="mobile-hint">单指旋转 · 双指缩放 · 点击探索</span></div>
      <div class="map-scale"><span></span><small>风格化建筑示意</small></div>
    </section>
    <aside class="story-panel" aria-label="散步路线与地点介绍">
      <section id="overview" class="overview">
        <p class="eyebrow">A WALK UNDER THE PLANE TREES</p>
        <h1>走进<br>梧桐深处<span class="title-dot">。</span></h1>
        <div class="route-name">武康路 <span>⟶</span> 安福路</div>
        <p class="intro-copy">从百年街角，到一本旧书。<br>绕过梧桐与小店，在淮海中路收尾。</p>
        <div class="route-facts"><div><strong id="distance">约 2.2</strong><span>公里主线</span></div><div><strong>${f.length}</strong><span>个停靠点</span></div><div><strong>3—4</strong><span>小时慢逛</span></div></div>
        <button class="start-button" id="start">${r("footprints")} 从武康大楼出发 ${r("arrow-up-right")}</button>
        <details class="arrival-guide"><summary>${r("navigation")} 怎么到达 · 地铁与步行 ${r("plus")}</summary>${I}</details>
        <div class="route-list-heading"><span>沿途，值得停一停</span><small>THE ITINERARY</small></div>
        <nav class="stop-list" aria-label="沿途地点">${f.map(e=>`<button class="stop-button" data-stop="${e.id}"><span class="stop-number">${e.number}</span><span class="stop-copy"><strong>${e.id==="photo"?"对街，拍一张武康大楼":e.name}</strong><small>${e.category}</small></span>${r(e.icon)}</button>`).join("")}</nav>
        <p class="start-note">含庭院绕行约 2–3 公里 · 按地理顺序慢逛</p>
      </section>
      <section id="detail" class="detail" hidden aria-label="地点详情"></section>
    </aside>
  </main>
  <footer class="site-footer"><span class="footer-note">用脚步，收藏一座城。</span><span class="footer-location">SHANGHAI <b>31° N / 121° E</b></span><div class="map-attribution"><a href="https://openfreemap.org/" target="_blank" rel="noopener">OpenFreeMap</a> · <a href="https://openmaptiles.org/" target="_blank" rel="noopener">© OpenMapTiles</a> · <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">© OpenStreetMap</a></div></footer>
  <div class="sr-only" id="announcement" aria-live="polite"></div>
  <dialog id="credits" aria-labelledby="credits-title"><div class="dialog-top"><span class="eyebrow">BEHIND THE WALK</span><button class="icon-button" id="close-credits" aria-label="关闭关于路书">${r("x")}</button></div><h2 id="credits-title">一条路，慢慢走。</h2><p>上海路书，把真实街道变成一片可以探索的立体街区。第一站，从安福路走到武康路。</p><h3>关于这片街区</h3><p>道路与建筑轮廓来自 OpenStreetMap，经 OpenFreeMap / OpenMapTiles 提供。武康大楼按约 30 米高度与公开照片细化，周边建筑高度、树木与立面为风格化推定。取景点与过街线路为示意。</p><p><a href="./data/streets.json" target="_blank" rel="noopener">查看本路线地理数据</a> · <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">ODbL 数据许可</a></p><h3>摄影与资料</h3><p>武康大楼摄影：<strong>Supanut Arunoprayote</strong>，2025-11-28。依据 <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a> 使用，展示时缩放与裁切。建筑师：邬达克。</p><ul class="source-list"><li><a href="https://commons.wikimedia.org/wiki/File:Wukang_Mansion_20251128.jpg" target="_blank" rel="noopener">Wikimedia Commons · 原图及作者 ${r("arrow-up-right")}</a></li><li><a href="https://en.wikipedia.org/wiki/Wukang_Mansion" target="_blank" rel="noopener">武康大楼 · 历史资料 ${r("arrow-up-right")}</a></li><li><a href="https://offhandpractice.com/Deja-Vu-Recycle-Store-Shanghai" target="_blank" rel="noopener">多抓鱼 · OFFHAND PRACTICE 项目资料 ${r("arrow-up-right")}</a></li></ul><p class="detail-note">这是一份城市探索原型。建议停留时间为编辑建议；实际步行与店铺营业信息以现场为准。</p></dialog>
`;const B=document.querySelector("#overview"),R=document.querySelector("#detail"),U=document.querySelector(".story-panel");function x(e){var o;const t=f.find(s=>s.id===e);t&&($=e,B.hidden=!0,R.hidden=!1,document.body.dataset.selected=e,document.querySelector(".scene-caption > span:nth-child(2)").textContent=e==="finish"?"淮海中路 · 行程收尾":"聚焦地标 · 周边建筑淡显",R.innerHTML=`<div class="detail-top"><button class="text-button" id="back-overview">${r("arrow-left")} 路线总览</button><span class="stop-counter">${t.number} <span>/ ${String(f.length).padStart(2,"0")}</span></span></div><div class="detail-scroll"><p class="eyebrow">${t.english}</p><h2 tabindex="-1">${t.name}</h2><p class="address">${r("map-pin")}${t.address}</p>${e==="mansion"?'<div class="building-facts"><span><strong>1924</strong>建成</span><span><strong>邬达克</strong>建筑师</span><span><strong>诺曼底公寓</strong>原名</span></div>':""}<h3 class="detail-lead">${t.lead}</h3><p>${t.description}</p>${t.content}<a class="source-link" href="${t.source}" target="_blank" rel="noopener">${t.sourceLabel} ${r("arrow-up-right")}</a></div><div class="detail-bottom">${t.previous?`<button class="icon-button" id="previous-stop" aria-label="上一站：${f.find(s=>s.id===t.previous).short}">${r("arrow-left")}</button>`:""}<button class="start-button" id="next-stop">${t.next?`<span>下一站 <b>${f.find(s=>s.id===t.next).short}</b></span>${r("arrow-right")}`:`<span>回到路线总览</span>${r("rotate-ccw")}`}</button></div>`,document.querySelector("#back-overview").addEventListener("click",N),document.querySelector("#next-stop").addEventListener("click",()=>t.next?x(t.next):N()),(o=document.querySelector("#previous-stop"))==null||o.addEventListener("click",()=>x(t.previous)),document.querySelector("#announcement").textContent=`第 ${Number(t.number)} 站，${t.name}`,document.querySelectorAll("[data-stop]").forEach(s=>s.setAttribute("aria-pressed",String(s.dataset.stop===e))),U.scrollTop=0,D(),n==null||n.focus(e),R.querySelector("h2").focus({preventScroll:!0}))}function N(){$=null,B.hidden=!1,R.hidden=!0,delete document.body.dataset.selected,document.querySelector(".scene-caption > span:nth-child(2)").textContent="真实路网 · 微缩上海",document.querySelectorAll("[data-stop]").forEach(e=>e.setAttribute("aria-pressed","false")),U.scrollTop=0,n==null||n.overview(),document.querySelector("#announcement").textContent="已回到路线总览",document.querySelector("#start").focus({preventScroll:!0})}document.querySelectorAll("[data-stop]").forEach(e=>e.addEventListener("click",()=>x(e.dataset.stop)));document.querySelector("#start").addEventListener("click",()=>x(f[0].id));document.querySelector("#reset").addEventListener("click",N);document.querySelector("#zoom-in").addEventListener("click",()=>n==null?void 0:n.zoom(.8));document.querySelector("#zoom-out").addEventListener("click",()=>n==null?void 0:n.zoom(1.25));document.querySelector("#north").addEventListener("click",()=>n==null?void 0:n.north());const A=document.querySelector("#credits");A.querySelector("h2 + p").textContent="上海路书，把真实街道变成一片可以探索的立体街区。从武康大楼出发，经过武康路与安福路，在淮海中路收尾。";A.querySelector("h3 + p").textContent="道路与建筑轮廓来自 OpenStreetMap，经 OpenFreeMap / OpenMapTiles 提供。七处地标按资料进行风格化建模；新增地标落位、商店分界、高度、背面与庭院陈设为近似示意。红线为路网中心线，不含院内步行支路；主线约 2.2 公里，含逛店与院内绕行约 2–3 公里。";A.insertAdjacentHTML("beforeend",'<h3>建筑实物参照</h3><p>本轮对照实物照片修正屋顶、窗型、阳台铁艺和商店入口。砖石、瓦片与橱窗色彩图案为程序化绘制；图案不是店铺当前陈列的复刻。高度、背面、庭院布局和部分地块仍为推定。</p><ul class="source-list"><li><a href="https://commons.wikimedia.org/wiki/File:20260209_210_Wukang_Road.jpg" target="_blank" rel="noopener">武康路210号 · Windmemories / CC BY-SA 4.0 ↗</a></li><li><a href="https://commons.wikimedia.org/wiki/File:武康路376号住宅.jpg" target="_blank" rel="noopener">武康路376号 · 建筑外观参考 ↗</a></li><li><a href="https://offhandpractice.com/Deja-Vu-Recycle-Store-Shanghai" target="_blank" rel="noopener">多抓鱼入口与材料 · OFFHAND PRACTICE ↗</a></li></ul>');A.insertAdjacentHTML("beforeend",`<h3>新增影像与资料</h3><p>武康路 210 号：Shypanda，<a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noopener">CC BY 3.0</a>。巴金故居：Jpbowen，<a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener">CC BY-SA 4.0</a>。两图均缩放、裁切与降饱和度；巴金照片展示改编以同一许可提供。</p><ul class="source-list"><li><a href="https://commons.wikimedia.org/wiki/File:WukangRd_sh.JPG" target="_blank" rel="noopener">武康路 210 号 · 原图与署名 ↗</a></li><li><a href="https://commons.wikimedia.org/wiki/File:Ba_Jin_house,_Shanghai.JPG" target="_blank" rel="noopener">巴金故居 · 原图与署名 ↗</a></li>${f.filter(e=>["courtyard","bajin","rac","wiggle"].includes(e.id)).map(e=>`<li><a href="${e.source}" target="_blank" rel="noopener">${e.name} · 资料 ↗</a></li>`).join("")}</ul><h3>交通参考</h3>${I}`);document.querySelector("#about").addEventListener("click",()=>A.showModal());document.querySelector("#close-credits").addEventListener("click",()=>A.close());A.addEventListener("click",e=>{const t=A.getBoundingClientRect();(e.clientX<t.left||e.clientX>t.right||e.clientY<t.top||e.clientY>t.bottom)&&A.close()});D();document.querySelectorAll(".map-tools button").forEach(e=>{e.disabled=!0});async function Ae(){try{const[e,{WalkScene:t}]=await Promise.all([fetch("./data/streets.json"),Y(()=>import("./scene-DRav-qBV.js"),[],import.meta.url)]);if(!e.ok)throw new Error("Map data is unavailable");const o=await e.json();n=new t(document.querySelector("#map"),o,{gray:H,onSelect:x}),document.querySelector("#map-status").hidden=!0,document.querySelectorAll(".map-tools button").forEach(c=>{c.disabled=!1}),document.querySelector("#distance").textContent=`约 ${(o.routeLength/1e3).toFixed(1)}`,H&&document.body.classList.add("gray-mode"),$&&n.focus($,!1);const s=[...document.querySelectorAll(".map-marker")],a=[...document.querySelectorAll("[data-position]")],l=document.querySelector(".compass svg");n.onFrame=()=>{const c=[];s.forEach((i,b)=>{const u=n.project(n.anchorFor(f[b].id));i.hidden=!u.visible||!!$&&$!==f[b].id;const m=document.querySelector(`[data-leader="${f[b].id}"]`);if(m.style.display=i.hidden?"none":"",i.hidden)return;const h=i.offsetWidth/2,w=i.offsetHeight,g=n.container.clientWidth,k=n.container.clientHeight-40;let v=Math.max(h+14,Math.min(g-h-60,u.x)),E=Math.max(w+58,Math.min(k,u.y));const q=(C,S)=>!c.some(y=>C+h+5>y.left&&C-h-5<y.right&&S>y.top-6&&S-w<y.bottom+6);if(!$&&!q(v,E)){let C=!1;for(let S=1;S<12&&!C;S++)for(const y of[-1,1]){const L=E+y*S*(w+7);if(L>=w+58&&L<=k&&q(v,L)){E=L,C=!0;break}}if(!C)for(const S of[h+14,g-h-60])for(let y=w+58;y<=k;y+=w+7){if(q(S,y)){v=S,E=y,C=!0;break}if(C)break}}c.push({left:v-h,right:v+h,top:E-w,bottom:E}),i.style.left=`${v}px`,i.style.top=`${E}px`,m.setAttribute("x1",u.x),m.setAttribute("y1",u.y),m.setAttribute("x2",v),m.setAttribute("y2",E-3)}),a.forEach(i=>{const b=n.project(i.dataset.position.split(",").map(Number));i.style.left=`${b.x}px`,i.style.top=`${b.y}px`,i.hidden=!b.visible||!!$}),l.style.transform=`rotate(${-n.controls.getAzimuthalAngle()*180/Math.PI-45}deg)`;const p=n.camera.position.distanceTo(n.controls.target);document.querySelector("#zoom-in").disabled=p<=n.controls.minDistance+.5,document.querySelector("#zoom-out").disabled=p>=n.controls.maxDistance-.5},n.onError=c=>{const p=document.querySelector("#map-status");p.hidden=!1,p.classList.add("map-error"),p.textContent=c,document.querySelectorAll(".map-tools button").forEach(i=>{i.disabled=!0}),document.querySelector("#markers").hidden=!0,document.querySelector(".marker-leaders").style.display="none"}}catch(e){const t=document.querySelector("#map-status");t.classList.add("map-error"),t.textContent="三维街区暂时无法加载。你仍可点击地点阅读路书，刷新页面可重试。",document.querySelector("#markers").hidden=!0,document.querySelector("#street-labels").hidden=!0,console.warn("3D view unavailable:",e.message)}}Ae();
