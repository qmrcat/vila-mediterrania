import {
  REQUIRES_MOD_API,
  PERSONAL_LANDMARKS as rawLandmarks,
  PERSONAL_TERRAINS as rawTerrains,
  PERSONAL_TREES as rawTrees,
  PERSONAL_BUSINESSES as rawBusinesses,
} from './mods-personals/catalog.js';

/** Contracte estable entre el nucli i mods-personals. */
export const MOD_API_VERSION=1;
const idPattern=/^[a-z][A-Za-z0-9]{1,39}$/;
const hexPattern=/^#[0-9a-f]{6}$/i;
const reservedLandmarkTools=new Set(['navigate','clone','house','land','meadow','rocky','beach','plaza','stairs','erase','paintFloor','business','beachbar','market','church','townhall','custom','buildingSign','terrainRailing','bridge','slope','buildings','monuments','rename','none']);
const reservedBusinessTools=new Set(['none','rename']);
const reservedTreeIds=new Set([...reservedLandmarkTools,...Object.getOwnPropertyNames(Object.prototype),'house','land','meadow','rocky','beach','plaza','stairs','cobble','dirt','asphalt']);
const record=(value,label)=>{
  if(!value||Array.isArray(value)||typeof value!=='object')throw new Error(`mods-personals: ${label} ha de ser un objecte.`);
  return value;
};
const text=(value,label)=>{
  if(typeof value!=='string'||!value.trim())throw new Error(`mods-personals: falta ${label}.`);
  return value.trim();
};
const id=(value,label)=>{
  if(!idPattern.test(value))throw new Error(`mods-personals: identificador no vàlid a ${label}: ${value}.`);
  return value;
};
const positive=(value,label)=>{
  if(!Number.isFinite(value)||value<=0)throw new Error(`mods-personals: ${label} ha de ser un nombre positiu.`);
  return value;
};
const color=(value,label)=>{
  if(!hexPattern.test(value))throw new Error(`mods-personals: ${label} ha de ser un color #rrggbb.`);
  return value.toLowerCase();
};

if(REQUIRES_MOD_API!==MOD_API_VERSION)throw new Error(`mods-personals necessita l'API ${REQUIRES_MOD_API}; aquest joc ofereix l'API ${MOD_API_VERSION}.`);

function validateLandmarks(input){
  const output={};
  for(const [key,value] of Object.entries(record(input,'PERSONAL_LANDMARKS'))){
    id(key,'PERSONAL_LANDMARKS');record(value,`PERSONAL_LANDMARKS.${key}`);
    if(reservedTreeIds.has(key))throw new Error(`mods-personals: l'identificador «${key}» està reservat per una eina del joc.`);
    if(!Array.isArray(value.sizes)||!value.sizes.length||value.sizes.some(size=>![1,2,4,6,9,16].includes(size)))throw new Error(`mods-personals: mides no vàlides a ${key}.`);
    if(value.category!==undefined&&value.category!=='monument')throw new Error(`mods-personals: category de ${key} només pot ser monument.`);
    output[key]={name:text(value.name,`${key}.name`),sizes:[...new Set(value.sizes)],height:positive(value.height,`${key}.height`),help:text(value.help,`${key}.help`),...(value.category?{category:value.category}:{})};
  }
  return Object.freeze(output);
}

function validateTerrains(input){
  const output={};
  for(const [key,value] of Object.entries(record(input,'PERSONAL_TERRAINS'))){
    id(key,'PERSONAL_TERRAINS');record(value,`PERSONAL_TERRAINS.${key}`);
    if(reservedTreeIds.has(key))throw new Error(`mods-personals: l'identificador de terreny «${key}» està reservat.`);
    output[key]={name:text(value.name,`${key}.name`),color:color(value.color,`${key}.color`),height:positive(value.height,`${key}.height`),description:text(value.description,`${key}.description`)};
  }
  return Object.freeze(output);
}

function validateTrees(input){
  if(!Array.isArray(input))throw new Error('mods-personals: PERSONAL_TREES ha de ser una llista.');
  const seen=new Set();
  return Object.freeze(input.map(value=>{
    record(value,'PERSONAL_TREES');const key=id(value.id,'PERSONAL_TREES');
    if(reservedTreeIds.has(key))throw new Error(`mods-personals: l'identificador d'arbre «${key}» està reservat.`);
    if(seen.has(key))throw new Error(`mods-personals: arbre repetit: ${key}.`);seen.add(key);
    return {id:key,name:text(value.name,`${key}.name`),...(value.scientific?{scientific:text(value.scientific,`${key}.scientific`)}:{}),height:positive(value.height,`${key}.height`),description:text(value.description,`${key}.description`)};
  }));
}

function validateBusinesses(input){
  const output={};
  for(const [key,value] of Object.entries(record(input,'PERSONAL_BUSINESSES'))){
    id(key,'PERSONAL_BUSINESSES');record(value,`PERSONAL_BUSINESSES.${key}`);
    if(reservedBusinessTools.has(key)||Object.hasOwn(Object.prototype,key))throw new Error(`mods-personals: l'identificador de negoci «${key}» està reservat.`);
    if(value.door!==undefined&&![-.36,0,.36].includes(value.door))throw new Error(`mods-personals: door de ${key} ha de ser -.36, 0 o .36.`);
    if(value.neutral!==undefined&&typeof value.neutral!=='boolean')throw new Error(`mods-personals: neutral de ${key} ha de ser booleà.`);
    output[key]={name:text(value.name,`${key}.name`),accent:color(value.accent,`${key}.accent`),frame:color(value.frame,`${key}.frame`),awning:color(value.awning,`${key}.awning`),description:text(value.description,`${key}.description`),...(value.door!==undefined?{door:value.door}:{}),...(value.neutral!==undefined?{neutral:value.neutral}:{})};
  }
  return Object.freeze(output);
}

export const PERSONAL_LANDMARKS=validateLandmarks(rawLandmarks);
export const PERSONAL_TERRAINS=validateTerrains(rawTerrains);
export const PERSONAL_TREES=validateTrees(rawTrees);
export const PERSONAL_BUSINESSES=validateBusinesses(rawBusinesses);

export function assertNoKeyCollisions(core,personal,label){
  const duplicate=Object.keys(personal).find(key=>Object.hasOwn(core,key));
  if(duplicate)throw new Error(`mods-personals: ${label} repeteix l'identificador del joc «${duplicate}».`);
}

export function assertNoIdCollisions(core,personal,label){
  const ids=new Set(core.map(item=>item.id)),duplicate=personal.find(item=>ids.has(item.id));
  if(duplicate)throw new Error(`mods-personals: ${label} repeteix l'identificador del joc «${duplicate.id}».`);
}
