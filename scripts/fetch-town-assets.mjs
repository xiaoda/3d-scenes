import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
const root=path.resolve(import.meta.dirname,'..');
const base=path.join(root,'public/assets/town');
const spec=JSON.parse(await fs.readFile(path.join(root,'asset-sources/polyhaven-downloads.json'),'utf8'));
await fs.mkdir(base,{recursive:true});
let cursor=0;
const records=[];
async function worker(){
 while(cursor<spec.files.length){
  const item=spec.files[cursor++];
  const u=new URL(item.url);
  if(u.protocol!=='https:'||u.hostname!=='dl.polyhaven.org')throw Error('拒绝非白名单 URL');
  const dest=path.resolve(base,item.path);
  if(!dest.startsWith(base+path.sep))throw Error('拒绝越界写入');
  let data=await fs.readFile(dest).catch(()=>null);
  if(!data||createHash('md5').update(data).digest('hex')!==item.md5){
   const res=await fetch(u,{headers:{'User-Agent':'3D-Scenes-P1-LocalAssetReview/1.0'},signal:AbortSignal.timeout(240000),redirect:'error'});
   if(!res.ok)throw Error('下载失败 '+res.status+' '+item.path);
   data=Buffer.from(await res.arrayBuffer());
   if(data.length!==item.size||createHash('md5').update(data).digest('hex')!==item.md5)throw Error('大小/校验和不一致 '+item.path);
   await fs.mkdir(path.dirname(dest),{recursive:true});
   await fs.writeFile(dest+'.partial',data);
   await fs.rename(dest+'.partial',dest);
  }
  records.push({asset:item.asset,path:item.path,url:item.url,bytes:data.length,sha256:createHash('sha256').update(data).digest('hex'),md5:item.md5});
  console.log('已核验',item.path,data.length);
 }
}
await Promise.all([worker(),worker(),worker()]);
const buildings=await fs.readFile(path.join(base,'buildings/manifest.json'),'utf8').then(JSON.parse).catch(e=>{if(e.code==='ENOENT')return null;throw e;});
const building=buildings?.assets?.length?{status:'candidate-review',note:'已导入两栋候选，独立台账见 buildings/manifest.json；主建筑近景未通过，不以程序占位模型替代。'}:{status:'awaiting-source',note:'未导入合格主建筑；禁止以程序占位模型替代。'};
const manifest={version:1,p1Accepted:false,building,assets:spec.assets.map(a=>({...a,files:records.filter(f=>f.asset===a.id)}))};
await fs.writeFile(path.join(base,'manifest.json'),JSON.stringify(manifest,null,2));
console.log('完成',records.length,'个文件');
