import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {plan,PAGES} from '../eines/actualitza-versio.mjs';

test('les versions de publicació estan al dia (node eines/actualitza-versio.mjs)',async()=>{
  const {changes}=await plan();
  assert.deepEqual([...changes.keys()],[],'Executa node eines/actualitza-versio.mjs abans de publicar.');
});

test('cap import porta ?v=: el resol l’import map i no es carrega dues vegades',async()=>{
  const {notes}=await plan();
  assert.deepEqual(notes.filter(n=>n.includes('avís')),[]);
  for(const page of PAGES){
    const html=await readFile(new URL('../'+page,import.meta.url),'utf8');
    const map=JSON.parse(/<script type="importmap">([\s\S]*?)<\/script>/.exec(html)[1]).imports;
    for(const file of Object.keys(map)){
      const source=await readFile(new URL(file,new URL('../'+page,import.meta.url)),'utf8');
      assert.doesNotMatch(source,/(?:\bfrom\s*|\bimport\s*\(?\s*)['"]\.{1,2}\/[^'"]+\.js\?/,`${file} té un ?v= en un import`);
    }
  }
});
