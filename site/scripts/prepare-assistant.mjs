import { readFile, writeFile } from 'node:fs/promises';
const products=JSON.parse(await readFile(new URL('../src/data/products.json',import.meta.url),'utf8'));
const index=products.map(({id,slug,name,code,thumbnail,specifications})=>({id,slug,name,code,image:thumbnail,refs:specifications.filter(s=>/OEM|Alternate Part/i.test(s.label)).map(s=>s.value).join(' ')}));
await writeFile(new URL('../public/assistant-catalogue.json',import.meta.url),JSON.stringify(index));
console.log(`Demo assistant catalogue ready: ${index.length} parts.`);
