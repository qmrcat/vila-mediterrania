/** Actualitza les versions de publicació. Executa abans de pujar canvis:
 *   node eines/actualitza-versio.mjs          recalcula els ?v= dels fitxers modificats
 *   node eines/actualitza-versio.mjs 101      a més, passa el joc a la versió 101
 *   node eines/actualitza-versio.mjs --comprova   només diu si cal executar-lo (codi 1)
 *
 * Cada mòdul rep un ?v= amb l'empremta del seu contingut, escrit a l'import map
 * de cada pàgina. Així el navegador (i la memòria cau de GitHub Pages) no pot
 * barrejar un app.js nou amb un model.js antic, i un fitxer sense canvis
 * conserva la mateixa adreça. Els imports del codi no porten mai ?v=.
 * Només fa servir mòduls estàndard de Node.js. */
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {dirname,resolve,relative,sep} from 'node:path';

// Aquest fitxer és a eines/; la carpeta del joc és la de sobre.
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
export const PAGES=['index.html','editor.html','editor-mods/index.html'];
const START='<!-- versions:inici · generat per actualitza-versio.mjs; no l’editis a mà -->',END='<!-- versions:final -->';
const importPattern=/(?:\bfrom\s*|\bimport\s*\(?\s*)(['"])(\.{1,2}\/[^'"?]+?\.js)(?:\?[^'"]*)?\1/g;
// Camins en cadenes, com la llista de editor-mods/shapes.js que acaba a import(path).
const literalPattern=/(['"])(\.{1,2}\/[^'"?\s]+?\.js)\1/g;
const entryPattern=/(<script\b[^>]*\bsrc=")(\.{1,2}\/[^"?]+?\.js)(?:\?[^"]*)?(")|(<link\b[^>]*\bhref=")(\.{1,2}\/[^"?]+?\.css)(?:\?[^"]*)?(")|(\bimport\(\s*')(\.{1,2}\/[^'?]+?\.js)(?:\?[^']*)?(')/g;

// Amb core.autocrlf, Windows pot tenir CRLF on GitHub té LF: l'empremta i les
// comparacions no han de dependre dels finals de línia.
const lf=text=>text.replace(/\r\n/g,'\n');
const read=async file=>lf(await readFile(resolve(root,file),'utf8'));
const fingerprint=async file=>createHash('sha256').update(await read(file)).digest('hex').slice(0,10);
const toPosix=path=>path.split(sep).join('/');
const fromPage=(page,file)=>{const path=toPosix(relative(dirname(resolve(root,page)),resolve(root,file)));return path.startsWith('.')?path:'./'+path;};

/** Mòduls que una pàgina pot carregar, seguint els imports estàtics i dinàmics. */
async function moduleGraph(page,html){
  const pending=[],seen=new Set(),skipped=new Set(),optional=new Set();
  const visit=(from,specifier,maybe=false)=>{
    const file=toPosix(relative(root,resolve(dirname(resolve(root,from)),specifier)));
    if(file.startsWith('..'))return;
    if(!maybe)optional.delete(file);
    if(!seen.has(file)){seen.add(file);pending.push(file);if(maybe)optional.add(file);}
  };
  for(const match of html.matchAll(entryPattern))if(match[2]||match[8])visit(page,match[2]??match[8]);
  for(const match of html.replace(/<script type="importmap">[\s\S]*?<\/script>/g,'').matchAll(/<script type="module">([\s\S]*?)<\/script>/g))
    for(const inner of match[1].matchAll(importPattern))visit(page,inner[2]);
  const modules=[];
  while(pending.length){
    const file=pending.shift();
    let source;try{source=await read(file);}catch(error){if(error.code!=='ENOENT')throw error;if(!optional.has(file))skipped.add(file);continue;}
    modules.push(file);
    for(const match of source.matchAll(importPattern))visit(file,match[2]);
    for(const match of source.matchAll(literalPattern))visit(file,match[2],true);
  }
  return {modules:modules.sort(),skipped:[...skipped]};
}

async function versionedPage(page,version){
  let html=await read(page);
  const hashes=new Map(),hashOf=async file=>{if(!hashes.has(file))hashes.set(file,await fingerprint(file));return hashes.get(file);};
  const {modules,skipped}=await moduleGraph(page,html);
  // Fitxers d'entrada que no passen per l'import map: <script src> i fulls d'estil.
  const replacements=[];
  for(const match of html.matchAll(entryPattern)){
    const [open,path,close]=match[1]?[match[1],match[2],match[3]]:match[4]?[match[4],match[5],match[6]]:[match[7],match[8],match[9]];
    const file=toPosix(relative(root,resolve(dirname(resolve(root,page)),path)));
    // Un import('./x.js') dins d'un script en línia ja el resol l'import map.
    replacements.push([match[0],match[7]?open+path+close:`${open}${path}?v=${await hashOf(file)}${close}`]);
  }
  for(const [before,after] of replacements)html=html.replace(before,after);
  const imports={};
  for(const file of modules){const path=fromPage(page,file);imports[path]=`${path}?v=${await hashOf(file)}`;}
  const map=`${START}\n<script type="importmap">\n{"imports":{\n${Object.entries(imports).map(([k,v])=>`  ${JSON.stringify(k)}:${JSON.stringify(v)}`).join(',\n')}\n}}\n</script>\n${END}`;
  const block=new RegExp(`${START.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}[\\s\\S]*?${END}`);
  if(block.test(html))html=html.replace(block,map);
  else if(html.includes('</head>'))html=html.replace('</head>',`${map}\n</head>`);
  else throw new Error(`${page}: no hi ha cap </head> on posar l’import map.`);
  if(page==='index.html'){
    html=html.replace(/(<meta name="game-version" content=")\d+(")/,`$1${version}$2`).replace(/(<p id="game-version-label">Versió )\d+(<\/p>)/,`$1${version}$2`);
  }
  return {html,modules,skipped};
}

/** Retorna els fitxers que canviarien, amb el contingut nou. */
export async function plan(newVersion){
  const current=JSON.parse(await read('version.json')).version;
  const version=newVersion??current;
  if(!Number.isSafeInteger(version)||version<1)throw new Error('La versió ha de ser un enter positiu.');
  if(version<current)throw new Error(`La versió ${version} és anterior a l’actual (${current}). Els jugadors no rebrien l’avís d’actualització.`);
  const changes=new Map(),notes=[];
  const set=async(file,content)=>{if(await read(file)!==content)changes.set(file,content);};
  await set('version.json',JSON.stringify({version})+'\n');
  const versio=await read('VERSIO.txt');
  await set('VERSIO.txt',versio.replace(/^(Vila Mediterrània — versió )\d+/,`$1${version}`));
  for(const page of PAGES){
    const {html,modules,skipped}=await versionedPage(page,version);
    await set(page,html);
    notes.push(`${page}: ${modules.length} mòduls`);
    for(const file of skipped)notes.push(`  avís: ${file} s’importa però no existeix`);
  }
  return {version,changes,notes};
}

async function main(args){
  const check=args.includes('--comprova'),number=args.find(a=>/^\d+$/.test(a));
  const {version,changes,notes}=await plan(number===undefined?undefined:Number(number));
  if(check){
    if(changes.size){console.log(`Cal executar node eines/actualitza-versio.mjs. Desactualitzats: ${[...changes.keys()].join(', ')}.`);process.exitCode=1;}
    else console.log(`Versions al dia · joc v${version}.`);
    return;
  }
  for(const [file,content] of changes){
    const crlf=(await readFile(resolve(root,file),'utf8')).includes('\r\n');
    await writeFile(resolve(root,file),crlf?content.replace(/\n/g,'\r\n'):content);
  }
  console.log(notes.join('\n'));
  console.log(changes.size?`Actualitzat: ${[...changes.keys()].join(', ')} · joc v${version}.`:`Res a canviar · joc v${version}.`);
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)
  main(process.argv.slice(2)).catch(error=>{console.error(error.message);process.exitCode=1;});
