// Reference-pixel landmarks, mapped uniformly to a 512×512 artboard.
// One closed outline includes the bill, pouch, tail, both legs and both feet.
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SCALE = 448 / (1934 - 246);
const path = commands => commands.map(([op, ...xy]) => op + xy.map((v, i) =>
  +(i % 2 ? 90 + (v - 484) * SCALE : 32 + (v - 246) * SCALE).toFixed(3)
).join(' ')).join('');

const crown = [
  ['M', 870, 484], ['C', 955, 484, 1032, 480, 1105, 512],
  ['C', 1209, 550, 1279, 634, 1302, 746],
];
const billEdge = [
  ['L', 1874, 746], ['C', 1953, 746, 1953, 858, 1874, 869],
  ['C', 1852, 901, 1844, 924, 1800, 925],
  ['C', 1747, 925, 1722, 926, 1680, 954],
  ['C', 1645, 978, 1630, 987, 1585, 987], ['L', 1450, 987],
  ['C', 1403, 987, 1389, 1006, 1365, 1030],
  ['C', 1349, 1048, 1337, 1052, 1316, 1051],
];
const rightBody = [
  ['C', 1316, 1221, 1202, 1398, 958, 1433],
];
const rightFoot = [
  ['L', 958, 1619], ['C', 958, 1623, 960, 1625, 965, 1625],
  ['L', 1048, 1625], ['C', 1069, 1625, 1083, 1641, 1083, 1663],
  ['L', 1083, 1698], ['C', 1083, 1721, 1070, 1731, 1047, 1731],
  ['L', 909, 1731], ['C', 891, 1731, 882, 1721, 882, 1703],
  ['L', 882, 1497],
];
const betweenFeet = [['C', 844, 1500, 801, 1500, 764, 1498]];
const leftFoot = [
  ['L', 764, 1619], ['C', 764, 1623, 766, 1625, 772, 1625],
  ['L', 797, 1625], ['C', 816, 1625, 827, 1638, 827, 1660],
  ['L', 827, 1701], ['C', 827, 1722, 817, 1731, 795, 1731],
  ['L', 608, 1731], ['C', 585, 1731, 574, 1722, 574, 1701],
  ['L', 574, 1662], ['C', 574, 1639, 588, 1625, 611, 1625],
  ['L', 685, 1625], ['C', 689, 1625, 691, 1623, 691, 1619],
  ['L', 691, 1440],
];
const tailAndHead = [
  ['C', 444, 1431, 274, 1298, 249, 1101],
  ['C', 246, 1076, 245, 1048, 248, 1025],
  ['C', 250, 1002, 263, 987, 282, 985],
  ['C', 311, 981, 320, 1009, 340, 1025],
  ['C', 365, 1046, 397, 1040, 416, 1020],
  ['C', 447, 989, 447, 935, 453, 846],
  ['C', 462, 661, 565, 530, 731, 494],
  ['C', 774, 485, 820, 484, 870, 484], ['Z'],
];
const outerD = path([...crown, ...billEdge, ...rightBody, ...rightFoot,
  ...betweenFeet, ...leftFoot, ...tailAndHead]);
const billD = path([['M', 1273, 746], ...billEdge,
  ['L', 1277, 1051], ['C', 1254, 1051, 1244, 1037, 1244, 1015],
  ['L', 1244, 782], ['C', 1244, 758, 1253, 746, 1273, 746], ['Z']]);
const legsD = path([['M', 882, 1440], ['L', 958, 1433], ...rightFoot, ['Z']]) +
  path([['M', 691, 1440], ['L', 764, 1442], ...leftFoot, ['Z']]);
const eyeD = path([['M', 711, 688], ['L', 808, 688],
  ['C', 822, 688, 828, 695, 828, 710], ['L', 828, 792],
  ['C', 828, 807, 823, 813, 808, 813], ['L', 709, 813],
  ['C', 695, 813, 690, 807, 690, 793], ['L', 690, 710],
  ['C', 690, 695, 696, 688, 711, 688], ['Z']]);
const highlightD = path([['M', 759, 746], ['L', 827, 746], ['L', 827, 792],
  ['C', 827, 807, 823, 812, 808, 812], ['L', 759, 812], ['Z']]);
const layers = [
  { id: 'silhouette', d: outerD, tone: 'birdBody' },
  { id: 'bill', d: billD, tone: 'birdMid' },
  { id: 'feet', d: legsD, tone: 'birdMid' },
  { id: 'eye', d: eyeD, tone: 'birdEye' },
  { id: 'eye-highlight', d: highlightD, tone: 'bg' },
];
const colors = { birdBody: '#C9C9C9', birdMid: '#9A9A9A', birdEye: '#2E2E2E', bg: '#F7F7F7' };
const art = layers.map(p => `<path id="${p.id}" fill="${colors[p.tone]}" d="${p.d}"/>`).join('\n');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-labelledby="title"><title id="title">参考鹈鹕：长嘴、圆身、翘尾与双脚</title>\n${art}\n</svg>`;
mkdirSync(join(ROOT, 'ref'), { recursive: true });
writeFileSync(join(ROOT, 'ref/bird.svg'), svg);
writeFileSync(join(ROOT, 'tools/bird-parts.json'), JSON.stringify({ layers }));
writeFileSync(join(ROOT, 'tools/bird-preview.svg'), svg);
console.log('Generated continuous pelican outline and 5 named illustration layers.');
