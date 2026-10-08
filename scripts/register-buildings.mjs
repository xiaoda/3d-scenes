import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
const root=path.resolve(import.meta.dirname,'..');
const base=path.join(root,'public/assets/town');
const spec=JSON.parse(await fs.readFile(path.join(root,'asset-sources/building-sources.json'),'utf8'));
const assets=[];
for(const asset of spec.assets){
 const dir=path.dirname(path.join(base,asset.model));
 const names=await fs.readdir(dir,{recursive:true});
 const files=[];
 for(const name of names.sort()){
  const target=path.join(dir,name),stat=await fs.lstat(target);
  if(stat.isSymbolicLink())throw Error('拒绝符号链接');
  if(stat.isDirectory())continue;
  if(!/\.(gltf|bin|png|jpg|json)$/i.test(name))throw Error('非运行期产物：'+name);
  const data=await fs.readFile(target);
  files.push({path:path.relative(base,target).split(path.sep).join('/'),bytes:data.length,sha256:createHash('sha256').update(data).digest('hex')});
 }
 assets.push({...asset,files});
}
await fs.writeFile(path.join(base,'buildings/manifest.json'),JSON.stringify({version:1,p1Accepted:false,reviewedAt:spec.reviewedAt,assets},null,2)+'\n');
console.log('已登记',assets.length,'栋候选；未标记通过视觉验收。');
