import fs from 'node:fs/promises';import path from 'node:path';import{createHash}from'node:crypto';
const root=path.resolve(import.meta.dirname,'..'),base=path.join(root,'public/assets/town'),dir=path.join(base,'street/house1');
const source=JSON.parse(await fs.readFile(path.join(root,'asset-sources/street-house.json'),'utf8')),files=[];
for(const name of(await fs.readdir(dir,{recursive:true})).sort()){
 const p=path.join(dir,name),s=await fs.lstat(p);if(s.isSymbolicLink())throw Error('symlink rejected');if(s.isDirectory())continue;if(!/\.(gltf|bin|json|jpg|png)$/i.test(name))throw Error('unreviewed file');const b=await fs.readFile(p);files.push({path:path.relative(base,p).split(path.sep).join('/'),bytes:b.length,sha256:createHash('sha256').update(b).digest('hex')});
}
await fs.writeFile(path.join(base,'street/manifest.json'),JSON.stringify({version:1,accepted:false,assets:[{...source,model:'street/house1/model.gltf',conversion:'独立转换；原几何/UV/内嵌颜色图，旧材质固定粗糙度近似；窗色和门厚调整；缺失的链接 Wood 用包内本地 Wood 连接，不依赖外部 blend。',files}]},null,2)+'\n');console.log('已登记配楼',files.length,'文件',files.reduce((n,f)=>n+f.bytes,0),'bytes');
