// Format de dades d'un mod, alineat amb l'API de mods personals 1 del joc.
// És pur: no toca ni el DOM ni Three.js.
import { UNIT, SHAPES } from './constants.js';

export const MOD_FORMAT = 'vila-mod';
export const MOD_VERSION = 2;
export const REQUIRES_MOD_API = 1;
export const STORAGE_KEY = 'vila-mediterrania-mods-2';

// Les mateixes mides que landmarkDimensions() de model.js.
export const SIZES = [
  { size: 1, width: 1, depth: 1, label: '1 × 1' },
  { size: 2, width: 2, depth: 1, label: '2 × 1' },
  { size: 4, width: 2, depth: 2, label: '2 × 2' },
  { size: 6, width: 3, depth: 2, label: '3 × 2' },
  { size: 9, width: 3, depth: 3, label: '3 × 3' },
  { size: 16, width: 4, depth: 4, label: '4 × 4' },
];

export const footprint = size => SIZES.find(s => s.size === size) ?? SIZES[0];

// A les 20 formes oficials s'hi sumen les que el joc registri a
// PERSONAL_GEOMETRIES i les que estiguis dissenyant al taller.
let extraShapes = new Set();
export const setExtraShapes = list => { extraShapes = new Set(list); };
export const isKnownShape = shape => SHAPES.includes(shape) || extraShapes.has(shape);
export const num = (value, fallback = 0) => (Number.isFinite(Number(value)) ? Number(value) : fallback);

// personal-content.js exigeix minúscula inicial i entre 2 i 40 caràcters.
export const ID_PATTERN = /^[a-z][A-Za-z0-9]{1,39}$/;

// Còpia de les llistes reservades de personal-content.js i model.js.
export const RESERVED_IDS = new Set([
  'navigate', 'clone', 'house', 'land', 'meadow', 'rocky', 'beach', 'plaza', 'stairs', 'erase',
  'paintFloor', 'business', 'beachbar', 'market', 'church', 'townhall', 'custom', 'buildingSign',
  'terrainRailing', 'bridge', 'slope', 'buildings', 'monuments', 'rename', 'none',
  'cobble', 'dirt', 'asphalt', 'constructor', 'toString', 'valueOf', 'hasOwnProperty',
]);

export function newPart(patch = {}) {
  return { shape: 'box', color: '#d4cab3', u: 0, h: .25, v: 0, sx: .5, sy: .5, sz: .5, ry: 0, rx: 0, rz: 0, ...patch };
}

export function newMod(patch = {}) {
  return {
    format: MOD_FORMAT, version: MOD_VERSION, requiresModApi: REQUIRES_MOD_API,
    id: 'modNou', name: 'Mod nou', category: 'building',
    sizes: [1], previewSize: 1, height: 1, autoHeight: true,
    help: 'Ocupa una cel·la de terra ferma, lliure i anivellada. Tria l’orientació de l’entrada.',
    parts: [],
    ...patch,
  };
}

