import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
const root=path.resolve(import.meta.dirname,'..'),dest=path.join(root,'.preview/facade-materials');
const spec=JSON.parse(await fs.readFile(path.join(root,'asset-sources/facade-materials.json'),'utf8'));
await fs.mkdir(dest,{recursive:true});
for(const f of spec.files){
 const url=new URL(f.url);
 if(url.protocol!=='https:'||url.hostname!=='dl.polyhaven.org'||url.username||url.password)throw Error('非白名单下载地址');
 if(path.basename(f.path)!==f.path||!/^[\w.-]+\.jpg$/.test(f.path))throw Error('非法文件名');
 const file=path.join(dest,f.path),hash=data=>createHash('md5').update(data).digest('hex');
 let data=await fs.readFile(file).catch(()=>null);
 if(!data||data.length!==f.size||hash(data)!==f.md5){
  const response=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(180000),headers:{'User-Agent':'3D-Scenes-FacadeStudy/1.0'}});
  if(!response.ok||!response.body)throw Error('下载失败 '+response.status);
  const chunks=[];let bytes=0;
  for await(const chunk of response.body){bytes+=chunk.length;if(bytes>f.size)throw Error('文件超过预期大小');chunks.push(chunk);}
  data=Buffer.concat(chunks);
  if(data.length!==f.size||hash(data)!==f.md5)throw Error('来源校验失败 '+f.path);
  await fs.writeFile(file+'.partial',data);await fs.rename(file+'.partial',file);
 }
 console.log('已核验',f.path,data.length,createHash('sha256').update(data).digest('hex'));
}
