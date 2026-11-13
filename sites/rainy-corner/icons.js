import {CloudRain,Sun,createElement} from 'lucide';
const GLYPHS=Object.freeze({'cloud-rain':CloudRain,sun:Sun});
export function icon(name,size=18){
  if(!Object.hasOwn(GLYPHS,name))throw new Error(`Unknown icon: ${name}`);
  const [tag,attrs,children]=GLYPHS[name];
  return createElement([tag,{...attrs,width:size,height:size,'aria-hidden':'true',focusable:'false','data-icon':name},children]);
}
