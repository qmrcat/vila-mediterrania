import { JSON_MODS_FITA_DE_TERME } from './json-mod-extra/json-fita-de-terma.js';
import { JSON_MODS_CASA_NAVAS } from './json-mod-extra/json-casa-navas.js';

// Camí B · dades pures dels mods instal·lats. Aquest fitxer no importa res, de
// manera que catalog.js el pot llegir sense trencar la seva regla de no
// importar Three.js ni cap renderitzador.
//
// Enganxa aquí dins el JSON que exporta el taller, separat per comes.
export const JSON_MODS = [
  /* enganxa aquí el JSON de cada mod, separat per comes */
  ...JSON_MODS_CASA_NAVAS,
  ...JSON_MODS_FITA_DE_TERME,
];



/** Es fusiona dins de PERSONAL_LANDMARKS de mods-personals/catalog.js. */
export const JSON_LANDMARKS = Object.fromEntries(JSON_MODS.map(mod => [mod.id, {
  name: mod.name, sizes: mod.sizes, height: mod.height, help: mod.help,
  ...(mod.category === 'monument' ? { category: 'monument' } : {}),
}]));