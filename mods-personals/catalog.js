/**
 * Contingut personal de l'usuari. Aquest fitxer només conté dades:
 * no importis Three.js, el DOM ni cap renderitzador.
 *
 * La IA no ha de modificar aquesta carpeta si l'usuari no ho demana.
 */
export const REQUIRES_MOD_API=1;

import {ISRAEL_FLAG_DEFINITION} from './israel-flag-definition.js';

/**
 * id: {name, sizes:[1|2|4|6|9|16], height, help, category?:'monument'}
 */
export const PERSONAL_LANDMARKS={
  windmill:{
    name:'Molí de vent',
    sizes:[1],
    height:2.60,
    help:'Ocupa una cel·la de terra ferma o conreu, lliure i anivellada. Tria cap on mira el portal.',
  },
  flagIsrael:ISRAEL_FLAG_DEFINITION,
  casaMercadalReus2:{
    name:'Casa de la plaça del Mercadal',
    sizes:[4],
    height:3.63,
    help:'Col·loca-la entre mitgeres laterals i posteriors, en dues cel·les anivellades, amb els balcons orientats cap a la plaça.',
  },
  ajuntamentAmbRellotge:{
    name:'Ajuntament amb torre del rellotge',
    sizes:[9],
    height:5.70,
    help:'Col·loca l\'Ajuntament de Reus en una parcel·la de dues per dues cel·les, amb la façana principal orientada cap a la plaça.',
  },
  casaTomasBarbera:{
    name:'Casa Tomàs Barberà',
    sizes:[4],
    height:3.92,
    help:'Col·loca-la en terreny pla, amb els porxos al sud, un carrer lateral a l\'esquerra i la mitgera a la dreta.',
  },
};

/**
 * id: {name, color:'#rrggbb', height, description}
 * Es comporten com els terrenys agrícoles: conserven alçada i pendent.
 */
export const PERSONAL_TERRAINS={
    pratHerbes:{
    name:'Prat d’herbes',
    menuAfter:'meadow',
    color:'#86a967',
    height:.40,
    description:'Herbes altes i baixes en verds variats, amb mates, espigues i flors escampades.',
  },
};

/**
 * {id, name, scientific?:string, height:number, description:string}
 */
export const PERSONAL_TREES=[];

/**
 * id: {name, accent, frame, awning, description, door?:-.36|0|.36,
 *      neutral?:boolean}
 * Si neutral no és true, cal un renderitzador d'aparador amb el mateix id.
 */
export const PERSONAL_BUSINESSES={};

