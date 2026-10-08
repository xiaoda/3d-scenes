import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
const root=await fs.realpath(process.argv[2]);
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.gltf':'model/gltf+json','.glb':'model/gltf-binary','.bin':'application/octet-stream','.hdr':'application/octet-stream','.jpg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml','.md':'text/plain; charset=utf-8'};
const server=http.createServer(async(req,res)=>{
 try{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
  if(!/^127\.0\.0\.1(?::\d+)?$/.test(req.headers.host??'')){res.writeHead(403);res.end();return;}
  let url=decodeURIComponent((req.url??'/').split('?')[0]);
  if(url.includes('\\')||url.split('/').some(x=>x==='..'||x.startsWith('.'))){res.writeHead(404);res.end();return;}
  if(url.endsWith('/'))url+='index.html';
  const candidate=path.resolve(root,'.'+url),ext=path.extname(candidate);
  if(!candidate.startsWith(root+path.sep)||!types[ext]){res.writeHead(404);res.end();return;}
  const real=await fs.realpath(candidate);
  if(!real.startsWith(root+path.sep)){res.writeHead(404);res.end();return;}
  const data=await fs.readFile(real);
  res.writeHead(200,{'Content-Type':types[ext],'Content-Length':data.length,'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'"});
  res.end(req.method==='HEAD'?undefined:data);
 }catch(e){res.writeHead(e.code==='ENOENT'?404:500);res.end();if(e.code!=='ENOENT')console.error(e);}
});
server.listen(0,'127.0.0.1',()=>console.log(JSON.stringify({pid:process.pid,root,port:server.address().port,host:'127.0.0.1'})));
