const originalPlaces = [
  {
    id: 'bookshop', number: '01', name: '多抓鱼循环商店', short: '多抓鱼', english: 'DÉJÀ VU RECYCLE STORE',
    category: '旧书与日常', icon: 'book-open', address: '安福路 300 号', position: [86, 17, -532],
    lead: '好东西，值得再遇见。',
    description: '在安福路，把脚步留给一本旧书。多抓鱼让读过的书、穿过的衣服，和下一个喜欢它们的人相遇。',
    content: `<div class="editorial-quote">旧书，也有<br>下一段旅程。<span>A SECOND CHAPTER</span></div><p>这栋三层建筑曾是上海电影发行放映公司的办公场所。2020 年，OFFHAND PRACTICE 将它改造成循环商店，让旧空间也拥有了新的日常。</p><div class="small-heading">走到这里，可以做什么</div><ul class="reading-list"><li>慢慢翻书，让偶遇代替搜索。</li><li>看看窗边的自然光，以及天然石材拼成的马赛克细节。</li><li>出门后向西，转入武康路，继续这段散步。</li></ul><p class="detail-note">商店介绍依据建筑项目资料整理；营业信息以店方最新公告为准。</p>`,
    source: 'https://offhandpractice.com/Deja-Vu-Recycle-Store-Shanghai', sourceLabel: '阅读建筑设计资料', next: 'mansion',
  },
  {
    id: 'mansion', number: '02', name: '武康大楼', short: '武康大楼', english: 'WUKANG MANSION',
    category: '建筑与往事', icon: 'landmark', address: '淮海中路 1836—1858 号', position: [-136, 43, 474],
    lead: '一栋楼，停泊了一百年。',
    description: '沿着武康路走到尽头，红砖立面在街角收成一道弧线。抬头看，拱廊、阳台与窗框，把时间留在了建筑上。',
    content: `<figure class="detail-photo"><img src="./assets/wukang-mansion.jpg" alt="武康大楼红砖立面、弧形阳台与底层拱廊" width="960" height="1200"><figcaption>武康大楼 · 建筑师 邬达克<br>摄影 Supanut Arunoprayote / CC BY 4.0</figcaption></figure><div class="small-heading">街角的时间线</div><ol class="timeline"><li><strong>1924</strong><div><h3>诺曼底公寓落成</h3><p>由建筑师邬达克设计，八层、约 30 米高。地块的形状，成就了这道独特的楔形轮廓。</p></div></li><li><strong>1953</strong><div><h3>有了今天的名字</h3><p>诺曼底公寓更名为武康大楼，和身旁的武康路，共同成为上海的城市记忆。</p></div></li><li><strong>今天</strong><div><h3>日常仍在继续</h3><p>它是一处历史建筑，也是一栋住宅。最动人的风景，是百年建筑里延续至今的生活。</p></div></li></ol>`,
    source: 'https://en.wikipedia.org/wiki/Wukang_Mansion', sourceLabel: '查看历史资料', next: 'photo',
  },
  {
    id: 'photo', number: '03', name: '对街取景点', short: '对街取景点', english: 'THE POSTCARD VIEW',
    category: '留下这一刻', icon: 'camera', address: '武康大楼对面人行道 · 位置示意', position: [-172, 4, 551],
    lead: '把这个街角，带回去。',
    description: '走到大楼对面，朝着楔形街角望过去。两侧立面在画面里展开，这是属于武康大楼的经典角度。',
    content: `<figure class="detail-photo photo-tall"><img src="./assets/wukang-mansion.jpg" alt="从对街望向武康大楼的经典街角构图参考" width="960" height="1200"><figcaption>构图参考 · 摄影 Supanut Arunoprayote / CC BY 4.0</figcaption></figure><div class="small-heading">给这一张照片的小建议</div><ul class="reading-list"><li>试试竖构图，从底层拱廊一直收进屋顶。</li><li>把楔形街角放在画面偏中间的位置，让两侧立面自然延伸。</li><li>留一点天空和街道，让建筑有呼吸的空间。</li></ul><p class="detail-note">橙色扇形表示取景方向。站位与镜头高度为示意，现场请以实际人行道位置为准。</p>`,
    source: 'https://commons.wikimedia.org/wiki/File:Wukang_Mansion_20251128.jpg', sourceLabel: '查看原图与摄影署名', next: null,
  },
];

