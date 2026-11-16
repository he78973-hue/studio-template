import { build } from 'esbuild';
import { writeFile,readFile } from 'node:fs/promises';
const output=process.argv[2]||'雨夜便利店.html';
const weatherStyles=await readFile('weather-ui.css','utf8');
const licenses=(await Promise.all(['three','lucide'].map(name=>readFile(`node_modules/${name}/LICENSE`,'utf8')))).join('\n\n').replaceAll('--','—');
const result = await build({entryPoints:['scene.js'],bundle:true,minify:true,write:false,format:'iife',legalComments:'inline'});
// The generated multiline GLSL chunks contain insignificant trailing spaces.
const bundledCode=result.outputFiles[0].text.replace(/[\t ]+$/gm,'');
await writeFile(output,`<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#111b2d"><title>听雨便利店 · 上海街角</title><style>*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#111b2d}canvas{display:block;width:100%;height:100%;touch-action:none;outline:none}${weatherStyles}</style></head><body><!-- Third-party notices:\n${licenses}\n--><script>${bundledCode.replaceAll('</script','<\\/script')}</script></body></html>`);
console.log(`Built standalone ${output}`);
