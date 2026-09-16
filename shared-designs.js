import {catalogFile,validateCatalog,validateDesign,designId} from './designs.js';

// Relative to this module: also works on GitHub project Pages and local servers.
export const SHARED_CATALOG_URL=new URL('./biblioteca/catalog.json',import.meta.url);
export const MAX_CATALOG_BYTES=2_000_000;

export function parseSharedCatalog(text){
  if(new TextEncoder().encode(text).byteLength>MAX_CATALOG_BYTES)throw new Error('El catàleg supera el límit de 2 MB.');
  let data;
  try{data=JSON.parse(text);}catch{throw new Error('El catàleg no conté un JSON vàlid.');}
  return validateCatalog(data);
}

export async function loadSharedDesigns({url=SHARED_CATALOG_URL,fetcher=globalThis.fetch,timeout=12000}={}){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeout);
  try{
    const response=await fetcher(url,{cache:'no-store',signal:controller.signal});
    if(!response.ok)throw new Error(`No s’ha pogut llegir la biblioteca compartida (HTTP ${response.status}).`);
    if(Number(response.headers.get('content-length'))>MAX_CATALOG_BYTES)throw new Error('El catàleg supera el límit de 2 MB.');
    return parseSharedCatalog(await response.text());
  }catch(error){
    if(controller.signal.aborted)throw new Error('La biblioteca triga massa a respondre. Torna-ho a provar.');
    if(error instanceof TypeError)throw new Error('No s’ha pogut connectar amb la biblioteca compartida. Comprova la connexió.');
    throw error;
  }finally{clearTimeout(timer);}
}

// Publication keeps IDs so later exports update the same building. Never mutate
// the current editor design or the source collection, including on validation failure.
export function mergePublishedDesign(designs,design){
  const next=validateCatalog(catalogFile(designs)),candidate=validateDesign(design);
  const index=next.findIndex(d=>d.id===candidate.id);
  if(index<0)next.push(candidate);else next[index]=candidate;
  const result=catalogFile(next);
  validateCatalog(result);
  const json=JSON.stringify(result,null,2);
  parseSharedCatalog(json);
  return result;
}

export function copySharedDesign(design){
  return validateDesign({...design,id:designId(),name:(design.name+' · còpia').slice(0,60)});
}
