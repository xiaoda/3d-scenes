import test from 'node:test';
import assert from 'node:assert/strict';
import {cameraPreset, groundPlacement, textureSpace, groundControlState, floorCameraPreset} from '../src/engine/inspection.ts';
import {PerspectiveCamera,Vector3} from 'three';
test('落地计算保留原始尺寸，只消除中心偏移',()=>{
 assert.deepEqual(groundPlacement({min:[-2,-1,-3],max:[4,5,1]}),[-1,1,1]);
});
test('前表面近景距离恰为一米，不把中心距当表面距',()=>{
 const p=cameraPreset({width:2,height:3,depth:.4},'detail',1.5);
 assert.equal(p.position[2]-p.target[2],1);
 assert.equal(p.target[2],.2);
});
test('横竖屏整体机位会根据较紧的视场留出空间',()=>{
 const b={width:2,height:3,depth:.4};
 assert.ok(cameraPreset(b,'overall',.6).position[2]>cameraPreset(b,'overall',1.5).position[2]);
});
test('背面机位位于负 Z 且不在模型内部',()=>{
 assert.ok(cameraPreset({width:2,height:3,depth:.4},'back',1.5).position[2]<-.2);
});
test('仅颜色图使用 sRGB，法线/ARM/位移按线性数据解读',()=>{
 assert.equal(textureSpace('baseColor'),'srgb');
 for(const type of ['normal','arm','displacement'])assert.equal(textureSpace(type),'');
});
test('石路始终显示，但不改变返回模型时的隐藏偏好',()=>{
 assert.deepEqual(groundControlState('floor',false,true),{visible:true,disabled:true});
 assert.deepEqual(groundControlState('barrel',false,true),{visible:false,disabled:false});
 assert.deepEqual(groundControlState('door',true,true),{visible:true,disabled:false});
});
test('地面加载失败时，显示地面按钮不可用且不声称已显示',()=>{
 assert.deepEqual(groundControlState('door',true,false),{visible:false,disabled:true});
});
test('石路整体机位在横屏和窄屏中完整包含四角',()=>{
 for(const aspect of [.5,348/428,1,1086/558,3]){
  const preset=floorCameraPreset('overall',aspect);
  const camera=new PerspectiveCamera(42,aspect,.02,150);
  camera.position.set(...preset.position);camera.lookAt(...preset.target);camera.updateMatrixWorld();
  for(const x of [-3,3])for(const z of [-3,3]){
   const p=new Vector3(x,0,z).project(camera);
   assert.ok(Math.abs(p.x)<.99&&Math.abs(p.y)<.99&&p.z>-1&&p.z<1,`aspect=${aspect}, corner=${x},${z}, projection=${p.toArray()}`);
  }
 }
});
test('石路低角度近看机位不受整体适配影响',()=>{
 assert.deepEqual(floorCameraPreset('detail',.6),{position:[.5,.38,1.2],target:[0,0,0]});
});
