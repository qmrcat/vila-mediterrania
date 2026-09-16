import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {menuMetadata,validateMenuOrder,orderMenuEntries} from '../menu-order.js';
import {groupBuildings} from '../building-categories.js';
import {orderSelect,initPersonalMenus,MENU_RULES} from '../personal-menus.js';

const entries=(...ids)=>ids.map(id=>({id,group:'base'}));
const ids=items=>items.map(e=>e.id);
test('sense regles es conserva l’ordre i les dades originals',()=>{
  const input=entries('land','meadow','other');
  assert.deepEqual(orderMenuEntries(input),input);
  assert.notEqual(orderMenuEntries(input)[0],input[0]);
});
test('un terreny surt del grup agrícola i segueix la pradera',()=>{
  const input=[...entries('land','meadow','rocky'),{id:'herbes',group:'agricultural'}];
  const result=orderMenuEntries(input,{herbes:{menuAfter:'meadow'}});
  assert.deepEqual(ids(result),['land','meadow','herbes','rocky']);
  assert.equal(result[2].group,'base');assert.equal(input[3].group,'agricultural');
});
test('cadenes, dependències declarades fora d’ordre i germans estables',()=>{
  const input=entries('a','z','c','b','d');
  const rules={c:{menuAfter:'b'},b:{menuAfter:'a'},d:{menuAfter:'a'}};
  const output=orderMenuEntries(input,rules);
  assert.deepEqual(ids(output),['a','b','c','d','z']);
  assert.deepEqual(orderMenuEntries(output,rules),output);
});
test('referència absent o al mateix element conserva totes les opcions',()=>{
  const warnings=[],input=entries('a','b','c');
  assert.deepEqual(orderMenuEntries(input,{a:{menuAfter:'a'},b:{menuAfter:'absent'}},m=>warnings.push(m)),input);
  assert.equal(warnings.length,2);
});
test('cicles i descendents d’un cicle no bloquegen ni perden opcions',()=>{
  const input=entries('z','a','b','c','d');
  const rules={a:{menuAfter:'b'},b:{menuAfter:'a'},d:{menuAfter:'a'}};
  const output=orderMenuEntries(input,rules);
  assert.equal(output.length,input.length);assert.equal(new Set(ids(output)).size,input.length);
  assert.deepEqual(ids(output),['z','a','d','b','c']);
  assert.deepEqual(orderMenuEntries(output,rules),output);
});
test('edifici i variants hereten la categoria de la referència',()=>{
  const tools=new Map([['school','Escola'],['theatre','Teatre'],['customHall','Sala'],['variant','Variant'],['building-sign','Rètol']]);
  const personal={variant:{menuAfter:'customHall'},customHall:{menuAfter:'theatre'}};
  const groups=groupBuildings(tools,personal);
  assert.deepEqual(groups.find(g=>g.id==='culture').entries.map(e=>e[0]),['school','theatre','customHall','variant']);
  assert.equal(groups.some(g=>g.id==='personal'),false);
  assert.equal(groups.at(-1).id,'signs');
});
test('la configuració comuna preval sobre menuAfter del mod',()=>{
  const tools=new Map([['school','Escola'],['theatre','Teatre'],['customHall','Sala']]);
  const groups=groupBuildings(tools,{customHall:{menuAfter:'theatre'}},{customHall:{menuAfter:'school'}});
  assert.deepEqual(groups[0].entries.map(e=>e[0]),['school','customHall','theatre']);
});
test('ponts, monuments, arbres, negocis i valors numèrics utilitzen el mateix motor',()=>{
  for(const [a,b] of [['classic','stone'],['castle','wall'],['pine','olive'],['bar','bakery'],['0','1']]){
    assert.deepEqual(ids(orderMenuEntries(entries(a,b),{[a]:{menuAfter:b}})),[b,a]);
  }
});
test('validació de la propietat i de les regles per qualsevol selector',()=>{
  assert.deepEqual(menuMetadata({menuAfter:' meadow '},'herbes'),{menuAfter:'meadow'});
  assert.deepEqual(menuMetadata({},'antic'),{});
  for(const value of [null,4,'',[],{}])assert.throws(()=>menuMetadata({menuAfter:value},'error'));
  const valid=validateMenuOrder({'bridge-type':{classic:{menuAfter:'stone'}},'new-selector':{'1':{menuAfter:'0'}}});
  assert.equal(valid['bridge-type'].classic.menuAfter,'stone');
  for(const value of [null,[],{'bad selector':{}},{'bridge-type':[]},{'bridge-type':{classic:{}}}])assert.throws(()=>validateMenuOrder(value));
});
test('els quatre registres conserven menuAfter i el catàleg antic segueix sent vàlid',async t=>{
  const dir=await mkdtemp(join(tmpdir(),'vila-menu-'));t.after(()=>rm(dir,{recursive:true,force:true}));
  await mkdir(join(dir,'mods-personals'));
  for(const file of ['personal-content.js','menu-order.js'])await writeFile(join(dir,file),await readFile(new URL('../'+file,import.meta.url)));
  const catalog=`export const REQUIRES_MOD_API=1;
export const PERSONAL_LANDMARKS={sala:{name:'Sala',sizes:[1],height:1,help:'Ajuda',menuAfter:'theatre'},torre:{name:'Torre',sizes:[1],height:1,help:'Ajuda',category:'monument',menuAfter:'castle'}};
export const PERSONAL_TERRAINS={herbes:{name:'Herbes',color:'#ffffff',height:1,description:'Herba',menuAfter:'meadow'}};
export const PERSONAL_TREES=[{id:'arbre',name:'Arbre',height:1,description:'Fulles',menuAfter:'pine'}];
export const PERSONAL_BUSINESSES={botiga:{name:'Botiga',accent:'#ffffff',frame:'#ffffff',awning:'#ffffff',description:'Botiga',menuAfter:'bar'}};`;
  await writeFile(join(dir,'mods-personals/catalog.js'),catalog);
  const m=await import(pathToFileURL(join(dir,'personal-content.js')));
  assert.equal(m.PERSONAL_LANDMARKS.sala.menuAfter,'theatre');assert.equal(m.PERSONAL_LANDMARKS.torre.menuAfter,'castle');
  assert.equal(m.PERSONAL_TERRAINS.herbes.menuAfter,'meadow');assert.equal(m.PERSONAL_TREES[0].menuAfter,'pine');
  assert.equal(m.PERSONAL_BUSINESSES.botiga.menuAfter,'bar');assert.equal(Object.keys(m.PERSONAL_MENU_ORDER).length,0);
  assert.equal(m.MOD_API_VERSION,1);
});