const photo = (file,alt,author,license,url) => `<figure class="detail-photo"><img src="./assets/${file}" alt="${alt}" loading="lazy"><figcaption>资料照片 · ${author} / <a href="${url}" target="_blank" rel="noopener">${license}</a><br>展示时缩放、裁切与降饱和度；非实时街景。</figcaption></figure>`;
const note='<p class="detail-note">建筑高度、背面与细节为风格化推定。地标落位为近似示意，现场请按门牌寻找。</p>';
const added = [
 {id:'courtyard',name:'武康庭',short:'武康庭',english:'FERGUSON LANE',category:'庭院与咖啡 · 20–30 分钟',icon:'landmark',address:'武康路 374—376 号',lead:'在院子里，慢一拍。',description:'从武康大楼向北走，先把时间留给武康庭。红砖、窗台和庭院，把街边的热闹收进一段安静的日常。',content:'<div class="editorial-quote">街道之外，<br>还有一座小庭院。<span>A PAUSE IN THE COURTYARD</span></div><ul class="reading-list"><li>从武康路入口进入，看看老建筑与当下小店的相处方式。</li><li>给一杯咖啡留出时间，再回到武康路向北。</li></ul>'+note,source:'https://baike.baidu.com/item/武康庭',sourceLabel:'查看武康庭资料'},
 {id:'bajin',name:'巴金故居',short:'巴金故居',english:'THE HOME OF BA JIN',category:'文学与生活 · 30–40 分钟',icon:'book-open',address:'武康路 113 号',lead:'在书页之外，遇见作家。',description:'这栋花园住宅建于 1923 年。1955 年起，巴金在这里生活；2011 年，故居向公众开放。房间、书籍与手稿，把文学重新带回日常。',content:photo('ba-jin-house.jpg','从花园看巴金故居的灰墙、绿色门窗与山墙','Jpbowen','CC BY-SA 4.0','https://creativecommons.org/licenses/by-sa/4.0/')+'<div class="small-heading">走到这里，可以留意</div><ul class="reading-list"><li>绿色窗框、山墙和花园，是观察这栋住宅的起点。</li><li>如遇开放，可按现场参观安排慢慢阅读展陈。</li></ul><p class="detail-note">入内前请核实故居最新开放与预约公告；本路书不提供实时开馆状态。照片的展示改编同样采用 CC BY-SA 4.0。</p>'+note,source:'https://en.wikipedia.org/wiki/Former_Residence_of_Ba_Jin',sourceLabel:'查看故居历史资料'},
 {id:'romeo',name:'罗密欧阳台',short:'罗密欧阳台',english:'ROMEO’S BALCONY',category:'街角建筑 · 10–15 分钟',icon:'landmark',address:'武康路 210 号',lead:'抬头，就有一点浪漫。',description:'武康路 210 号的弧形阳台，被人们昵称为“罗密欧阳台”。浅色墙面、红色线脚与圆弧轮廓，是这处街边小建筑的记忆点。',content:photo('romeo-balcony.jpg','武康路210号的弧形墙面与门牌','Shypanda','CC BY 3.0','https://creativecommons.org/licenses/by/3.0/')+'<p>这个名字是一种浪漫的联想，并非莎士比亚故事的发生地。试着从人行道仰望，让梧桐枝叶成为画面的前景。</p><p class="detail-note">这里是住宅建筑，以外观欣赏为主。</p>'+note,source:'https://en.wikipedia.org/wiki/Wukang_Road#Former_residences',sourceLabel:'查看地址与建筑资料'},
 {id:'rac',name:'RAC Bar',short:'RAC Bar',english:'CRÊPES, COFFEE & A PAUSE',category:'咖啡与可丽饼 · 40–60 分钟',icon:'coffee',address:'安福路 322 号 6 幢一楼',lead:'把散步，暂时交给一杯咖啡。',description:'走到武康路与安福路交会处，转入 322 号院内寻找 RAC Bar。院子、咖啡与可丽饼，让午后多了一个坐下来的理由。',content:'<div class="editorial-quote">不赶路，<br>也算行程的一部分。<span>TAKE YOUR TIME</span></div><ul class="reading-list"><li>这是院内的 RAC Bar，与临街 RAC Coffee 点位有所区别。</li><li>可把这里作为用餐停留，排队时间另外预留。</li><li>回到安福路后向东，依次到 308 号与 300 号。</li></ul>'+note,source:'https://www.baidu.com/link?url=Rm0xNhR4KWJXe65tMnmlpUWGDWv95weVmzFTD3WKysj09EFn3HMHhJ1jYipbMD9ENW59Q0UK3iSxJwE5vf01l_',sourceLabel:'上海徐汇 · 餐厅与地址资料'},
 {id:'wiggle',name:'wiggle wiggle',short:'wiggle wiggle',english:'A LITTLE COLOUR ON ANFU',category:'色彩与小物 · 20–30 分钟',icon:'palette',address:'安福路 308 号',lead:'给今天，加一点颜色。',description:'韩国生活方式品牌 wiggle wiggle 在安福路开设了四层空间。鲜明的配色、花朵与日常小物，让这段梧桐街区忽然变得活泼。',content:'<div class="editorial-quote">小小的东西，<br>也能让人开心。<span>COLOUR YOUR AFTERNOON</span></div><ul class="reading-list"><li>挑一件喜欢的小物，或留下一张色彩鲜明的照片。</li><li>四层空间的信息来自 2024 年开店报道；陈列与营业情况以店方最新公告为准。</li><li>离开后沿安福路向东，到多抓鱼翻一本书。</li></ul>'+note,source:'https://www.baidu.com/link?url=X6-icdu6oMd8S_gTa88dKxbgXj5zFEi4huQPAPa0aqRcpFUlfrBznAobrHMyFxoA9mifRcazm5F-4QFvX1f30jDS_SrsoD0VChxY8Ys2HhC',sourceLabel:'新民晚报 · 开店报道'},
 {id:'finish',name:'在淮海中路收尾',short:'淮海中路',english:'THE WALK CONTINUES',category:'街区日常 · 行程收尾',icon:'map-pin',address:'淮海中路 × 乌鲁木齐中路',lead:'散步结束，上海还在继续。',description:'沿安福路向东，在乌鲁木齐中路转向南。让沿途的小店与街区日常，陪你走到淮海中路，为这个下午画一个轻轻的句号。',content:'<div class="small-heading">接下来，怎么走</div><ul class="reading-list"><li>本路线在淮海中路与乌鲁木齐中路交会处结束。</li><li>可按当天目的地选择附近地铁；往东北方向继续可到常熟路站（1／7 号线）。</li><li>2–3 公里为含短距离院内绕行的估计，3–4 小时包含参观、逛店与用餐。</li></ul><p class="detail-note">红线沿公开路网中心线绘制，不是实时人行导航。院内支路与具体过街位置以现场为准。</p>',source:'https://www.exploreshanghai.com/metro/pedia/station/changshu-road/',sourceLabel:'查看常熟路站交通信息'},
];
const byId=Object.fromEntries([...originalPlaces,...added].map(p=>[p.id,p]));
byId.mansion.description='从武康路南端开始，红砖立面在街角收成一道弧线。抬头看，拱廊、阳台与窗框，把时间留在了建筑上。';
byId.bookshop.content=byId.bookshop.content.replace('出门后向西，转入武康路，继续这段散步。','出门后沿安福路向东，在乌鲁木齐中路转向南，走到淮海中路收尾。');
const order=['mansion','photo','courtyard','bajin','romeo','rac','wiggle','bookshop','finish'];
export const places=order.map((id,i)=>({...byId[id],number:String(i+1).padStart(2,'0'),next:order[i+1]||null,previous:order[i-1]||null}));

export const arrivalGuide = `<div class="arrival-entry"><strong>从武康大楼出发</strong><span class="metro-lines">10 / 11 号线 · 交通大学站 7 号口</span><p>出站后经华山路、淮海中路步行到大楼，预留约 5–10 分钟。</p><a href="https://www.exploreshanghai.com/metro/pedia/station/jiaotong-university/" target="_blank" rel="noopener">查看站口资料 ↗</a></div><div class="arrival-entry"><strong>从安福路一侧到达</strong><span class="metro-lines">1 / 7 号线 · 常熟路站 8 号口</span><p>到安福路东端约 5–10 分钟；继续到西段的多抓鱼、wiggle wiggle 和 RAC 一带，建议总共预留约 15–20 分钟。</p><a href="https://www.exploreshanghai.com/metro/pedia/station/changshu-road/" target="_blank" rel="noopener">查看站口资料 ↗</a></div><p class="detail-note">出口位置依据 ExploreShanghai；步行时间为编辑估计，包含步速与等灯差异。本页默认从武康大楼向北出发。</p>`;
