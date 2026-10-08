import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveTavernVariant,isTavernVariant} from '../src/engine/variants.ts';
test('升级版缺失降级到原件；两个都缺失则不可用',()=>{
 assert.equal(resolveTavernVariant('upgraded',false,true),'tavern');
 assert.equal(resolveTavernVariant('upgraded',false,false),null);
 assert.equal(resolveTavernVariant('original',true,false),'tavern-upgrade');
});
test('已加载时遵循明确的原版/升级版选择',()=>{
 assert.equal(resolveTavernVariant('upgraded',true,true),'tavern-upgrade');
 assert.equal(resolveTavernVariant('original',true,true),'tavern');
 assert.equal(isTavernVariant('shack'),false);
 assert.equal(isTavernVariant('tavern-upgrade'),true);
});
