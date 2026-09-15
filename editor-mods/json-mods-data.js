// Camí B · dades pures dels mods instal·lats. Aquest fitxer no importa res, de
// manera que catalog.js el pot llegir sense trencar la seva regla de no
// importar Three.js ni cap renderitzador.
//
// Enganxa aquí dins el JSON que exporta el taller, separat per comes.
export const JSON_MODS = [
  // {
  //   "format": "vila-mod", "version": 2, "requiresModApi": 1,
  //   "id": "watchtower", "name": "Torre de guaita", "category": "monument",
  //   "sizes": [1], "height": 2.41,
  //   "help": "Torre defensiva d'una cel·la. Tria l'orientació.",
  //   "parts": [ … ]
  // },
];

/** Es fusiona dins de PERSONAL_LANDMARKS de mods-personals/catalog.js. */
export const JSON_LANDMARKS = Object.fromEntries(JSON_MODS.map(mod => [mod.id, {
  name: mod.name, sizes: mod.sizes, height: mod.height, help: mod.help,
  ...(mod.category === 'monument' ? { category: 'monument' } : {}),
}]));
