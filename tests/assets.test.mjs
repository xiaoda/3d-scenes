import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
const root=path.resolve(import.meta.dirname,'..');
const manifestPath=path.join(root,'public/assets/town/manifest.json');
test('资产台账存在且完整记录下载来源、许可、文件哈希',async()=>{
 const manifest=JSON.parse(await fs.readFile(manifestPath,'utf8'));
 assert.ok(manifest.assets.length>=3);
 for(const asset of manifest.assets){
  assert.equal(asset.license,'CC0-1.0');assert.ok(asset.source.startsWith('https://polyhaven.com/a/'));
  assert.ok(asset.author.length>0);assert.ok(asset.files.length>0);
  for(const file of asset.files){
   const target=path.resolve(root,'public/assets/town',file.path);
   assert.ok(target.startsWith(path.join(root,'public/assets/town')+path.sep));
   const data=await fs.readFile(target);
   assert.equal(data.length,file.bytes);
   assert.equal(createHash('sha256').update(data).digest('hex'),file.sha256);
  }
 }
});
test('glTF 外部引用全部本地存在，不执行来源文件里的代码',async()=>{
 const manifest=JSON.parse(await fs.readFile(manifestPath,'utf8'));
 for(const asset of manifest.assets.filter(a=>a.model)){
  const file=path.join(root,'public/assets/town',asset.model);
  const gltf=JSON.parse(await fs.readFile(file,'utf8'));
  assert.equal(gltf.asset.version,'2.0');
  assert.ok(gltf.meshes.length>0);
  for(const item of [...(gltf.buffers??[]),...(gltf.images??[])]){
   assert.ok(item.uri&&!/^(?:https?:|data:)|\.\./.test(item.uri));
   await fs.access(path.join(path.dirname(file),item.uri));
  }
 }
});
test('建筑候选已获取但未验收时，不能把 P1 标为通过',async()=>{
 const manifest=JSON.parse(await fs.readFile(manifestPath,'utf8'));
 assert.equal(manifest.building.status,'candidate-review');
 const buildings=JSON.parse(await fs.readFile(path.join(root,'public/assets/town/buildings/manifest.json'),'utf8'));
 assert.ok(buildings.assets.every(a=>a.review.status==='candidate'));
 assert.equal(buildings.p1Accepted,false);
 assert.equal(manifest.p1Accepted,false);
});
