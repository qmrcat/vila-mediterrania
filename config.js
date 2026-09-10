/** CONFIGURACIÓ DEL JOC
 * Modifica els valors d'aquest objecte, desa el fitxer i recarrega amb Ctrl+F5.
 * Les alçades són nombres de plantes/nivells, no metres.
 * Els canvis són globals en aquesta còpia del joc; no es desen dins de cada vila.
 */
export const CONFIG = {
  houses: {
    maxFloors: 9,           // Plantes totals, inclosa la planta baixa.
    maxPatioFloors: 3,      // Cases amb pati; no pot superar maxFloors.
  },
  terrain: {
    maxElevation: 8,        // Nivell màxim. Un pendent també ocupa el nivell superior.
  },
  flags: {
    housePercentage: 75,    // Percentatge de cases elegibles amb bandera: 0–100.
    esteladaPercentage: 60, // Percentatge d’estelades entre les banderes: 0–100.
    enabledByDefault: false,// Només per a viles noves; les desades conserven el botó.
  },
  grid: {
    sizes: [33, 49, 65],    // Costats de les quadrícules: nombres senars, mínim 17.
    defaultSize: 33,       // Ha de ser un dels valors de sizes.
  },
  bridges: {
    minLength: 2,          // Distància entre extrems, en cel·les; mínim 2.
    maxLength: 16,
  },
  limits: {
    objectsPerCategory: 128,// Límit independent per a ponts, mercats, esglésies,
                           // ajuntaments, edificis del jugador i equipaments.
    undoSteps: 60,         // Canvis recuperables amb Desfés durant la sessió.
  },
};

// Comprovació de coherència. No cal modificar el codi d'aquí sota.
const invalid=field=>{throw new Error(`config.js: revisa el valor de ${field}.`);};
const integer=(value,min,field)=>{if(!Number.isSafeInteger(value)||value<min)invalid(field);};
integer(CONFIG.houses.maxFloors,1,'houses.maxFloors');
integer(CONFIG.houses.maxPatioFloors,1,'houses.maxPatioFloors');
if(CONFIG.houses.maxPatioFloors>CONFIG.houses.maxFloors)invalid('houses.maxPatioFloors (ha de ser ≤ maxFloors)');
integer(CONFIG.terrain.maxElevation,1,'terrain.maxElevation');
if(!Number.isFinite(CONFIG.flags.housePercentage)||CONFIG.flags.housePercentage<0||CONFIG.flags.housePercentage>100)invalid('flags.housePercentage (0–100)');
if(!Number.isFinite(CONFIG.flags.esteladaPercentage)||CONFIG.flags.esteladaPercentage<0||CONFIG.flags.esteladaPercentage>100)invalid('flags.esteladaPercentage (0–100)');
if(typeof CONFIG.flags.enabledByDefault!=='boolean')invalid('flags.enabledByDefault (true o false)');
if(!Array.isArray(CONFIG.grid.sizes)||!CONFIG.grid.sizes.length)invalid('grid.sizes');
for(const size of CONFIG.grid.sizes){integer(size,17,'grid.sizes');if(size%2!==1)invalid('grid.sizes (només senars)');}
if(new Set(CONFIG.grid.sizes).size!==CONFIG.grid.sizes.length||!CONFIG.grid.sizes.includes(CONFIG.grid.defaultSize))invalid('grid.defaultSize / grid.sizes');
integer(CONFIG.bridges.minLength,2,'bridges.minLength');
integer(CONFIG.bridges.maxLength,CONFIG.bridges.minLength,'bridges.maxLength');
integer(CONFIG.limits.objectsPerCategory,1,'limits.objectsPerCategory');
integer(CONFIG.limits.undoSteps,1,'limits.undoSteps');
for(const section of Object.values(CONFIG)){for(const value of Object.values(section))if(Array.isArray(value))Object.freeze(value);Object.freeze(section);}
Object.freeze(CONFIG);