/** Frontera de seguretat: tot el que entri de fora passa per aquí. */
export function validateMod(input) {
  if (!input || typeof input !== 'object') throw new Error('El fitxer no conté cap mod.');
  if (input.format !== MOD_FORMAT) throw new Error('Això no és un fitxer de mod de Vila Mediterrània.');
  if (!ID_PATTERN.test(String(input.id ?? ''))) throw new Error('L’identificador ha de començar per minúscula, tenir entre 2 i 40 caràcters i només lletres i xifres.');
  const sizes = Array.isArray(input.sizes) ? input.sizes : [input.size];
  if (!sizes.length || sizes.some(size => !SIZES.some(s => s.size === size))) throw new Error('Les mides han de ser 1, 2, 4, 6, 9 o 16 cel·les.');
  if (!Array.isArray(input.parts)) throw new Error('Falta la llista de peces.');
  if (input.parts.length > 2000) throw new Error('Un mod no pot passar de 2000 peces.');
  const parts = input.parts.map(p => {
    if (!isKnownShape(p?.shape)) throw new Error(`La forma «${p?.shape}» no existeix ni al joc ni al taller.`);
    if (!/^#[0-9a-fA-F]{6}$/.test(String(p.color))) throw new Error('Els colors han de ser hexadecimals de sis xifres.');
    return newPart({
      shape: p.shape, color: String(p.color).toLowerCase(),
      u: num(p.u), h: num(p.h), v: num(p.v),
      sx: num(p.sx, 1), sy: num(p.sy, 1), sz: num(p.sz, 1),
      ry: num(p.ry), rx: num(p.rx), rz: num(p.rz),
    });
  });
  const unique = [...new Set(sizes)].sort((a, b) => a - b);
  return {
    format: MOD_FORMAT, version: MOD_VERSION, requiresModApi: REQUIRES_MOD_API,
    id: String(input.id), name: String(input.name ?? input.id).slice(0, 48),
    category: input.category === 'monument' ? 'monument' : 'building',
    sizes: unique,
    previewSize: unique.includes(input.previewSize) ? input.previewSize : unique[0],
    height: Math.max(num(input.height, 1), .01), autoHeight: input.autoHeight !== false,
    help: String(input.help ?? input.instructions ?? '').slice(0, 400), parts,
  };
}

/** La mida petita mana: la geometria ha de cabre a la parcel·la més estreta. */
export const smallestPlot = mod => footprint(Math.min(...mod.sizes));

/** Avisos que no impedeixen desar, però sí que trenquen el mod dins del joc. */
export function reviewMod(mod, bounds, taken = [], pending = []) {
  const notes = [];
  if (!mod.parts.length) notes.push({ level: 'info', text: 'Encara no hi ha cap peça. Afegeix-ne una per començar.' });
  if (!ID_PATTERN.test(mod.id)) notes.push({ level: 'error', text: 'L’identificador ha de començar per minúscula i només pot tenir lletres i xifres.' });
  if (RESERVED_IDS.has(mod.id)) notes.push({ level: 'error', text: `«${mod.id}» és una eina del joc: personal-content.js el rebutjarà.` });
  if (taken.includes(mod.id)) notes.push({ level: 'error', text: `Ja hi ha un element del joc amb l’identificador «${mod.id}». Canvia’l o el catàleg no carregarà.` });
  if (!mod.help.trim()) notes.push({ level: 'error', text: 'El camp help és obligatori: sense text, el catàleg no passa la validació.' });

  if (bounds) {
    const { width, depth, label } = smallestPlot(mod);
    const limitU = width * UNIT / 2, limitV = depth * UNIT / 2, margin = .001;
    if (bounds.maxU > limitU + margin || bounds.minU < -limitU - margin || bounds.maxV > limitV + margin || bounds.minV < -limitV - margin)
      notes.push({ level: 'error', text: `Alguna peça surt de la parcel·la de ${label} i es clavarà dins de la casa del costat.` });
    if (bounds.minH < -margin) notes.push({ level: 'warn', text: 'Hi ha peces per sota de la base; quedaran enterrades al terreny.' });
    if (!mod.autoHeight && Math.abs(mod.height - bounds.maxH) > .05)
      notes.push({ level: 'warn', text: `L’alçada declarada (${mod.height.toFixed(2)}) no coincideix amb la real (${bounds.maxH.toFixed(2)}). El volum de clic no encaixarà.` });
  }
  if (mod.sizes.length > 1)
    notes.push({ level: 'info', text: 'Amb més d’una mida, el renderitzador rep landmark.size: fes-hi créixer la geometria o deixa-la centrada a propòsit.' });
  const missing = [...new Set(mod.parts.map(p => p.shape))].filter(shape => pending.includes(shape));
  if (missing.length) notes.push({ level: 'error',
    text: `Aquestes formes encara no són al joc: ${missing.join(', ')}. Instal·la mods-personals/geometries.js i recarrega.` });
  const colors = new Set(mod.parts.map(p => p.color));
  if (colors.size > 14) notes.push({ level: 'warn', text: `${colors.size} colors diferents: cadascun crea un material nou. Mira si en pots reaprofitar.` });
  return notes;
}

// ——— Col·lecció al navegador ———

export function loadCollection(storage) {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list.map(validateMod) : [];
  } catch { return []; }
}

export function saveCollection(storage, mods) {
  storage.setItem(STORAGE_KEY, JSON.stringify(mods.map(validateMod)));
}

export const uniqueId = (mods, id) => {
  let candidate = id, n = 2;
  while (mods.some(m => m.id === candidate)) candidate = `${id}${n++}`;
  return candidate;
};
