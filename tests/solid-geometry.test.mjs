import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.min.js';
import {booleanGeometry,composeGeometry} from '../solid-geometry.js';
import {createPersonalGeometries} from '../personal-geometries.js';
import {BOOLEAN_EXAMPLES} from '../mods-personals/exemples-booleans.js';
import {partMaterialKey,createPartMaterial,createPartMeshes} from '../part-materials.js';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
function volume(g){
  const p=g.attributes.position,idx=g.index;let v=0;
  for(let i=0;i<(idx?.count??p.count);i+=3){
    const [a,b,c]=[0,1,2].map(j=>new THREE.Vector3().fromBufferAttribute(p,idx?idx.getX(i+j):i+j));v+=a.dot(b.cross(c))/6;
  }
  return v;
}
function hit(g,x,y){
  const m=new THREE.MeshBasicMaterial(),mesh=new THREE.Mesh(g,m);mesh.updateMatrixWorld();
  const result=new THREE.Raycaster(new THREE.Vector3(x,y,2),new THREE.Vector3(0,0,-1)).intersectObject(mesh);m.dispose();return result;
}
test('union, subtraction and intersection have the expected volumes; originals stay unchanged',()=>{
  const a=new THREE.BoxGeometry(1,1,1),b=new THREE.BoxGeometry(1,1,1),rest=new Float32Array(a.attributes.position.array);
  for(const [op,expected] of [['union',1.5],['subtract',.5],['intersect',.5]]){
    const result=booleanGeometry(THREE,op,a,{geometry:b,position:[.5,0,0]});assert(Math.abs(volume(result)-expected)<1e-6);result.dispose();
  }
  assert.deepEqual(a.attributes.position.array,rest);a.dispose();b.dispose();
});
test('identical, disjoint and completely removed operands give consistent results',()=>{
  const a=new THREE.BoxGeometry(),b=new THREE.BoxGeometry();
  for(const op of ['union','intersect']){const r=booleanGeometry(THREE,op,a,b);assert(Math.abs(volume(r)-1)<1e-6);r.dispose();}
  assert.throws(()=>booleanGeometry(THREE,'subtract',a,b),/buit/);
  assert.throws(()=>booleanGeometry(THREE,'intersect',a,{geometry:b,position:[3,0,0]}),/buit/);
  const restored=composeGeometry(THREE,a,[{operation:'subtract',operand:b},{operation:'union',operand:b}]);assert(Math.abs(volume(restored)-1)<1e-6);restored.dispose();
  a.dispose();b.dispose();
});
test('mirroring, scaling and rotations preserve outward orientation',()=>{
  const a=new THREE.BoxGeometry(),b=new THREE.BoxGeometry(.2,.2,3);
  const r=booleanGeometry(THREE,'subtract',{geometry:a,scale:[-2,1,1]},{geometry:b,rotation:[0,0,Math.PI/4]});
  assert(Math.abs(volume(r)-1.96)<1e-5);assert.equal(hit(r,0,0).length,0);r.dispose();a.dispose();b.dispose();
});
test('circular tunnel and three holes are real openings with solid surrounding walls',()=>{
  const shapes=createPersonalGeometries(THREE,{},BOOLEAN_EXAMPLES);
  assert.equal(hit(shapes.csgCubForadat,0,.5).length,0);assert(hit(shapes.csgCubForadat,.4,.5).length>0);
  for(const x of [-.3,0,.3])assert.equal(hit(shapes.csgTresForats,x,.56).length,0);
  assert(hit(shapes.csgTresForats,.15,.56).length>0);
  for(const g of Object.values(shapes)){assert(volume(g)>0);g.dispose();}
});
test('custom hollow geometries can be operands',()=>{
  const shape=new THREE.Shape();shape.moveTo(-.5,0);shape.lineTo(.5,0);shape.lineTo(.5,1);shape.lineTo(-.5,1);shape.closePath();
  const hole=new THREE.Path();hole.moveTo(-.38,.12);hole.lineTo(.38,.12);hole.lineTo(.38,.88);hole.lineTo(-.38,.88);hole.closePath();shape.holes.push(hole);
  const frame=new THREE.ExtrudeGeometry(shape,{depth:1,bevelEnabled:false}).translate(0,0,-.5),drill=new THREE.BoxGeometry(.25,.3,2);
  const result=booleanGeometry(THREE,'subtract',frame,{geometry:drill,position:[0,.08,0]});
  assert.equal(hit(result,0,.05).length,0);assert.equal(hit(result,0,.5).length,0);assert(hit(result,.44,.5).length>0);
  result.dispose();frame.dispose();drill.dispose();
});
test('invalid operations and transforms fail clearly',()=>{
  const a=new THREE.BoxGeometry();
  assert.throws(()=>booleanGeometry(THREE,'notAnOperation',a,a),/desconeguda/);
  assert.throws(()=>booleanGeometry(THREE,'union',a,{geometry:a,scale:[0,1,1]}),/scale/);
  assert.throws(()=>booleanGeometry(THREE,'union',a,{geometry:a,position:[NaN,0,0]}),/finits/);
  assert.throws(()=>booleanGeometry(THREE,'union',a,{}),/BufferGeometry/);a.dispose();
});
test('materials distinguish opacity, reuse equivalent keys and retain old colours',()=>{
  assert.equal(partMaterialKey('#123456'),'#123456');
  assert.equal(partMaterialKey({color:'#ABCDEF',opacity:.3}),partMaterialKey({opacity:.3,color:'#abcdef'}));
  assert.notEqual(partMaterialKey({color:'#abcdef',opacity:.3}),partMaterialKey({color:'#abcdef',opacity:.8}));
  for(const opacity of [-1,2,NaN])assert.throws(()=>partMaterialKey({color:'#abcdef',opacity}),/opacity/);
  const glass=createPartMaterial(THREE,{color:'#88ddff',opacity:.3,doubleSide:true});
  assert(glass.transparent);assert.equal(glass.depthWrite,false);assert.equal(glass.side,THREE.DoubleSide);
  const old=createPartMaterial(THREE,'#ffe9a0');assert.equal(old.emissiveIntensity,.8);assert.equal(old.transparent,false);
  glass.dispose();old.dispose();
});
test('transparent meshes are sortable individually and opaque meshes remain instanced',()=>{
  const g=new THREE.BoxGeometry(),matrices=[new THREE.Matrix4(),new THREE.Matrix4().makeTranslation(3,0,0)];
  const glass=createPartMaterial(THREE,{color:'#88ddff',opacity:.3}),stone=createPartMaterial(THREE,'#cab897');
  const panes=createPartMeshes(THREE,g,glass,matrices),blocks=createPartMeshes(THREE,g,stone,matrices);
  assert.equal(panes.length,2);assert(panes.every(m=>m.isMesh&&!m.isInstancedMesh&&!m.castShadow));assert.equal(panes[1].position.x,3);
  assert.equal(blocks.length,1);assert(blocks[0].isInstancedMesh);assert.equal(blocks[0].count,2);
  const hidden=createPartMaterial(THREE,{color:'#ffffff',opacity:0});assert.equal(createPartMeshes(THREE,g,hidden,matrices).length,0);
  blocks[0].dispose();g.dispose();glass.dispose();stone.dispose();hidden.dispose();
});