// Small DOM fixture: verifies node identity, optgroup placement and selection,
// without a browser, a renderer, or third-party dependencies.
class Node {
  constructor(tag,value){this.tagName=tag;this.value=value;this.children=[];this.parentElement=null;}
  get firstElementChild(){return this.children[0]??null;}
  get nextElementSibling(){return this.parentElement?.children[this.parentElement.children.indexOf(this)+1]??null;}
  get options(){return this.children.flatMap(n=>n.tagName==='OPTION'?[n]:n.options);}
  append(...nodes){for(const node of nodes)this.insertBefore(node,null);}
  insertBefore(node,boundary){
    if(node.parentElement){const a=node.parentElement.children;a.splice(a.indexOf(node),1);}
    node.parentElement=this;const index=boundary?this.children.indexOf(boundary):this.children.length;this.children.splice(index,0,node);
  }
  closest(tag){return this.tagName===tag.toUpperCase()?this:this.parentElement?.closest(tag);}
}
const option=id=>new Node('OPTION',id);
test('DOM: mou el mod fora de l’optgroup, conserva selecció i no repeteix mutacions',()=>{
  const select=new Node('SELECT'),group=new Node('OPTGROUP'),meadow=option('meadow'),herbes=option('herbes');
  select.append(option('land'),meadow,option('rocky'),group);group.append(option('vineyard'),herbes);select.value='herbes';
  const rules={herbes:{menuAfter:'meadow'}};
  assert.equal(orderSelect(select,rules),true);
  assert.deepEqual(select.options.map(o=>o.value),['land','meadow','herbes','rocky','vineyard']);
  assert.equal(herbes.parentElement,select);assert.equal(select.value,'herbes');
  assert.equal(orderSelect(select,rules),false);
});
test('DOM: respecta les opcions sense grup abans i després dels optgroups',()=>{
  const select=new Node('SELECT'),group=new Node('OPTGROUP'),custom=option('custom');
  select.append(option('first'),group,option('rename'),option('none'));group.append(option('bar'),custom);
  orderSelect(select,{custom:{menuAfter:'rename'}});
  assert.deepEqual(select.children.map(n=>n.value??'group'),['first','group','rename','custom','none']);
  assert.equal(orderSelect(select,{custom:{menuAfter:'rename'}}),false);
});
test('DOM: referències que arriben tard i opcions reconstruïdes es tornen a ordenar',()=>{
  const previous=globalThis.MutationObserver;let callback;
  globalThis.MutationObserver=class{constructor(fn){callback=fn;}observe(){}disconnect(){}};
  try{
    const select=new Node('SELECT');select.id='bridge-type';select.value='classic';
    const controller=initPersonalMenus({querySelectorAll:()=>[select]},{'bridge-type':{classic:{menuAfter:'stone'}}});
    for(let i=0;i<2;i++){
      select.children=[];select.append(option('classic'),option('stone'));
      callback([{target:select}]);
      assert.deepEqual(select.options.map(o=>o.value),['stone','classic']);assert.equal(select.value,'classic');
    }
    controller.dispose();
  }finally{globalThis.MutationObserver=previous;}
});
