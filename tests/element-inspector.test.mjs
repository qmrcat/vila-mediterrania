import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorld,editWorld,TREE_SPECIES,landmarkCells,patioCell} from '../model.js';
import {newDesign,resizeDesign} from '../designs.js';
import {inspectElement} from '../element-info.js';
import {createElementInspector} from '../element-inspector.js';
import {createPickingGeometry,VillageScene} from '../scene.js';
import {MeshBasicMaterial} from '../vendor/three.module.min.js';

const empty=()=>createWorld('brava','empty');
test('identifica totes les espècies d’arbre i copia l’estat sense modificar-lo',()=>{
  for(const tree of TREE_SPECIES){
    const world=empty();editWorld(world,0,0,tree.id);const before=JSON.stringify(world);
    const info=inspectElement(world,{x:0,z:0});assert.equal(info.name,tree.name);assert.equal(info.category,'Arbre');
    assert.deepEqual(JSON.parse(info.json),world.tiles[0]);assert.equal(JSON.stringify(world),before);
    world.tiles[0].elevation=2;assert.equal(JSON.parse(info.json).elevation,0);
  }
});
test('mar buit i referències invàlides no generen un element fictici',()=>{
  assert.equal(inspectElement(empty(),{x:0,z:0}),null);
  assert.equal(inspectElement(empty(),{entity:{collection:'unknown',index:0}}),null);
  assert.equal(inspectElement(empty(),{entity:{collection:'tiles',index:-1}}),null);
});
test('cases, negocis de cada planta, pati i rètols',()=>{
  const world=empty();editWorld(world,0,0,'house');editWorld(world,0,0,'house');
  const house=world.tiles[0];house.business={type:'bar',direction:0,name:'Can Joan',terrace:false};
  house.upperBusinesses=[{type:'bookshop',floor:1,direction:1,name:'Llibres',terrace:false}];
  house.patio={position:'back',direction:0};
  const ground=inspectElement(world,{x:0,z:0,level:0});
  assert.ok(ground.facts.some(([k,v])=>k==='Negoci'&&v.includes('Can Joan')));
  assert.ok(!ground.facts.some(([,v])=>v.includes('Llibres')));
  assert.ok(inspectElement(world,{x:0,z:0,level:1}).facts.some(([,v])=>v.includes('Llibres')));
  assert.deepEqual(JSON.parse(inspectElement(world,patioCell(house)).json),house);
});
test('edifici gran i disseny del jugador es resolen des de qualsevol cel·la',()=>{
  const world=empty(),castle={type:'castle',size:9,direction:1,x:0,z:0};world.landmarks.push(castle);
  for(const p of landmarkCells(castle))assert.deepEqual(JSON.parse(inspectElement(world,p).json),castle);
  const design=resizeDesign(newDesign(),2,2),custom={x:5,z:5,direction:0,design};world.customBuildings.push(custom);
  const info=inspectElement(world,{x:6,z:6});assert.equal(info.name,design.name);assert.deepEqual(JSON.parse(info.json),custom);
});
test('mercat, ajuntament, església, guingueta i terreny personal tenen nom',()=>{
  for(const [collection,element,name] of [
    ['markets',{x:0,z:0,size:4,direction:0,signName:'Mercat Nou'},'Mercat Nou'],
    ['townHalls',{x:0,z:0,size:4,direction:0},'Ajuntament'],
    ['churches',{x:0,z:0,direction:0},'Església'],
  ]){const w=empty();w[collection].push(element);assert.equal(inspectElement(w,{x:0,z:0}).name,name);}
  const w=empty();editWorld(w,0,0,'beach');w.tiles[0].beachBar={name:'La Mar',direction:0};
  assert.equal(inspectElement(w,{x:0,z:0}).name,'La Mar');
  const mod=empty();editWorld(mod,0,0,'pratHerbes');assert.equal(inspectElement(mod,{x:0,z:0}).name,'Prat d’herbes');
});
test('picking distingeix pont i terreny sota el pont, sense contaminar el JSON',()=>{
  const w=empty();for(let x=0;x<=3;x++)editWorld(w,x,0,'land');
  const bridge={a:{x:0,z:0},b:{x:3,z:0},type:'stone'};w.bridges.push(bridge);
  const material=new MeshBasicMaterial(),mesh=createPickingGeometry(w,material);
  try{
    const hits=mesh.userData.targets.filter(p=>p.x===1&&p.z===0);
    const deck=hits.find(p=>p.entity.collection==='bridges'),ground=hits.find(p=>p.entity.collection==='tiles');
    assert.ok(deck&&ground);assert.equal(inspectElement(w,deck).category,'Pont');
    assert.equal(inspectElement(w,ground).name,'Terra ferma');
    assert.deepEqual(JSON.parse(inspectElement(w,deck).json),bridge);
    for(const hit of mesh.userData.targets)assert.deepEqual(JSON.parse(inspectElement(w,hit).json),w[hit.entity.collection][hit.entity.index]);
  }finally{mesh.geometry.dispose();mesh.dispose();material.dispose();}
});

