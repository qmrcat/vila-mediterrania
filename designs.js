import {CONFIG} from './config.js';
import {validateEntrance} from './entrances.js';
/** Portable building blueprints. No renderer or framework dependency. */
export const DESIGN_KEY='vila-mediterrania:designs:v3';
export const FACE_TYPES=['blank','door','window','arched-window','balcony'];
export const designId=()=>crypto.randomUUID?.()??Array.from(crypto.getRandomValues(new Uint8Array(16)),n=>n.toString(16).padStart(2,'0')).join('');
const hex=c=>typeof c==='string'&&/^#[0-9a-f]{6}$/i.test(c);
const integer=(n,min,max)=>Number.isInteger(n)&&n>=min&&n<=max;
export function newDesign(){
  return {version:3,id:designId(),name:'El meu edifici',width:1,depth:1,middleCount:1,
    ground:[{color:'#f5eee0',style:'solid',faces:['door','window','window','window']}],
    middle:[{color:'#f5eee0',style:'solid',faces:['balcony','window','window','window']}],
    roof:[{type:'tile',color:'#bf7957',direction:0}]};
}
export function validateDesign(d){
  if(!d||![1,2,3].includes(d.version)||typeof d.id!=='string'||! /^[a-zA-Z0-9_-]{1,80}$/.test(d.id)||typeof d.name!=='string'||!d.name.trim()||d.name.length>60||!integer(d.width,1,3)||!integer(d.depth,1,3)||!integer(d.middleCount,0,d.upperFloors?CONFIG.houses.maxFloors-1:3))throw new Error('El disseny ha de tenir un nom, una mida d’1 a 3 cel·les i de 0 a 3 plantes intermèdies.');
  const n=d.width*d.depth;
  if(!['ground','middle','roof'].every(k=>Array.isArray(d[k])&&d[k].length===n))throw new Error('Les tres plantes han de coincidir amb la mida del disseny.');
  const cell=(c,optional)=>{
    if(optional&&c===null)return null;
    if(!c||!hex(c.color)||!['solid','arcade'].includes(c.style)||!Array.isArray(c.faces)||c.faces.length!==4||!Array.from(c.faces).every(f=>FACE_TYPES.includes(f)||(f&&typeof f==='object')))throw new Error('Hi ha una cel·la amb murs o obertures no vàlids.');
    return {color:c.color.toLowerCase(),style:c.style,faces:Array.from(c.faces,f=>typeof f==='string'?f:validateEntrance(f))};
  };
  let upperFloors;
  if(d.upperFloors!==undefined){
    if(!Array.isArray(d.upperFloors)||d.upperFloors.length!==d.middleCount||!d.upperFloors.every(f=>Array.isArray(f)&&f.length===n))throw new Error('Les plantes individuals no coincideixen amb el disseny.');
    upperFloors=d.upperFloors.map(f=>Array.from(f,c=>cell(c,true)));
  }
  return {...(upperFloors?{upperFloors}:{}),version:3,id:d.id,name:d.name.trim(),width:d.width,depth:d.depth,middleCount:d.middleCount,
    ground:Array.from(d.ground,c=>cell(c,false)),middle:Array.from(d.middle,c=>cell(c,true)),roof:Array.from(d.roof,c=>{
      if(!c||!['tile','shed','flat','attic'].includes(c.type)||!hex(c.color)||!integer(c.direction,0,3))throw new Error('Hi ha una coberta no vàlida.');
      return {type:c.type,color:c.color.toLowerCase(),direction:c.direction};
    })};
}
export function resizeDesign(design,width,depth){
  if(!integer(width,1,3)||!integer(depth,1,3))throw new Error('Mida no vàlida.');
  const next={...design,width,depth},defaults=newDesign();
  for(const layer of ['ground','middle','roof'])next[layer]=Array.from({length:width*depth},(_,i)=>{
    const x=i%width,z=Math.floor(i/width);return structuredClone(x<design.width&&z<design.depth?design[layer][z*design.width+x]:defaults[layer][0]);
  });
  if(design.upperFloors)next.upperFloors=design.upperFloors.map(f=>Array.from({length:width*depth},(_,i)=>{const x=i%width,z=Math.floor(i/width);return structuredClone(x<design.width&&z<design.depth?f[z*design.width+x]:defaults.middle[0]);}));
  return validateDesign(next);
}
export function validateCatalog(data){
  if(!data||data.format!=='vila-buildings'||![1,2,3].includes(data.version)||!Array.isArray(data.designs)||data.designs.length>100)throw new Error('Aquest fitxer no és una col·lecció de dissenys compatible (màxim 100).');
  const designs=Array.from(data.designs,validateDesign);if(new Set(designs.map(d=>d.id)).size!==designs.length)throw new Error('El fitxer conté identificadors repetits.');
  return designs;
}
export const catalogFile=designs=>({format:'vila-buildings',version:3,designs:designs.map(validateDesign)});
export function loadDesigns(storage){const raw=storage.getItem(DESIGN_KEY)??storage.getItem('vila-mediterrania:designs:v2')??storage.getItem('vila-mediterrania:designs:v1');return raw===null?[]:validateCatalog(JSON.parse(raw));}
export function writeDesigns(storage,designs){const data=catalogFile(designs);validateCatalog(data);storage.setItem(DESIGN_KEY,JSON.stringify(data));return data.designs;}
export function saveDesign(storage,design){
  const d=validateDesign(design),all=loadDesigns(storage),i=all.findIndex(c=>c.id===d.id);if(i<0)all.push(d);else all[i]=d;
  return writeDesigns(storage,all);
}
export function importDesigns(storage,input){
  const imported=validateCatalog(input).map(d=>({...d,id:designId()}));
  return {designs:writeDesigns(storage,[...loadDesigns(storage),...imported]),imported};
}
export const customDimensions=b=>({width:b.direction%2?b.design.depth:b.design.width,depth:b.direction%2?b.design.width:b.design.depth});
export function customCell(b,index){
  const {width,depth}=customDimensions(b),a=b.direction*Math.PI/2,c=Math.round(Math.cos(a)),s=Math.round(Math.sin(a));
  const u=index%b.design.width-(b.design.width-1)/2,v=Math.floor(index/b.design.width)-(b.design.depth-1)/2;
  return {x:Math.round(b.x+(width-1)/2+c*u+s*v),z:Math.round(b.z+(depth-1)/2-s*u+c*v)};
}
export const customCells=b=>Array.from({length:b.design.width*b.design.depth},(_,i)=>customCell(b,i));
export const customAt=(world,x,z)=>(world.customBuildings??[]).find(b=>customCells(b).some(c=>c.x===x&&c.z===z));
export const customFloors=(d,index)=>1+(d.upperFloors?d.upperFloors.findLastIndex(f=>f[index]!==null)+1:d.middle[index]?d.middleCount:0);
export const designFloor=(d,index,level)=>level===0?d.ground[index]:d.upperFloors?(d.upperFloors[level-1]?.[index]??{...d.ground[index],style:'arcade'}):d.middle[index];
