/** Regenera music/playlist.json amb els àudios de la carpeta music.
 * Només cal per a allotjaments estàtics (Apache, GitHub Pages, Live Server):
 * el servidor inclòs (Inicia-Vila.exe, node server.mjs) genera la llista sol.
 * Executa: node genera-playlist.mjs */
import {readdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
const audio=/\.(mp3|ogg|oga|wav|m4a|aac|flac|opus|webm)$/i;
async function musicFiles(folder,prefix=''){
  let entries;try{entries=await readdir(folder,{withFileTypes:true});}catch(error){if(error.code==='ENOENT')return [];throw error;}
  const files=[];
  for(const entry of entries){
    if(entry.isSymbolicLink())continue;
    const name=prefix+entry.name;
    if(entry.isDirectory())files.push(...await musicFiles(resolve(folder,entry.name),name+'/'));
    else if(entry.isFile()&&audio.test(entry.name))files.push(name);
  }
  return files.sort((a,b)=>a.localeCompare(b,'ca',{numeric:true}));
}
const folder=resolve(dirname(fileURLToPath(import.meta.url)),'music');
const files=await musicFiles(folder);
await writeFile(resolve(folder,'playlist.json'),JSON.stringify(files,null,2)+'\n');
console.log(`music/playlist.json actualitzat amb ${files.length} pistes.`);