class Canvas extends EventTarget{focus(){}setPointerCapture(){}getBoundingClientRect(){return {left:0,top:0,right:500,bottom:500};}}
const emit=(target,type,extra={})=>{
  const event=new Event(type,{cancelable:true});
  for(const [key,value] of Object.entries({pointerId:1,clientX:10,clientY:10,button:0,buttons:1,pointerType:'mouse',...extra}))Object.defineProperty(event,key,{value});
  target.dispatchEvent(event);
};
test('Navega informa amb clic o toc; arrossegar, pinça, cancel·lar i clic dret no editen',()=>{
  const previous=globalThis.window;globalThis.window=new EventTarget();
  const canvas=new Canvas(),abort=new AbortController();let inspected=0,edited=0;
  const scene={canvas,abort,navigationOnly:true,cursor:{visible:false},world:empty(),scale:10,height:500,target:{x:0,z:0},theta:.7,phi:.9,
    pick:()=>({x:0,z:0}),onHover:()=>{},setCursor:()=>{},onInspect:()=>inspected++,onClick:()=>edited++,updateCamera:()=>{},zoom:()=>{},onTerrainStrokeEnd:()=>{}};
  try{
    VillageScene.prototype.installPointerControls.call(scene);
    const click=(extra={})=>{emit(canvas,'pointerdown',extra);emit(canvas,'pointerup',extra);};
    click();click({pointerType:'touch'});assert.equal(inspected,2);
    click({button:2});assert.equal(inspected,2);
    emit(canvas,'pointerdown');emit(canvas,'pointermove',{clientX:80});emit(canvas,'pointerup',{clientX:80});
    emit(canvas,'pointerdown');emit(canvas,'pointercancel');
    emit(canvas,'pointerdown',{pointerType:'touch'});emit(canvas,'pointerdown',{pointerId:2,pointerType:'touch'});
    emit(canvas,'pointerup',{pointerId:2,pointerType:'touch'});emit(canvas,'pointerup',{pointerType:'touch'});
    assert.equal(inspected,2);assert.equal(edited,0);
    scene.navigationOnly=false;click();click({button:2});assert.equal(edited,2);
  }finally{abort.abort();globalThis.window=previous;}
});

function dialogFixture(){
  const fields=new Map(),dialog={open:false,events:{},addEventListener(k,fn){this.events[k]=fn;},showModal(){this.open=true;},close(){this.open=false;this.events.close?.();},querySelector(id){if(!fields.has(id))fields.set(id,{hidden:false,value:'',textContent:'',events:{},addEventListener(k,fn){this.events[k]=fn;},replaceChildren(){},append(){},focus(){},select(){this.selected=true;}});return fields.get(id);}};
  return {dialog,field:id=>dialog.querySelector('#'+id)};
}
test('botó desactivat per config; còpia exacte i fallback en denegar el porta-retalls',async()=>{
  const previous=globalThis.document;globalThis.document={createElement:()=>({textContent:''})};
  try{
    const w=empty();editWorld(w,0,0,'pine');let copies=[];
    const off=dialogFixture(),disabled=createElementInspector(off.dialog,{writeText:async text=>copies.push(text)});
    disabled.open(w,{x:0,z:0});assert.equal(off.field('element-copy').hidden,true);
    await off.field('element-copy').events.click();assert.equal(copies.length,0);
    const on=dialogFixture(),enabled=createElementInspector(on.dialog,{allowJsonCopy:true,writeText:async text=>copies.push(text)});
    enabled.open(w,{x:0,z:0});await on.field('element-copy').events.click();assert.deepEqual(JSON.parse(copies[0]),w.tiles[0]);
    assert.match(on.field('element-copy-status').textContent,/copiat/);
    const fail=dialogFixture(),blocked=createElementInspector(fail.dialog,{allowJsonCopy:true,writeText:async()=>{throw new Error('denied');}});
    blocked.open(w,{x:0,z:0});await fail.field('element-copy').events.click();
    assert.equal(fail.field('element-json').hidden,false);assert.equal(fail.field('element-json').selected,true);
    assert.deepEqual(JSON.parse(fail.field('element-json').value),w.tiles[0]);
  }finally{globalThis.document=previous;}
});
