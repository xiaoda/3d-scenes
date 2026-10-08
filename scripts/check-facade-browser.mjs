// Run this function on a freshly loaded page through Chrome DevTools MCP.
export default async function checkFacadeBrowser() {
 const checks=[],api=window.__assetLab,$=s=>document.querySelector(s);
 const assert=(ok,name)=>{checks.push({name,ok:!!ok});if(!ok)throw Error(name);};
 const settle=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
 const equal=(a,b)=>a.length===b.length&&a.every((n,i)=>Math.abs(n-b[i])<1e-7);
 assert(!!api,'诊断接口已就绪');
 assert(api.inspect().active==='tavern-upgrade','首次默认展示升级版');
 assert(api.inspect().errors.length===0,'完整资源没有加载错误');
 assert(document.documentElement.scrollWidth<=innerWidth,'窄屏没有横向溢出');
 assert(!$('#variant-switch').hidden,'酒馆显示版本对照');
 assert($('#material-source').href==='https://polyhaven.com/a/castle_wall_slates','新增材质来源正确');
 assert($('#source-link').href==='https://opengameart.org/content/medieval-tavern','保留原模型来源');
 const reports=api.inspect().reports,original=reports.find(r=>r.key==='tavern'),upgrade=reports.find(r=>r.key==='tavern-upgrade');
 assert(equal(Object.values(original.size),Object.values(upgrade.size)),'原/升级保持建筑包围盒');
 assert(upgrade.triangles===9161&&upgrade.meshes===56,'升级几何预算符合记录');
 $('[data-light="neutral"]').click();$('#ground-toggle').click();$('#wireframe').click();
 for(const view of ['overall','front','back','detail']){
  $('[data-view="'+view+'"]').click();await settle();const before=api.inspect();
  for(const version of ['original','upgraded']){
   $('[data-variant="'+version+'"]').click();await settle();const after=api.inspect();
   assert(equal(before.camera,after.camera)&&equal(before.target,after.target),view+' / '+version+' 保留机位');
   assert(after.view===view&&after.sunIntensity===0&&after.environmentIntensity===before.environmentIntensity&&!after.groundVisible&&after.wireframe&&after.groundSize===before.groundSize,view+' / '+version+' 保留检查条件');
   assert($('[data-variant="'+version+'"]').getAttribute('aria-pressed')==='true',view+' / '+version+' 按钮状态');
  }
 }
 $('#reset').click();await settle();const reset=api.inspect();
 assert(reset.active==='tavern-upgrade'&&reset.view==='overall'&&!reset.wireframe&&reset.groundVisible&&reset.sunIntensity===2.4,'重置不丢失版本');
 $('[data-asset="barrel"]').click();await settle();
 assert($('#variant-switch').hidden&&$('#material-source').hidden,'其他资产隐藏版本与墙材质来源');
 $('[data-asset="tavern"]').click();await settle();assert(api.inspect().active==='tavern-upgrade','返回酒馆记住升级版');
 $('[data-variant="original"]').click();await settle();
 assert($('#material-source').hidden,'原件不显示新增材质来源');
 $('[data-asset="shack"]').click();$('[data-asset="tavern"]').click();await settle();
 assert(api.inspect().active==='tavern','返回酒馆记住原始版');
 $('[data-variant="upgraded"]').click();$('#reset').click();await settle();
 return {viewport:[innerWidth,innerHeight],checks,state:api.inspect()};
}
