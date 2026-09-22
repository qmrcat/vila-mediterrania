// Genera el codi que va a mods-personals/. Dos camins: un renderitzador escrit
// (camí A) o el JSON llegit per un renderitzador genèric (camí B).
import { footprint, hasMaterial } from './format.js';
import { SHAPES } from './constants.js';

const round = (n, places = 3) => {
  const factor = 10 ** places;
  const v = Math.round(n * factor) / factor;
  if (Object.is(v, -0) || v === 0) return '0';
  return String(v).replace(/^(-?)0\./, '$1.');
};

const pascal = id => id.charAt(0).toUpperCase() + id.slice(1);
const kebab = id => id.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
export const renderName = mod => `render${pascal(mod.id)}`;
export const moduleFile = mod => `${kebab(mod.id)}-geometry.js`;

const tilted = part => Math.abs(part.rx) > 1e-6 || Math.abs(part.rz) > 1e-6;

/** Formes que no són de les 20 oficials: el mod depèn de geometries.js. */
export const customShapes = mod =>
  [...new Set(mod.parts.map(part => part.shape))].filter(shape => !SHAPES.includes(shape));

const shapeSnippet = mod => {
  const custom = customShapes(mod);
  if (!custom.length) return [];
  return [{
    file: 'mods-personals/geometries.js',
    code: `// Aquest mod fa servir formes personals: ${custom.join(', ')}.
` +
      `// Copia'n el fitxer des d'Exporta → El fitxer geometries.js.`,
    note: 'Sense aquest fitxer, el joc llança «Forma desconeguda» en dibuixar el mod.',
  }];
};
const quote = text => String(text).replace(/'/g, "\\'");

/** El color sol, o l'objecte de material de la v97 si la peça en té. */
function paintArg(part) {
  if (!hasMaterial(part)) return `'${part.color}'`;
  const fields = ['opacity', 'roughness', 'metalness']
    .filter(key => part[key] !== undefined)
    .map(key => `${key}:${round(part[key], 3)}`);
  if (part.doubleSide) fields.push('doubleSide:true');
  return `{color:'${part.color}',${fields.join(',')}}`;
}

function callLine(part, fn) {
  const args = [`'${part.shape}'`, paintArg(part), round(part.u), round(part.h), round(part.v), round(part.sx), round(part.sy), round(part.sz)];
  const spin = [part.ry, part.rx, part.rz].map(value => round(value, 5));
  while (spin.length && spin[spin.length - 1] === '0') spin.pop();
  // El nom que li hagis posat al taller acaba com a comentari, que és on és útil.
  const label = part.name ? ` // ${part.name.replace(/\r?\n/g, ' ')}` : '';
  return `  ${fn}(${[...args, ...spin].join(',')});${label}`;
}

/** Camí A · el renderitzador que desaràs a mods-personals/. */
export function moduleCode(mod) {
  const needsTilt = mod.parts.some(tilted);
  const plots = mod.sizes.map(size => `${footprint(size).label} cel·les`).join(', ');
  // orientedPart compon el gir de l'edifici amb la inclinació local; sense
  // això, les peces inclinades queden torçades en les altres orientacions.
  const signature = needsTilt
    ? `export function ${renderName(mod)}(landmark, part, unit, {orientedPart}){`
    : `export function ${renderName(mod)}(landmark, part, unit){`;
  const sizeNote = mod.sizes.length > 1
    ? `  // landmark.size val ${mod.sizes.join(' o ')}: adapta-hi la geometria si cal.\n`
    : '';
  const body = mod.parts.map(p => callLine(p, tilted(p) ? 'orientedPart' : 'part')).join('\n');
  return `/** ${mod.name} · ${plots} · alçada ${mod.height.toFixed(2)}. */\n` +
    `${signature}\n${sizeNote}${body}\n}\n`;
}

const catalogEntry = mod => `  ${mod.id}:{\n` +
  `    name:'${quote(mod.name)}',\n` +
  `    sizes:[${mod.sizes.join(',')}],\n` +
  `    height:${mod.height.toFixed(2)},\n` +
  `    help:'${quote(mod.help)}',\n` +
  (mod.category === 'monument' ? `    category:'monument',\n` : '') +
  `  },`;

/** Camí A · els dos registres de mods-personals. */
export function registerSnippets(mod) {
  return [
    {
      file: `mods-personals/${moduleFile(mod)}`,
      code: '// Desa-hi el renderitzador que trobaràs a «El renderitzador».',
      note: 'Un fitxer per mod, com el windmill-geometry.js que ja porta el joc.',
    },
    {
      file: 'mods-personals/catalog.js · dins de PERSONAL_LANDMARKS',
      code: catalogEntry(mod),
      note: 'Només dades. No hi importis Three.js ni cap renderitzador.',
    },
    {
      file: 'mods-personals/renderers.js',
      code: `import {${renderName(mod)}} from './${moduleFile(mod)}';\n\n` +
        `// dins de PERSONAL_LANDMARK_RENDERERS:\n  ${mod.id}:${renderName(mod)},`,
      note: 'Les claus han de coincidir exactament amb les del catàleg.',
    },
    ...shapeSnippet(mod),
    {
      file: 'Comprovació',
      code: 'node mods-personals/check.mjs\nnode check-mods.mjs',
      note: 'La segona ordre comprova col·lisions, col·locació, totes les mides i orientacions i la recuperació des del JSON.',
    },
  ];
}

export const modJson = mod => JSON.stringify({
  format: mod.format, version: mod.version, requiresModApi: mod.requiresModApi,
  id: mod.id, name: mod.name, category: mod.category, sizes: mod.sizes,
  height: Math.round(mod.height * 100) / 100, help: mod.help, parts: mod.parts,
}, null, 2);

/** Camí B · com endollar el renderitzador genèric una sola vegada. */
export function runtimeSnippets() {
  return [
    {
      file: 'mods-personals/json-mods-data.js',
      code: 'export const JSON_MODS = [\n  /* enganxa aquí el JSON de cada mod, separat per comes */\n];',
      note: 'És l’únic fitxer que tocaràs cada vegada que afegeixis un mod nou.',
    },
    {
      file: 'mods-personals/catalog.js',
      code: `import {JSON_LANDMARKS} from './json-mods-data.js';\n\n` +
        `export const PERSONAL_LANDMARKS={\n  windmill:{ … },\n  ...JSON_LANDMARKS,\n};`,
      note: 'json-mods-data.js són dades pures: el catàleg continua sense importar cap renderitzador.',
    },
    {
      file: 'mods-personals/renderers.js',
      code: `import {JSON_LANDMARK_RENDERERS} from './json-mods.js';\n\n` +
        `export const PERSONAL_LANDMARK_RENDERERS={\n  windmill:renderWindmill,\n  ...JSON_LANDMARK_RENDERERS,\n};`,
      note: 'Copia json-mods.js i json-mods-data.js d’aquesta carpeta a mods-personals/.',
    },
    {
      file: 'Comprovació',
      code: 'node check-mods.mjs',
      note: 'Hauria de llistar els mods nous dins del recompte d’edificis i de renderitzadors.',
    },
  ];
}

export function download(filename, text) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob), link = document.createElement('a');
  link.href = url; link.download = filename; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
