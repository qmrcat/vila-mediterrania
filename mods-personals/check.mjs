import {MOD_API_VERSION,PERSONAL_LANDMARKS,PERSONAL_TERRAINS,PERSONAL_TREES,PERSONAL_BUSINESSES} from '../personal-content.js';
import {PERSONAL_LANDMARK_RENDERERS,PERSONAL_TERRAIN_RENDERERS,PERSONAL_TREE_RENDERERS,PERSONAL_RETAIL_RENDERERS} from '../personal-renderers.js';

const counts={
  edificis:Object.keys(PERSONAL_LANDMARKS).length,
  terrenys:Object.keys(PERSONAL_TERRAINS).length,
  arbres:PERSONAL_TREES.length,
  negocis:Object.keys(PERSONAL_BUSINESSES).length,
  renderitzadors:Object.keys(PERSONAL_LANDMARK_RENDERERS).length+Object.keys(PERSONAL_TERRAIN_RENDERERS).length+Object.keys(PERSONAL_TREE_RENDERERS).length+Object.keys(PERSONAL_RETAIL_RENDERERS).length,
};
console.log(`Mods personals correctes · API ${MOD_API_VERSION}`);
console.log(Object.entries(counts).map(([name,count])=>`${name}: ${count}`).join(' · '));
