export const RAILING_MATERIALS={iron:'Ferro',wood:'Fusta',stone:'Pedra'};
export const RAILING_SIDES={N:[2],S:[0],E:[1],O:[3],NO:[2,3],NE:[1,2],ES:[0,1],SO:[0,3],NS:[0,2],EO:[1,3]};
export function validateTerrainRailing(value){
  if(!value||!Object.hasOwn(RAILING_MATERIALS,value.material)||!Array.isArray(value.sides)||!value.sides.every(n=>Number.isInteger(n)&&n>=0&&n<4))throw new Error('La barana de terreny no és vàlida.');
  const sides=[...value.sides].sort();
  if(!Object.values(RAILING_SIDES).some(s=>JSON.stringify(s)===JSON.stringify(sides)))throw new Error('Tria un costat o dos costats per a la barana.');
  return {material:value.material,sides};
}
