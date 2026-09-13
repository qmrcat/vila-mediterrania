/** Shared agricultural terrain definitions, independent of the renderer. */
export const AGRICULTURAL_TERRAINS={
  vineyard:{name:'Vinya',color:'#a68a60',height:.48,description:'Fileres de ceps amb fulles, raïms, pals i fils de suport.'},
  oliveGrove:{name:'Oliverar',color:'#b1a17b',height:.78,description:'Oliveres petites en fileres, amb capçades de verd grisós i olives.'},
  cereal:{name:'Cereals',color:'#b6a061',height:.43,description:'Fileres de tiges i espigues daurades.'},
  orchard:{name:'Fruiters',color:'#8e9b63',height:.82,description:'Arbres fruiters amb capçades verdes i fruita vermella i taronja.'},
  vegetableGarden:{name:'Horta',color:'#92704e',height:.35,description:'Bancals amb tomaqueres, cols i pastanagues.'},
};
export const AGRICULTURAL_TYPES=Object.keys(AGRICULTURAL_TERRAINS);
export const isAgricultural=kind=>Object.hasOwn(AGRICULTURAL_TERRAINS,kind);
