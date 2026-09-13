/** Shared agricultural terrain definitions, independent of the renderer. */
export const AGRICULTURAL_TERRAINS={
  goatPasture:{name:'Pastura de cabres',color:'#99ac72',height:.48,description:'Herba i arbustos variats, amb dues o tres cabres per zona de pastura connectada.'},
  sheepPasture:{name:'Pastura d’ovelles',color:'#a6c77d',height:.45,description:'Herba tendra amb dues o tres ovelles per zona de pastura d’ovelles connectada.'},
  cowPasture:{name:'Pastura de vaques · Bruna dels Pirineus',color:'#a6c77d',height:.56,description:'Herba tendra i bales de palla, amb dues o tres vaques Bruna dels Pirineus per zona connectada.'},
  poultryYard:{name:'Gallines i oques',color:'#b9aa7e',height:.56,description:'Galliner de fusta, terra trepitjada, palla i herba escassa. Quatre o cinc gallines i una o dues oques per zona connectada.'},
  vineyard:{name:'Vinya',color:'#a68a60',height:.48,description:'Fileres de ceps amb fulles, raïms, pals i fils de suport.'},
  oliveGrove:{name:'Oliverar',color:'#b1a17b',height:.78,description:'Oliveres petites en fileres, amb capçades de verd grisós i olives.'},
  cereal:{name:'Cereals',color:'#b6a061',height:.43,description:'Fileres de tiges i espigues daurades.'},
  orchard:{name:'Fruiters',color:'#8e9b63',height:.82,description:'Arbres fruiters amb capçades verdes i fruita vermella i taronja.'},
  vegetableGarden:{name:'Horta',color:'#92704e',height:.35,description:'Bancals amb tomaqueres, cols i pastanagues.'},
};
export const AGRICULTURAL_TYPES=Object.keys(AGRICULTURAL_TERRAINS);
export const isAgricultural=kind=>Object.hasOwn(AGRICULTURAL_TERRAINS,kind);
