// Exportació opcional: els registres antics sense aquesta línia continuen funcionant.
export {PERSONAL_GEOMETRIES} from './geometries.js';
/**
 * Renderitzadors personals. Les claus han de coincidir amb catalog.js.
 * No modifiquis les signatures: formen part de MOD_API_VERSION 1.
 */
import {renderWindmill} from './windmill-geometry.js';

/** renderer(landmark, part, unit, {box,beam,orientedPart}) */
export const PERSONAL_LANDMARK_RENDERERS={windmill:renderWindmill};

/** renderer(tile, {add,surfaceBox,unit,exclude,branch,root,emit,row,soil,ox,oz}) */
export const PERSONAL_TERRAIN_RENDERERS={};

/** renderer(tile, {x,y,z,seed,unit,add,branch,randomAt}) */
export const PERSONAL_TREE_RENDERERS={};

/** renderer({type,side,u,face,box}) */
export const PERSONAL_RETAIL_RENDERERS={};
