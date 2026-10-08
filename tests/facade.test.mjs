import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
const root=path.resolve(import.meta.dirname,'../public/assets/town');
test('立面变体来源可追溯，原版冻结，所有依赖可离线校验',async()=>{
 const manifest=JSON.parse(await fs.readFile(path.join(root,'facade/manifest.json'),'utf8'));
 assert.equal(manifest.accepted,false);
 const a=manifest.assets[0];assert.equal(a.id,'tavern-facade-v1');
 assert.equal(a.license,'CC0-1.0');assert.equal(a.sources.length,2);
 const original=await fs.readFile(path.join(root,a.original.path));
 assert.equal(createHash('sha256').update(original).digest('hex'),a.original.sha256);
 for(const f of a.files){
  const target=path.resolve(root,f.path);assert.ok(target.startsWith(root+path.sep));
  const data=await fs.readFile(target);
  assert.equal(data.length,f.bytes);assert.equal(createHash('sha256').update(data).digest('hex'),f.sha256);
 }
 const filename=path.join(root,a.model),gltf=JSON.parse(await fs.readFile(filename,'utf8'));
 for(const ref of [...gltf.buffers,...gltf.images]){
  assert.ok(ref.uri&&!/^(?:[a-z]+:|\/)|\.\.|\\/i.test(ref.uri));
  const rel=path.relative(root,path.join(path.dirname(filename),decodeURIComponent(ref.uri))).split(path.sep).join('/');
  assert.ok(a.files.some(f=>f.path===rel),'依赖未登记：'+rel);
 }
 const wall=gltf.materials.find(m=>m.name==='Facade_Stone_PBR');
 assert.ok(wall?.pbrMetallicRoughness.baseColorTexture);
 assert.ok(wall.normalTexture && wall.pbrMetallicRoughness.metallicRoughnessTexture && wall.occlusionTexture);
 assert.equal(wall.pbrMetallicRoughness.metallicFactor,0);
 assert.ok(Math.abs(wall.normalTexture.scale-.65)<1e-6,'Blender float32 法线强度约为 0.65');
 assert.equal(wall.occlusionTexture.index,wall.pbrMetallicRoughness.metallicRoughnessTexture.index);
 for(const f of manifest.materialDownload.files){
  const data=await fs.readFile(path.join(path.dirname(filename),'textures',f.path));
  assert.equal(createHash('md5').update(data).digest('hex'),f.md5,'来源贴图必须原字节保留');
 }
 const glass=gltf.materials.find(m=>m.name==='Facade_Window_Glass');
 assert.ok(glass&&!glass.pbrMetallicRoughness.baseColorTexture,'升级窗面不再使用蓝色贴片图');
 assert.equal(glass.alphaMode??'OPAQUE','OPAQUE','无室内，不做透明穿帮玻璃');
 const stats=JSON.parse(await fs.readFile(path.join(root,a.conversionStats),'utf8'));
 assert.equal(stats.wallTileMetres,2.5);assert.equal(stats.doorThicknessMetres,.06);
 assert.ok(stats.thickenedDoors===4 && stats.rectangularWindows>10);
 assert.ok(stats.leadTriangles>0 && stats.leadTriangles<6000);
 assert.equal(stats.sourceGeometryPreserved,true);
});
