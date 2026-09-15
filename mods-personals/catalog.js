/**
 * Contingut personal de l'usuari. Aquest fitxer només conté dades:
 * no importis Three.js, el DOM ni cap renderitzador.
 *
 * La IA no ha de modificar aquesta carpeta si l'usuari no ho demana.
 */
export const REQUIRES_MOD_API=1;

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
};

/**
 * id: {name, color:'#rrggbb', height, description}
 * Es comporten com els terrenys agrícoles: conserven alçada i pendent.
 */
export const PERSONAL_TERRAINS={};

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
