import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
const root=path.resolve(import.meta.dirname,'..'),base=path.join(root,'public/assets/town');
const spec=JSON.parse(await fs.readFile(path.join(root,'asset-sources/facade-materials.json'),'utf8'));
const sourceManifest=JSON.parse(await fs.readFile(path.join(base,'buildings/manifest.json'),'utf8'));
const original=sourceManifest.assets.find(a=>a.id==='daniel-tavern');
const originalFile=original.files.find(f=>f.path===original.model);
const hash=data=>createHash('sha256').update(data).digest('hex');
if(hash(await fs.readFile(path.join(base,original.model)))!==originalFile.sha256)throw Error('原版被改变，停止登记');
const dir=path.join(base,'facade/tavern-v1'),files=[];
for(const name of (await fs.readdir(dir,{recursive:true})).sort()){
 const filename=path.join(dir,name),stat=await fs.lstat(filename);
 if(stat.isSymbolicLink())throw Error('拒绝符号链接');if(stat.isDirectory())continue;
 if(!/\.(gltf|bin|json|jpg|png)$/i.test(name))throw Error('未审核运行格式 '+name);
 const data=await fs.readFile(filename);
 files.push({path:path.relative(base,filename).split(path.sep).join('/'),bytes:data.length,sha256:hash(data)});
}
const asset={id:'tavern-facade-v1',name:'Medieval Tavern · 立面升级 v1',author:'Daniel Andersson（原模型） / Rob Tuytel（石墙）',license:'CC0-1.0',source:original.source,
 sources:[{name:'原始酒馆',url:original.source,author:original.author,license:original.license},{name:spec.name,url:spec.source,author:spec.author,license:spec.license}],
 materialSource:spec.source,model:'facade/tavern-v1/model.gltf',textureLabel:'石墙 2K / 其余原图',
 original:{path:original.model,sha256:originalFile.sha256},conversionStats:'facade/tavern-v1/conversion.json',
 review:{status:'study',limitations:['只升级石墙、窗面与门扇，不是整栋完整 PBR','不含室内；玻璃为不透明近似','石墙法线不改变轮廓，木梁/屋瓦仍为旧图','同机位对照，待用户评审']},files};
await fs.mkdir(path.join(base,'facade'),{recursive:true});
await fs.writeFile(path.join(base,'facade/manifest.json'),JSON.stringify({version:1,accepted:false,assets:[asset],materialDownload:spec},null,2)+'\n');
console.log('立面变体已登记：',files.length,'个文件，',files.reduce((n,f)=>n+f.bytes,0),'bytes；原版未改变。');
