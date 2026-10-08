import test from 'node:test';
import assert from 'node:assert/strict';
import {cameraPreset, groundPlacement, textureSpace, groundControlState, floorCameraPreset, inspectionGroundSize} from '../src/engine/inspection.ts';
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
test('建筑地面覆盖完整占地并保留 2 米贴图尺度，小样本仍为 6 米',()=>{
 assert.equal(inspectionGroundSize({width:.7,height:.8,depth:.7}),6);
 assert.equal(inspectionGroundSize({width:2.02,height:2.97,depth:.34}),6);
 assert.equal(inspectionGroundSize({width:15,height:10,depth:18}),22);
});
test('大建筑整体机位在横竖屏完整包含包围盒八角',()=>{
 const b={width:17,height:12,depth:20};
 for(const aspect of [.5,.81,1,1.95,3]){
  const pose=cameraPreset(b,'overall',aspect);
  const camera=new PerspectiveCamera(42,aspect,.02,300);
  camera.position.set(...pose.position);camera.lookAt(...pose.target);camera.updateMatrixWorld();
  for(const x of [-b.width/2,b.width/2])for(const y of [0,b.height])for(const z of [-b.depth/2,b.depth/2]){
   const p=new Vector3(x,y,z).project(camera);
   assert.ok(Math.abs(p.x)<.99&&Math.abs(p.y)<.99&&p.z<1,`aspect=${aspect}, p=${p.toArray()}`);
  }
 }
});
test('建筑近景使用约 1.6 米人眼高度，而不是悬浮在楼层中部',()=>{
 const pose=cameraPreset({width:18,height:8,depth:14},'detail',1.5);
 assert.equal(pose.target[1],1.6);
});
