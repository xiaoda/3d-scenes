import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
const base=path.resolve(import.meta.dirname,'../public/assets/town');
test('街角配楼来源与运行依赖完整，已认可酒馆不改写',async()=>{
 const m=JSON.parse(await fs.readFile(path.join(base,'street/manifest.json'),'utf8'));
 assert.equal(m.assets[0].license,'CC0-1.0');assert.equal(m.assets[0].id,'daniel-house1');assert.equal(m.accepted,false);
 for(const f of m.assets[0].files){const p=path.resolve(base,f.path);assert.ok(p.startsWith(base+path.sep));const b=await fs.readFile(p);assert.equal(b.length,f.bytes);assert.equal(createHash('sha256').update(b).digest('hex'),f.sha256);}
 const a=m.assets[0],g=JSON.parse(await fs.readFile(path.join(base,a.model),'utf8'));
 for(const r of [...g.buffers,...g.images]){assert.ok(r.uri&&!/^(?:[a-z]+:|\/)|\.\.|\\/i.test(r.uri));assert.ok(a.files.some(f=>f.path===path.posix.join(path.posix.dirname(a.model),decodeURIComponent(r.uri))));}
 assert.ok(g.materials.every(m=>m.pbrMetallicRoughness));
 const frozen=JSON.parse(await fs.readFile(path.join(base,'facade/manifest.json'),'utf8'));
 for(const f of frozen.assets[0].files)assert.equal(createHash('sha256').update(await fs.readFile(path.join(base,f.path))).digest('hex'),f.sha256);
});
