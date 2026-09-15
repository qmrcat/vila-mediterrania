import {PERSONAL_LANDMARKS,PERSONAL_TERRAINS,PERSONAL_TREES,PERSONAL_BUSINESSES} from './personal-content.js';
import {
  PERSONAL_LANDMARK_RENDERERS as rawLandmarkRenderers,
  PERSONAL_TERRAIN_RENDERERS as rawTerrainRenderers,
  PERSONAL_TREE_RENDERERS as rawTreeRenderers,
  PERSONAL_RETAIL_RENDERERS as rawRetailRenderers,
} from './mods-personals/renderers.js';

const functions=(value,label,definitions,required=true)=>{
  if(!value||Array.isArray(value)||typeof value!=='object')throw new Error(`mods-personals: ${label} ha de ser un objecte.`);
  for(const [key,renderer] of Object.entries(value)){
    if(!Object.hasOwn(definitions,key))throw new Error(`mods-personals: ${label}.${key} no té cap definició al catàleg.`);
    if(typeof renderer!=='function')throw new Error(`mods-personals: ${label}.${key} ha de ser una funció.`);
  }
  if(required){
    const missing=Object.keys(definitions).find(key=>!Object.hasOwn(value,key));
    if(missing)throw new Error(`mods-personals: falta el renderitzador de «${missing}» a ${label}.`);
  }
  return Object.freeze({...value});
};

export const PERSONAL_LANDMARK_RENDERERS=functions(rawLandmarkRenderers,'PERSONAL_LANDMARK_RENDERERS',PERSONAL_LANDMARKS);
export const PERSONAL_TERRAIN_RENDERERS=functions(rawTerrainRenderers,'PERSONAL_TERRAIN_RENDERERS',PERSONAL_TERRAINS);
export const PERSONAL_TREE_RENDERERS=functions(rawTreeRenderers,'PERSONAL_TREE_RENDERERS',Object.fromEntries(PERSONAL_TREES.map(tree=>[tree.id,tree])));
export const PERSONAL_RETAIL_RENDERERS=functions(rawRetailRenderers,'PERSONAL_RETAIL_RENDERERS',PERSONAL_BUSINESSES,false);

const missingRetail=Object.entries(PERSONAL_BUSINESSES).find(([key,business])=>!business.neutral&&!Object.hasOwn(PERSONAL_RETAIL_RENDERERS,key));
if(missingRetail)throw new Error(`mods-personals: el negoci «${missingRetail[0]}» necessita neutral:true o un renderitzador d'aparador.`);
