import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
const root=path.resolve(import.meta.dirname,'../public/assets/town');
test('建筑转换产物有原始归档来源、许可与逐文件哈希',async()=>{
 const manifest=JSON.parse(await fs.readFile(path.join(root,'buildings/manifest.json'),'utf8'));
 assert.equal(manifest.assets.length,2);
 for(const a of manifest.assets){
  assert.equal(a.license,'CC0-1.0');
  assert.equal(new URL(a.source).hostname,'opengameart.org');
  assert.match(a.archive.sha256,/^[a-f0-9]{64}$/);
  assert.ok(a.author && a.conversion && a.textureLabel);
  assert.equal(a.review.status,'candidate');
  assert.ok(a.review.limitations.length>0);
  for(const f of a.files){
   const target=path.resolve(root,f.path);
   assert.ok(target.startsWith(root+path.sep));
   const data=await fs.readFile(target);
   assert.equal(data.length,f.bytes);
   assert.equal(createHash('sha256').update(data).digest('hex'),f.sha256);
  }
  const file=path.join(root,a.model),gltf=JSON.parse(await fs.readFile(file,'utf8'));
  assert.equal(gltf.asset.version,'2.0');assert.ok(gltf.meshes.length);
  for(const ref of [...(gltf.buffers??[]),...(gltf.images??[])]){
   assert.ok(ref.uri&&!/^(?:[a-z]+:|\/)|\.\.|\\/i.test(ref.uri));
   const relative=path.relative(root,path.join(path.dirname(file),decodeURIComponent(ref.uri))).split(path.sep).join('/');
   assert.ok(a.files.some(f=>f.path===relative),'引用必须在资产哈希台账中：'+relative);
  }
 }
});
