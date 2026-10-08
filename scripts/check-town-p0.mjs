import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dir=path.join(root,'docs/p0-town');
const layout=JSON.parse(await fs.readFile(path.join(dir,'layout.json'),'utf8'));
const sources=JSON.parse(await fs.readFile(path.join(dir,'sources.json'),'utf8'));
const html=await fs.readFile(path.join(dir,'index.html'),'utf8');
const inRect=(p,r)=>p.x>=r.x&&p.x<=r.x+r.width&&p.z>=r.z&&p.z<=r.z+r.depth;
test('四张参考的本地文件与来源哈希一致',async()=>{
 assert.equal(sources.length,4);
 for(const s of sources){const b=await fs.readFile(path.join(dir,'images',s.file));assert.equal(b[0],255);assert.equal(b[1],216);assert.equal(createHash('sha256').update(b).digest('hex'),s.sha256);assert.equal(new URL(s.source).hostname,'commons.wikimedia.org');assert.ok(s.author&&s.license&&s.licenseUrl);}
});
test('所有本地资源链接存在且不越出参考板目录',async()=>{
 for(const m of html.matchAll(/(?:href|src)="([^"]+)"/g)){if(/^(https?:|data:|#)/.test(m[1]))continue;const p=path.resolve(dir,m[1]);assert.ok(p.startsWith(dir+path.sep));await fs.access(p);}
 assert.equal(html.includes('{{'),false);
});
test('照片、布局与成品状态区分明确',()=>{
 assert.ok(html.includes('不是本项目 3D 渲染'));assert.ok(html.includes('不是 3D 成品'));
 assert.ok(html.includes('参考图与具体布局：待审阅'));
 assert.equal((html.match(/data-photo=/g)||[]).length,4);assert.ok(html.includes('aria-labelledby="modal-title"'));
});
test('四栋建筑在场地内且无占地相交',()=>{
 assert.equal(layout.buildings.length,4);for(const b of layout.buildings){assert.ok(b.x>=0&&b.z>=0&&b.x+b.width<=layout.width&&b.z+b.depth<=layout.depth);}
 for(let i=0;i<layout.buildings.length;i++)for(let j=i+1;j<layout.buildings.length;j++){const a=layout.buildings[i],b=layout.buildings[j];assert.ok(a.x+a.width<=b.x||b.x+b.width<=a.x||a.z+a.depth<=b.z||b.z+b.depth<=a.z);}
});
test('观察点与建议路线采样位于平面可达区，不在建筑内部',()=>{
 const check=p=>{assert.ok(layout.walkableAreas.some(r=>inRect(p,r)));assert.ok(!layout.buildings.some(b=>p.x>b.x&&p.x<b.x+b.width&&p.z>b.z&&p.z<b.z+b.depth));};
 layout.viewpoints.forEach(check);
 for(let i=1;i<layout.route.length;i++){const a=layout.route[i-1],b=layout.route[i];for(let n=0;n<=50;n++)check({x:a.x+(b.x-a.x)*n/50,z:a.z+(b.z-a.z)*n/50});}
});
test('布局 SVG 与数据中的建筑及机位标识一致',async()=>{
 const svg=await fs.readFile(path.join(dir,'layout.svg'),'utf8');for(const b of layout.buildings)assert.ok(svg.includes(b.name));for(const c of layout.viewpoints)assert.ok(svg.includes(c.id));assert.ok(svg.includes('每格 1 m'));assert.equal((svg.match(/class="camera"/g)||[]).length,4);assert.ok(svg.includes('.camera{fill:#fffaf0}'));assert.ok(svg.includes('width="960" height="790" viewBox='));
});
test('说明文档与许可台账存在',async()=>{
 for(const f of ['README.md','sources.md']){const t=await fs.readFile(path.join(dir,f),'utf8');assert.ok(t.length>100);assert.equal(t.includes(String.fromCharCode(0xfffd)),false);}
});
