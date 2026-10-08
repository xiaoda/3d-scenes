export default async function checkStreetBrowser(){
 const api=window.__street,$=s=>document.querySelector(s),checks=[];
 const assert=(ok,name)=>{checks.push({name,ok:!!ok});if(!ok)throw Error(name);};
 const settle=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
 const wait=ms=>new Promise(r=>setTimeout(r,ms));const key=(type,code)=>window.dispatchEvent(new KeyboardEvent(type,{code,bubbles:true}));
 assert(api.inspect().mode==='ready','资源就绪');assert(!api.inspect().errors.length,'无资产错误');
 assert(Object.keys(api.inspect().models).length===3,'两栋建筑和酒桶实物加载');
 assert(api.inspect().models.house.meshes===83,'配楼不是程序占位建筑');
 assert(document.documentElement.scrollWidth<=innerWidth,'页面没有横向溢出');
 assert(api.inspect().metrics.fps===null,'未采样不虚报帧率');
 for(const v of ['entry','porch','corner']){$('[data-viewpoint="'+v+'"]').click();await settle();const s=api.inspect();assert(s.walkable&&s.mode==='ready'&&!s.overview,v+' 观察点合法');assert($('[data-viewpoint="'+v+'"]').getAttribute('aria-pressed')==='true',v+' 按钮状态');}
 $('#overview').click();await settle();assert(api.inspect().overview,'鸟瞰可用');
 $('#walk').click();assert(!api.inspect().overview&&api.inspect().mode==='walking','从鸟瞰开始漫游回到地面');
 const before=api.inspect().pose;key('keydown','KeyW');await wait(500);key('keyup','KeyW');
 const moved=api.inspect();assert(Math.hypot(moved.pose.x-before.x,moved.pose.z-before.z)>.1&&moved.walkable,'WASD 实际移动且不穿碰撞');
 key('keydown','KeyD');window.dispatchEvent(new Event('blur'));await settle();const stopped=api.inspect();
 assert(stopped.mode==='paused'&&stopped.keys.length===0&&stopped.touchInputs===0,'失焦暂停并清除输入');await wait(200);
 assert(JSON.stringify(api.inspect().pose)===JSON.stringify(stopped.pose),'暂停后位置不漂移');
 $('#walk').click();await wait(150);key('keydown','Escape');assert(api.inspect().mode==='paused','Esc 暂停');
 $('#reset').click();await settle();assert(api.inspect().pose.x===9&&api.inspect().pose.z===17&&api.inspect().mode==='ready','重置回到出生点');
 $('#walk').click();$('#info-button').click();assert(api.inspect().mode==='paused'&&!$('#notes').hidden,'查看手记自动暂停');
 assert($('#info-button').getAttribute('aria-expanded')==='true','手记可访问状态');assert(document.querySelectorAll('#notes a[target="_blank"]').length===6,'来源作者完整');
 $('#close-notes').click();assert($('#notes').hidden,'手记可关闭');$('#reset').click();await settle();
 return {checks,viewport:[innerWidth,innerHeight],state:api.inspect()};
}
