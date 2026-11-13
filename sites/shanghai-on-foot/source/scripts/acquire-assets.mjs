import { writeFile } from 'node:fs/promises';
const assets = [
 ['wukang-mansion.jpg','4/41/Wukang_Mansion_20251128.jpg','Wukang_Mansion_20251128.jpg'],
 ['romeo-balcony.jpg','c/c4/WukangRd_sh.JPG','WukangRd_sh.JPG'],
 ['ba-jin-house.jpg','0/07/Ba_Jin_house%2C_Shanghai.JPG','Ba_Jin_house%2C_Shanghai.JPG'],
];
for(const [name,path,file] of assets){
const urls=['upload.wikimedia.org','thumb.wikimedia.org'].map(host=>`https://${host}/wikipedia/commons/thumb/${path}/960px-${file}`);
let downloaded = false;
for (const url of urls) {
  try {
    const response = await fetch(url, {signal: AbortSignal.timeout(35000)});
    if (!response.ok) throw new Error(String(response.status));
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes[0] !== 0xff || bytes[1] !== 0xd8) throw new Error('Not a JPEG');
    await writeFile(new URL(`../public/assets/${name}`, import.meta.url), bytes);
    console.log('Licensed photograph saved:', name, bytes.length, 'bytes; see public/assets/CREDITS.md');
    downloaded = true; break;
  } catch (error) {console.error(url, error.message);}
}
if (!downloaded) process.exitCode = 1;
}
