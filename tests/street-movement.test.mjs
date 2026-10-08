import test from'node:test';import assert from'node:assert/strict';
import{movePlayer,isWalkable,PLAYER}from'../src/street/movement.ts';
import{bounds,obstacles,viewpoints,buildings}from'../src/street/layout.ts';
const empty={minX:-100,maxX:100,minZ:-100,maxZ:100},start={x:0,z:0};
test('出生和三个地面观察点可达，建筑占地不重叠',()=>{
 for(const p of Object.values(viewpoints))assert.ok(isWalkable(p,obstacles,bounds));
 const[a,b]=buildings.map(b=>b.footprint);assert.ok(a.maxX<b.minX||b.maxX<a.minX||a.maxZ<b.minZ||b.maxZ<a.minZ);
});
test('人物速度按米计，斜向输入不会加速，长帧被限幅',()=>{
 const a=movePlayer(start,{forward:1,right:0},0,.05,[],empty),b=movePlayer(start,{forward:1,right:1},0,.05,[],empty);
 assert.ok(Math.abs(Math.hypot(a.x,a.z)-PLAYER.speed*.05)<1e-9);assert.ok(Math.abs(Math.hypot(a.x,a.z)-Math.hypot(b.x,b.z))<1e-9);
 assert.deepEqual(movePlayer(start,{forward:1,right:0},0,10,[],empty),a);
});
test('旋转方向正确，无效输入不产生 NaN',()=>{
 const a=movePlayer(start,{forward:1,right:0},Math.PI/2,.05,[],empty);assert.ok(a.x<0&&Math.abs(a.z)<1e-9);
 assert.deepEqual(movePlayer(start,{forward:NaN,right:0},0,.05,[],empty),start);
 assert.deepEqual(movePlayer(start,{forward:1,right:0},0,Infinity,[],empty),start);
});
test('碰撞保持玩家半径，不穿薄墙，沿墙滑动',()=>{
 const wall=[{minX:.4,maxX:.45,minZ:-4,maxZ:4}];let p={...start};
 for(let i=0;i<500;i++)p=movePlayer(p,{forward:1,right:1},0,.05,wall,empty);
 // Stay near the wall for the collision-specific assertion (before passing its end).
 p={...start};for(let i=0;i<20;i++)p=movePlayer(p,{forward:1,right:1},0,.05,wall,empty);
 assert.ok(p.x<=.4-PLAYER.radius+1e-9&&p.z<-.5);assert.ok(isWalkable(p,wall,empty));
 assert.equal(isWalkable({x:.2,z:0},wall,empty),false);
});
test('世界边界不能越过；测试路线每个采样点合法',()=>{
 let p={...viewpoints.entry};for(let i=0;i<2000;i++){p=movePlayer(p,{forward:-1,right:1},0,.05,obstacles,bounds);assert.ok(isWalkable(p,obstacles,bounds));}
 assert.ok(p.x<=bounds.maxX-PLAYER.radius&&p.z<=bounds.maxZ-PLAYER.radius);
 for(let z=2;z<=19;z+=.1)assert.ok(isWalkable({x:7,z},obstacles,bounds),'入口到酒馆通路');
 for(let x=-4;x<=7;x+=.1)assert.ok(isWalkable({x,z:14},obstacles,bounds),'转角通路');
});
