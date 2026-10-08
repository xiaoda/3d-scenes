import './style.css';
import {AssetLab} from './engine/renderer.ts';
import {base,catalog} from './assets/catalog.ts';
import type {AssetKey,Manifest} from './assets/catalog.ts';
import type {View} from './engine/inspection.ts';
import {groundControlState} from './engine/inspection.ts';
const $=<T extends HTMLElement=HTMLElement>(s:string)=>document.querySelector<T>(s)!;
const viewport=$('#viewport'),state=$('#load-state'),error=$('#error'),loading=$('#loading');
let lab:AssetLab,manifest:Manifest,active:AssetKey='barrel';
let ready=false,fatalError=false;
function enableControls(enabled:boolean){document.querySelectorAll<HTMLButtonElement>('.workspace button').forEach(b=>b.disabled=!enabled);}
function syncGroundControl(){const ground=groundControlState(active,lab.ground,lab.reports.has('floor'));$('#ground-toggle').toggleAttribute('disabled',ground.disabled);$('#ground-toggle').setAttribute('aria-pressed',String(ground.visible));}
function showError(message:string){ready=false;fatalError=true;enableControls(false);error.hidden=false;error.textContent=message;state.textContent='需要检查';loading.hidden=true;}
function view(v:View){lab.view(v);document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===v)));}
function select(key:AssetKey){
 if(!ready)return;
 try{
  const report=lab.select(key);active=key;const entry=catalog[key],record=manifest.assets.find(a=>a.id===entry.id)!;
  $('#asset-title').textContent=entry.title;$('#asset-tag').textContent=entry.tag;$('#asset-note').textContent=entry.note;
  $('#dimensions').textContent=[report.size.width,report.size.height,report.size.depth].map(x=>x.toFixed(2)).join(' × ')+' m';
  $('#triangles').textContent=Math.round(report.triangles).toLocaleString()+' / '+report.meshes+' 网格';
  $('#asset-size').textContent=(record.textureLabel??'2K')+' / '+(record.files.reduce((n,f)=>n+f.bytes,0)/1048576).toFixed(1)+' MiB';
  $('#source-link').setAttribute('href',record.source);
  $('#source-link').textContent='来源：'+(new URL(record.source).hostname==='opengameart.org'?'OpenGameArt':'Poly Haven')+' ↗';
  $('#credit').textContent=record.author+' · CC0';
  $('#detail-button').textContent=key==='floor'?'低角度近看':'约 1 米近看';
  syncGroundControl();
  for(const b of document.querySelectorAll<HTMLButtonElement>('[data-asset]')){const selected=b.dataset.asset===key;b.classList.toggle('active',selected);b.setAttribute('aria-pressed',String(selected));}
  view('overall');
 }catch(e){showError(String(e));}
}
for(const b of document.querySelectorAll<HTMLButtonElement>('[data-asset]'))b.addEventListener('click',()=>select(b.dataset.asset as AssetKey));
for(const b of document.querySelectorAll<HTMLButtonElement>('[data-view]'))b.addEventListener('click',()=>{if(ready)view(b.dataset.view as View);});
for(const b of document.querySelectorAll<HTMLButtonElement>('[data-light]'))b.addEventListener('click',()=>{if(!ready)return;lab.light(b.dataset.light as 'sun'|'neutral');document.querySelectorAll<HTMLButtonElement>('[data-light]').forEach(t=>t.setAttribute('aria-pressed',String(t===b)));});
$('#wireframe').addEventListener('click',()=>{if(!ready)return;lab.setWire(!lab.wire);$('#wireframe').setAttribute('aria-pressed',String(lab.wire));});
$('#ground-toggle').addEventListener('click',()=>{if(!ready)return;lab.setGround(!lab.ground);syncGroundControl();});
$('#reset').addEventListener('click',()=>{if(!ready)return;lab.light('sun');document.querySelectorAll<HTMLButtonElement>('[data-light]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.light==='sun')));lab.setWire(false);$('#wireframe').setAttribute('aria-pressed','false');lab.setGround(true);$('#ground-toggle').setAttribute('aria-pressed','true');select(active);});
viewport.addEventListener('lab-error',e=>showError((e as CustomEvent).detail));
async function init(){
 enableControls(false);
 try{
  const r=await fetch(base+'manifest.json');if(!r.ok)throw Error('资产台账加载失败 '+r.status);manifest=await r.json();
  let buildingWarning='';
  try{
   const response=await fetch(base+'buildings/manifest.json');if(!response.ok)throw Error('HTTP '+response.status);
   const buildings:Manifest=await response.json();
   if(!Array.isArray(buildings.assets))throw Error('清单格式错误');
   manifest.assets.push(...buildings.assets);
  }catch(e){buildingWarning='建筑清单加载失败（原有样本仍可检查）：'+String(e);}
  lab=new AssetLab(viewport);await lab.load(manifest,label=>{state.textContent=label;});
  if(buildingWarning)lab.errors.push(buildingWarning);
  if(fatalError)return;
  const first=lab.reports.has('tavern')?'tavern':lab.reports.has('barrel')?'barrel':lab.reports.keys().next().value;
  if(!first)throw Error('没有可检查的模型；请查看本地资源是否完整。');
  ready=true;loading.hidden=true;enableControls(true);
  if(lab.errors.length){state.textContent='部分资产失败';error.hidden=false;error.textContent=lab.errors.join('；');}else state.textContent=lab.reports.size+' 项样本已载入';
  for(const b of document.querySelectorAll<HTMLButtonElement>('[data-asset]'))b.disabled=!lab.reports.has(b.dataset.asset as AssetKey);
  select(first);
  (window as unknown as {__assetLab:unknown}).__assetLab={inspect:()=>lab.inspect(),select:(key:AssetKey)=>select(key),view:(v:View)=>view(v)};
 }catch(e){showError('无法完成三维载入。请确认浏览器支持 WebGL2，且本地资源完整。 '+String(e));}
}
window.addEventListener('pagehide',()=>lab?.dispose());
window.addEventListener('pageshow',e=>{if(e.persisted)location.reload();});
init();
