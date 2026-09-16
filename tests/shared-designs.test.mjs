import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {once} from 'node:events';
import {newDesign,catalogFile,saveDesign,loadDesigns,DESIGN_KEY} from '../designs.js';
import {createWorld,editWorld,validateWorld} from '../model.js';
import {SHARED_CATALOG_URL,MAX_CATALOG_BYTES,parseSharedCatalog,loadSharedDesigns,mergePublishedDesign,copySharedDesign} from '../shared-designs.js';

const blueprint=(id,name=id)=>({...newDesign(),id,name});
const response=(data,options)=>new Response(typeof data==='string'?data:JSON.stringify(data),options);

test('el catàleg inicial existeix, és vàlid i no publica dissenys privats',async()=>{
  assert.equal(SHARED_CATALOG_URL.pathname.endsWith('/biblioteca/catalog.json'),true);
  assert.deepEqual(parseSharedCatalog(await readFile(SHARED_CATALOG_URL,'utf8')),[]);
});

test('afegir i actualitzar conserva els altres dissenys i els identificadors',()=>{
  const a=blueprint('a'),b=blueprint('b'),original=structuredClone([a,b]);
  const added=mergePublishedDesign([a,b],blueprint('c'));
  const updated=mergePublishedDesign(added.designs,{...b,name:'Casa reformada'});
  assert.deepEqual(updated.designs.map(d=>[d.id,d.name]),[['a','a'],['b','Casa reformada'],['c','c']]);
  assert.deepEqual([a,b],original);
  assert.equal(added.designs[1].name,'b');
  updated.designs[0].ground[0].faces[0]='blank';
  assert.equal(a.ground[0].faces[0],'door');
});

test('diverses exportacions i reobrir un catàleg del disc conserven les addicions pendents',()=>{
  const first=mergePublishedDesign([],blueprint('primer'));
  const resumed=parseSharedCatalog(JSON.stringify(first));
  const second=mergePublishedDesign(resumed,blueprint('segon'));
  assert.deepEqual(second.designs.map(d=>d.id),['primer','segon']);
});

test('la còpia privada no sobreescriu un disseny local amb el mateix id',()=>{
  const data=new Map(),storage={getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value)};
  const local=blueprint('mateix','Privat'),shared=blueprint('mateix','Compartit');
  saveDesign(storage,local);const before=data.get(DESIGN_KEY);
  const copy=copySharedDesign(shared);
  assert.notEqual(copy.id,shared.id);assert.equal(data.get(DESIGN_KEY),before);
  saveDesign(storage,copy);
  assert.equal(loadDesigns(storage).length,2);
  assert.deepEqual(loadDesigns(storage)[0],local);
  copy.ground[0].color='#ffffff';
  assert.notEqual(shared.ground[0].color,copy.ground[0].color);
});

test('la vila incorpora una còpia i es pot recuperar sense el catàleg compartit',()=>{
  const design=blueprint('publicat'),world=createWorld('brava','empty');
  editWorld(world,0,0,'land');
  const result=editWorld(world,0,0,'custom',{customDesign:design,customDirection:0});
  assert.equal(result.changed,true);
  const snapshot=structuredClone(world.customBuildings[0].design);
  design.name='Nom nou';design.ground[0].color='#ffffff';
  const restored=validateWorld(JSON.parse(JSON.stringify(world)));
  assert.deepEqual(restored.customBuildings[0].design,snapshot);
});

test('un catàleg incorrecte no es converteix silenciosament en una biblioteca buida',()=>{
  for(const invalid of ['<html>Error</html>','{}',JSON.stringify({format:'vila-buildings',version:999,designs:[]}),JSON.stringify(catalogFile([blueprint('repetit'),blueprint('repetit')]))]){
    assert.throws(()=>parseSharedCatalog(invalid));
  }
  const design=blueprint('incompatible');design.roof[0].type='codi-arbitrari';
  assert.throws(()=>parseSharedCatalog(JSON.stringify({format:'vila-buildings',version:4,designs:[design]})));
});

test('límit de 100 dissenys: es pot actualitzar però no afegir-ne més',()=>{
  const full=Array.from({length:100},(_,i)=>blueprint('d'+i));
  assert.equal(mergePublishedDesign(full,{...full[0],name:'Actualitzat'}).designs.length,100);
  assert.throws(()=>mergePublishedDesign(full,blueprint('nou')),/100/);
  assert.equal(full[0].name,'d0');assert.equal(full.length,100);
});

test('un disseny invàlid no altera el catàleg de treball',()=>{
  const designs=[blueprint('segur')],original=structuredClone(designs);
  assert.throws(()=>mergePublishedDesign(designs,{...designs[0],width:20}));
  assert.deepEqual(designs,original);
});

test('la càrrega ignora la memòria cau HTTP i valida les dades rebudes',async()=>{
  const design=blueprint('servidor');let called=false;
  const designs=await loadSharedDesigns({fetcher:async(url,options)=>{
    called=true;assert.equal(url,SHARED_CATALOG_URL);assert.equal(options.cache,'no-store');
    assert.ok(options.signal instanceof AbortSignal);return response(catalogFile([design]));
  }});
  assert.equal(called,true);assert.deepEqual(designs,[design]);
});

test('errors HTTP, connexió i contingut invàlid es comuniquen',async()=>{
  await assert.rejects(loadSharedDesigns({fetcher:async()=>response('',{status:404})}),/HTTP 404/);
  await assert.rejects(loadSharedDesigns({fetcher:async()=>{throw new TypeError('Failed to fetch');}}),/connexió/);
  await assert.rejects(loadSharedDesigns({fetcher:async()=>response('<html>404</html>')}),/JSON vàlid/);
});

test('la càrrega s’atura si el servidor triga massa',async()=>{
  await assert.rejects(loadSharedDesigns({timeout:10,fetcher:(_url,{signal})=>new Promise((_resolve,reject)=>{
    signal.addEventListener('abort',()=>reject(signal.reason),{once:true});
  })}),/triga massa/);
});

test('límit de mida tant a la capçalera com al cos, comptant bytes UTF-8',async()=>{
  assert.throws(()=>parseSharedCatalog('à'.repeat(MAX_CATALOG_BYTES/2+1)),/2 MB/);
  await assert.rejects(loadSharedDesigns({fetcher:async()=>response('{}',{headers:{'content-length':String(MAX_CATALOG_BYTES+1)}})}),/2 MB/);
  await assert.rejects(loadSharedDesigns({fetcher:async()=>response(' '.repeat(MAX_CATALOG_BYTES+1))}),/2 MB/);
});

test('la lectura funciona sota una subcarpeta com GitHub Pages',async t=>{
  const catalog=await readFile(SHARED_CATALOG_URL,'utf8'),requests=[];
  const server=createServer((req,res)=>{
    requests.push(req.url);
    if(req.url==='/vila-mediterrania/biblioteca/catalog.json'){
      res.writeHead(200,{'content-type':'application/json'});res.end(catalog);
    }else{res.writeHead(404);res.end();}
  });
  server.listen(0,'127.0.0.1');await once(server,'listening');
  t.after(()=>new Promise(resolve=>{server.close(resolve);server.closeAllConnections();}));
  const url=new URL(`http://127.0.0.1:${server.address().port}/vila-mediterrania/biblioteca/catalog.json`);
  assert.deepEqual(await loadSharedDesigns({url}),[]);
  assert.deepEqual(requests,['/vila-mediterrania/biblioteca/catalog.json']);
});
