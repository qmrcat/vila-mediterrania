import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.min.js';
import {createPersonalAnimations} from '../personal-animations.js';
import {ISRAEL_FLAG_GEOMETRIES} from '../mods-personals/israel-flag-geometries.js';
import {ISRAEL_FLAG_ANIMATIONS} from '../mods-personals/israel-flag-animation.js';
import {createWorld,editWorld} from '../model.js';
import {createVillageGeometry,VillageScene} from '../scene.js';

test('optional animation registry keeps old mods valid and rejects invalid definitions',()=>{
  assert.doesNotThrow(()=>createPersonalAnimations(THREE,{},[],{}).update(1,[]));
  assert.throws(()=>createPersonalAnimations(THREE,{},[],null),/registre/);
  assert.throws(()=>createPersonalAnimations(THREE,{box:new THREE.BoxGeometry()},[],{box:{update(){},maxDisplacement:1}}),/personal registrada/);
  const g={testShape:new THREE.BoxGeometry()};
  for(const d of [{update:async()=>{},maxDisplacement:1},{update(){},maxDisplacement:-1},{update(){},maxDisplacement:Infinity}])
    assert.throws(()=>createPersonalAnimations(THREE,g,['testShape'],{testShape:d}));
  g.testShape.dispose();
});

test('flag waves without drift, keeps hoist fixed, pattern aligned and vertices inside declared bounds',()=>{
  const geometries=Object.fromEntries(Object.entries(ISRAEL_FLAG_GEOMETRIES).map(([id,fn])=>[id,fn(THREE)]));
  const rest=Object.fromEntries(Object.entries(geometries).map(([id,g])=>[id,new Float32Array(g.attributes.position.array)]));
  const animator=createPersonalAnimations(THREE,geometries,Object.keys(geometries),ISRAEL_FLAG_ANIMATIONS);
  for(const t of [0,.25,1,3,13,1000]){
    animator.update(t,Object.keys(geometries));
    for(const [id,g] of Object.entries(geometries)){
      const p=g.attributes.position,r=rest[id];let changed=0;
      for(let i=0;i<p.count;i++){
        assert(g.boundingBox.containsPoint(new THREE.Vector3().fromBufferAttribute(p,i)));
        if(r[i*3]===0)assert.deepEqual([p.getX(i),p.getY(i),p.getZ(i)],[r[i*3],r[i*3+1],r[i*3+2]]);
        if(p.getZ(i)!==r[i*3+2])changed++;
        // Both surfaces must follow this same displacement at the same X.
        const u=r[i*3]/.91;
        const delta=.065*u*(Math.sin(u*Math.PI*2.2-t*2.2)-Math.sin(u*Math.PI*2.2))+.012*u*Math.sin(t*3.1)*Math.sin(u*Math.PI*3);
        assert(Math.abs(p.getZ(i)-r[i*3+2]-delta)<1e-7);
      }
      if(t)assert(changed>0);
      assert(Array.from(g.attributes.normal.array).every(Number.isFinite));
    }
  }
  animator.update(0,Object.keys(geometries));
  for(const [id,g] of Object.entries(geometries)){assert.deepEqual(g.attributes.position.array,rest[id]);g.dispose();}
});

test('a shared geometry updates once per frame and unused geometries do not animate',()=>{
  const g={testShape:new THREE.BoxGeometry()};let calls=0;
  const animator=createPersonalAnimations(THREE,g,['testShape'],{testShape:{maxDisplacement:.1,update(){calls++;}}});
  animator.update(1,[]);assert.equal(calls,0);
  animator.update(1,['testShape','testShape']);assert.equal(calls,1);
  g.testShape.dispose();
});

test('scene uses shared animated shapes, survives rebuilding and obeys reduced motion',()=>{
  const world=createWorld('brava','empty');
  for(const x of [0,2]){editWorld(world,x,0,'land');editWorld(world,x,0,'flagIsrael');}
  const before=JSON.stringify(world),village=createVillageGeometry(world);
  assert.deepEqual(village.userData.animatedGeometryNames.sort(),['israelFlagCloth','israelFlagEmblem']);
  const cloth=village.children.find(m=>m.isInstancedMesh&&m.count===2&&m.geometry.attributes.position.count===576);
  assert(cloth);
  const geometry=cloth.geometry,rest=new Float32Array(geometry.attributes.position.array);
  const oldDocument=globalThis.document,oldRAF=globalThis.requestAnimationFrame;
  globalThis.document={hidden:false};globalThis.requestAnimationFrame=()=>0;
  const scene={village,reducedMotion:true,animalsMoving:false,time:{value:0},boats:{children:[]},renderer:{render(){}},frame(){}};
  try{
    VillageScene.prototype.frame.call(scene,1100);assert.deepEqual(geometry.attributes.position.array,rest);
    scene.reducedMotion=false;VillageScene.prototype.frame.call(scene,1100);assert.notDeepEqual(geometry.attributes.position.array,rest);
    const moving=new Float32Array(geometry.attributes.position.array);
    globalThis.document.hidden=true;VillageScene.prototype.frame.call(scene,2000);assert.deepEqual(geometry.attributes.position.array,moving);
    const rebuilt=createVillageGeometry(world);
    assert(rebuilt.children.some(m=>m.geometry===geometry));
    assert.equal(JSON.stringify(world),before);
    for(const group of [village,rebuilt])for(const m of group.children){m.dispose?.();if(m.userData.ownsGeometry)m.geometry.dispose();if(m.userData.ownsMaterial)m.material.dispose();}
  }finally{globalThis.document=oldDocument;globalThis.requestAnimationFrame=oldRAF;}
});
