// Run after Vite builds source/dist. Only this template's generated JS/CSS is cleaned.
import { cp, mkdir, readdir, unlink } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root=dirname(fileURLToPath(import.meta.url));
const assets=join(root,'assets');
await mkdir(assets,{recursive:true});
for(const file of await readdir(assets)) {
  if(/-[\w-]{8}\.(js|css)$/.test(file))await unlink(join(assets,file));
}
await cp(join(root,'source/dist/index.html'),join(root,'index.html'));
await cp(join(root,'source/dist/assets'),assets,{recursive:true});
console.log('Published index.html and local assets at the template root.');
