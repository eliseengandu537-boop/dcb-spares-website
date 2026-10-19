import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const products=JSON.parse(await fs.readFile('src/data/products.json','utf8'));
const catalogue=JSON.parse(await fs.readFile('src/data/catalogue.json','utf8'));
assert.equal(new Set(products.map(p=>p.id)).size,products.length,'Duplicate product IDs');
assert.equal(catalogue.categories.length,16);
assert.equal(catalogue.brands.length,12);
assert.equal(products.length,catalogue.productCount);
const ids=new Set(products.map(p=>p.id));
for(const category of [...catalogue.categories,...catalogue.brands]){
  assert.equal(category.productIds.length,category.expected,category.slug+' source count');
  for(const id of category.productIds)assert(ids.has(id),category.slug+' missing product '+id);
}
const assets=new Set();
for(const p of products){
  assert(p.name.trim(),`Missing title ${p.id}`);
  assert(p.images.length,`Missing product photos ${p.id}`);
  assert(p.categories.length,`Missing product range ${p.id}`);
  assert(!p.description.some(d=>d.includes('Full Name')&&d.includes('Email address')),`Imported form ${p.id}`);
  p.images.forEach(u=>assets.add(u));if(p.thumbnail)assets.add(p.thumbnail);
  if(process.argv.includes('--export'))await fs.access(`out/product/${p.slug}/index.html`);
}
for(const asset of assets){assert(asset.startsWith('/images/catalogue/'));await fs.access('public'+asset);}
console.log(`Verified ${products.length} unique products, 16 complete categories, 12 brand ranges and ${assets.size} local product photographs${process.argv.includes('--export')?' with every exported product page':''}.`);
