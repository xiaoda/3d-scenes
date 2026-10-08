export default async function checkTownBrowser() {
 const checks=[], api=window.__assetLab, $=s=>document.querySelector(s);
 const assert=(ok,name)=>{checks.push({name,ok:!!ok});if(!ok)throw Error(name);};
 const settle=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
 assert(!!api,'诊断接口已就绪'); assert(api.inspect().errors.length===0,'没有资产加载错误');
 assert(document.documentElement.scrollWidth<=innerWidth,'页面没有横向溢出');
 for(const [key,ground] of [['tavern',22],['shack',12],['barrel',6],['door',6],['floor',6]]){
  $('[data-asset="'+key+'"]').click();await settle();
  if(key==='tavern'){$('[data-variant="original"]').click();await settle();}
  const s=api.inspect();
  assert(s.active===key,'切换 '+key);assert(s.groundSize===ground,'地面尺度 '+key);
  assert($('[data-asset="'+key+'"]').getAttribute('aria-pressed')==='true','按钮状态 '+key);
  for(const view of ['front','back','detail','overall']){
   $('[data-view="'+view+'"]').click();await settle();
   const v=api.inspect();assert(v.view===view&&v.camera.every(Number.isFinite),key+' / '+view+' 机位有效');
   if(view==='detail'&&(key==='tavern'||key==='shack'))assert(v.detailSurfaceDistance===1,key+' 近景命中真实表面');
  }
 }
 $('[data-asset="tavern"]').click();$('#ground-toggle').click();assert(!api.inspect().groundVisible,'建筑隐藏地面');
 $('[data-asset="floor"]').click();assert(api.inspect().groundVisible&&$('#ground-toggle').disabled,'地面样本不能隐藏自身');
 $('[data-asset="shack"]').click();assert(!api.inspect().groundVisible,'保留隐藏地面偏好');
 $('#wireframe').click();assert(api.inspect().wireframe,'线框开启');
 $('[data-light="neutral"]').click();assert(api.inspect().sunIntensity===0,'中性检查');
 $('#reset').click();await settle();const reset=api.inspect();
 assert(!reset.wireframe&&reset.groundVisible&&reset.sunIntensity===2.4&&reset.view==='overall','重置完整恢复');
 assert($('#source-link').href==='https://opengameart.org/content/old-medieval-house','建筑来源正确');
 $('[data-asset="barrel"]').click();assert($('#source-link').textContent.includes('Poly Haven'),'原样本来源正确');
 $('[data-asset="tavern"]').click();await settle();
 return {viewport:[innerWidth,innerHeight],checks,state:api.inspect()};
}
