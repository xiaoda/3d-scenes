import './style.css';
import{StreetScene}from'./scene.ts';
import{bounds,obstacles,viewpoints}from'./layout.ts';
import type{Viewpoint}from'./layout.ts';
import{movePlayer,isWalkable,PLAYER}from'./movement.ts';
const $=<T extends HTMLElement=HTMLElement>(s:string)=>document.querySelector<T>(s)!;
const mount=$('#scene'),walk=$<HTMLButtonElement>('#walk'),panel=$('#load-panel'),status=$('#walk-status');
let world:StreetScene|undefined,mode:'loading'|'ready'|'walking'|'paused'|'error'='loading',overview=false,disposed=false,frame=0,last=0;
let pose:{x:number;z:number;yaw:number;pitch:number}={...viewpoints.entry};
const keys=new Set<string>(),touch=new Map<number,string>(),abort=new AbortController(),signal=abort.signal;
let dragging:{id:number;x:number;y:number}|null=null;
const samples:number[]=[];let movingFrames=0;
function inputs(){const all=new Set([...keys,...touch.values()]);return{forward:Number(all.has('KeyW')||all.has('ArrowUp')||all.has('forward'))-Number(all.has('KeyS')||all.has('ArrowDown')||all.has('back')),right:Number(all.has('KeyD')||all.has('ArrowRight')||all.has('right'))-Number(all.has('KeyA')||all.has('ArrowLeft')||all.has('left'))};}
function clearInput(){keys.clear();touch.clear();dragging=null;}
function invalidate(){if(!disposed&&!frame&&!document.hidden)frame=requestAnimationFrame(render);}
function updateCamera(){if(!world||overview)return;world.camera.position.set(pose.x,PLAYER.height,pose.z);world.camera.rotation.set(pose.pitch,pose.yaw,0,'YXZ');}
function render(time:number){
 frame=0;if(disposed||document.hidden)return;
 if(mode==='walking'){
  const dt=last?(time-last)/1000:0,input=inputs();
  if(dt>0){samples.push(dt*1000);if(samples.length>600)samples.shift();if(input.forward||input.right)movingFrames++;}
  pose={...pose,...movePlayer(pose,input,pose.yaw,dt,obstacles,bounds)};updateCamera();
 }
 last=time;world?.render();
 if(!$('#notes').hidden)updatePerformance();
 if(mode==='walking')invalidate();
}
function metrics(){const sorted=[...samples].sort((a,b)=>a-b),mean=samples.reduce((a,b)=>a+b,0)/(samples.length||1);return{frames:samples.length,movingFrames,meanMs:mean,medianMs:sorted[Math.floor(sorted.length*.5)]??null,p95Ms:sorted[Math.floor(sorted.length*.95)]??null,fps:samples.length>=30?1000/mean:null,note:'连续漫游模式的 RAF 帧间隔；不是 GPU 计时或最终性能验收。'};}
function updatePerformance(){const m=metrics(),s=world?.inspect();$('#performance').textContent=`${s?.drawingBuffer.join(' × ')??'—'} px · ${s?.drawCalls??0} draw calls\n${m.frames} 帧 / 移动 ${m.movingFrames} 帧${m.fps?` · 均值 ${m.fps.toFixed(1)} FPS · P95 ${m.p95Ms!.toFixed(1)}ms`:' · 尚无足够采样'}\n${s?.gpu??''}\n${m.note}`;}
function sync(){document.body.classList.toggle('walking',mode==='walking');walk.textContent=mode==='walking'?'暂停漫游 Ⅱ':mode==='paused'?'继续漫游 →':'开始漫游 →';status.textContent=mode==='walking'?'漫游中 · 拖动转头':mode==='paused'?'已暂停':mode==='ready'?'拖动可环视':mode==='error'?'载入失败':'素材载入中';}
function pause(){if(mode==='walking'){mode='paused';clearInput();last=0;sync();invalidate();}}
function place(key:Viewpoint){if(mode==='loading'||mode==='error')return;mode='ready';overview=false;clearInput();pose={...viewpoints[key]};updateCamera();for(const b of document.querySelectorAll<HTMLElement>('[data-viewpoint]'))b.setAttribute('aria-pressed',String(b.dataset.viewpoint===key));$('#overview').setAttribute('aria-pressed','false');sync();invalidate();}
function start(){if(mode==='loading'||mode==='error'||document.hidden)return;if(overview)place('entry');if(mode==='walking'){pause();return;}mode='walking';samples.length=0;movingFrames=0;last=0;clearInput();mount.focus({preventScroll:true});sync();invalidate();}
function failure(message:string){mode='error';clearInput();sync();for(const b of document.querySelectorAll<HTMLButtonElement>('.control-dock button,#touch-pad button'))b.disabled=true;panel.hidden=false;$('#load-title').textContent='这段街道暂时无法载入';$('#load-message').textContent=message;$('#failure-back').hidden=false;world?.dispose();}
walk.addEventListener('click',start,{signal});$('#reset').addEventListener('click',()=>place('entry'),{signal});
for(const b of document.querySelectorAll<HTMLButtonElement>('[data-viewpoint]'))b.addEventListener('click',()=>place(b.dataset.viewpoint as Viewpoint),{signal});
$('#overview').addEventListener('click',()=>{if(!world||mode==='loading'||mode==='error')return;pause();clearInput();mode='ready';overview=true;world.camera.position.set(34,33,43);world.camera.lookAt(0,1,2);for(const b of document.querySelectorAll<HTMLElement>('[data-viewpoint]'))b.setAttribute('aria-pressed','false');$('#overview').setAttribute('aria-pressed','true');sync();invalidate();},{signal});
function notes(open:boolean){if(open)pause();$('#notes').hidden=!open;$('#info-button').setAttribute('aria-expanded',String(open));updatePerformance();if(open)$('#close-notes').focus({preventScroll:true});else $('#info-button').focus({preventScroll:true});}
$('#info-button').addEventListener('click',()=>notes($('#notes').hidden===true),{signal});$('#close-notes').addEventListener('click',()=>notes(false),{signal});
window.addEventListener('keydown',e=>{
 if(e.code==='Escape'){pause();if(!$('#notes').hidden)notes(false);return;}
 if(mode!=='walking'||e.ctrlKey||e.metaKey||e.altKey||e.target instanceof HTMLInputElement)return;
 if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)){e.preventDefault();keys.add(e.code);}
},{signal});
window.addEventListener('keyup',e=>keys.delete(e.code),{signal});
window.addEventListener('blur',()=>{clearInput();pause();},{signal});
document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInput();pause();last=0;}else invalidate();},{signal});
mount.addEventListener('pointerdown',e=>{if(mode==='loading'||mode==='error'||overview||e.button!==0)return;dragging={id:e.pointerId,x:e.clientX,y:e.clientY};mount.setPointerCapture(e.pointerId);},{signal});
mount.addEventListener('pointermove',e=>{if(!dragging||dragging.id!==e.pointerId)return;pose.yaw-=(e.clientX-dragging.x)*.004;pose.pitch=Math.max(-.9,Math.min(.9,pose.pitch-(e.clientY-dragging.y)*.004));dragging={id:e.pointerId,x:e.clientX,y:e.clientY};updateCamera();invalidate();},{signal});
const release=(e:PointerEvent)=>{if(dragging?.id===e.pointerId)dragging=null;touch.delete(e.pointerId);};
window.addEventListener('pointerup',release,{signal});window.addEventListener('pointercancel',release,{signal});
mount.addEventListener('lostpointercapture',()=>{dragging=null;},{signal});
for(const b of document.querySelectorAll<HTMLButtonElement>('[data-move]')){
 b.addEventListener('pointerdown',e=>{if(mode!=='walking')return;e.preventDefault();b.setPointerCapture(e.pointerId);touch.set(e.pointerId,b.dataset.move!);},{signal});
 b.addEventListener('lostpointercapture',e=>touch.delete(e.pointerId),{signal});
}
const observer=new ResizeObserver(()=>{world?.resize();invalidate();});observer.observe(mount);
window.addEventListener('pagehide',()=>{disposed=true;clearInput();cancelAnimationFrame(frame);observer.disconnect();abort.abort();world?.dispose();},{once:true});
window.addEventListener('pageshow',e=>{if(e.persisted)location.reload();});
(window as unknown as{__street:unknown}).__street={inspect:()=>({mode,pose:{...pose},overview,walkable:isWalkable(pose,obstacles,bounds),keys:[...keys],touchInputs:touch.size,metrics:metrics(),...world?.inspect()}),view:place};
try{
 world=new StreetScene(mount,()=>failure('WebGL 上下文丢失，请重新载入页面。'));
 await world.load(s=>{$('#load-title').textContent=s;});
 if(!disposed&&(mode as string)!=='error'){mode='ready';panel.hidden=true;for(const b of document.querySelectorAll<HTMLButtonElement>('.control-dock button,#touch-pad button'))b.disabled=false;place('entry');}
}catch(e){if(!disposed)failure(String(e));}
