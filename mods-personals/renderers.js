// Exportació opcional: els registres antics sense aquesta línia continuen funcionant.
export {PERSONAL_GEOMETRIES} from './geometries.js';
export {ISRAEL_FLAG_ANIMATIONS as PERSONAL_GEOMETRY_ANIMATIONS} from './israel-flag-animation.js';
/**
 * Renderitzadors personals. Les claus han de coincidir amb catalog.js.
 * No modifiquis les signatures: formen part de MOD_API_VERSION 1.
 */
import {renderWindmill} from './windmill-geometry.js';
import {renderGrassland} from './prat-herbes.js';
import {renderIsraelFlag} from './israel-flag.js';

import {renderCasaMercadalReus2} from './mods-geometry/casa-mercadal-reus2-geometry.js';
import {renderAjuntamentAmbRellotge} from './mods-geometry/ajuntament-amb-rellotge-geometry.js';

/** renderer(landmark, part, unit, {box,beam,orientedPart}) */
export const PERSONAL_LANDMARK_RENDERERS={
    windmill:renderWindmill,
    flagIsrael:renderIsraelFlag,
    casaMercadalReus2:renderCasaMercadalReus2,
    ajuntamentAmbRellotge:renderAjuntamentAmbRellotge,
};

/** renderer(tile, {add,surfaceBox,unit,exclude,branch,root,emit,row,soil,ox,oz}) */
export const PERSONAL_TERRAIN_RENDERERS={pratHerbes:renderGrassland};

/** renderer(tile, {x,y,z,seed,unit,add,branch,randomAt}) */
export const PERSONAL_TREE_RENDERERS={};

/** renderer({type,side,u,face,box}) */
export const PERSONAL_RETAIL_RENDERERS={};

// export const PERSONAL_GEOMETRY_ANIMATIONS = ISRAEL_FLAG_ANIMATIONS;