test('full game integration works with empty registries and with a CSG landmark and two glass materials',()=>{
  const root=fileURLToPath(new URL('../',import.meta.url)),temp=fs.mkdtempSync(path.join(os.tmpdir(),'vila-csg-test-'));
  try{
    for(const name of fs.readdirSync(root))if(name.endsWith('.js'))fs.copyFileSync(path.join(root,name),path.join(temp,name));
    fs.cpSync(path.join(root,'vendor'),path.join(temp,'vendor'),{recursive:true});
    fs.mkdirSync(path.join(temp,'mods-personals'));fs.writeFileSync(path.join(temp,'package.json'),'{"type":"module"}');
    fs.copyFileSync(path.join(root,'mods-personals/exemples-booleans.js'),path.join(temp,'mods-personals/exemples-booleans.js'));
    for(const enabled of [false,true]){
      fs.writeFileSync(path.join(temp,'mods-personals/catalog.js'),`export const REQUIRES_MOD_API=1,PERSONAL_LANDMARKS=${enabled?"{csgTest:{name:'Taller',help:'Prova',sizes:[1],height:1.2}}":"{}"},PERSONAL_TERRAINS={},PERSONAL_TREES=[],PERSONAL_BUSINESSES={};`);
      fs.writeFileSync(path.join(temp,'mods-personals/renderers.js'),`
        ${enabled?"export {BOOLEAN_EXAMPLES as PERSONAL_GEOMETRIES} from './exemples-booleans.js';":''}
        export const PERSONAL_LANDMARK_RENDERERS=${enabled?`{csgTest(l,part){
          part('csgCubForadat','#cab897',0,0,0,1,1,1);
          part('box',{color:'#88ddff',opacity:.3},0,.5,0,.4,.4,.02);
          part('box',{color:'#88ddff',opacity:.7},.4,.5,0,.1,.3,.02);
        }}`:'{}'},PERSONAL_TERRAIN_RENDERERS={},PERSONAL_TREE_RENDERERS={},PERSONAL_RETAIL_RENDERERS={};`);
      const script=`import assert from 'node:assert/strict';
        import {createVillageGeometry} from './scene.js';
        import {createWorld,editWorld,validateWorld} from './model.js';
        const world=createWorld('brava','empty');
        for(const x of [0,2]){editWorld(world,x,0,'land');if(${enabled})assert(editWorld(world,x,0,'csgTest',{landmarkDirection:x?1:0}).changed);}
        const original=JSON.stringify(world),group=createVillageGeometry(world),panes=group.children.filter(m=>m.material?.transparent&&[.3,.7].includes(m.material.opacity));
        assert.equal(panes.length,${enabled?4:0});assert(panes.every(m=>!m.isInstancedMesh&&!m.material.depthWrite));
        assert.equal(JSON.stringify(world),original);validateWorld(JSON.parse(original));
        if(${enabled})assert(group.children.some(m=>m.isInstancedMesh&&m.count===2));`;
      execFileSync(process.execPath,['--input-type=module','-e',script],{cwd:temp,stdio:'pipe'});
    }
  }finally{fs.rmSync(temp,{recursive:true,force:true});}
});
