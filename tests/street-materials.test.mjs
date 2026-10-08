import test from'node:test';import assert from'node:assert/strict';import * as THREE from'three';
import{prepareMaterials}from'../src/street/materials.ts';
test('共用木材只调整一次，不随网格数量重复变黑；石墙不染色',()=>{
 const wood=new THREE.MeshStandardMaterial();wood.name='Wood_review';const stone=new THREE.MeshStandardMaterial();stone.name='Facade_Stone_PBR';
 const root=new THREE.Group(),g=new THREE.BoxGeometry();for(let i=0;i<30;i++)root.add(new THREE.Mesh(g,wood));root.add(new THREE.Mesh(g,stone));
 prepareMaterials(root,8);assert.deepEqual(wood.color.toArray(),new THREE.Color(0xc9bdaa).toArray());assert.deepEqual(stone.color.toArray(),[1,1,1]);
 g.dispose();wood.dispose();stone.dispose();
});
